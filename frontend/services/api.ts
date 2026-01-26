import axios from 'axios';
import { authService } from './auth';

const api = axios.create({
    baseURL: '/api/v1'
});

api.interceptors.request.use(async config => {
    const token = authService.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            const detail = error.response.data?.detail || JSON.stringify(error.response.data);
            console.error("Auth Error:", detail);
            // Alert user to debug

            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                authService.logout();
            }
        }
        return Promise.reject(error);
    }
);

export default api;
