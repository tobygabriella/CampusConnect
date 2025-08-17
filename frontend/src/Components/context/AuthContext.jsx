import { createContext, useContext, useState, useEffect } from 'react';
import api from  "@/utils/axiosInstance.js";
import { clearAuthCookiesAndRedirect } from "@/utils/authUtils.js";
const AuthContext = createContext(null);
import Loading from '../Loading/LoadingState';

export const AuthProvider = ({ children }) =>  {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [isLoading, setIsLoading] = useState(true);

  const verifyAuth = async () => {
    try {
      const response = await api.get("/auth/verify-token", { withCredentials: true });
      
      if (response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        throw new Error("No user data found");
      }
    } catch (error) {
      console.error("Token verification failed:", error.response?.status);
      
      // Define public paths that don't require authentication
      const publicPaths = ["/", "/waitlist", "/login", "/signup", "/getting-started"];
      const currentPath = window.location.pathname;
      
      if (error.response?.status === 401) {
        try {
          const refreshResponse = await api.post("/auth/refresh-token", {}, { withCredentials: true });
          
          if (refreshResponse.status === 200) {
            return verifyAuth();
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError.response?.status);
          // Only redirect if not on a public page
          if (!publicPaths.includes(currentPath)) {
            clearAuthCookiesAndRedirect();
          }
        }
      } else {
        // Only redirect if not on a public page
        if (!publicPaths.includes(currentPath)) {
          clearAuthCookiesAndRedirect();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check for logout param
    if (window.location.search.includes('logout=true')) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      return; // Skip verification
    }
    verifyAuth();
  }, []);

  const login = async (formData, navigate) => {
    try {
      const response = await api.post("/auth/login", formData, { withCredentials: true });
  
      setUser(response.data.user);
      setIsAuthenticated(true);
  
      // Only redirect for specific onboarding cases
      if (response.data.user.role === "service_provider" && !response.data.user.serviceProvider?.profession) {
        navigate("/service-provider-info");
      } else if (!response.data.user.username) {
        navigate("/onboarding");
      }
      // Otherwise, stay on current page or let ProtectedRoute handle it
    } catch (error) {
      console.error("Login failed:", error.response?.data?.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      clearAuthCookiesAndRedirect();
    }
  };
  

  const updateUser = (newUserData) => {
    setUser(prev => ({ ...prev, ...newUserData }));
  };

  if (isLoading) {
    return <Loading />;
  }

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

export default AuthProvider;