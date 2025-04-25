// web/admin-portal/src/context/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { api } from "../config/api";

interface Notification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  receivers: {
    userId: string;
    receivingData: {
      channel: string;
      status: string;
      read: boolean;
      readAt: string | null;
    }[];
  }[];
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

// Socket.io instance
let socket: Socket | null = null;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize Socket.io connection
  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem("adminUser");
    if (!userStr) return;

    const user = JSON.parse(userStr);

    if (user && user._id) {
      console.log("Initializing notification socket for user:", user._id);

      // Connect to admin namespace
      socket = io(`${api.baseURL}/admin`, {
        auth: {
          token: localStorage.getItem("adminToken"),
        },
      });

      // Log connection status
      socket.on("connect", () => {
        console.log(
          "Connected to notification service with socket id:",
          socket?.id
        );
        // Join room with user ID
        socket?.emit("join", user._id);
        console.log(`Joined room with user ID: ${user._id}`);
      });

      // Listen for notifications
      socket.on("notification", (notification: Notification) => {
        console.log("Received notification:", notification);
        // Update notifications list (prepend new notification)
        setNotifications((prev) => [notification, ...prev.slice(0, 9)]);
        // Increment unread count
        setUnreadCount((count) => count + 1);
      });

      // Listen for unread count updates
      socket.on("unreadCount", ({ count }: { count: number }) => {
        console.log("Received unread count update:", count);
        setUnreadCount(count);
      });

      // Listen for connection errors
      socket.on("connect_error", (error: Error) => {
        console.error("Socket connection error:", error);
      });

      // Listen for disconnection
      socket.on("disconnect", (reason: string) => {
        console.log("Disconnected from notification service:", reason);
      });

      // Clean up on unmount
      return () => {
        if (socket) {
          console.log("Disconnecting socket");
          socket.disconnect();
        }
      };
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      // Get current user ID from localStorage
      const userStr = localStorage.getItem("adminUser");
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const userId = user._id;

      if (!userId) return;

      // Fetch unread notifications count
      const countResponse = await axios.get(
        `${api.endpoints.notifications.getAll}/unread/count/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (countResponse.data.success) {
        setUnreadCount(countResponse.data.count);
      }

      // Fetch unread notifications
      const response = await axios.get(
        `${api.endpoints.notifications.getAll}/unread/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      // Get current user
      const userStr = localStorage.getItem("adminUser");
      if (!userStr) return;

      const user = JSON.parse(userStr);

      await axios.post(
        `${api.endpoints.notifications.markAsRead}/${id}`,
        {
          userId: user._id,
          userType: "ADMIN",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => {
          if (notification._id === id) {
            return {
              ...notification,
              receivers: notification.receivers.map((receiver) => ({
                ...receiver,
                receivingData: receiver.receivingData.map((data) => ({
                  ...data,
                  read: true,
                  readAt: new Date().toISOString(),
                })),
              })),
            };
          }
          return notification;
        })
      );

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      // Get current user ID
      const userStr = localStorage.getItem("adminUser");
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const userId = user._id;

      if (!userId) return;

      // Mark all notifications as read
      for (const notification of notifications) {
        await axios.post(
          `${api.endpoints.notifications.markAsRead}/${notification._id}`,
          {
            userId: userId,
            userType: "ADMIN",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          receivers: notification.receivers.map((receiver) => ({
            ...receiver,
            receivingData: receiver.receivingData.map((data) => ({
              ...data,
              read: true,
              readAt: new Date().toISOString(),
            })),
          })),
        }))
      );

      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
