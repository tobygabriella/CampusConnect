import axios from 'axios';

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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If it's not 401 or it's already been retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // If we're already refreshing, queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          return api(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Attempt to refresh the token
      await axios.post('/auth/refresh-token', {}, { 
        withCredentials: true,
        baseURL: 'http://localhost:5001'
      });
      
      processQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
