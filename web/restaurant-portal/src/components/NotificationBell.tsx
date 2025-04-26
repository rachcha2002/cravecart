import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationContext";
import { Bell, Settings, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast"; // Add this import

const RestaurantNotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    socketConnected,
    reconnectSocket,
    fetchUnreadNotifications,
  } = useNotifications();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Format timestamp
  const formatTime = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return "some time ago";
    }
  };

  // Handle notification click
  const handleNotificationClick = async (id: string, orderId?: string) => {
    await markAsRead(id);

    // If order notification, navigate to order details
    if (orderId) {
      setIsOpen(false);
      navigate(`/orders/${orderId}`);
    }
  };

  // Determine icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new-order":
        return (
          <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full text-green-600">
            🍔
          </div>
        );
      case "order-status-update":
        return (
          <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full text-blue-600">
            📝
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-600">
            ℹ️
          </div>
        );
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    fetchUnreadNotifications();
    toast.success("Notifications refreshed");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />

        {/* Connection status indicator */}
        <span
          className={`absolute top-1 right-1 block h-2 w-2 rounded-full ${
            socketConnected ? "bg-green-500" : "bg-red-500"
          }`}
          title={socketConnected ? "Connected" : "Disconnected"}
        />

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg overflow-hidden z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              {!socketConnected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    reconnectSocket();
                  }}
                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Reconnect
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRefresh();
                }}
                className="text-gray-500 hover:text-gray-700"
                title="Refresh"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="p-3 border-b border-gray-200 bg-white flex justify-between items-center">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark all as read
                </button>
              )}
            </div>
          )}

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center">
                <Bell className="h-8 w-8 text-gray-300 mb-2" />
                <p>No notifications</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                    onClick={() =>
                      handleNotificationClick(
                        notification.id,
                        notification.orderId
                      )
                    }
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <p
                            className={`text-sm font-semibold ${
                              !notification.read
                                ? "text-blue-600"
                                : "text-gray-800"
                            }`}
                          >
                            {notification.title ||
                              (notification.type === "new-order"
                                ? "New Order"
                                : "Order Update")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        {notification.orderId && (
                          <p className="text-xs mt-1 text-gray-500">
                            Order #{notification.orderId}
                          </p>
                        )}
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 mt-1 rounded-full bg-blue-600 flex-shrink-0"></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-gray-50 text-xs text-center text-gray-500">
            <p>
              Status:{" "}
              {socketConnected ? (
                <span className="text-green-600">Connected</span>
              ) : (
                <span className="text-red-600">Disconnected</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantNotificationBell;
