import axios from 'axios';
import { jwtDecode } from "jwt-decode";

const API_URL = '/api/v1';

interface TokenPayload {
    sub: string;
    tid: string;
    role: string;
    exp: number;
}

export const authService = {
    login: async (email: string, password: string) => {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        params.append('grant_type', 'password');

        const response = await axios.post(`${API_URL}/auth/login/access-token`, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log("Login Response:", response.data);

        if (response.data.access_token) {
            console.log("Saving token...");
            localStorage.setItem('auth_token', response.data.access_token);
            // Set cookie for Next.js Middleware
            document.cookie = `auth_token=${response.data.access_token}; path=/; max-age=86400; SameSite=Lax`;
        } else {
            console.error("No access token in response");
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('auth_token');
        // Clear all cookies just in case
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        window.location.href = '/login';
    },

    getToken: () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('auth_token');
        }
        return null;
    },

    isAuthenticated: () => {
        const token = authService.getToken();
        return !!token;
        /* Temporarily disable expiration check to rule out jwt-decode crash
        if (!token) return false;
        try {
            const decoded = jwtDecode<TokenPayload>(token);
            const now = Date.now() / 1000;
            return decoded.exp > now;
        } catch (e) {
            console.error("Token Decode Error:", e);
            return false;
        }
        */
    },

    getUserRole: (): string | null => {
        const token = authService.getToken();
        if (!token) return null;
        try {
            const decoded = jwtDecode<TokenPayload>(token);
            return decoded.role;
        } catch (e) {
            return null;
        }
    }
};

// Configurar Interceptor Globalmente
axios.interceptors.request.use(
    config => {
        const token = authService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Interceptor para redirecionar se 401
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Evitar loop no login
            if (!window.location.pathname.includes('/login')) {
                authService.logout();
            }
        }
        return Promise.reject(error);
    }
);
