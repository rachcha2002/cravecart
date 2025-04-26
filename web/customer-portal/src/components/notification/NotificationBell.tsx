import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  useNotifications,
  Notification,
} from "../../contexts/NotificationContext";
import { BellIcon } from "@heroicons/react/24/outline";
import { WifiIcon, ArrowPathIcon } from "@heroicons/react/24/solid";

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastFetchTimeRef = useRef<number>(0);

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

  // Log when the component renders
  console.log(
    "NotificationBell render, isOpen:",
    isOpen,
    "unreadCount:",
    unreadCount
  );

  // Fetch notifications when dropdown opens, with debounce
  const handleOpenDropdown = useCallback(() => {
    // Track when dropdown is opened/closed
    setIsOpen((prev) => !prev);

    // If opening and it's been more than 10 seconds since last fetch
    const now = Date.now();
    if (!isOpen && now - lastFetchTimeRef.current > 10000) {
      console.log("Dropdown opened, fetching notifications");
      fetchUnreadNotifications();
      lastFetchTimeRef.current = now;
    }
  }, [isOpen, fetchUnreadNotifications]);

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

  // Handle notification click
  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      console.log("Notification clicked:", notification.id);

      await markAsRead(notification.id);

      // If it's an order notification, navigate to the order detail page
      if (notification.orderId) {
        setIsOpen(false);
        navigate(`/orders/${notification.orderId}`);
      } else if (notification.actionUrl) {
        // If there's an action URL, navigate to it
        setIsOpen(false);

        // Check if it's an internal or external URL
        if (notification.actionUrl.startsWith("http")) {
          window.open(notification.actionUrl, "_blank");
        } else {
          navigate(notification.actionUrl);
        }
      }
    },
    [markAsRead, navigate]
  );

  // Handle mark all as read
  const handleMarkAllRead = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      console.log("Marking all notifications as read");
      markAllAsRead();
    },
    [markAllAsRead]
  );

  // Handle reconnect button click
  const handleReconnect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      console.log("Manual reconnect initiated");
      reconnectSocket();
    },
    [reconnectSocket]
  );

  // Format time to be more user-friendly
  const formatTime = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    }
    if (hours > 0) {
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }
    if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }

    return "Just now";
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-1 rounded-full text-gray-700 hover:bg-gray-100 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-700"
        onClick={handleOpenDropdown}
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-20 overflow-hidden dark:bg-gray-800">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                Notifications
              </h3>
              {socketConnected ? (
                <span className="ml-2 text-xs font-normal text-green-500 flex items-center">
                  <WifiIcon className="h-3 w-3 mr-1" />
                  Live
                </span>
              ) : (
                <button
                  onClick={handleReconnect}
                  className="ml-2 text-xs font-normal text-yellow-500 flex items-center hover:text-yellow-600"
                >
                  <ArrowPathIcon className="h-3 w-3 mr-1" />
                  Reconnect
                </button>
              )}
            </div>

            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center dark:text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer dark:border-gray-700 dark:hover:bg-gray-700 ${
                    !notification.read ? "bg-blue-50 dark:bg-blue-900/10" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {notification.title && (
                        <p
                          className={`text-sm font-medium ${
                            notification.read
                              ? "text-gray-600 dark:text-gray-400"
                              : "text-gray-800 dark:text-white"
                          }`}
                        >
                          {notification.title}
                        </p>
                      )}
                      <p
                        className={`text-sm ${
                          notification.read
                            ? "text-gray-500 dark:text-gray-400"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                    )}
                  </div>
                  {notification.actionText && (
                    <button className="mt-2 text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700">
                      {notification.actionText}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
