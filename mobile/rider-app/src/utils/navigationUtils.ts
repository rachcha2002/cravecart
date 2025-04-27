// src/utils/navigationUtils.ts
import { createNavigationContainerRef } from "@react-navigation/native";

// Create a navigation reference
export const navigationRef = createNavigationContainerRef();

// Navigate to a specific route
export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    // @ts-ignore
    navigationRef.navigate(name, params);
  }
}

// Handle notification navigation based on type
export function handleNotificationNavigation(type: string, data: any) {
  switch (type) {
    case "new_order":
      navigate("orders");
      break;
    case "order_update":
      navigate("orders", { orderId: data.orderId });
      break;
    case "account_update":
      navigate("profile");
      break;
    default:
      // Default to home
      navigate("index");
  }
}
