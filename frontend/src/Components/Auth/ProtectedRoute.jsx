import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/Components/context/AuthContext";
import { useEffect, useState } from "react";
import api from "@/utils/axiosInstance";
import Loading from "@/Components/Loading/LoadingState";

// DEVELOPMENT MODE - Using environment variable
// Control this via the VITE_DEV_MODE in .env file
const BYPASS_AUTH = import.meta.env.VITE_DEV_MODE === "true";
// Mock user for development - change role as needed: "student" or "service_provider"
const DEV_USER = {
  id: "dev-user-123",
  name: "Development User",
  email: "dev@example.com",
  role: "student", // Change this to test different roles
  username: "dev_user",
  avatar: null
};

const ProtectedRoute = ({ requiresAuth = false, allowedRoles = [] }) => {
  // In development bypass mode, we won't need these values from AuthContext
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [hasProviderDetails, setHasProviderDetails] = useState(true); // Assume true in dev mode

  // For development mode, skip the authentication checks
  if (BYPASS_AUTH) {
    console.log("⚠️ DEVELOPMENT MODE: Authentication checks bypassed");
    
    // Check for role restrictions even in dev mode
    if (requiresAuth && allowedRoles.length > 0 && !allowedRoles.includes(DEV_USER.role)) {
      console.warn(`⚠️ DEV MODE: Role ${DEV_USER.role} not allowed here. Allowed roles: ${allowedRoles.join(', ')}`);
      console.warn("Change DEV_USER.role in ProtectedRoute.jsx to access this route");
      return <Navigate to="/not-authorized" replace />;
    }
    
    return <Outlet />;
  }

  // Original authentication logic follows
  useEffect(() => {
    const checkDetails = async () => {
      if (user?.role === "service_provider") {
        try {
          const { data } = await api.get("/service-provider/details", {
            withCredentials: true,
          });

          const complete = !!data?.professionId || (data?.services?.length ?? 0) > 0;

          setHasProviderDetails(complete);
        } catch (e) {
          console.error("✖️ Failed to fetch provider details:", e);
          setHasProviderDetails(false);
        }
      } else {
        setHasProviderDetails(true);
      }
    };

    if (isAuthenticated && user) {
      checkDetails();
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return <Loading />; 
  }

  if (user?.role === "service_provider" && hasProviderDetails === null) {
    return <Loading />
  }

  if (
    user?.role === "service_provider" &&
    location.pathname === "/service-provider-info" &&
    hasProviderDetails === true
  ) {
    return <Navigate to="/profile" replace />;
  }

  if (
    user?.role === "service_provider" &&
    hasProviderDetails === false &&
    location.pathname !== "/service-provider-info"
  ) {
    return <Navigate to="/service-provider-info" replace />;
  }

  if (requiresAuth) {
    if (!isAuthenticated) {
      return <Navigate to="/" replace state={{ from: location }} />;
    }

    // Log right before the provider‑info redirect
    if (
      user?.role === "service_provider" &&
      hasProviderDetails === false &&
      location.pathname !== "/service-provider-info"
    ) {
      return <Navigate to="/service-provider-info" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
      if (user?.role === "student") {
        return <Navigate to="/profile" replace />;
      } else if (user?.role === "service_provider") {
        return <Navigate to="/service-provider-info" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
