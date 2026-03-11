import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import { Send, Hash, MessageSquare, Clock } from 'lucide-react';

export default function DepartmentChat() {
    const { user } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [activeDept, setActiveDept] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [ws, setWs] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    
    const messagesEndRef = useRef(null);

    // 1. Fetch departments based on role
    useEffect(() => {
        const fetchDepts = async () => {
            try {
                // Determine which departments to show
                if (['admin', 'hr'].includes(user?.role)) {
                    // Admins see all
                    const res = await API.get('/departments/');
                    const depts = res.data.results ?? res.data;
                    setDepartments(depts);
                    if (depts.length > 0) setActiveDept(depts[0]);
                } else {
                    // Employees only see their own department
                    const meRes = await API.get('/employees/me/');
                    const empDept = meRes.data.department;
                    if (empDept && typeof empDept === 'object') {
                        setDepartments([empDept]);
                        setActiveDept(empDept);
                    } else if (empDept) {
                        // In case it comes back as ID, we need its name. 
                        // But usually the serializer handles this. Fallback:
                        setDepartments([{ id: empDept, name: meRes.data.department_name || 'My Department' }]);
                        setActiveDept({ id: empDept, name: meRes.data.department_name || 'My Department' });
                    }
                }
            } catch (err) {
                console.error("Failed to load departments", err);
            }
        };
        if (user) fetchDepts();
    }, [user]);

    // 2. Load History & Initialize WebSocket when activeDept changes
    useEffect(() => {
        if (!activeDept) return;

        // Load history via REST
        const loadHistory = async () => {
            setLoadingHistory(true);
            try {
                const res = await API.get(`/chat/messages/?department=${activeDept.id}`);
                setMessages((res.data.results ?? res.data).reverse() || []); // newest at bottom
            } catch (err) {
                console.error("Failed to fetch chat history", err);
            } finally {
                setLoadingHistory(false);
            }
        };
        loadHistory();

        // Connect WebSocket
        const token = localStorage.getItem('access');
        const socketUrl = `ws://localhost:8000/ws/chat/${activeDept.id}/?token=${token}`;
        const socket = new WebSocket(socketUrl);

        socket.onopen = () => console.log('WebSocket Connected to', activeDept.name);
        
        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            setMessages((prev) => [...prev, {
                id: data.id,
                content: data.message,
                sender: data.sender_id,
                sender_name: data.sender_name,
                sender_profile_picture: data.sender_profile_picture,
                timestamp: data.timestamp
            }]);
        };

        socket.onclose = () => console.log('WebSocket Disconnected');

        setWs(socket);

        return () => {
            if (socket) socket.close();
        };
    }, [activeDept]);

    // 3. Auto Scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || !ws) return;

        ws.send(JSON.stringify({ message: input.trim() }));
        setInput('');
    };

    return (
        <div className="flex h-[calc(100vh-120px)] bg-slate-50 dark:bg-[#0B1120] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
            {/* Sidebar (Departments) */}
            <div className="w-64 sm:w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] flex flex-col shrink-0">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-emerald-500" />
                        Team Rooms
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Select a department to chat
                    </p>
                </div>
                <div className="overflow-y-auto flex-1 p-3 space-y-1">
                    {departments.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center mt-5">No assigned department.</p>
                    ) : (
                        departments.map((dept) => (
                            <button
                                key={dept.id}
                                onClick={() => setActiveDept(dept)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                                    activeDept?.id === dept.id
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    activeDept?.id === dept.id ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800'
                                }`}>
                                    <Hash className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-sm truncate">{dept.name}</span>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white/50 dark:bg-[#0B1120]/50">
                {activeDept ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center bg-white dark:bg-[#111827] shrink-0">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Hash className="w-5 h-5 text-slate-400" />
                                {activeDept.name}
                            </h3>
                        </div>

                        {/* Messages Feed */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {loadingHistory ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center pt-20 text-slate-500">
                                    <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                                    <p className="font-medium">No messages yet</p>
                                    <p className="text-xs mt-1">Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => {
                                    const isMe = msg.sender_name === user?.username;
                                    const showName = i === 0 || messages[i - 1].sender_name !== msg.sender_name;

                                    return (
                                        <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                                            {!isMe && showName ? (
                                                <img
                                                    src={msg.sender_profile_picture 
                                                        ? `http://localhost:8000${msg.sender_profile_picture}` 
                                                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender_name)}&background=1A2B3C&color=fff`}
                                                    alt={msg.sender_name}
                                                    className="w-8 h-8 rounded-full shrink-0 object-cover mt-1 bg-slate-200 dark:bg-slate-800"
                                                />
                                            ) : (
                                                <div className="w-8 shrink-0" />
                                            )}

                                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                {showName && !isMe && (
                                                    <span className="text-xs font-bold text-slate-500 mb-1 ml-1">
                                                        {msg.sender_name}
                                                    </span>
                                                )}
                                                <div className={`px-4 py-2.5 rounded-2xl text-[14px] ${
                                                    isMe 
                                                        ? 'bg-emerald-600 text-white rounded-tr-sm'
                                                        : 'bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 shadow-sm rounded-tl-sm'
                                                }`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 shrink-0">
                            <form onSubmit={handleSend} className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={`Message #${activeDept.name}...`}
                                    className="flex-1 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-200 placeholder-slate-400 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 shadow-sm hover:shadow-md hover:shadow-emerald-500/20"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Select a Department</h3>
                        <p className="text-sm mt-1">Choose a room from the sidebar to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}
