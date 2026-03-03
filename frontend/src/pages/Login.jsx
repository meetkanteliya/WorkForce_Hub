import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(form.username, form.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4 relative overflow-hidden">
            {/* Deep Navy/Slate Atmospheric Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Accent blue glow */}
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#2563EB]/20 rounded-full blur-[100px] animate-pulse" />
                {/* Slate blue glow */}
                <div className="absolute bottom-10 -right-20 w-80 h-80 bg-[#1E3A8A]/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in">
                <div className="glass-navy rounded-3xl p-8 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    {/* Brand Banner */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg shadow-[#2563EB]/30 ring-1 ring-white/20">
                            <span className="text-white text-2xl font-black tracking-tighter">WH</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">WorkForce Hub</h1>
                        <p className="text-[#94A3B8] text-sm">Secure Authentication</p>
                    </div>

                    {error && (
                        <div className="bg-rose-500/10 text-rose-300 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-3 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2">Username</label>
                            <input
                                type="text"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                className="w-full px-4 py-3 bg-[#0F172A]/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#2563EB]/50 focus:border-[#2563EB] outline-none transition-all text-sm text-slate-100 font-medium placeholder-slate-500"
                                placeholder="Corporate ID or Username"
                                required
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest">Password</label>
                            </div>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full px-4 py-3 bg-[#0F172A]/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#2563EB]/50 focus:border-[#2563EB] outline-none transition-all text-sm text-slate-100 font-medium placeholder-slate-500"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#2563EB] text-white py-3 mt-4 rounded-xl font-bold hover:bg-[#1D4ED8] transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] cursor-pointer tracking-wide"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Authenticating...
                                </span>
                            ) : 'Access Dashboard'}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
}
