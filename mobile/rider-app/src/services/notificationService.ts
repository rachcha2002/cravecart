// src/services/notificationService.ts
import { authApi } from "../api/authApi";
import * as Notifications from "expo-notifications";

export const notificationService = {
  // Get all unread notifications
  getUnreadNotifications: async () => {
    try {
      // Get current user to get ID
      const currentUser = await authApi.getCurrentUser();
      const userId = currentUser.user._id;

      const response = await fetch(
        `${authApi.getNotificationApiUrl()}/notifications/unread/${userId}`
      );
      return await response.json();
    } catch (error) {
      console.error("Get unread notifications failed:", error);
      throw error;
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId: string) => {
    try {
      // Get current user to get ID
      const currentUser = await authApi.getCurrentUser();
      const userId = currentUser.user._id;

      const response = await fetch(
        `${authApi.getNotificationApiUrl()}/notifications/${notificationId}/read`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            userType: currentUser.user.role.toUpperCase(),
          }),
        }
      );

      return await response.json();
    } catch (error) {
      console.error("Mark notification as read failed:", error);
      throw error;
    }
  },

  // Schedule a local notification
  scheduleLocalNotification: async (
    title: string,
    body: string,
    data: any = {}
  ) => {
    try {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error("Schedule local notification failed:", error);
      throw error;
    }
  },
};
