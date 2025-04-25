import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { api } from "../config/api";

// Custom event for token refresh
export const TOKEN_REFRESHED_EVENT = "auth:token_refreshed";
export const AUTH_LOGOUT_EVENT = "auth:logout";

interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  isVerified: boolean;
  status: string;
  restaurantInfo?: {
    location: {
      type: string;
      coordinates: number[];
    };
    cuisine: string[];
    images: string[];
  };
  deliveryInfo?: {
    currentLocation: {
      type: string;
      coordinates: number[];
    };
    documents: {
      driverLicense: { verified: boolean };
      vehicleRegistration: { verified: boolean };
      insurance: { verified: boolean };
    };
    availabilityStatus: string;
  };
  defaultLocations: any[];
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  refreshToken: () => Promise<string | null>;
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
  const [user, setUser] = useState<User | null>(() => {
    // Try to get user data from localStorage on initial load
    const storedUser = localStorage.getItem("adminUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("adminToken");
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug log function
  const logDebug = (message: string, data?: any) => {
    console.log(`[AuthContext] ${message}`, data || "");
  };

  // Custom event dispatcher for token refresh
  const dispatchTokenRefreshed = (token: string) => {
    logDebug("Dispatching token refreshed event");
    const event = new CustomEvent(TOKEN_REFRESHED_EVENT, { detail: { token } });
    document.dispatchEvent(event);
  };

  // Custom event dispatcher for logout
  const dispatchLogout = () => {
    logDebug("Dispatching logout event");
    const event = new Event(AUTH_LOGOUT_EVENT);
    document.dispatchEvent(event);
  };

  // Set up axios interceptors
  useEffect(() => {
    logDebug("Setting up axios interceptors");

    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("adminToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          logDebug(`Request interceptor: Added token to request`);
        }
        return config;
      },
      (error) => {
        logDebug(`Request interceptor error:`, error);
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        logDebug(`Response interceptor error:`, {
          status: error.response?.status,
          url: originalRequest?.url,
          isRetry: originalRequest?._retry,
        });

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          logDebug("Token expired, attempting refresh");

          try {
            const newToken = await refreshToken();
            if (newToken) {
              logDebug("Token refresh successful, retrying request");
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return axios(originalRequest);
            } else {
              throw new Error("Token refresh failed");
            }
          } catch (refreshError) {
            logDebug("Token refresh failed, logging out", refreshError);
            await logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    logDebug("getCurrentUser called");
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        logDebug("No token found in localStorage");
        throw new Error("No token found");
      }

      logDebug("Calling API: GET /me");
      const response = await axios.get(api.endpoints.auth.me, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      logDebug("Received user data", response.data);
      if (response.data) {
        setUser(response.data);
        localStorage.setItem("adminUser", JSON.stringify(response.data));
        setIsAuthenticated(true);
        logDebug("User state updated", response.data);
      }

      return response.data as User;
    } catch (error) {
      logDebug("Error in getCurrentUser:", error);

      if (axios.isAxiosError(error)) {
        setError(
          `API Error: ${error.response?.status || "Unknown"} - ${error.message}`
        );

        if (error.response?.status === 401) {
          logDebug("401 error - attempting token refresh");
          try {
            const newToken = await refreshToken();
            if (newToken) {
              logDebug("Token refreshed, retrying getCurrentUser");
              return getCurrentUser();
            }
          } catch (refreshError) {
            logDebug("Refresh token failed:", refreshError);
            setError("Session expired. Please login again.");
            throw refreshError;
          }
        }
      } else {
        setError("Unknown error occurred");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshToken = async (): Promise<string | null> => {
    logDebug("refreshToken called");
    setIsLoading(true);

    try {
      const refreshTokenValue = localStorage.getItem("refreshToken");
      if (!refreshTokenValue) {
        logDebug("No refresh token found");
        throw new Error("No refresh token found");
      }

      logDebug("Calling refresh token API");
      const response = await axios.post(
        api.endpoints.auth.refreshToken,
        {
          refreshToken: refreshTokenValue,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.token) {
        const newToken = response.data.token;
        logDebug("Refresh successful, updating tokens");
        localStorage.setItem("adminToken", newToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);

        // Notify other components about token refresh
        dispatchTokenRefreshed(newToken);

        return newToken;
      } else {
        logDebug("No token in refresh response");
        throw new Error("No token in response");
      }
    } catch (error) {
      logDebug("Refresh token error:", error);
      clearAuthData();
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to clear all auth data
  const clearAuthData = () => {
    logDebug("Clearing auth data");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("adminUser");
    setUser(null);
    setIsAuthenticated(false);
  };

  // Initialize auth state
  useEffect(() => {
    logDebug("Initializing auth state");

    const initializeAuth = async () => {
      setIsLoading(true);

      try {
        const token = localStorage.getItem("adminToken");
        logDebug(`Token exists in localStorage: ${!!token}`);

        if (token) {
          logDebug("Token found, attempting to get current user");
          await getCurrentUser();
          logDebug("User successfully loaded");
        } else {
          logDebug("No token found, user not authenticated");
          clearAuthData();
        }
      } catch (error) {
        logDebug("Error during initialization:", error);
        clearAuthData();
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
        logDebug("Auth initialization completed");
      }
    };

    initializeAuth();
  }, [getCurrentUser]);

  const login = async (email: string, password: string) => {
    logDebug(`Login attempt for: ${email}`);
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        api.endpoints.auth.login,
        {
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.token) {
        const token = response.data.token;
        logDebug("Login successful");
        localStorage.setItem("adminToken", token);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        localStorage.setItem("adminUser", JSON.stringify(response.data.user));
        setUser(response.data.user);
        setIsAuthenticated(true);

        // Notify components about new token
        dispatchTokenRefreshed(token);
      } else {
        logDebug("No token in login response");
        throw new Error("No token in response");
      }
    } catch (error) {
      logDebug("Login error:", error);
      setError("Invalid email or password");
      throw new Error("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    logDebug("Logout called");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("adminToken");
      if (token) {
        logDebug("Calling logout API");
        await axios.post(api.endpoints.auth.logout, null, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        logDebug("Logout API call successful");
      }
    } catch (error) {
      logDebug("Logout API error (continuing anyway):", error);
    } finally {
      clearAuthData();
      // Notify other components about logout
      dispatchLogout();
      setIsLoading(false);
    }
  };

  // Final auth state for debugging
  useEffect(() => {
    logDebug("Auth state updated", {
      isAuthenticated,
      isInitialized,
      hasUser: !!user,
      userName: user?.name,
    });
  }, [isAuthenticated, isInitialized, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isInitialized,
        isLoading,
        error,
        login,
        logout,
        getCurrentUser,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
