import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/Components/context/AuthContext";
import { useEffect, useState } from "react";
import api from "@/utils/axiosInstance";
import Loading from "@/Components/Loading/LoadingState";

const ProtectedRoute = ({ requiresAuth = false, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [hasProviderDetails, setHasProviderDetails] = useState(null);

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
    return <Loading />;
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
