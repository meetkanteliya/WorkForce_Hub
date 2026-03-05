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
    const [profilePic, setProfilePic] = useState(null);

    const isAuthenticated = !!tokens?.access;

    // Fetch profile picture on app load
    useEffect(() => {
        if (isAuthenticated) {
            API.get('/employees/me/')
                .then(res => { if (res.data?.profile_picture) setProfilePic(res.data.profile_picture); })
                .catch(() => { });
        }
    }, [isAuthenticated]);

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

        // Fetch profile picture
        try {
            const empRes = await API.get('/employees/me/', {
                headers: { Authorization: `Bearer ${newTokens.access}` },
            });
            if (empRes.data?.profile_picture) setProfilePic(empRes.data.profile_picture);
        } catch { }

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
            value={{ user, tokens, isAuthenticated, loading, login, logout, hasRole, profilePic, setProfilePic }}
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
