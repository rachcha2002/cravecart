import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Use localStorage to check if we're authenticated during initialization
  const checkLocalStorage = () => {
    return !!localStorage.getItem("adminToken");
  };

  useEffect(() => {
    // If we've finished initializing and we're not authenticated, mark for redirect
    if (isInitialized && !isAuthenticated && !isLoading) {
      setIsRedirecting(true);
    }
  }, [isInitialized, isAuthenticated, isLoading]);

  // Show loading state while initializing auth
  if (!isInitialized || isLoading) {
    // We'll assume we're authenticated if there's a token in localStorage
    // This prevents flashing the login page during initialization
    if (checkLocalStorage()) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="spinner border-t-4 border-[#f29f05] border-solid h-12 w-12 rounded-full animate-spin mb-4 mx-auto"></div>
            <p>Loading your data...</p>
          </div>
        </div>
      );
    }

    // No token in localStorage, better to redirect immediately
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect if authentication fails
  if (isRedirecting || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
