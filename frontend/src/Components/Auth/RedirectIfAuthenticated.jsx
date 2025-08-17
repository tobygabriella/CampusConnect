import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/Components/context/AuthContext";
import GettingStarted from "../LandingPage/GettingStarted.jsx";
import Loading from "@/Components/Loading/LoadingState";

const RedirectIfAuthenticated = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading />;
  }

  const publicPaths = ["/getting-started", "/login", "/signup", "/waitlist"];

  // Allow access to public pages explicitly
  if (!isAuthenticated && publicPaths.includes(location.pathname)) {
    if (location.pathname === "/getting-started") return <GettingStarted />;
    return null; // proceed to requested public route
  }

  // If authenticated user tries accessing getting-started, redirect them to profile
  if (isAuthenticated && location.pathname === "/getting-started") {
    return <Navigate to="/profile" replace />;
  }

  // If unauthenticated user accesses any protected page, redirect them to getting-started
  if (!isAuthenticated && !publicPaths.includes(location.pathname)) {
    return <Navigate to="/getting-started" replace />;
  }

  return null; // allow authenticated users to proceed
};

export default RedirectIfAuthenticated;