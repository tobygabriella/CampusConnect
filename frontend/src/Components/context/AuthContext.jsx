import { createContext, useContext, useState, useEffect } from 'react';
import api from "/Users/tobygabriella/Desktop/Aro/frontend/src/utils/axiosInstance.js";
import { logoutUser } from "/Users/tobygabriella/Desktop/Aro/frontend/src/utils/authUtils.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Set initial to false
  const [isLoading, setIsLoading] = useState(true);

  const verifyAuth = async () => {
    try {
      // Check if auth token exists in cookies
      const response = await api.get('/auth/verify-token', { withCredentials: true });
      
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Token verification failed:", error.response?.status);
      
      if (error.response?.status === 401) {
        // Try refreshing the token
        try {
          const refreshResponse = await api.post('/auth/refresh-token', { withCredentials: true });
  
          if (refreshResponse.status === 200) {
            return verifyAuth(); // Retry authentication after refresh
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError.response?.status);
          logoutUser(); // Logout and redirect if refresh fails
        }
      } else {
        logoutUser();
      }
    } finally {
      setIsLoading(false);
    }
  };
  

  useEffect(() => {
    verifyAuth();
  }, []);

  const login = async (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };
  

  const updateUser = (newUserData) => {
    setUser(prev => ({ ...prev, ...newUserData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateUser,
        verifyAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};