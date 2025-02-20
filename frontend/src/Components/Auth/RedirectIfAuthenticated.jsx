import { Navigate } from "react-router-dom";
import { useAuth } from "/Users/tobygabriella/Desktop/Aro/frontend/src/Components/context/AuthContext.jsx";
import LandingPage from "/Users/tobygabriella/Desktop/Aro/frontend/src/Components/LandingPage/LandingPage.jsx";

const RedirectIfAuthenticated = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    if (user?.role === 'service_provider') {
      return <Navigate to="/service-provider-info" replace />;
    }
    return <Navigate to="/profile" replace />;
  }

  return <LandingPage />;
};

export default RedirectIfAuthenticated;
