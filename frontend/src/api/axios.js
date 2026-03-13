import axios from 'axios';

const API = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request, and handle FormData content-type
API.interceptors.request.use((config) => {
    let tokens = {};

    try {
        const storedTokens = localStorage.getItem('tokens');
        tokens = storedTokens ? JSON.parse(storedTokens) : {};
    } catch (err) {
        console.error("Invalid tokens in localStorage", err);
        tokens = {};
    }

    if (tokens.access) {
        config.headers.Authorization = `Bearer ${tokens.access}`;
    }

    // Let browser set Content-Type with boundary for FormData
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    return config;
});

// Handle 401 — try to refresh token, else logout
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            let tokens = null;

            try {
                const storedTokens = localStorage.getItem("tokens");
                tokens = storedTokens ? JSON.parse(storedTokens) : null;
            } catch (err) {
                console.error("Invalid tokens in localStorage", err);
                tokens = null;
            }

            if (tokens && tokens.refresh) {
                try {
                    const res = await axios.post('/api/auth/token/refresh/', {
                        refresh: tokens.refresh,
                    });

                    const newTokens = {
                        ...tokens,
                        access: res.data.access,
                    };

                    if (res.data.refresh) {
                        newTokens.refresh = res.data.refresh;
                    }

                    localStorage.setItem('tokens', JSON.stringify(newTokens));

                    originalRequest.headers.Authorization = `Bearer ${res.data.access}`;

                    return API(originalRequest);

                } catch (refreshError) {
                    localStorage.removeItem('tokens');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default API;