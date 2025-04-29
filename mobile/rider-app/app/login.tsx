// app/login.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import * as Location from 'expo-location'; // Add location import
import { API_URLS } from "../src/api/authApi"; // Import API_URLS

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [locationPermission, setLocationPermission] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Request location permissions when component mounts
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert(
          "Location Permission Required",
          "This app needs location access to update your position for deliveries. Please enable location services in your settings.",
          [{ text: "OK" }]
        );
      }
    })();
  }, []);

  // Function to update driver's location
  const updateDriverLocation = async (userId: string) => {
    try {
      setLocationLoading(true);
      
      // Get current position
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      const { longitude, latitude } = currentLocation.coords;
      console.log('Current GPS coordinates on login:', { longitude, latitude });
      
      // Send location update to server
      const locationResponse = await fetch(`${API_URLS.AUTH_SERVICE}/deliveries/updatelocation/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ longitude, latitude })
      });
      
      if (!locationResponse.ok) {
        console.warn('Failed to update driver location on login', await locationResponse.text());
      } else {
        console.log('Driver location successfully updated on login');
      }
    } catch (error) {
      console.error('Error updating location on login:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      const response = await login(email, password);

      // Check if the user is a delivery person
      if (response.user.role !== "delivery") {
        Alert.alert("Error", "This app is for delivery drivers only");
        return;
      }

      // Check if the user is verified
      if (!response.user.isVerified) {
        router.replace("/verification-pending");
        return;
      }

      // Update driver's location if permission is granted
      if (locationPermission && response.user._id) {
        await updateDriverLocation(response.user._id);
      }

      // Navigate to the main app
      router.replace("/(tabs)");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Login failed. Please check your credentials.";
      Alert.alert("Login Error", errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {!locationPermission && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={async () => {
              const { status } = await Location.requestForegroundPermissionsAsync();
              setLocationPermission(status === 'granted');
            }}
          >
            <Text style={styles.permissionButtonText}>Enable Location Services</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, (loading || locationLoading) && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading || locationLoading}
        >
          {loading || locationLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() =>
            Alert.alert("Feature", "Reset password feature coming soon")
          }
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  form: {
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#f29f05",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: 15,
  },
  forgotPasswordText: {
    color: "#f29f05",
    fontSize: 14,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    color: "#666",
    fontSize: 14,
  },
  registerLink: {
    color: "#f29f05",
    fontSize: 14,
    fontWeight: "bold",
  },
  permissionButton: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  permissionButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: "500",
  },
});
