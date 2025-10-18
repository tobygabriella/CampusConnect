import { createContext, useContext, useState, useEffect } from 'react';
import api from  "@/utils/axiosInstance.js";
import { clearAuthCookiesAndRedirect } from "@/utils/authUtils.js";
const AuthContext = createContext(null);
import Loading from '../Loading/LoadingState';

// DEVELOPMENT MODE - Using environment variable
// Control this via the VITE_DEV_MODE in .env file
const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

// Mock user for development - change role as needed
const DEV_USER = {
  id: "dev-user-123",
  name: "Development User",
  email: "dev@example.com",
  role: "student", // Change this to test different roles: "student" or "service_provider"
  username: "dev_user",
  avatar: null,
  // Properties for student role
  collegeId: "college-123",
  collegeName: "Dev University",
  verified: true,
  createdAt: new Date().toISOString(),
  // Properties for service provider role
  serviceProvider: {
    id: "sp-123",
    profession: "Stylist",
    professionId: "profession-123",
    bio: "Development bio for testing",
    services: [{
      id: "service-123",
      name: "Haircut",
      description: "Development service description",
      duration: 60,
      price: 50.00
    }],
    isAcceptingClients: true
  },
  // Add any other properties needed for specific features
};

export const AuthProvider = ({ children }) =>  {
  // In development mode, we start with the mock user and authenticated state
  const [user, setUser] = useState(DEV_MODE ? DEV_USER : null);
  const [isAuthenticated, setIsAuthenticated] = useState(DEV_MODE ? true : false); 
  const [isLoading, setIsLoading] = useState(!DEV_MODE); // Not loading in dev mode

  const verifyAuth = async () => {
    // Skip API calls in development mode
    if (DEV_MODE) {
      console.log("⚠️ DEVELOPMENT MODE: Using mock user, skipping authentication verification");
      setIsLoading(false);
      return;
    }

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
    // In development mode, use mock user
    if (DEV_MODE) {
      console.log("⚠️ DEVELOPMENT MODE: Logged in with mock user", formData.email);
      setUser(DEV_USER);
      setIsAuthenticated(true);
      return;
    }
    
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
    if (DEV_MODE) {
      console.log("⚠️ DEVELOPMENT MODE: Logged out mock user");
      
      // In development mode, simulate logout and redirect but maintain dev mode
      // This simulates logout UI behavior but keeps the dev mode enabled
      console.log("Redirecting to landing page");
      
      // Optional: Toggle this to test different logout behaviors
      const simulateFullLogout = false;
      
      if (simulateFullLogout) {
        // Simulate complete logout (will require clicking login again)
        setUser(null);
        setIsAuthenticated(false);
      } else {
        // Just redirect but keep mock user active (faster for testing)
        // The mock user will still be active when you navigate back to protected pages
      }
      
      // Always redirect to home
      window.location.href = '/';
      return;
    }
    
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
  
  // Development-only function to switch roles
  const switchDevRole = (newRole) => {
    if (DEV_MODE && (newRole === "student" || newRole === "service_provider")) {
      console.log(`⚠️ DEV MODE: Switching user role to ${newRole}`);
      setUser(prev => ({
        ...prev,
        role: newRole,
        // If switching to service_provider, ensure serviceProvider data is available
        // If switching to student, keep the existing serviceProvider data
      }));
      return true;
    }
    return false;
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
        verifyAuth,
        // Development-only function
        switchDevRole: DEV_MODE ? switchDevRole : undefined
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