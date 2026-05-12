import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../../store/slices/authSlice';
import {
  fetchMessages,
  addMessage,
  clearChannel,
  selectMessages,
  selectLoadingHistory,
} from '../../../store/slices/chatSlice';

function getWsOrigin() {
  const origin = window.location.origin;
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return 'ws://localhost:8000';
  }
  return origin.replace(/^http/, 'ws');
}

export function useDepartmentChat(activeDept) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const channelKey = activeDept ? `dept-${activeDept.id}` : null;
  const messages = useSelector(selectMessages(channelKey || '__none__'));
  const loadingHistory = useSelector(selectLoadingHistory(channelKey || '__none__'));

  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState([]);

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // Load History & Initialize WebSocket with reconnection
  useEffect(() => {
    if (!activeDept) return;

    const key = `dept-${activeDept.id}`;

    // Clear old channel messages and fetch new
    dispatch(clearChannel({ key }));
    dispatch(fetchMessages({ channel: 'department', departmentId: activeDept.id }));

    // Connect WebSocket with reconnection logic
    const token = localStorage.getItem('access');
    const socketUrl = `${getWsOrigin()}/ws/chat/${activeDept.id}/?token=${token}`;

    const connectWebSocket = () => {
      const socket = new WebSocket(socketUrl);

      socket.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setIsOnline(true);

        // Process offline queue
        if (offlineQueue.length > 0) {
          const queueCopy = [...offlineQueue];
          setOfflineQueue([]);

          queueCopy.forEach((msg) => {
            try {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(msg));
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

      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);

          // Create optimistic message structure
          const tempId = data.temp_id || data.id;
          const message = {
            id: data.id || tempId,
            content: data.message,
            sender: data.sender_id,
            sender_name: data.sender_name,
            sender_profile_picture: data.sender_profile_picture,
            timestamp: data.timestamp,
            temp_id: data.temp_id,
            status: 'delivered',
          };

          dispatch(addMessage({ key, message }));
        } catch (error) {
          console.error('WebSocket payload parse error:', error);
          // Continue operation gracefully
        }
      };

      socket.onerror = () => {
        socket.close();
      };

      socket.onclose = () => {
        setIsOnline(false);
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(5000, reconnectAttemptsRef.current * 1000) + Math.random() * 1000;
        reconnectTimerRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay);
      };

      wsRef.current = socket;
    };

    connectWebSocket();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [activeDept, dispatch, offlineQueue]);

  const sendMessage = (message) => {
    const socket = wsRef.current;
    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const msgObj = {
      message: message.trim(),
      temp_id: tempId,
    };

    // Optimistic message
    const optimisticMsg = {
      id: tempId,
      content: message.trim(),
      sender: user?.id,
      sender_name: user?.username,
      sender_profile_picture: user?.employee?.profile_picture || null,
      timestamp: new Date().toISOString(),
      status: 'sending',
      temp_id: tempId,
    };

    const key = `dept-${activeDept.id}`;
    dispatch(addMessage({ key, message: optimisticMsg }));

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      // Mark as failed and queue
      dispatch(addMessage({ key, message: { ...optimisticMsg, status: 'failed' } }));
      setOfflineQueue((prev) => [...prev, msgObj]);
      return false;
    }

    socket.send(JSON.stringify(msgObj));
    return true;
  };

  return {
    user,
    messages,
    loadingHistory,
    isOnline,
    offlineQueue,
    sendMessage,
  };
}
