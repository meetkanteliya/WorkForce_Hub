import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

// Safe JSON parse helper
const safeParse = (value) => {
    try {
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
};

export function AuthProvider({ children }) {

    const [user, setUser] = useState(() => safeParse(localStorage.getItem('user')));
    const [tokens, setTokens] = useState(() => safeParse(localStorage.getItem('tokens')));
    const [loading, setLoading] = useState(false);
    const [profilePic, setProfilePic] = useState(null);

    const isAuthenticated = !!tokens?.access;

    // Fetch profile picture on app load
    useEffect(() => {
        if (isAuthenticated) {
            API.get('/employees/me/')
                .then(res => {
                    if (res.data?.profile_picture) {
                        setProfilePic(res.data.profile_picture);
                    }
                })
                .catch(() => { });
        }
    }, [isAuthenticated]);

    // LOGIN
    const login = async (username, password) => {

        setLoading(true);

        try {

            // Step 1: login request
            const res = await API.post('/auth/login/', { username, password });

            const newTokens = res.data;

            localStorage.setItem('tokens', JSON.stringify(newTokens));
            setTokens(newTokens);

            // Step 2: get user profile
            const profileRes = await API.get('/auth/profile/', {
                headers: { Authorization: `Bearer ${newTokens.access}` },
            });

            const userData = profileRes.data;

            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            // Step 3: get employee data (profile picture)
            try {
                const empRes = await API.get('/employees/me/', {
                    headers: { Authorization: `Bearer ${newTokens.access}` },
                });

                if (empRes.data?.profile_picture) {
                    setProfilePic(empRes.data.profile_picture);
                }

            } catch {
                // non-critical error
            }

            return userData;

        } catch (error) {

            // Rollback authentication if anything fails
            localStorage.removeItem('tokens');
            localStorage.removeItem('user');

            setTokens(null);
            setUser(null);

            throw error;

        } finally {
            setLoading(false);
        }
    };

    // LOGOUT
    const logout = () => {
        localStorage.removeItem('tokens');
        localStorage.removeItem('user');
        setTokens(null);
        setUser(null);
        setProfilePic(null);
    };

    // Role checker
    const hasRole = (...roles) => {
        return user && roles.includes(user.role);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                tokens,
                isAuthenticated,
                loading,
                login,
                logout,
                hasRole,
                profilePic,
                setProfilePic
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};