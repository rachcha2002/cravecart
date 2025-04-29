import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform, BackHandler } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { Colors } from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { HapticTab } from "@/src/components/HapticTab";
import TabBarBackground from "@/src/components/ui/TabBarBackground";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  
  // Handle back button press to prevent going back to login
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Check if we're at the home tab - if so, prevent going back
        if (pathname === '/' || 
            pathname === '/index' || 
            pathname === '/(tabs)/' || 
            pathname === '/(tabs)/index') {
          return true; // Prevent default behavior (going back)
        }
        return false; // Allow default behavior for other screens
      }
    );

    return () => backHandler.remove();
  }, [pathname]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="list-alt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="hand-holding-usd" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
