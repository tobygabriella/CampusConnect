
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "/Users/tobygabriella/Desktop/Aro/frontend/src/Components/context/AuthContext.jsx";
import { useEffect, useState } from "react";
import api from "@/utils/axiosInstance";

const ProtectedRoute = ({ requiresAuth = false, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [hasProviderDetails, setHasProviderDetails] = useState(false);
  const [checkingDetails, setCheckingDetails] = useState(false);

  useEffect(() => {
    const checkServiceProviderDetails = async () => {
      if (user?.role === "service_provider") {
        setCheckingDetails(true);
        try {
          const response = await api.get("/service-provider/details", { withCredentials: true });
          setHasProviderDetails(!!response.data);
        } catch (error) {
          setHasProviderDetails(false);
        } finally {
          setCheckingDetails(false);
        }
      }
    };

    if (isAuthenticated && user) {
      checkServiceProviderDetails();
    }
  }, [isAuthenticated, user]);

  // Show loading state while checking authentication or provider details
  if (isLoading || checkingDetails) {
    return <div>Loading...</div>;
  }

  // Only check auth if the route requires it
  if (requiresAuth) {
    // If route requires authentication and user is not authenticated, redirect to login
    if (!isAuthenticated && !isLoading) {
      return <Navigate to="/" replace />;
    }

    // Special handling for service providers
    if (user?.role === "service_provider") {
      // If we're not on the service-provider-info page and provider hasn't submitted details
      if (!hasProviderDetails && location.pathname !== "/service-provider-info") {
        return <Navigate to="/service-provider-info" replace />;
      }

      // If we're on the service-provider-info page and provider has submitted details
      if (hasProviderDetails && location.pathname === "/service-provider-info") {
        return <Navigate to="/profile" replace />;
      }
    }

    // If roles are specified and user's role is not included, redirect to appropriate dashboard
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