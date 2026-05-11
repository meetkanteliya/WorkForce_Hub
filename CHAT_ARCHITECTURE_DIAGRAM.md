# 🏗️ Team Chat Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                     (React 19 + Vite)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CompanyChat.jsx (Main Component)                        │  │
│  │  - Message rendering                                     │  │
│  │  - User interactions                                     │  │
│  │  - WebSocket management                                  │  │
│  │  - File upload handling                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Redux Store (chatSlice.js)                             │  │
│  │  - Message state                                         │  │
│  │  - Optimistic updates                                    │  │
│  │  - Message reconciliation                                │  │
│  │  - Offline queue                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket (wss://)
                              │ REST API (https://)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Django Channels (ASGI)                                  │  │
│  │  - WebSocket routing                                     │  │
│  │  - Real-time message broadcast                           │  │
│  │  - Connection management                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CompanyChatConsumer (consumers.py)                      │  │
│  │  - Message handling                                      │  │
│  │  - Typing indicators                                     │  │
│  │  - Reactions                                             │  │
│  │  - Authentication                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Django REST Framework                                   │  │
│  │  - Message CRUD API                                      │  │
│  │  - File upload API                                       │  │
│  │  - Members API                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Serializers (serializers.py)                           │  │
│  │  - Message validation                                    │  │
│  │  - Data transformation                                   │  │
│  │  - temp_id handling                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ ORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL / SQLite                                     │  │
│  │  - CompanyChatMessage                                    │  │
│  │  - CompanyChatMessageReaction                            │  │
│  │  - CompanyChatMessageRead                                │  │
│  │  - User                                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Message Flow Diagram

### Sending a Message

```
┌─────────┐
│  USER   │
└────┬────┘
     │ 1. Type message & click Send
     ▼
┌─────────────────────┐
│  CompanyChat.jsx    │
│  handleSend()       │
└────┬────────────────┘
     │ 2. Create optimistic message with temp_id
     ▼
┌─────────────────────┐
│  Redux Store        │
│  addMessage()       │ ← Optimistic update (instant UI)
└────┬────────────────┘
     │ 3. Send via WebSocket
     ▼
┌─────────────────────┐
│  WebSocket          │
│  socket.send()      │
└────┬────────────────┘
     │ 4. Message to backend
     ▼
┌─────────────────────┐
│  Consumer           │
│  receive()          │
└────┬────────────────┘
     │ 5. Validate & save to DB
     ▼
┌─────────────────────┐
│  Database           │
│  INSERT message     │
└────┬────────────────┘
     │ 6. Return saved message
     ▼
┌─────────────────────┐
│  Consumer           │
│  serialize()        │ ← Echo temp_id back
└────┬────────────────┘
     │ 7. Broadcast to all clients
     ▼
┌─────────────────────┐
│  WebSocket          │
│  group_send()       │
└────┬────────────────┘
     │ 8. Receive broadcast
     ▼
┌─────────────────────┐
│  CompanyChat.jsx    │
│  ws.onmessage()     │
└────┬────────────────┘
     │ 9. Dispatch to Redux
     ▼
┌─────────────────────┐
│  Redux Store        │
│  addMessage()       │ ← Reconcile: temp_id → real id
└────┬────────────────┘
     │ 10. Update UI
     ▼
┌─────────┐
│  USER   │ ← Message appears with real ID
└─────────┘
```

---

## State Management Flow

### Redux State Structure

```
chatSlice
├── messages: {
│   "company": [
│     {
│       id: 123,                    // Real ID from backend
│       temp_id: "temp_456",        // Temporary ID for reconciliation
│       content: "Hello world",
│       sender: { ... },
│       timestamp: "2026-05-08...",
│       status: "delivered",        // "sending" | "failed" | "delivered"
│       reply_to: { ... },
│       reactions: { "👍": [1,2] },
│       attachment_url: "...",
│       is_deleted: false
│     }
│   ]
│ }
├── loadingHistory: { "company": false }
├── hasMoreHistory: { "company": true }
├── members: [ { id, username, ... } ]
├── typingUsers: { "company": { 2: "Jane" } }
├── unreadCounts: { "company": 5 }
└── deletingIds: [123, 456]
```

### State Update Flow

```
User Action
    ↓
┌─────────────────────┐
│ Optimistic Update   │ ← Instant UI feedback
│ (temp_id)           │
└─────────────────────┘
    ↓
┌─────────────────────┐
│ WebSocket Send      │
└─────────────────────┘
    ↓
┌─────────────────────┐
│ Backend Processing  │
└─────────────────────┘
    ↓
┌─────────────────────┐
│ WebSocket Broadcast │ ← Echo temp_id
└─────────────────────┘
    ↓
┌─────────────────────┐
│ Reconciliation      │ ← Replace temp_id with real id
│ (temp_id → real id) │
└─────────────────────┘
    ↓
┌─────────────────────┐
│ UI Update           │ ← Final state
└─────────────────────┘
```

---

## Component Hierarchy

```
CompanyChat (Main Container)
│
├── ErrorBoundary (Crash Protection)
│   └── Fallback UI (if error)
│
├── Header
│   ├── Channel Icon
│   ├── Channel Name
│   ├── Unread Badge
│   ├── Connection Status
│   └── Members Button
│
├── Messages Area (Scrollable)
│   ├── Infinite Scroll Handler
│   ├── Loading Spinner (top)
│   │
│   ├── Date Separator ("Today", "Yesterday", etc.)
│   │
│   ├── Message Bubble
│   │   ├── Avatar (if not me)
│   │   ├── Sender Name + Role Badge
│   │   ├── Message Container
│   │   │   ├── Reply Quote (if reply)
│   │   │   ├── Message Content
│   │   │   │   ├── Text with @mentions
│   │   │   │   └── Attachment (image/file)
│   │   │   ├── Timestamp + Status
│   │   │   └── Reactions Bar
│   │   │
│   │   └── Action Toolbar (click-to-open)
│   │       ├── Quick Reactions (6 emojis)
│   │       └── Context Menu
│   │           ├── Copy
│   │           ├── Reply
│   │           └── Delete (if allowed)
│   │
│   └── Messages End Ref (auto-scroll target)
│
├── Typing Indicator
│   └── Animated Dots + Names
│
├── Input Area
│   ├── Reply Bar (if replying)
│   │   ├── Reply Preview
│   │   └── Cancel Button
│   │
│   ├── Input Form
│   │   ├── Attach Button
│   │   ├── Textarea
│   │   │   ├── @Mention Dropdown
│   │   │   └── Auto-resize
│   │   └── Send Button
│   │
│   └── Hidden File Input
│
├── Members Sidebar (toggle)
│   ├── Header
│   │   ├── Title + Count
│   │   └── Close Button
│   │
│   └── Members List
│       └── Member Card
│           ├── Avatar + Online Dot
│           ├── Name + Role
│           └── Admin Badge
│
└── Image Preview Modal
    ├── Close Button
    └── Full-size Image
```

---

## WebSocket Protocol

### Connection Flow

```
1. User opens chat
   ↓
2. Get JWT token from Redux
   ↓
3. Connect WebSocket
   ws://localhost:8000/ws/company-chat/?token=<JWT>
   ↓
4. Backend validates token
   ↓
5. Join "company_chat" group
   ↓
6. Connection established
   ↓
7. Sync missed messages (if reconnect)
   ↓
8. Process offline queue
```

### Message Types

#### Client → Server

```javascript
// Send message
{
  type: "message",
  message: "Hello world",
  reply_to_id: 123,
  temp_id: "temp_456"
}

// Typing indicator
{
  type: "typing",
  is_typing: true
}

// Reaction
{
  type: "reaction",
  message_id: 123,
  emoji: "👍"
}
```

#### Server → Client

```javascript
// New message
{
  type: "company_chat_message",
  payload: {
    id: 123,
    temp_id: "temp_456",  // Echoed back
    sender: { ... },
    content: "Hello world",
    timestamp: "...",
    ...
  }
}

// Typing update
{
  type: "company_typing",
  user_id: 2,
  full_name: "Jane Doe",
  is_typing: true
}

// Reaction update
{
  type: "company_reaction_update",
  message_id: 123,
  reactions: {
    "👍": [1, 2, 3],
    "❤️": [4, 5]
  }
}

// Message deleted
{
  type: "company_message_deleted",
  payload: {
    id: 123,
    is_deleted: true,
    deleted_by: { ... }
  }
}
```

---

## Interaction Flow

### Click-to-Open Toolbar (Desktop)

```
User clicks message bubble
    ↓
setActiveMessageId(msg.id)
    ↓
Toolbar renders above message
    ↓
User clicks reaction
    ↓
handleReaction(msgId, emoji)
    ↓
Send WebSocket message
    ↓
Backend broadcasts update
    ↓
All clients update reactions
    ↓
Toolbar stays open (can add more)
    ↓
User clicks outside
    ↓
handleClickOutside()
    ↓
setActiveMessageId(null)
    ↓
Toolbar closes
```

### Long-Press (Mobile)

```
User touches message
    ↓
handleTouchStart(msgId)
    ↓
Start 500ms timer
    ↓
User holds for 500ms
    ↓
Timer fires
    ↓
Haptic feedback (vibrate 50ms)
    ↓
setActiveMessageId(msgId)
    ↓
Toolbar opens
    ↓
User taps reaction
    ↓
handleReaction(msgId, emoji)
    ↓
Toolbar stays open
    ↓
User taps outside
    ↓
Toolbar closes
```

---

## Error Handling Flow

```
Error occurs in component
    ↓
ErrorBoundary catches error
    ↓
componentDidCatch()
    ↓
Log error to console
    ↓
Render fallback UI
    ↓
Show "Something went wrong" message
    ↓
Show "Reload Chat" button
    ↓
User clicks reload
    ↓
window.location.reload()
    ↓
Chat reloads fresh
```

---

## Offline Queue Flow

```
User sends message
    ↓
Check WebSocket state
    ↓
WebSocket CLOSED?
    ↓
YES → Add to offline queue
    ↓
Show "Pending" status
    ↓
WebSocket reconnects
    ↓
ws.onopen()
    ↓
Process offline queue
    ↓
For each queued message:
    ↓
Try to send
    ↓
Success? → Remove from queue
    ↓
Failure? → Re-queue
    ↓
Update UI status
```

---

## Reconciliation Flow

```
User sends message
    ↓
Create optimistic message
{
  id: "temp_123",
  temp_id: "temp_123",
  content: "Hello",
  status: "sending"
}
    ↓
Add to Redux state
    ↓
Send via WebSocket
    ↓
Backend saves to DB
    ↓
Backend broadcasts
{
  id: 456,              ← Real ID
  temp_id: "temp_123",  ← Echoed back
  content: "Hello",
  status: "delivered"
}
    ↓
Redux receives message
    ↓
Find message with temp_id="temp_123"
    ↓
Replace optimistic message with real message
    ↓
UI updates: "temp_123" → 456
    ↓
Status: "sending" → "delivered"
```

---

## Performance Optimization

### Memoization Strategy

```
Component Level:
├── useMemo(groupedMessages)     ← Group by date
├── useMemo(filteredMentions)    ← Filter members
└── useMemo(onlineCount)         ← Count members

Redux Level:
├── selectMessages(key)           ← Memoized selector
├── selectLoadingHistory(key)     ← Memoized selector
└── selectHasMoreHistory(key)     ← Memoized selector

Event Handling:
├── useEffect with dependencies   ← Only run when needed
├── Conditional listeners         ← Only add when active
└── Proper cleanup                ← Remove on unmount
```

### Render Optimization

```
Avoid Re-renders:
├── useMemo for expensive calculations
├── useCallback for event handlers
├── React.memo for child components (future)
└── Proper dependency arrays

Efficient Updates:
├── Optimistic updates (instant UI)
├── Batch Redux updates
├── requestAnimationFrame for scroll
└── Debounced typing indicators
```

---

## Security Flow

### Authentication

```
User logs in
    ↓
Backend generates JWT token
    ↓
Frontend stores in Redux
    ↓
WebSocket connection
    ↓
Pass token in query string
ws://.../?token=<JWT>
    ↓
Backend validates token
    ↓
Extract user_id from token
    ↓
Check user is active
    ↓
Accept connection
```

### Authorization

```
User attempts action
    ↓
Check permission
    ↓
Delete message?
    ↓
Check: sender OR admin OR hr
    ↓
Allowed? → Proceed
    ↓
Denied? → Block action
```

---

## Deployment Architecture

```
┌─────────────────────┐
│   Load Balancer     │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
┌────▼────┐ ┌───▼─────┐
│ Web     │ │ Web     │
│ Server  │ │ Server  │
│ (Nginx) │ │ (Nginx) │
└────┬────┘ └───┬─────┘
     │          │
     └─────┬────┘
           │
┌──────────▼──────────┐
│   ASGI Server       │
│   (Daphne/Uvicorn)  │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   Django Channels   │
│   (WebSocket)       │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   Redis             │
│   (Channel Layer)   │
└─────────────────────┘
           │
┌──────────▼──────────┐
│   PostgreSQL        │
│   (Database)        │
└─────────────────────┘
```

---

**This diagram provides a visual overview of the Team Chat architecture, message flow, and component hierarchy.**
