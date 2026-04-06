import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ── Channel keys ──
// company chat   → "company"
// department chat → "dept-<id>"

const channelKey = (channel, id) =>
    channel === 'company' ? 'company' : `dept-${id}`;

// ── Async Thunks ──

/**
 * fetchMessages – loads chat history for a given channel.
 */
export const fetchMessages = createAsyncThunk(
    'chat/fetchMessages',
    async ({ channel, departmentId }, { rejectWithValue }) => {
        try {
            const endpoint =
                channel === 'company'
                    ? '/chat/company/messages/'
                    : `/chat/messages/?department=${departmentId}`;
            const res = await API.get(endpoint);
            const data = res.data?.results ?? res.data;
            const results = Array.isArray(data) ? data : [];
            // API returns newest-first, reverse to get oldest-first for display
            return {
                key: channelKey(channel, departmentId),
                messages: results.slice().reverse(),
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * fetchMembers – loads members for company chat.
 */
export const fetchMembers = createAsyncThunk(
    'chat/fetchMembers',
    async (_, { rejectWithValue }) => {
        try {
            const res = await API.get('/chat/company/members/');
            return res.data.results ?? res.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * deleteMessage – soft-deletes a company chat message.
 */
export const deleteMessage = createAsyncThunk(
    'chat/deleteMessage',
    async ({ messageId, key }, { rejectWithValue }) => {
        try {
            await API.delete(`/chat/company/messages/${messageId}/delete/`);
            return { messageId, key };
        } catch (error) {
            return rejectWithValue({ messageId, key, error: error.message });
        }
    }
);

// ── Initial State ──
const initialState = {
    // keyed by channel: { "company": [...], "dept-3": [...] }
    messages: {},
    // loading state per channel
    loadingHistory: {},
    // company members
    members: [],
    // typing users per channel: { "company": { userId: name, ... } }
    typingUsers: {},
    // unread count per channel
    unreadCounts: {},
    // set of message IDs currently being deleted
    deletingIds: [],
};

// ── Helper: ensure channel exists in state ──
const ensureChannel = (state, key) => {
    if (!state.messages[key]) state.messages[key] = [];
    if (!state.typingUsers[key]) state.typingUsers[key] = {};
    if (state.unreadCounts[key] === undefined) state.unreadCounts[key] = 0;
};

// ── Slice ──
const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        /**
         * addMessage – appends a new message (from WebSocket) if not duplicate.
         * payload: { key, message }
         */
        addMessage(state, action) {
            const { key, message } = action.payload;
            ensureChannel(state, key);
            // Prevent duplicates
            if (!state.messages[key].some((m) => m.id === message.id)) {
                state.messages[key].push(message);
            }
        },

        /**
         * updateMessage – replaces a message in-place (e.g. soft-delete broadcast).
         * payload: { key, message }
         */
        updateMessage(state, action) {
            const { key, message } = action.payload;
            ensureChannel(state, key);
            const idx = state.messages[key].findIndex((m) => m.id === message.id);
            if (idx !== -1) {
                state.messages[key][idx] = message;
            }
        },

        /**
         * optimisticDelete – marks a message as deleted immediately.
         * payload: { key, messageId }
         */
        optimisticDelete(state, action) {
            const { key, messageId } = action.payload;
            ensureChannel(state, key);
            const idx = state.messages[key].findIndex((m) => m.id === messageId);
            if (idx !== -1) {
                state.messages[key][idx] = { ...state.messages[key][idx], is_deleted: true };
            }
            if (!state.deletingIds.includes(messageId)) {
                state.deletingIds.push(messageId);
            }
        },

        /**
         * rollbackDelete – undo optimistic delete on failure.
         * payload: { key, messageId }
         */
        rollbackDelete(state, action) {
            const { key, messageId } = action.payload;
            ensureChannel(state, key);
            const idx = state.messages[key].findIndex((m) => m.id === messageId);
            if (idx !== -1) {
                state.messages[key][idx] = { ...state.messages[key][idx], is_deleted: false };
            }
            state.deletingIds = state.deletingIds.filter((id) => id !== messageId);
        },

        /**
         * setTypingUser – sets or clears a typing indicator.
         * payload: { key, userId, name, isTyping }
         */
        setTypingUser(state, action) {
            const { key, userId, name, isTyping } = action.payload;
            ensureChannel(state, key);
            if (isTyping) {
                state.typingUsers[key][userId] = name;
            } else {
                delete state.typingUsers[key][userId];
            }
        },

        /**
         * incrementUnread – bumps unread counter for a channel.
         * payload: { key }
         */
        incrementUnread(state, action) {
            const { key } = action.payload;
            ensureChannel(state, key);
            state.unreadCounts[key] += 1;
        },

        /**
         * clearUnread – resets unread counter.
         * payload: { key }
         */
        clearUnread(state, action) {
            const { key } = action.payload;
            if (state.unreadCounts[key] !== undefined) {
                state.unreadCounts[key] = 0;
            }
        },

        /**
         * clearChannel – resets a channel's messages (e.g. when switching departments).
         * payload: { key }
         */
        clearChannel(state, action) {
            const { key } = action.payload;
            state.messages[key] = [];
            state.typingUsers[key] = {};
        },
    },
    extraReducers: (builder) => {
        // fetchMessages
        builder
            .addCase(fetchMessages.pending, (state, action) => {
                const key =
                    action.meta.arg.channel === 'company'
                        ? 'company'
                        : `dept-${action.meta.arg.departmentId}`;
                state.loadingHistory[key] = true;
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                const { key, messages } = action.payload;
                state.messages[key] = messages;
                state.loadingHistory[key] = false;
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                const key =
                    action.meta.arg.channel === 'company'
                        ? 'company'
                        : `dept-${action.meta.arg.departmentId}`;
                state.loadingHistory[key] = false;
            });

        // fetchMembers
        builder.addCase(fetchMembers.fulfilled, (state, action) => {
            state.members = action.payload;
        });

        // deleteMessage
        builder
            .addCase(deleteMessage.fulfilled, (state, action) => {
                const { messageId } = action.payload;
                state.deletingIds = state.deletingIds.filter((id) => id !== messageId);
            })
            .addCase(deleteMessage.rejected, (state, action) => {
                if (action.payload) {
                    const { messageId, key } = action.payload;
                    // rollback
                    const idx = state.messages[key]?.findIndex((m) => m.id === messageId);
                    if (idx !== undefined && idx !== -1) {
                        state.messages[key][idx] = { ...state.messages[key][idx], is_deleted: false };
                    }
                    state.deletingIds = state.deletingIds.filter((id) => id !== messageId);
                }
            });
    },
});

// ── Actions ──
export const {
    addMessage,
    updateMessage,
    optimisticDelete,
    rollbackDelete,
    setTypingUser,
    incrementUnread,
    clearUnread,
    clearChannel,
} = chatSlice.actions;

// ── Selectors ──
export const selectMessages = (key) => (state) => state.chat.messages[key] || [];
export const selectLoadingHistory = (key) => (state) => !!state.chat.loadingHistory[key];
export const selectMembers = (state) => state.chat.members;
export const selectTypingUsers = (key) => (state) => state.chat.typingUsers[key] || {};
export const selectUnreadCount = (key) => (state) => state.chat.unreadCounts[key] || 0;
export const selectDeletingIds = (state) => state.chat.deletingIds;

export default chatSlice.reducer;
