import React, { useEffect } from "react";
import { useNotifications } from "../context/NotificationsContext";
import { useAuth } from "../context/AuthContext";

export const NotificationHandler: React.FC = () => {
  const { registerForPushNotifications } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    // Register for push notifications when user logs in
    if (user) {
      registerForPushNotifications();
    }
  }, [user]);

  // This is a "headless" component - it doesn't render anything
  return null;
};
