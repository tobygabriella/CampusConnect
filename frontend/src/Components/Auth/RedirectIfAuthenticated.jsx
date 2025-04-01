import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "/Users/tobygabriella/Desktop/Aro/frontend/src/Components/context/AuthContext.jsx";
import GettingStarted from "../LandingPage/GettingStarted.jsx";

const RedirectIfAuthenticated = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If the user is authenticated and tries to access the getting-started page, redirect to profile
  if (isAuthenticated && location.pathname === "/getting-started") {
    return <Navigate to="/profile" replace />;
  }

  // If the user is not authenticated and tries to access the getting-started page, allow it
  if (!isAuthenticated && location.pathname === "/getting-started") {
    return <GettingStarted />;
  }

  // If the user is not authenticated and tries to access any other page, redirect to getting-started
  if (!isAuthenticated) {
    return <Navigate to="/getting-started" replace />;
  }

  // If none of the above, allow the user to proceed
  return <Navigate to="/" replace />;
};

export default RedirectIfAuthenticated;
