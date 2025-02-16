import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LandingPage from "/Users/tobygabriella/Desktop/Aro/frontend/src/Components/LandingPage/LandingPage.jsx";

const RedirectIfAuthenticated = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Show loading state while checking auth
  }

  return isAuthenticated ? <Navigate to="/home" replace /> : <LandingPage />;
};

export default RedirectIfAuthenticated;
