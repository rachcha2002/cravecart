import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

// Define the notification type
export interface Notification {
  id: string;
  type: 'order-status-update' | 'info';
  message: string;
  timestamp: Date;
  orderId?: string;
  read: boolean;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  socket: Socket | null;
  clearNotifications: () => void;
  socketConnected: boolean;
  reconnectSocket: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
}

interface NotificationProviderProps {
  children: ReactNode;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Set socket.io server URL - this must match your order service exactly
const SOCKET_URL = 'http://localhost:5003/customer-updates'; // customer-specific namespace

// Provider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const { user } = useAuth();

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Simple polling state for fallback
  const [isPolling, setIsPolling] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    // Only create socket if user is logged in
    if (!user || !user.id) {
      console.log('No user logged in, skipping socket connection');
      return;
    }

    console.log('Creating socket connection to:', SOCKET_URL);

    // Close any existing socket
    if (socket) {
      console.log('Closing existing socket');
      socket.close();
    }

    // Create new socket with minimal options
    const newSocket = io(SOCKET_URL);
    console.log('Socket instance created');
    
    setSocket(newSocket);

    // Set up event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected, ID:', newSocket.id);
      setSocketConnected(true);
      
      // Join customer-specific room
      newSocket.emit('join-customer', user.id);
      console.log('Sent join-customer event with ID:', user.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
    });

    // Clean up on unmount
    return () => {
      console.log('Unmounting, disconnecting socket');
      newSocket.disconnect();
    };
  }, [user]); // Only recreate socket when user changes

  // Listen for order status updates
  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdate = (data: any) => {
      console.log('Received order update:', data);
      
      // We need to check if this update is for the current user
      const orderId = data.orderId;
      const orderUserId = data.orderData?.user?.id;
      const currentUserId = user?.id;
      
      // Only show notifications for this user's orders
      if (orderUserId === currentUserId) {
        console.log('Order update is for current user');
        
        // Add to notifications
        addNotification({
          type: 'order-status-update',
          message: data.message || `Order ${orderId} status updated to ${data.status}`,
          orderId,
          data: data.orderData
        });
        
        // Show toast
        toast.success(data.message || `Order status updated to ${data.status}`);
      } else {
        console.log('Order update is NOT for current user', { orderUserId, currentUserId });
      }
    };

    // Add event listener
    socket.on('order-status-update', handleOrderUpdate);
    
    // Remove event listener on cleanup
    return () => {
      socket.off('order-status-update', handleOrderUpdate);
    };
  }, [socket, user]);

  // Simple manual reconnect function
  const reconnectSocket = () => {
    if (!user || !user.id) return;
    
    console.log('Manually reconnecting socket');
    
    if (socket) {
      socket.disconnect();
    }
    
    // Show reconnecting toast
    toast.loading('Reconnecting to server...', { id: 'reconnect-toast' });
    
    // Create new socket
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    
    // Handle connection events
    newSocket.on('connect', () => {
      console.log('Socket reconnected');
      setSocketConnected(true);
      toast.success('Successfully reconnected!', { id: 'reconnect-success' });
      toast.dismiss('reconnect-toast');
      
      // Join customer-specific room
      newSocket.emit('join-customer', user.id);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Reconnection error:', error);
      setSocketConnected(false);
      toast.error('Failed to reconnect', { id: 'reconnect-error' });
      toast.dismiss('reconnect-toast');
    });
  };

  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      socket,
      clearNotifications,
      socketConnected,
      reconnectSocket,
      addNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
}; 