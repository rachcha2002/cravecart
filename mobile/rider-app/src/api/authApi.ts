// src/api/authApi.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Base API URL configuration
export const BASE_API_URL =process.env.EXPO_PUBLIC_BASE_URL ||"http://192.168.121.59"; // Centralized server URL

// API URLs for different services
export const API_URLS = {
  AUTH_SERVICE:process.env.EXPO_PUBLIC_AUTH_SERVICE,
  ORDER_SERVICE:process.env.EXPO_PUBLIC_ORDER_SERVICE,
  DELIVERY_SERVICE:process.env.EXPO_PUBLIC_DELIVERY_SERVICE,
  NOTIFICATION_SERVICE:process.env.EXPO_PUBLIC_NOTIFICATION_SERVICE,
  SOCKET_SERVICE:process.env.EXPO_PUBLIC_SOCKET_SERVICE
};

// Choose the right URL based on where the app is running
const getApiUrl = () => {
  if (Platform.OS === "android") {

    // For Android emulator - use the configured IP
    return API_URLS.AUTH_SERVICE;

    
  } else if (Platform.OS === "ios") {
    // For iOS simulator
    return "http://localhost:3001/api";
  } else {
    // For web or fallback
    return "http://localhost:3001/api";
  }
};

const getNotificationApiUrl = () => {
  if (Platform.OS === "android") {
    // For Android emulator - this special IP points to host machine's localhost
    return API_URLS.NOTIFICATION_SERVICE;


  } else if (Platform.OS === "ios") {
    // For iOS simulator
    return "http://localhost:3001/api";
  } else {
    // For web or fallback
    return "http://localhost:3001/api";
  }
};

const API_URL = getApiUrl();
const NOTIFICATION_API_URL = getNotificationApiUrl();
console.log("Using Notification API URL:", NOTIFICATION_API_URL);
console.log("Using API URL:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Add token to requests with proper format
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      // Make sure the token format includes "Bearer "
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        "Request with auth token:",
        config.headers.Authorization.substring(0, 20) + "..."
      );
    } else {
      console.log("No auth token found for request");
    }
    return config;
  } catch (error) {
    console.error("Request interceptor error:", error);
    return config;
  }
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error Response:", error);

    if (error.response) {
      console.error("Error data:", error.response.data);
      console.error("Error status:", error.response.status);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error message:", error.message);
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  getApiUrl: () => API_URL,
  getNotificationApiUrl: () => NOTIFICATION_API_URL,

  login: async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      return response.data;
    } catch (error) {
      console.error("Login API call failed:", error);
      // Check for 403 due to pending verification
      if (
        (error as any).response?.status === 403 &&
        (error as any).response?.data?.message ===
          "Account is pending verification"
      ) {
        // Return a special object instead of throwing error
        return {
          pendingVerification: true,
          message: "Your account is pending verification",
          user: { email },
        };
      }

      throw error;
    }
  },

  register: async (userData: any) => {
    try {
      console.log("Registering with data:", JSON.stringify(userData, null, 2));
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      console.error("Registration API call failed:", error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get("/auth/me");
      return response.data;
    } catch (error) {
      console.error("Get current user API call failed:", error);
      throw error;
    }
  },

  checkVerificationStatus: async () => {
    try {
      const response = await api.get("/auth/me");
      return response.data.user.isVerified;
    } catch (error) {
      console.error("Check verification status API call failed:", error);
      return false;
    }
  },

  updateUserProfile: async (userData: any) => {
    try {
      // First get current user to get ID
      const currentUser = await authApi.getCurrentUser();
      const userId = currentUser.user._id;

      console.log("Updating user with ID:", userId);
      console.log("Update data:", JSON.stringify(userData, null, 2));

      // Use the ID-specific endpoint
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error("Update profile API call failed:", error);
      throw error;
    }
  },

  updateDeliveryLocation: async (coordinates: [number, number]) => {
    try {
      const response = await api.patch("/users/delivery/location", {
        longitude: coordinates[0],
        latitude: coordinates[1],
      });
      return response.data;
    } catch (error) {
      console.error("Update location API call failed:", error);
      throw error;
    }
  },

  updateDeliveryAvailability: async (status: "online" | "offline") => {
    try {
      const response = await api.patch("/users/delivery/availability", {
        availabilityStatus: status,
      });
      return response.data;
    } catch (error) {
      console.error("Update availability API call failed:", error);
      throw error;
    }
  },

  updateProfilePicture: async (imageUrl: string) => {
    try {
      const response = await api.patch("/users/profile-picture", {
        url: imageUrl,
      });
      return response.data;
    } catch (error) {
      console.error("Update profile picture API call failed:", error);
      throw error;
    }
  },

  updateDriverDocuments: async (documentType: string, documentUrl: string) => {
    try {
      const response = await api.patch("/users/delivery/documents", {
        documentType,
        url: documentUrl,
      });
      return response.data;
    } catch (error) {
      console.error("Update document API call failed:", error);
      throw error;
    }
  },

  updateLicenseNumber: async (licenseNumber: string) => {
    try {
      // Get the current user first
      const currentUser = await authApi.getCurrentUser();
      const userId = currentUser.user._id;

      // Only update the license number field in deliveryInfo
      const response = await api.put(`/users/${userId}`, {
        deliveryInfo: {
          licenseNumber,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Update license number API call failed:", error);
      throw error;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const response = await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error("Change password API call failed:", error);
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
    return { success: true };
  },

  // Register device token
  registerDeviceToken: async (token: string, platform: string) => {
    try {
      // Get current user to get ID
      const currentUser = await authApi.getCurrentUser();
      const userId = currentUser.user._id;

      const response = await api.post(`/users/pushes/${userId}/device-tokens`, {
        token,
        platform,
      });
      return response.data;
    } catch (error) {
      console.error("Register device token API call failed:", error);
      throw error;
    }
  },

  // Remove device token
  removeDeviceToken: async (token: string) => {
    try {
      // Get current user to get ID
      const currentUser = await authApi.getCurrentUser();
      const userId = currentUser.user._id;

      const response = await api.delete(
        `/users/pushes/${userId}/device-tokens/${token}`
      );
      return response.data;
    } catch (error) {
      console.error("Remove device token API call failed:", error);
      throw error;
    }
  },

  getUnreadNotifications: async (userId: string) => {
    try {
      const response = await fetch(
        `${NOTIFICATION_API_URL}/notifications/unread/${userId}`
      );
      return await response.json();
    } catch (error) {
      console.error("Get unread notifications failed:", error);
      throw error;
    }
  },

  // Get unread count
  getUnreadNotificationsCount: async (userId: string) => {
    try {
      const response = await fetch(
        `${NOTIFICATION_API_URL}/notifications/unread/${userId}/count`
      );
      return await response.json();
    } catch (error) {
      console.error("Get unread count failed:", error);
      throw error;
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (
    notificationId: string,
    userId: string,
    userType: string
  ) => {
    try {
      const response = await fetch(
        `${NOTIFICATION_API_URL}/notifications/${notificationId}/read`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, userType }),
        }
      );
      return await response.json();
    } catch (error) {
      console.error("Mark notification as read failed:", error);
      throw error;
    }
  },
};
