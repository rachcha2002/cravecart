import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";
import {
  playNotificationSound,
  preloadNotificationSound,
} from "../utils/SoundUtils";

// Define the notification type
export interface Notification {
  id: string;
  type: "new-order" | "order-status-update" | "info" | "IN_APP";
  title?: string;
  message: string;
  timestamp: Date;
  orderId?: string;
  read: boolean;
  data?: any;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  socket: Socket | null;
  clearNotifications: () => void;
  socketConnected: boolean;
  reconnectSocket: () => void;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">
  ) => void;
  fetchUnreadNotifications: () => Promise<void>;
}

interface NotificationProviderProps {
  children: ReactNode;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

// Get socket.io server URLs from environment variables or use defaults
const NOTIFICATION_SERVICE_URL =
  process.env.REACT_APP_NOTIFICATION_SERVICE_URL || "http://localhost:5005";

// Provider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { user } = useAuth();

  // Use a ref to track socket connection to prevent duplicate connections
  const socketRef = useRef<Socket | null>(null);

  // Use another ref to track if initial fetch has been done
  const initialFetchDoneRef = useRef(false);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Preload notification sound
  useEffect(() => {
    preloadNotificationSound();
  }, []);

  // Fetch unread notifications - memoized to prevent recreation on each render
  const fetchUnreadNotifications = useCallback(async () => {
    if (!user?._id) {
      console.log("fetchUnreadNotifications: No user ID available");
      return;
    }

    // Add a debug log
    console.log("fetchUnreadNotifications called for restaurant:", user._id);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      // Clear existing notifications to prevent duplicates
      setNotifications([]);

      const response = await fetch(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/unread/${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // Add cache control headers to prevent caching
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      console.log("Fetch unread response status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetch unread response data:", data);

      if (data.success && data.data) {
        console.log("Received unread notifications:", data.data.length);

        // Transform to our notification format
        const fetchedNotifications = data.data.map((notif: any) => ({
          id: notif._id,
          type: notif.type || "info",
          title: notif.title,
          message: notif.message,
          timestamp: new Date(notif.createdAt),
          orderId: notif.orderId,
          read: false,
          data: notif.data,
          actionUrl: notif.actionUrl,
          actionText: notif.actionText,
        }));

        // Set notifications state with fresh data from server
        setNotifications(fetchedNotifications);
        console.log(
          "Updated notifications state with",
          fetchedNotifications.length,
          "items"
        );
      } else {
        console.log("No unread notifications found or invalid response format");
        // Clear notifications if none returned
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [user?._id]); // Only re-create when user ID changes

  // Initialize socket connection
  useEffect(() => {
    // Only initialize if user exists and no active connection is in progress
    if (!user?._id || isConnecting || socketRef.current) {
      return;
    }

    console.log("Setting up socket connection for restaurant:", user._id);
    setIsConnecting(true);

    // Get the appropriate namespace based on user role
    const userRole = user.role || "RESTAURANT";
    const namespace = userRole.toLowerCase().replace("_", "-");
    const namespaceUrl = `${NOTIFICATION_SERVICE_URL}/${namespace}`;

    try {
      const socketInstance = io(namespaceUrl, {
        auth: { userId: user._id },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ["websocket", "polling"],
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);

      socketInstance.on("connect", () => {
        console.log("Socket connected successfully:", socketInstance.id);
        setSocketConnected(true);
        setIsConnecting(false);
        setIsPolling(false);

        // Join user-specific room
        socketInstance.emit("join", {
          userId: user._id,
          userType: userRole,
        });

        console.log("Emitted join event with:", {
          userId: user._id,
          userType: userRole,
        });
      });

      socketInstance.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
        setSocketConnected(false);
        setIsConnecting(false);
        setIsPolling(true);
      });

      socketInstance.on("disconnect", () => {
        console.log("Socket disconnected");
        setSocketConnected(false);
        setIsPolling(true);
      });

      socketInstance.on("reconnect_failed", () => {
        console.error("Socket reconnection failed after max attempts");
        setIsPolling(true);
      });

      // Listen for notifications
      socketInstance.on("notification", (data) => {
        console.log("Received notification via socket:", data);

        const newNotification: Notification = {
          id: data.id || Math.random().toString(36).substring(2, 9),
          type: data.type || "info",
          title: data.title,
          message: data.message,
          timestamp: new Date(),
          orderId: data.orderId,
          read: false,
          data: data.data,
          actionUrl: data.actionUrl,
          actionText: data.actionText,
        };

        setNotifications((prev) => [newNotification, ...prev]);

        // Play notification sound for new notifications
        playNotificationSound();

        // Show toast notification
        toast.success(`${data.title || "New notification"}: ${data.message}`, {
          duration: 5000,
        });
      });

      // Listen for unread count updates
      socketInstance.on("unreadCount", (data) => {
        console.log("Received unread count update:", data);
        // We don't need to do anything here as we'll fetch unread notifications
      });

      // Listen for notification-read events
      socketInstance.on("notification-read", (data) => {
        console.log("Received notification-read event:", data);
        // Refresh notifications when server confirms read status changed
        fetchUnreadNotifications();
      });

      // Listen for new order notifications
      socketInstance.on("new-order", (data) => {
        console.log("Received new order via socket:", data);

        // Only add notification if the order is for this restaurant
        if (
          data.orderData.restaurant &&
          data.orderData.restaurant._id === user._id
        ) {
          const newNotification: Notification = {
            id: Math.random().toString(36).substring(2, 9),
            type: "new-order",
            title: "New Order",
            message: data.message || `New order #${data.orderId} received!`,
            timestamp: new Date(),
            orderId: data.orderId,
            read: false,
            data: data.orderData,
          };

          setNotifications((prev) => [newNotification, ...prev]);

          // Play notification sound for new orders
          playNotificationSound();

          // Show toast notification
          toast.success(
            `New Order: ${data.message || `Order #${data.orderId} received!`}`,
            {
              duration: 5000,
            }
          );
        }
      });

      // Handle order status updates
      socketInstance.on("order-status-update", (data) => {
        console.log("Received order status update:", data);

        // Only add notification if the order is for this restaurant
        if (
          data.orderData.restaurant &&
          data.orderData.restaurant._id === user._id
        ) {
          // Format the status for display
          const formattedStatus = data.status
            .split("-")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          const newNotification: Notification = {
            id: Math.random().toString(36).substring(2, 9),
            type: "order-status-update",
            title: "Order Status Update",
            message:
              data.message ||
              `Order #${data.orderId} status updated to ${formattedStatus}`,
            timestamp: new Date(),
            orderId: data.orderId,
            read: false,
            data: {
              ...data.orderData,
              formattedStatus,
              timestamp: new Date(),
            },
          };

          setNotifications((prev) => [newNotification, ...prev]);

          // Play notification sound
          playNotificationSound();

          // Show toast notification
          toast.success(
            `Order Update: ${
              data.message ||
              `Order #${data.orderId} status updated to ${formattedStatus}`
            }`,
            {
              duration: 5000,
            }
          );
        }
      });

      return () => {
        console.log("Cleaning up socket connection");
        socketInstance.disconnect();
        setSocket(null);
        socketRef.current = null;
        setIsConnecting(false);
      };
    } catch (error) {
      console.error("Error initializing socket:", error);
      setIsConnecting(false);
      setIsPolling(true);
      socketRef.current = null;
    }
  }, [user, fetchUnreadNotifications]); // Include fetchUnreadNotifications to dependencies

  // Add polling when socket is offline
  useEffect(() => {
    if (!isPolling || !user?._id) return;

    console.log("Starting polling for notifications");

    // Initial fetch
    fetchUnreadNotifications();

    // Set up polling interval
    const intervalId = setInterval(() => {
      console.log("Polling for notifications");
      fetchUnreadNotifications();
    }, 30000); // Poll every 30 seconds

    return () => {
      console.log("Stopping notification polling");
      clearInterval(intervalId);
    };
  }, [isPolling, user?._id, fetchUnreadNotifications]);

  // Fetch notifications on initial load, only once
  useEffect(() => {
    if (user?._id && !initialFetchDoneRef.current) {
      console.log("Initial fetch of notifications");
      fetchUnreadNotifications();
      initialFetchDoneRef.current = true;
    }
  }, [user?._id, fetchUnreadNotifications]);

  // Add a new notification - memoized
  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);

      // Play notification sound
      playNotificationSound();
    },
    []
  );

  // Mark a notification as read - memoized
  const markAsRead = useCallback(
    async (id: string) => {
      if (!user?._id) {
        console.log("markAsRead: No user ID available");
        return;
      }

      console.log("Marking notification as read:", id);

      // Update UI state immediately
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );

      // Call API to persist the change
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          return;
        }

        console.log("Calling mark-read API endpoint...");
        const response = await fetch(
          `${NOTIFICATION_SERVICE_URL}/api/notifications/read/${id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              // Add cache control headers to prevent caching
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
            body: JSON.stringify({
              userId: user._id,
              userType: user.role || "RESTAURANT_OWNER",
            }),
          }
        );

        console.log("Mark read response status:", response.status);

        if (!response.ok) {
          console.error(
            "Failed to mark notification as read on server:",
            response.status
          );
          return;
        }

        const responseData = await response.json();
        console.log("Mark read response data:", responseData);

        // Fetch updated unread notifications after a small delay
        setTimeout(() => {
          fetchUnreadNotifications();
        }, 500);
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [user?._id, fetchUnreadNotifications]
  );

  // Mark all notifications as read - memoized
  const markAllAsRead = useCallback(async () => {
    if (!user?._id || notifications.length === 0) {
      console.log("markAllAsRead: No user ID or no notifications");
      return;
    }

    console.log("Marking all notifications as read");

    // Update UI state immediately
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );

    // Call API to persist the change
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      console.log("Calling mark-all-read API endpoint...");
      const response = await fetch(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/mark-all-read/${user._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            // Add cache control headers to prevent caching
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          body: JSON.stringify({
            userId: user._id,
            userType: user.role || "RESTAURANT_OWNER",
          }),
        }
      );

      console.log("Mark all read response status:", response.status);

      if (!response.ok) {
        console.error(
          "Failed to mark all notifications as read on server:",
          response.status
        );
        return;
      }

      const responseData = await response.json();
      console.log("Mark all read response data:", responseData);

      // Fetch updated unread notifications after marking all as read
      setTimeout(() => {
        fetchUnreadNotifications();
      }, 500);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [user?._id, notifications.length, fetchUnreadNotifications]);

  // Clear all notifications - memoized
  const clearNotifications = useCallback(() => {
    console.log("Clearing all notifications");
    setNotifications([]);
  }, []);

  // Manual reconnect function - memoized
  const reconnectSocket = useCallback(() => {
    if (!user || !user._id) return;

    console.log("Manually reconnecting socket");

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Show reconnecting toast
    toast.loading("Reconnecting to notification server...", {
      id: "reconnect-toast",
    });

    // Create new socket
    const userRole = user.role || "RESTAURANT_OWNER";
    const namespace = userRole.toLowerCase().replace("_", "-");
    const namespaceUrl = `${NOTIFICATION_SERVICE_URL}/${namespace}`;

    const newSocket = io(namespaceUrl, {
      auth: { userId: user._id },
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Handle connection events
    newSocket.on("connect", () => {
      console.log("Socket reconnected:", newSocket.id);
      setSocketConnected(true);
      toast.success("Successfully reconnected!", { id: "reconnect-toast" });

      // Join user-specific room
      newSocket.emit("join", {
        userId: user._id,
        userType: userRole,
      });

      // Fetch missed notifications
      fetchUnreadNotifications();
    });

    newSocket.on("connect_error", (error) => {
      console.error("Reconnection error:", error.message);
      setSocketConnected(false);
      toast.error("Failed to reconnect", { id: "reconnect-toast" });
    });
  }, [user, fetchUnreadNotifications]);

  // Refresh notifications on page visibility change
  useEffect(() => {
    // When the user comes back to the tab, refresh notifications
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user?._id) {
        console.log("Page became visible, refreshing notifications");
        fetchUnreadNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchUnreadNotifications, user?._id]);

  // Log when the component renders
  console.log("NotificationProvider render, unreadCount:", unreadCount);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        socket,
        clearNotifications,
        socketConnected,
        reconnectSocket,
        addNotification,
        fetchUnreadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
