// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi } from "../api/authApi";
import { Alert } from "react-native";

type User = {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  isVerified: boolean;
  status: string;
  profilePicture?: string;
  deliveryInfo?: {
    vehicleType: string;
    vehicleNumber: string;
    licenseNumber: string;
    availabilityStatus: string;
    currentLocation?: {
      type: string;
      coordinates: number[];
    };
    documents?: any;
  };
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<any>;
  updateProfile: (userData: any) => Promise<any>;
  updateProfileImage: (imageUrl: string) => Promise<any>;
  checkVerificationStatus: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  initializing: true,
  login: async () => ({}),
  logout: async () => {},
  register: async () => ({}),
  updateProfile: async () => ({}),
  updateProfileImage: async () => ({}),
  checkVerificationStatus: async () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Check if user is already logged in on app startup
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const response = await authApi.getCurrentUser();
          setUser(response.user);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        // If token is invalid, remove it
        await AsyncStorage.removeItem("token");
      } finally {
        setInitializing(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password);

      // Handle pending verification
      if (data.pendingVerification) {
        Alert.alert(
          "Verification Required",
          "Your account is pending verification. Please wait for an admin to verify your account."
        );
        return data;
      }

      // Save token
      if (data.token) {
        await AsyncStorage.setItem("token", data.token);
      }

      // Set user
      setUser(data.user);
      return data;
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      const data = await authApi.register(userData);

      // Save token
      await AsyncStorage.setItem("token", data.token);

      // Set user
      setUser(data.user);
      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData: any) => {
    setLoading(true);
    try {
      const data = await authApi.updateUserProfile(userData);

      // Update local user state
      setUser((prevUser) => {
        if (!prevUser) return data.user;

        return {
          ...prevUser,
          ...data.user,
        };
      });

      return data;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfileImage = async (imageUrl: string) => {
    setLoading(true);
    try {
      // First, add the image to the user's profile
      await authApi.addProfileImage(imageUrl);

      // Then update the local user state
      setUser((prevUser) => {
        if (!prevUser) return null;

        return {
          ...prevUser,
          profilePicture: imageUrl,
        };
      });

      return { success: true };
    } catch (error) {
      console.error("Update profile image error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      return await authApi.checkVerificationStatus();
    } catch (error) {
      console.error("Check verification status error:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initializing,
        login,
        logout,
        register,
        updateProfile,
        updateProfileImage,
        checkVerificationStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
