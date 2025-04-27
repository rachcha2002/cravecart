import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { NotificationsProvider } from "./src/context/NotificationsContext";

const App = ({ children }) => {
  return (
    <SafeAreaProvider>
      <AuthProvider><NotificationsProvider>
          {children}
        </NotificationsProvider></AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
