import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import orderService from '../../services/orderService';
import { toast } from 'react-hot-toast';

/**
 * This component listens for order updates across the entire application
 * It subscribes to all the user's active orders and updates the notification system
 * when any order status changes
 */
const OrderUpdateListener: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [activeOrders, setActiveOrders] = useState<string[]>([]);
  const sseConnectionsRef = useRef<Record<string, EventSource | null>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to format status string
  const formatStatus = (status: string): string => {
    return status
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Fetch all active orders for the user
  useEffect(() => {
    const fetchActiveOrders = async () => {
      if (!user) {
        setActiveOrders([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await orderService.getUserOrders();
        
        if (response.success) {
          // Filter for orders that are still active (not delivered or cancelled)
          const activeOrderIds = response.data
            .filter((order: any) => 
              order.status !== 'delivered' && 
              order.status !== 'cancelled'
            )
            .map((order: any) => order.orderId);
          
          console.log('Active orders for live updates:', activeOrderIds);
          setActiveOrders(activeOrderIds);
        }
      } catch (error) {
        console.error('Error fetching active orders for updates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveOrders();

    // Refresh active orders every 5 minutes
    const intervalId = setInterval(fetchActiveOrders, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [user?.id]);

  // Set up SSE connections for each active order
  useEffect(() => {
    // Skip if still loading or no active orders
    if (isLoading || activeOrders.length === 0) return;

    console.log('Setting up SSE connections for all active orders');
    
    // Create new SSE connections for each order
    activeOrders.forEach(orderId => {
      // Skip if connection already exists
      if (sseConnectionsRef.current[orderId]) return;
      
      console.log(`Creating SSE connection for order ${orderId}`);
      
      const eventSource = orderService.subscribeToOrderUpdates(orderId, (data) => {
        console.log(`Received update for order ${orderId}:`, data);
        
        // Process the update
        if (data.type === 'status-update' && data.status) {
          // Format the status for display
          const formattedStatus = formatStatus(data.status);
          
          // Create a more descriptive message based on the status
          let message = `Order #${orderId} `;
          switch (data.status) {
            case 'order-received':
              message += 'has been received by the restaurant';
              break;
            case 'preparing-your-order':
              message += 'is being prepared';
              break;
            case 'wrapping-up':
              message += 'is being wrapped up';
              break;
            case 'picking-up':
              message += 'is being picked up by the delivery partner';
              break;
            case 'heading-your-way':
              message += 'is on its way to you';
              break;
            case 'delivered':
              message += 'has been delivered';
              break;
            case 'cancelled':
              message += 'has been cancelled';
              break;
            default:
              message += `status updated to ${formattedStatus}`;
          }
          
          // Add notification
          addNotification({
            type: 'order-status-update',
            message,
            orderId,
            data: {
              ...data.orderData,
              formattedStatus,
              status: data.status,
              timestamp: new Date(),
              restaurantName: data.orderData?.restaurant?.restaurantInfo?.restaurantName || 'Restaurant'
            }
          });
          
          // Show toast notification
          toast.success(message, {
            id: `order-update-${orderId}-${Date.now()}`,
            duration: 5000
          });
          
          // Dispatch a global event that any component can listen to
          window.dispatchEvent(new CustomEvent('orderStatusUpdate', { 
            detail: { 
              orderId,
              status: data.status,
              formattedStatus,
              data: data.orderData
            }
          }));
          
          // If the order is now complete, remove it from active orders on next refresh
          if (data.status === 'delivered' || data.status === 'cancelled') {
            console.log(`Order ${orderId} is now complete, will be removed from active tracking`);
          }
        }
      });
      
      // Store the connection
      if (eventSource) {
        sseConnectionsRef.current[orderId] = eventSource;
      }
    });
    
    // Clean up function to close all SSE connections
    return () => {
      console.log('Cleaning up all SSE connections');
      Object.entries(sseConnectionsRef.current).forEach(([orderId, eventSource]) => {
        if (eventSource) {
          console.log(`Closing SSE connection for order ${orderId}`);
          eventSource.close();
        }
      });
      sseConnectionsRef.current = {};
    };
  }, [activeOrders, isLoading, addNotification]);

  // This component doesn't render anything
  return null;
};

export default OrderUpdateListener; 