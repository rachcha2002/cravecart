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

// Define the notification type
export interface Notification {
  id: string;
  type: "order-status-update" | "info" | "IN_APP";
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

// Get socket.io server URL from environment variable or use a default
const NOTIFICATION_SERVICE_URL =
  process.env.REACT_APP_NOTIFICATION_SERVICE_URL ;

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

  // Fetch unread notifications - memoized to prevent recreation on each render
  const fetchUnreadNotifications = useCallback(async () => {
    if (!user?.id) return;

    // Add a debug log
    console.log("fetchUnreadNotifications called for user:", user.id);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const response = await fetch(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/unread/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
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

        // Add these notifications to state
        setNotifications((prev) => {
          // Filter out duplicates by ID
          const existingIds = prev.map((n) => n.id);
          const newNotifs = fetchedNotifications.filter(
            (n: Notification) => !existingIds.includes(n.id)
          );

          if (newNotifs.length > 0) {
            console.log(`Adding ${newNotifs.length} new notifications`);
            return [...newNotifs, ...prev];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [user?.id]); // Only re-create when user ID changes

  // Initialize socket connection
  useEffect(() => {
    // Only initialize if user exists and no active connection is in progress
    if (!user?.id || isConnecting || socketRef.current) {
      return;
    }

    console.log("Setting up socket connection for user:", user.id);
    setIsConnecting(true);

    // Get the appropriate namespace based on user role
    const userRole = user.role || "CUSTOMER";
    const namespace = userRole.toLowerCase().replace("_", "-");
    const namespaceUrl = `${NOTIFICATION_SERVICE_URL}/${namespace}`;

    try {
      const socketInstance = io(namespaceUrl, {
        auth: { userId: user.id },
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
        socketInstance.emit("join", { userId: user.id, userType: userRole });
        console.log("Emitted join event with:", {
          userId: user.id,
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

        // Show toast notification - Fixed: removed description property
        toast.success(`${data.title || "New notification"}: ${data.message}`, {
          duration: 5000,
        });
      });

      // Handle order status updates
      socketInstance.on("order-status-update", (data) => {
        console.log("Received order status update:", data);

        // Only add notification if the order is for this customer
        if (data.orderData?.user && data.orderData.user.id === user.id) {
          // Format the status for display
          const formattedStatus = data.status
            .split("-")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          // Create a more descriptive message based on the status
          let message = `Order #${data.orderId} `;
          switch (data.status) {
            case "order-received":
              message += "has been received by the restaurant";
              break;
            case "preparing-your-order":
              message += "is being prepared";
              break;
            case "wrapping-up":
              message += "is being wrapped up";
              break;
            case "picking-up":
              message += "is being picked up by the delivery partner";
              break;
            case "heading-your-way":
              message += "is on its way to you";
              break;
            case "delivered":
              message += "has been delivered";
              break;
            case "cancelled":
              message += "has been cancelled";
              break;
            default:
              message += `status updated to ${formattedStatus}`;
          }

          // Add notification
          const newNotification: Notification = {
            id: Math.random().toString(36).substring(2, 9),
            type: "order-status-update",
            message,
            timestamp: new Date(),
            orderId: data.orderId,
            read: false,
            data: {
              ...data.orderData,
              formattedStatus,
              timestamp: new Date(),
              restaurantName:
                data.orderData?.restaurant?.restaurantInfo?.restaurantName ||
                "Restaurant",
            },
          };

          setNotifications((prev) => [newNotification, ...prev]);

          // Show toast notification
          toast.success(message, {
            duration: 5000,
          });

          // Dispatch an event for other components to listen to
          window.dispatchEvent(
            new CustomEvent("orderStatusUpdate", {
              detail: {
                orderId: data.orderId,
                status: data.status,
                formattedStatus,
                data: data.orderData,
              },
            })
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
  }, [user]); // Include only user to prevent recreation on every render

  // Add polling when socket is offline
  useEffect(() => {
    if (!isPolling || !user?.id) return;

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
  }, [isPolling, user?.id, fetchUnreadNotifications]);

  // Fetch notifications on initial load, only once
  useEffect(() => {
    if (user?.id && !initialFetchDoneRef.current) {
      console.log("Initial fetch of notifications");
      fetchUnreadNotifications();
      initialFetchDoneRef.current = true;
    }
  }, [user?.id, fetchUnreadNotifications]);

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
    },
    []
  );

  // Mark a notification as read - memoized
  const markAsRead = useCallback(
    async (id: string) => {
      if (!user?.id) return;

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

        const response = await fetch(
          `${NOTIFICATION_SERVICE_URL}/api/notifications/read/${id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              userId: user.id,
              userType: user.role || "CUSTOMER",
            }),
          }
        );

        if (!response.ok) {
          console.error(
            "Failed to mark notification as read on server:",
            response.status
          );
        }
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [user?.id]
  );

  // Mark all notifications as read - memoized
  const markAllAsRead = useCallback(async () => {
    if (!user?.id || notifications.length === 0) return;

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

      const response = await fetch(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/mark-all-read/${user.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            userType: user.role || "CUSTOMER",
          }),
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to mark all notifications as read on server:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [user?.id, notifications.length]);

  // Clear all notifications - memoized
  const clearNotifications = useCallback(() => {
    console.log("Clearing all notifications");
    setNotifications([]);
  }, []);

  // Manual reconnect function - memoized
  const reconnectSocket = useCallback(() => {
    if (!user || !user.id) return;

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
    const userRole = user.role || "CUSTOMER";
    const namespace = userRole.toLowerCase().replace("_", "-");
    const namespaceUrl = `${NOTIFICATION_SERVICE_URL}/${namespace}`;

    const newSocket = io(namespaceUrl, {
      auth: { userId: user.id },
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Handle connection events
    newSocket.on("connect", () => {
      console.log("Socket reconnected:", newSocket.id);
      setSocketConnected(true);
      toast.success("Successfully reconnected!", { id: "reconnect-toast" });

      // Join user-specific room
      newSocket.emit("join", { userId: user.id, userType: userRole });

      // Fetch missed notifications
      fetchUnreadNotifications();
    });

    newSocket.on("connect_error", (error) => {
      console.error("Reconnection error:", error.message);
      setSocketConnected(false);
      toast.error("Failed to reconnect", { id: "reconnect-toast" });
    });
  }, [user, fetchUnreadNotifications]);

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

