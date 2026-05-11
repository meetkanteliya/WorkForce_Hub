import re

# -----------------
# chatSlice.js
# -----------------
with open("frontend/src/store/slices/chatSlice.js", "r", encoding="utf-8") as f:
    chat_slice = f.read()

fetch_messages_replace = """export const fetchMessages = createAsyncThunk(
    'chat/fetchMessages',
    async ({ channel, departmentId, offset = 0, since_id = null }, { rejectWithValue }) => {
        try {
            let endpoint = channel === 'company' ? '/chat/company/messages/' : `/chat/messages/?department=${departmentId}`;
            
            const params = new URLSearchParams();
            if (offset) params.append('offset', offset);
            if (since_id) params.append('since_id', since_id);
            
            if (params.toString()) {
                endpoint += (endpoint.includes('?') ? '&' : '?') + params.toString();
            }
            
            const res = await API.get(endpoint);
            const data = res.data?.results ?? res.data;
            const results = Array.isArray(data) ? data : [];
            return {
                key: channelKey(channel, departmentId),
                messages: results.slice().reverse(), // Backend gives newest first
                isLoadMore: offset > 0,
                isSync: !!since_id,
                hasMore: res.data?.next !== null && res.data?.next !== undefined
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);"""

chat_slice = re.sub(
    r'export const fetchMessages = createAsyncThunk\(.*?}\n\);',
    fetch_messages_replace,
    chat_slice,
    flags=re.DOTALL
)

addcase_replace = """            .addCase(fetchMessages.fulfilled, (state, action) => {
                const { key, messages, isLoadMore, isSync, hasMore } = action.payload;
                if (!state.messages[key]) state.messages[key] = [];
                
                if (isLoadMore) {
                    state.messages[key] = [...messages, ...state.messages[key]];
                } else if (isSync) {
                    const newMessages = messages.filter(m => !state.messages[key].some(sm => sm.id === m.id));
                    state.messages[key] = [...state.messages[key], ...newMessages];
                } else {
                    state.messages[key] = messages;
                }
                
                state.hasMoreHistory = state.hasMoreHistory || {};
                state.hasMoreHistory[key] = hasMore;
                state.loadingHistory[key] = false;
            })"""

chat_slice = re.sub(
    r'            \.addCase\(fetchMessages\.fulfilled, \(state, action\) => \{.*?\n            \}\)',
    addcase_replace,
    chat_slice,
    flags=re.DOTALL
)

with open("frontend/src/store/slices/chatSlice.js", "w", encoding="utf-8") as f:
    f.write(chat_slice)

# -----------------
# CompanyChat.jsx
# -----------------
with open("frontend/src/pages/chat/CompanyChat.jsx", "r", encoding="utf-8") as f:
    company_chat = f.read()

company_chat = company_chat.replace("const unreadCount = useSelector(selectUnreadCount(CHANNEL_KEY));", "const unreadCount = useSelector(selectUnreadCount(CHANNEL_KEY));\n  const hasMoreHistory = useSelector((state) => state.chat.hasMoreHistory?.[CHANNEL_KEY]);\n  const [isFetchingMore, setIsFetchingMore] = useState(false);\n  const [offlineQueue, setOfflineQueue] = useState([]);\n  const [isOnline, setIsOnline] = useState(true);")

# Update WebSocket logic
ws_replace = """    dispatch(fetchMessages({ channel: 'company' }));

    const wsUrl = `${getWsOrigin()}/ws/company-chat/?token=${tokens.access}`;

    const connectWebSocket = () => {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setIsOnline(true);
        
        // Sync missed messages
        if (messagesEndRef.current && socketRef.current.hasDisconnectedBefore) {
             const stateMessages = document.querySelectorAll('[data-msg-id]');
             let lastId = null;
             if (stateMessages.length > 0) {
                 lastId = stateMessages[stateMessages.length - 1].getAttribute('data-msg-id');
             }
             if (lastId) {
                 dispatch(fetchMessages({ channel: 'company', since_id: lastId }));
             }
        }
        socketRef.current.hasDisconnectedBefore = true;

        // Process offline queue
        setOfflineQueue(prev => {
            prev.forEach(msg => {
                try { ws.send(JSON.stringify(msg)); } catch(e) {}
            });
            return [];
        });
      };"""

company_chat = company_chat.replace("""    dispatch(fetchMessages({ channel: 'company' }));

    const wsUrl = `${getWsOrigin()}/ws/company-chat/?token=${tokens.access}`;

    const connectWebSocket = () => {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
      };""", ws_replace)

close_replace = """      ws.onclose = () => {
        setIsOnline(false);
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(5000, reconnectAttemptsRef.current * 1000) + Math.random() * 1000;
        reconnectTimerRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay);
      };"""

company_chat = re.sub(r'      ws\.onclose = \(\) => \{.*?      \};', close_replace, company_chat, flags=re.DOTALL)

# Handle Scroll for infinite loading
scroll_logic = """  // Infinite Scroll Handler
  const handleScroll = (e) => {
      if (e.target.scrollTop === 0 && hasMoreHistory && !isFetchingMore && !loadingHistory) {
          setIsFetchingMore(true);
          const currentHeight = e.target.scrollHeight;
          dispatch(fetchMessages({ channel: 'company', offset: messages.length })).finally(() => {
              setTimeout(() => {
                  if (e.target) {
                      e.target.scrollTop = e.target.scrollHeight - currentHeight;
                  }
                  setIsFetchingMore(false);
              }, 50);
          });
      }
  };"""

company_chat = company_chat.replace("  const sendTyping = (isTyping) => {", scroll_logic + "\n  const sendTyping = (isTyping) => {")

company_chat = company_chat.replace('<div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1">', '<div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1" onScroll={handleScroll}>')

company_chat = company_chat.replace("key={msg.id || i}", "key={msg.id || i}\n                  data-msg-id={msg.id}")

# Handle Offline Queue
handle_send = """  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    
    const msgObj = { type: 'message', message: text };
    const socket = socketRef.current;
    
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        setOfflineQueue(prev => [...prev, msgObj]);
    } else {
        socket.send(JSON.stringify(msgObj));
    }
    
    setInput('');
    sendTyping(false);
  };"""

company_chat = re.sub(r'  const handleSend = \(e\) => \{.*?  \};', handle_send, company_chat, flags=re.DOTALL)

# Add offline indicator to Header
header_replace = """              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-2">
                <span>{onlineCount} member{onlineCount !== 1 ? 's' : ''}</span>
                {!isOnline && (
                    <span className="flex items-center gap-1 text-rose-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        Reconnecting...
                    </span>
                )}
                {isOnline && offlineQueue.length > 0 && (
                    <span className="text-amber-500">Sending queued ({offlineQueue.length})...</span>
                )}
              </p>"""

company_chat = re.sub(r'              <p className="text-\[11px\] text-slate-400 dark:text-slate-500 font-medium">\n                \{onlineCount\} member\{onlineCount !== 1 \? \'s\' : \'\'\} • Everyone can see this\n              <\/p>', header_replace, company_chat)

with open("frontend/src/pages/chat/CompanyChat.jsx", "w", encoding="utf-8") as f:
    f.write(company_chat)

