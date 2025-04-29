// app/_layout.tsx
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { StatusBar, View } from 'react-native';
import { AuthProvider } from "../src/context/AuthContext";
import { NotificationsProvider } from "../src/context/NotificationsContext";
import { NotificationHandler } from "../src/components/NotificationHandler";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Setup for status bar
  useEffect(() => {
    // Ensure status bar is consistently translucent
    StatusBar.setTranslucent(true);
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('transparent');
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationsProvider>
          <NotificationHandler />
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <View style={{ flex: 1 }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { 
                    backgroundColor: "#f3f4f6"
                  },
                  animation: 'none' // Disable animations to prevent layout shifts
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="register" />
                <Stack.Screen name="verification-pending" />
                <Stack.Screen name="change-password" />
                <Stack.Screen name="update-documents" />
                <Stack.Screen name="notifications" />
                <Stack.Screen name="(tabs)" />
              </Stack>
            </View>
          </ThemeProvider>
        </NotificationsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
