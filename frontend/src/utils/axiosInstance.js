import axios from 'axios';
import { clearAuthCookiesAndRedirect } from "@/utils/authUtils.js";


const api = axios.create({
  baseURL: 'http://localhost:5001',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Keep track of refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response, // Return valid responses as they are
  async (error) => {
    const originalRequest = error.config;

    console.error("API Error:", {
      status: error.response?.status,
      url: originalRequest.url,
      isRetry: originalRequest._retry,
      isRefreshing
    });

    // If it's not 401 or it's already been retried, reject
    if (
      error.response?.status !== 401 || 
      originalRequest._retry || 
      originalRequest.url.includes('/auth/refresh-token') // Don't retry refresh requests
    ) {
      return Promise.reject(error);
    }

    // Handle multiple requests waiting for refresh
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(originalRequest))
        .catch(err => Promise.reject(err));
    }

    //Start refresh process
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await api.post('/auth/refresh-token', { withCredentials: true });

      if (refreshResponse.status === 200) {
        processQueue(null);
        return api(originalRequest); // Retry original request
      }
    } catch (refreshError) {
      console.error("Refresh token failed:", refreshError.response?.status);
      
      // Prevent infinite loop by logging out without reloading
      processQueue(refreshError, null);
      clearAuthCookiesAndRedirect({ reload: false }); // Custom logout function without reload

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
