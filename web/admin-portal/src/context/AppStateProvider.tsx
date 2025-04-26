import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

import {
  AUTH_LOGOUT_EVENT,
  TOKEN_REFRESHED_EVENT,
  useAuth,
} from "./AuthContext";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { api } from "../config/api";

// Add socket.io to the AppState
interface AppState {
  isLoading: boolean;
  headerData: {
    unreadCount: number;
    notifications: Notification[];
    userDisplayName: string | null;
    userAvatar: string | null;
  };
  isSocketConnected: boolean;
  error: string | null;
}

interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  // Add other notification fields as needed
}

interface AppStateContextType {
  appState: AppState;
  refreshHeaderData: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(
  undefined
);

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
};

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  // Initialize state with localStorage data if available
  const [appState, setAppState] = useState<AppState>(() => {
    try {
      const savedHeaderData = localStorage.getItem("headerData");
      return {
        isLoading: false,
        headerData: savedHeaderData
          ? JSON.parse(savedHeaderData)
          : {
              unreadCount: 0,
              notifications: [],
              userDisplayName: null,
              userAvatar: null,
            },
        isSocketConnected: false,
        error: null,
      };
    } catch (error) {
      console.error("Error loading header data from localStorage:", error);
      return {
        isLoading: false,
        headerData: {
          unreadCount: 0,
          notifications: [],
          userDisplayName: null,
          userAvatar: null,
        },
        isSocketConnected: false,
        error: null,
      };
    }
  });

  // Debug logging function
  const logDebug = (message: string, data?: any) => {
    console.log(`[AppState] ${message}`, data || "");
  };

  // Function to create socket connection
  const createSocketConnection = (token: string) => {
    logDebug("Creating WebSocket connection");

    // Disconnect existing socket if any
    if (socketRef.current) {
      logDebug("Disconnecting existing socket");
      socketRef.current.disconnect();
    }

    // Connect to WebSocket server
    const socket = io(api.baseURL, {
      auth: {
        token: token,
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Socket event handlers
    socket.on("connect", () => {
      logDebug("WebSocket connected");
      setAppState((prev) => ({ ...prev, isSocketConnected: true }));
    });

    socket.on("disconnect", () => {
      logDebug("WebSocket disconnected");
      setAppState((prev) => ({ ...prev, isSocketConnected: false }));
    });

    socket.on("error", (error) => {
      logDebug("WebSocket error", error);
      setAppState((prev) => ({ ...prev, error: "Connection error" }));
    });

    // Listen for new notifications
    socket.on("notification", (newNotification: Notification) => {
      logDebug("New notification received", newNotification);

      setAppState((prev) => {
        const updatedNotifications = [
          newNotification,
          ...prev.headerData.notifications,
        ];

        const newHeaderData = {
          ...prev.headerData,
          unreadCount: prev.headerData.unreadCount + 1,
          notifications: updatedNotifications,
        };

        // Update localStorage
        localStorage.setItem("headerData", JSON.stringify(newHeaderData));

        return {
          ...prev,
          headerData: newHeaderData,
        };
      });
    });

    // Listen for notification updates (e.g., when notifications are marked as read by another client)
    socket.on("notifications:update", () => {
      logDebug("Notification update received, refreshing data");
      refreshHeaderData();
    });

    // Store socket reference
    socketRef.current = socket;
    return socket;
  };

  // Setup WebSocket connection
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      createSocketConnection(token);

      // Cleanup function
      return () => {
        if (socketRef.current) {
          logDebug("Cleaning up WebSocket connection");
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [isInitialized, isAuthenticated]);

  // Listen for token refresh events
  useEffect(() => {
    const handleTokenRefresh = (event: CustomEvent) => {
      const { token } = event.detail;
      logDebug("Token refresh event received, reconnecting socket");
      createSocketConnection(token);
    };

    const handleLogout = () => {
      logDebug("Logout event received, disconnecting socket");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };

    // Add event listeners
    document.addEventListener(
      TOKEN_REFRESHED_EVENT,
      handleTokenRefresh as EventListener
    );
    document.addEventListener(AUTH_LOGOUT_EVENT, handleLogout);

    // Clean up
    return () => {
      document.removeEventListener(
        TOKEN_REFRESHED_EVENT,
        handleTokenRefresh as EventListener
      );
      document.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    };
  }, []);

  // Function to refresh header data from API
  const refreshHeaderData = async () => {
    if (!isAuthenticated) {
      logDebug("Not authenticated, skipping header data refresh");
      return;
    }

    logDebug("Refreshing header data");
    setAppState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get user data from localStorage as fallback
      const storedUser = localStorage.getItem("adminUser");
      const userObj = user || (storedUser ? JSON.parse(storedUser) : null);

      if (!userObj) {
        throw new Error("No user data available");
      }

      // Update user display info
      const userDisplayName = userObj.name || "User";
      const userAvatar = userObj.avatar || null;

      // Fetch notifications
      const notificationsResponse = await axios.get(
        api.endpoints.notifications.getAll,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const notifications = notificationsResponse.data || [];
      const unreadCount = notifications.filter(
        (n: Notification) => !n.isRead
      ).length;

      // Update state
      const newHeaderData = {
        unreadCount,
        notifications,
        userDisplayName,
        userAvatar,
      };

      setAppState((prev) => ({
        ...prev,
        isLoading: false,
        headerData: newHeaderData,
      }));

      // Save to localStorage for persistence
      localStorage.setItem("headerData", JSON.stringify(newHeaderData));
      logDebug(
        "Header data refreshed and saved to localStorage",
        newHeaderData
      );
    } catch (error) {
      logDebug("Error refreshing header data:", error);
      setAppState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to load header data",
      }));
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (id: string) => {
    try {
      await axios.post(
        `${api.endpoints.notifications.markAsRead}/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update local state
      setAppState((prev) => {
        const updatedNotifications = prev.headerData.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        );

        const newHeaderData = {
          ...prev.headerData,
          unreadCount: updatedNotifications.filter((n) => !n.isRead).length,
          notifications: updatedNotifications,
        };

        // Update localStorage
        localStorage.setItem("headerData", JSON.stringify(newHeaderData));

        return {
          ...prev,
          headerData: newHeaderData,
        };
      });

      // Emit socket event to notify other clients
      if (socketRef.current) {
        socketRef.current.emit("notifications:markAsRead", { id });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      setAppState((prev) => ({
        ...prev,
        error: "Failed to update notification",
      }));
    }
  };

  // Set error message
  const setError = (error: string | null) => {
    setAppState((prev) => ({
      ...prev,
      error,
    }));
  };

  // Load initial data when auth state changes
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      // Load user data from localStorage as fallback
      const storedUser = localStorage.getItem("adminUser");
      const userObj = user || (storedUser ? JSON.parse(storedUser) : null);

      if (userObj) {
        setAppState((prev) => ({
          ...prev,
          headerData: {
            ...prev.headerData,
            userDisplayName: userObj.name || "User",
            userAvatar: userObj.avatar || null,
          },
        }));
      }

      // Get fresh data from API
      refreshHeaderData();
    } else if (isInitialized && !isAuthenticated) {
      // Clear header data when logged out
      setAppState({
        isLoading: false,
        headerData: {
          unreadCount: 0,
          notifications: [],
          userDisplayName: null,
          userAvatar: null,
        },
        isSocketConnected: false,
        error: null,
      });
      localStorage.removeItem("headerData");
    }
  }, [isInitialized, isAuthenticated, user]);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "headerData" && e.newValue) {
        try {
          const newHeaderData = JSON.parse(e.newValue);
          setAppState((prev) => ({
            ...prev,
            headerData: newHeaderData,
          }));
        } catch (error) {
          console.error("Error parsing header data from storage event:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        appState,
        refreshHeaderData,
        markNotificationAsRead,
        setError,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};
