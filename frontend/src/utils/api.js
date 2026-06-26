import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds timeout
});

// Request Interceptor: Attach JWT Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Customize generic Network Error to show actual API failure details
    if (error.message === 'Network Error') {
      error.message = `Network Error: Failed to connect to the backend server at ${API_URL}. Please ensure the server is running and accessible.`;
    }

    // Log the exact failing API URL and response in the browser console
    const fullUrl = error.config 
      ? (error.config.url.startsWith('http') 
          ? error.config.url 
          : `${error.config.baseURL || ''}${error.config.url}`) 
      : 'unknown';
    console.error(`API Failure at URL: ${fullUrl}`, {
      method: error.config?.method,
      status: error.response?.status,
      response: error.response?.data,
      message: error.message
    });

    const originalRequest = error.config;
    
    // Check if error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // Attempt to refresh token using anonymous request instance
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          const { access_token, refresh_token, role, name } = response.data;
          
          localStorage.setItem('accessToken', access_token);
          localStorage.setItem('refreshToken', refresh_token);
          
          // Re-run the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clean up local storage and redirect
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userName');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
