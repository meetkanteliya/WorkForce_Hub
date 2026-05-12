import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, selectTokens } from '../../../store/slices/authSlice';
import {
  fetchMessages,
  fetchMembers,
  addMessage,
  updateMessage,
  updateMessageReactions,
  optimisticDelete,
  setTypingUser,
  incrementUnread,
  selectMessages,
  selectLoadingHistory,
  selectHasMoreHistory,
  selectMembers,
  selectTypingUsers,
  selectUnreadCount,
} from '../../../store/slices/chatSlice';

function getBackendOrigin() {
  return import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:8000';
}

function getWsOrigin() {
  const backend = getBackendOrigin();
  return backend.replace(/^http/, 'ws');
}

const CHANNEL_KEY = 'company';

export function useCompanyChat() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const tokens = useSelector(selectTokens);
  const messages = useSelector(selectMessages(CHANNEL_KEY));
  const loadingHistory = useSelector(selectLoadingHistory(CHANNEL_KEY));
  const hasMoreHistory = useSelector(selectHasMoreHistory(CHANNEL_KEY));
  const members = useSelector(selectMembers);
  const typingUsers = useSelector(selectTypingUsers(CHANNEL_KEY));
  const unreadCount = useSelector(selectUnreadCount(CHANNEL_KEY));

  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(true);

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const meId = user?.id;

  // Load members
  useEffect(() => {
    if (!tokens?.access) return;
    dispatch(fetchMembers());
  }, [tokens?.access, dispatch]);

  // Load history + WebSocket with reconnection
  useEffect(() => {
    if (!tokens?.access) return;

    dispatch(fetchMessages({ channel: 'company' }));

    const wsUrl = `${getWsOrigin()}/ws/company-chat/?token=${tokens.access}`;

    const connectWebSocket = () => {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setIsOnline(true);

        // Sync missed messages
        if (ws.hasDisconnectedBefore) {
          const stateMessages = document.querySelectorAll('[data-msg-id]');
          let lastId = null;
          if (stateMessages.length > 0) {
            lastId = stateMessages[stateMessages.length - 1].getAttribute('data-msg-id');
          }
          if (lastId) {
            dispatch(fetchMessages({ channel: 'company', since_id: lastId }));
          }
        }
        ws.hasDisconnectedBefore = true;

        // Process offline queue
        if (offlineQueue.length > 0) {
          const queueCopy = [...offlineQueue];
          setOfflineQueue([]);

          queueCopy.forEach((msg) => {
            try {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(msg));
              } else {
                setOfflineQueue((prev) => [...prev, msg]);
              }
            } catch (e) {
              console.error('Failed to send queued message:', e);
              setOfflineQueue((prev) => [...prev, msg]);
            }
          });
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'company_chat_message' && data.payload) {
            dispatch(addMessage({ key: CHANNEL_KEY, message: data.payload }));

            const fromOther = data.payload?.sender?.id !== meId;
            const isHidden = document.visibilityState !== 'visible';
            if (fromOther && isHidden) {
              dispatch(incrementUnread({ key: CHANNEL_KEY }));
            }
          }

          if (data.type === 'company_typing') {
            if (data.user_id && data.user_id !== meId) {
              dispatch(
                setTypingUser({
                  key: CHANNEL_KEY,
                  userId: data.user_id,
                  name: data.full_name || 'Someone',
                  isTyping: data.is_typing,
                })
              );
            }
          }

          if (data.type === 'company_message_deleted' && data.payload?.id) {
            dispatch(updateMessage({ key: CHANNEL_KEY, message: data.payload }));
          }

          if (data.type === 'company_reaction_update' && data.message_id) {
            dispatch(
              updateMessageReactions({
                key: CHANNEL_KEY,
                messageId: data.message_id,
                reactions: data.reactions || {},
              })
            );
          }
        } catch (error) {
          console.error('WebSocket payload parse error:', error);
          // Continue operation gracefully - don't crash
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onclose = () => {
        setIsOnline(false);
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(5000, reconnectAttemptsRef.current * 1000) + Math.random() * 1000;
        reconnectTimerRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [tokens?.access, meId, dispatch, offlineQueue]);

  // Infinite scroll handler
  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && hasMoreHistory && !isFetchingMore && !loadingHistory) {
      setIsFetchingMore(true);
      const currentHeight = e.target.scrollHeight;
      const currentScrollTop = e.target.scrollTop;

      dispatch(fetchMessages({ channel: 'company', offset: messages.length })).finally(() => {
        requestAnimationFrame(() => {
          if (e.target) {
            const newHeight = e.target.scrollHeight;
            e.target.scrollTop = newHeight - currentHeight + currentScrollTop;
          }
          setIsFetchingMore(false);
        });
      });
    }
  };

  const sendTyping = (isTyping) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
  };

  const sendMessage = (msgObj) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setOfflineQueue((prev) => [...prev, msgObj]);
      return false;
    }
    socket.send(JSON.stringify(msgObj));
    return true;
  };

  const sendReaction = (messageId, emoji) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'reaction', message_id: messageId, emoji }));
  };

  const typingList = Object.values(typingUsers);

  return {
    user,
    messages,
    loadingHistory,
    hasMoreHistory,
    members,
    typingList,
    unreadCount,
    isOnline,
    offlineQueue,
    socketRef,
    handleScroll,
    sendTyping,
    sendMessage,
    sendReaction,
    dispatch,
  };
}
