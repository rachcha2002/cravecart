import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  lazy,
  Suspense,
} from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  TruckIcon,
  ChatBubbleLeftIcon,
  CreditCardIcon,
  ArrowPathIcon,
  SignalIcon,
  MapIcon,
} from "@heroicons/react/24/outline";
import orderService from "../../services/orderService";
import { toast } from "react-hot-toast";
import { useNotifications } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import io from "socket.io-client";
import "./../../components/map/leaflet.css";

// Lazy load the DeliveryMap component to prevent issues with SSR
const DeliveryMap = lazy(() => import("../../components/map/DeliveryMap"));
const MapFallback = lazy(() => import("../../components/map/MapFallback"));

// Add the API_URL constant to use the correct socket endpoint
const API_URL =
  process.env.REACT_APP_DELIVERY_API_URL || "http://localhost:3005";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface DeliveryTimelineItem {
  status: string;
  time: string;
  description: string;
}

interface OrderDetails {
  id: string;
  orderId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
  date: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryInstructions: string;
  deliveryLocation?: {
    latitude: number;
    longitude: number;
  };
  driver?: {
    name: string;
    phone: string;
    rating: number;
    vehicleInfo: string;
  };
  deliveryTimeline: DeliveryTimelineItem[];
  createdAt: string;
  _id?: string; // Add _id field that may be present in API response
}

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, token } = useAuth();
  const {
    addNotification,
    socket: globalSocket,
    reconnectSocket,
  } = useNotifications();
  const [activeTab, setActiveTab] = useState<"details" | "timeline" | "track">(
    "details"
  );
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [riderLocation, setRiderLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const socketRef = useRef<any>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);

  // Function to fetch order details
  const fetchOrderDetails = useCallback(async (orderId: string) => {
    if (!orderId) {
      setError("Order ID is missing");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await orderService.getOrder(orderId);

      if (response.success && response.data) {
        const orderData = response.data;

        // Get delivery location from the order data
        if (orderData.deliveryLocation) {
          setDeliveryLocation({
            latitude: orderData.deliveryLocation.latitude,
            longitude: orderData.deliveryLocation.longitude,
          });
        }

        const formattedOrder: OrderDetails = {
          id: orderData._id,
          orderId: orderData.orderId,
          restaurantName:
            orderData.restaurant?.restaurantInfo?.restaurantName ||
            "Unknown Restaurant",
          restaurantAddress:
            orderData.restaurant?.address || "Address not available",
          restaurantPhone:
            orderData.restaurant?.phoneNumber || "Phone not available",
          date: new Date(orderData.createdAt).toLocaleString(),
          status: orderData.status,
          items: orderData.foods.map((food: any) => ({
            name: food.name,
            quantity: food.quantity,
            price: food.price,
            notes: food.notes || "",
          })),
          subtotal: orderData.subtotal,
          deliveryFee: orderData.deliveryFee,
          tax: orderData.tax,
          total: orderData.total,
          paymentMethod: `${orderData.paymentMethod || "Card"} (${
            orderData.paymentId
          })`,
          deliveryAddress: orderData.deliveryAddress || "Address not available",
          deliveryInstructions:
            orderData.deliveryInstructions || "No specific instructions",
          deliveryLocation: orderData.deliveryLocation,
          driver: orderData.driver
            ? {
                name: orderData.driver.name || "Not assigned yet",
                phone: orderData.driver.phoneNumber || "Not available",
                rating: orderData.driver.rating || 0,
                vehicleInfo: orderData.driver.vehicleInfo || "Not available",
              }
            : undefined,
          deliveryTimeline:
            orderData.deliveryTimeline?.map((item: any) => ({
              status: formatStatus(item.status),
              time: new Date(item.time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              description: item.description,
            })) || [],
          createdAt: orderData.createdAt,
        };

        setOrderDetails(formattedOrder);
        setLastUpdated(new Date());
        setError(null);

        // Store order details in sessionStorage to persist through refresh
        sessionStorage.setItem(
          `order-${orderId}`,
          JSON.stringify(formattedOrder)
        );
      } else {
        setError("Unable to load order details. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order details");

      // Try to retrieve from sessionStorage if available
      const storedOrder = sessionStorage.getItem(`order-${orderId}`);
      if (storedOrder) {
        try {
          setOrderDetails(JSON.parse(storedOrder));
          setError(null);
          toast("Showing cached order details");
        } catch (e) {
          // Error parsing stored order will be handled by error boundary
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Manually refresh order details
  const refreshOrder = useCallback(() => {
    if (id) {
      fetchOrderDetails(id);
    }
  }, [id, fetchOrderDetails]);

  // Connect to socket for rider location tracking
  useEffect(() => {
    if (
      !id ||
      !orderDetails ||
      (orderDetails.status !== "picking-up" &&
        orderDetails.status !== "heading-your-way")
    ) {
      return;
    }

    // Only connect socket when track tab is active
    if (activeTab !== "track") {
      return;
    }

    // Extract MongoDB ID from the formatted ID if needed
    const rawOrderId = orderDetails._id || orderDetails.id;

    // Connect to socket server - use environment variable or fall back to localhost
    console.log(
      "🔌 Connecting to socket server for tracking order:",
      rawOrderId
    );
    console.log("🔑 Using raw order ID for socket room:", rawOrderId);

    const trackingSocket = io(API_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000, // Increased timeout to 20 seconds
      transports: ["websocket", "polling"], // Explicitly set transports
    });

    socketRef.current = trackingSocket;

    trackingSocket.on("connect", () => {
      console.log("✅ Tracking socket connected with ID:", trackingSocket.id);
      setSocketConnected(true);

      // Join room for this specific order
      trackingSocket.emit("customerTrackOrder", {
        orderId: rawOrderId,
      });

      console.log("👥 Joined customer tracking room for order:", rawOrderId);

      // Request initial rider location if available
      trackingSocket.emit("requestInitialRiderLocation", {
        orderId: rawOrderId,
      });
    });

    // Listen for rider location updates
    trackingSocket.on("riderLocationUpdate", (data) => {
      console.log("📍 Received rider location update:", data);

      // Verify this update is for our order
      if (
        data.orderId === rawOrderId ||
        data.orderId === orderDetails.orderId ||
        data.orderId === id
      ) {
        console.log(
          `🚚 Rider for order ${orderDetails.orderId} is at: ${data.latitude}, ${data.longitude}`
        );

        // Update rider location state with the received coordinates
        if (data.latitude && data.longitude) {
          setRiderLocation({
            latitude: data.latitude,
            longitude: data.longitude,
          });
          setLastUpdated(new Date());
          console.log(
            "🔄 Updated rider location on map at",
            new Date().toLocaleTimeString()
          );
        } else {
          console.warn(
            "⚠️ Received rider location update without valid coordinates"
          );
        }
      }
    });

    trackingSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      setSocketConnected(false);
      toast.error("Unable to connect to tracking service. Retrying...");
    });

    trackingSocket.on("error", (error) => {
      console.error("❌ Tracking socket error:", error);
      setSocketConnected(false);
    });

    trackingSocket.on("disconnect", () => {
      console.log("🔌 Tracking socket disconnected");
      setSocketConnected(false);
    });

    // Cleanup on unmount or tab change
    return () => {
      if (trackingSocket) {
        console.log("🧹 Disconnecting tracking socket");
        trackingSocket.disconnect();
        socketRef.current = null;
        setSocketConnected(false);
      }
    };
  }, [id, orderDetails, activeTab]);

  // Initial order fetch
  useEffect(() => {
    if (id) {
      // Try to load from sessionStorage first for immediate display
      const storedOrder = sessionStorage.getItem(`order-${id}`);
      if (storedOrder) {
        try {
          setOrderDetails(JSON.parse(storedOrder));
        } catch (e) {
          // Error parsing stored order will be handled by error boundary
        }
      }

      // Then fetch fresh data
      fetchOrderDetails(id);
    }
  }, [id, fetchOrderDetails]);

  const formatStatus = (status: string): string => {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "order received":
        return "bg-blue-100 text-blue-800";
      case "preparing your order":
      case "preparing":
        return "bg-yellow-100 text-yellow-800";
      case "wrapping up":
      case "ready-for-pickup":
        return "bg-indigo-100 text-indigo-800";
      case "picking up":
        return "bg-purple-100 text-purple-800";
      case "heading your way":
      case "out-for-delivery":
        return "bg-orange-100 text-orange-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRestaurantInitial = () => {
    if (!orderDetails?.restaurantName) return "?";
    return orderDetails.restaurantName.charAt(0).toUpperCase();
  };

  const getRestaurantColor = () => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-teal-500",
    ];
    if (!orderDetails?.restaurantName) return colors[0];
    const index = orderDetails.restaurantName.length % colors.length;
    return colors[index];
  };

  // Add a function to manually reconnect the socket
  const reconnectTrackingSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocketConnected(false);

    // Switch to track tab which will trigger the useEffect to reconnect
    setActiveTab("track");
    toast("Reconnecting to tracking service...");
  }, []);

  // Connection status indicator
  const ConnectionStatusIndicator = () => (
    <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
      <div className="flex items-center">
        <div className="relative w-3 h-3 rounded-full mr-2 bg-gray-300">
          <div
            className={`absolute inset-0 rounded-full ${
              socketConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          {socketConnected && (
            <span className="animate-ping absolute inset-0 rounded-full bg-green-400 opacity-75"></span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium dark:text-white">
            {socketConnected ? "Live Tracking Active" : "Tracking Offline"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {!socketConnected && (
          <button
            onClick={reconnectTrackingSocket}
            className="flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
          >
            <SignalIcon className="w-3 h-3 mr-1" />
            Reconnect
          </button>
        )}
        <button
          onClick={refreshOrder}
          className="flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <ArrowPathIcon className="w-3 h-3 mr-1" />
          Refresh Now
        </button>
      </div>
    </div>
  );

  if (loading && !orderDetails) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  if (error && !orderDetails) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => fetchOrderDetails(id || "")}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/orders")}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return null;
  }

  // Add this additional tab option
  const tabs =
    orderDetails?.status === "picking-up" ||
    orderDetails?.status === "heading-your-way"
      ? ["details", "timeline", "track"]
      : ["details", "timeline"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Link
            to="/orders"
            className="flex items-center text-primary hover:text-primary-dark"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            <span>Back to Orders</span>
          </Link>
        </div>

        {/* Add Track Order Button for active deliveries */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold mr-4 ${getRestaurantColor()}`}
            >
              {getRestaurantInitial()}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold dark:text-white">
                    {orderDetails.restaurantName}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {orderDetails.date}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      formatStatus(orderDetails.status)
                    )}`}
                  >
                    {formatStatus(orderDetails.status)}
                  </div>

                  {/* Track Order button - only visible for active deliveries */}
                  {(orderDetails.status === "picking-up" ||
                    orderDetails.status === "heading-your-way") && (
                    <button
                      onClick={() => setActiveTab("track")}
                      className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <MapIcon className="h-4 w-4 mr-1" />
                      Track Order
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Order #{orderDetails.orderId}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab("details")}
            className={`py-3 px-6 font-medium ${
              activeTab === "details"
                ? "border-b-2 border-blue-500 text-blue-500 dark:text-blue-500"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Order Details
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`py-3 px-6 font-medium ${
              activeTab === "timeline"
                ? "border-b-2 border-blue-500 text-blue-500 dark:text-blue-500"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Delivery Timeline
          </button>

          {/* Only show tracking tab for applicable order statuses */}
          {(orderDetails.status === "picking-up" ||
            orderDetails.status === "heading-your-way") && (
            <button
              onClick={() => setActiveTab("track")}
              className={`py-3 px-6 font-medium ${
                activeTab === "track"
                  ? "border-b-2 border-blue-500 text-blue-500 dark:text-blue-500"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Live Tracking
            </button>
          )}
        </div>

        {/* Display appropriate content based on active tab */}
        {activeTab === "details" ? (
          // Details tab content
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">
                Order Items
              </h3>
              <div className="space-y-4">
                {orderDetails.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex items-start mb-2 sm:mb-0">
                      <span className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 w-8 h-8 rounded-full text-sm font-medium text-gray-800 dark:text-gray-200 mr-3">
                        {item.quantity}
                      </span>
                      <div>
                        <p className="font-medium dark:text-white">
                          {item.name}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span className="italic">Note: {item.notes}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-medium dark:text-white self-end sm:self-center">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">
                Payment Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Subtotal
                  </span>
                  <span className="dark:text-white">
                    ${orderDetails.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Delivery Fee
                  </span>
                  <span className="dark:text-white">
                    ${orderDetails.deliveryFee.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="dark:text-white">
                    ${orderDetails.tax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-lg mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="dark:text-white">Total</span>
                  <span className="dark:text-white">
                    ${orderDetails.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <CreditCardIcon className="h-4 w-4 mr-2" />
                  <span>Paid with {orderDetails.paymentMethod}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">
                Delivery Information
              </h3>
              <div className="space-y-4">
                <div className="flex">
                  <MapPinIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium dark:text-white">
                      Delivery Address
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {orderDetails.deliveryAddress}
                    </p>
                  </div>
                </div>
                {orderDetails.deliveryInstructions && (
                  <div className="flex">
                    <ChatBubbleLeftIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium dark:text-white">
                        Delivery Instructions
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {orderDetails.deliveryInstructions}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">
                Restaurant Information
              </h3>
              <div className="space-y-4">
                <div className="flex">
                  <MapPinIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium dark:text-white">Address</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {orderDetails.restaurantAddress}
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <PhoneIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium dark:text-white">Phone</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {orderDetails.restaurantPhone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "timeline" ? (
          // Timeline tab content
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="relative">
              {orderDetails.deliveryTimeline &&
              orderDetails.deliveryTimeline.length > 0 ? (
                orderDetails.deliveryTimeline.map((item, index) => (
                  <div key={index} className="mb-8 flex last:mb-0">
                    <div className="flex flex-col items-center mr-4">
                      <div
                        className={`rounded-full h-8 w-8 flex items-center justify-center ${
                          index === orderDetails.deliveryTimeline.length - 1
                            ? "bg-green-500 text-white"
                            : "bg-blue-100 text-blue-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                      {index < orderDetails.deliveryTimeline.length - 1 && (
                        <div className="h-full w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                      )}
                    </div>
                    <div
                      className={`bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm flex-1 ${
                        index === orderDetails.deliveryTimeline.length - 1
                          ? "border-l-4 border-green-500"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium dark:text-white">
                          {item.status}
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {item.time}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No delivery timeline available yet.
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                    Timeline will be updated as your order progresses.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Track tab content
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              Live Order Tracking
            </h3>

            <ConnectionStatusIndicator />

            {orderDetails.deliveryLocation ? (
              <div className="space-y-4">
                <div className="h-64 rounded-lg overflow-hidden">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="w-10 h-10 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
                      </div>
                    }
                  >
                    <DeliveryMap
                      riderLocation={riderLocation}
                      deliveryLocation={orderDetails.deliveryLocation}
                      height="300px"
                    />
                  </Suspense>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TruckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium dark:text-blue-300">
                      {orderDetails.status === "picking-up"
                        ? "Driver is heading to restaurant"
                        : "Driver is heading your way"}
                    </span>
                  </div>
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>

                {orderDetails.driver && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2 dark:text-white">
                      Driver Information
                    </h4>
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center mr-3">
                        <TruckIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium dark:text-gray-200">
                          {orderDetails.driver.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {orderDetails.driver.vehicleInfo}
                        </p>
                      </div>
                      <a
                        href={`tel:${orderDetails.driver.phone}`}
                        className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        Call
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Suspense fallback={<div className="h-48"></div>}>
                <MapFallback
                  height="300px"
                  message="Delivery location not available. Cannot display map."
                />
              </Suspense>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default OrderDetailPage;
