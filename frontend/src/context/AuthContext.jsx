import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [tokens, setTokens] = useState(() => {
        const saved = localStorage.getItem('tokens');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(false);

    const isAuthenticated = !!tokens?.access;

    // Login
    const login = async (username, password) => {
        const res = await API.post('/auth/login/', { username, password });
        const newTokens = res.data;
        localStorage.setItem('tokens', JSON.stringify(newTokens));
        setTokens(newTokens);

        // Fetch profile
        const profileRes = await API.get('/auth/profile/', {
            headers: { Authorization: `Bearer ${newTokens.access}` },
        });
        localStorage.setItem('user', JSON.stringify(profileRes.data));
        setUser(profileRes.data);
        return profileRes.data;
    };


    // Logout
    const logout = () => {
        localStorage.removeItem('tokens');
        localStorage.removeItem('user');
        setTokens(null);
        setUser(null);
    };

    // Check role
    const hasRole = (...roles) => {
        return user && roles.includes(user.role);
    };

    return (
        <AuthContext.Provider
            value={{ user, tokens, isAuthenticated, loading, login, logout, hasRole }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
