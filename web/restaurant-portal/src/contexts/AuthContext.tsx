import React, { createContext, useContext, useState, useEffect } from "react";
import { User, LoginResponse, RegisterData } from "../services/userService";
import { userService } from "../services/userService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  sessionTimeRemaining: number | null;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<
    number | null
  >(null);

  // Load user data if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const currentUser = await userService.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Failed to load user:", error);
          localStorage.removeItem("token");
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []); // Remove user dependency to prevent unnecessary re-renders

  // Token expiration check for session timer
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setSessionTimeRemaining(null);
      return;
    }

    const checkTokenExpiration = () => {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expiryTime = payload.exp * 1000;
        const remaining = Math.floor((expiryTime - Date.now()) / 1000);
        setSessionTimeRemaining(remaining > 0 ? remaining : 0);

        // Auto-refresh token if it's about to expire (within 5 minutes)
        if (remaining < 300 && remaining > 60) {
          refreshToken();
        }
      } catch (error) {
        console.error("Token validation error:", error);
        setSessionTimeRemaining(null);
        logout();
      }
    };

    checkTokenExpiration();
    const timer = setInterval(checkTokenExpiration, 1000);

    return () => clearInterval(timer);
  }, []);

  const refreshToken = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await userService.refreshToken(token);
      localStorage.setItem("token", response.token);
      // After refreshing token, reload user data
      const currentUser = await userService.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.login(email, password);
      localStorage.setItem("token", response.token);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Login failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.register(data);
      localStorage.setItem("token", response.token);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Registration failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    setSessionTimeRemaining(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        sessionTimeRemaining,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
