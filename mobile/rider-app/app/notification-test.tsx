// app/notification-test.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNotifications } from "../src/context/NotificationsContext";
import * as Notifications from "expo-notifications";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function NotificationTestScreen() {
  const { expoPushToken } = useNotifications();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sendTestNotification = async () => {
    setLoading(true);
    try {
      // Local notification test
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a local test notification",
          data: { type: "test" },
        },
        trigger: null, // Send immediately
      });

      alert("Test notification sent!");
    } catch (error) {
      console.error("Error sending test notification:", error);
      alert("Failed to send test notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Push Notification Test</Text>

        <View style={styles.tokenContainer}>
          <Text style={styles.label}>Your Device Token:</Text>
          <Text style={styles.token}>
            {expoPushToken || "Not registered yet"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={sendTestNotification}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Sending..." : "Send Test Notification"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  tokenContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "100%",
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  token: {
    fontSize: 14,
    color: "#666",
    flexWrap: "wrap",
  },
  button: {
    backgroundColor: "#f29f05",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 15,
  },
  backButton: {
    backgroundColor: "#888",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
