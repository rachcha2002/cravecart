import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useAuth } from "./AuthContext";
import { authApi } from "../api/authApi";

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationsContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  notifications: NotificationItem[];
  unreadCount: number;
  registerForPushNotifications: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  handleNotificationResponse: (
    response: Notifications.NotificationResponse
  ) => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  expoPushToken: null,
  notification: null,
  notifications: [],
  unreadCount: 0,
  registerForPushNotifications: async () => {},
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  handleNotificationResponse: () => {},
});

// Configure notification handler for when received in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Provider component
export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Register for push notifications
  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      console.log("Push notifications are not available on emulator/simulator");
      return;
    }

    try {
      // Request permission
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return;
      }

      // Get the token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      let token;

      if (Platform.OS === "android") {
        // FCM token for Android
        token = await Notifications.getDevicePushTokenAsync();
      } else {
        // Expo token for iOS
        token = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
      }

      if (token?.data) {
        setExpoPushToken(token.data);
        console.log("Push token:", token.data);

        // If user is logged in, register token with backend
        if (user) {
          try {
            await authApi.registerDeviceToken(token.data, Platform.OS);
            console.log("Device token registered with backend");
          } catch (error) {
            console.error("Failed to register token with backend:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error getting push token:", error);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      // Use the route from your notification controller
      const response = await fetch(
        `${authApi.getNotificationApiUrl()}/notifications/unread/count/${
          user._id
        }`
      );
      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Use the route from your notification controller
      const response = await fetch(
        `${authApi.getNotificationApiUrl()}/notifications/unread/${user._id}`
      );
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data);
        // Update unread count based on fetched notifications
        setUnreadCount(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      // Use the route from your notification controller
      const response = await fetch(
        `${authApi.getNotificationApiUrl()}/notifications/read/${notificationId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user._id,
            userType: user.role.toUpperCase(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update local state - mark the notification as read
        setNotifications(
          notifications.map((n) =>
            n._id === notificationId ? { ...n, read: true } : n
          )
        );

        // Update unread count
        await fetchUnreadCount();
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      // Since there's no batch endpoint in your API,
      // we'll mark each notification as read individually
      const readPromises = notifications
        .filter((n) => !n.read)
        .map((n) => markAsRead(n._id));

      await Promise.all(readPromises);

      // Update local state
      setNotifications(notifications.map((n) => ({ ...n, read: true })));

      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };
  // Handle notification response
  const handleNotificationResponse = (
    response: Notifications.NotificationResponse
  ) => {
    const data = response.notification.request.content.data;

    // Handle notification data based on type
    if (data?.type === "new_order") {
      // Navigate to orders screen
      // navigation.navigate('orders') - Would need to use a navigation ref
      console.log("New order notification clicked:", data);
    } else if (data?.type === "account_update") {
      // Handle account updates
      console.log("Account update notification clicked:", data);
    }
  };

  // Set up notification listeners
  useEffect(() => {
    registerForPushNotifications();

    // Listen for incoming notifications
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
        fetchNotifications();
      });

    // Listen for notification responses
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );

    // Clean up listeners
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Set up periodic polling
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000); // Check for new notifications every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <NotificationsContext.Provider
      value={{
        expoPushToken,
        notification,
        notifications,
        unreadCount,
        registerForPushNotifications,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        handleNotificationResponse,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

// Custom hook for using the context
//export type { NotificationItem };
export const useNotifications = () => useContext(NotificationsContext);
