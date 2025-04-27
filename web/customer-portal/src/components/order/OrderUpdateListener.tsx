import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import orderService from '../../services/orderService';
import { toast } from 'react-hot-toast';

/**
 * This component listens for order updates across the entire application
 * It now uses polling instead of SSE to check for order updates
 */
const OrderUpdateListener: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [activeOrders, setActiveOrders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderStatuses, setOrderStatuses] = useState<Record<string, string>>({});
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
          
          // Also store current status for each order
          const statuses: Record<string, string> = {};
          response.data.forEach((order: any) => {
            statuses[order.orderId] = order.status;
          });
          
          setOrderStatuses(prevStatuses => ({
            ...prevStatuses,
            ...statuses
          }));
          
          setActiveOrders(activeOrderIds);
        }
      } catch (error) {
        // Error will be handled by the error boundary
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveOrders();

    // Refresh active orders every 5 minutes
    const intervalId = setInterval(fetchActiveOrders, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [user?.id]);

  // Set up polling for active orders instead of SSE
  useEffect(() => {
    // Skip if still loading or no active orders
    if (isLoading || activeOrders.length === 0) return;
    
    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Function to check order status updates
    const checkOrderUpdates = async () => {
      for (const orderId of activeOrders) {
        try {
          const response = await orderService.getOrder(orderId);
          
          if (response.success && response.data) {
            const order = response.data;
            const newStatus = order.status;
            const previousStatus = orderStatuses[orderId];
            
            // If status has changed, notify the user
            if (previousStatus && newStatus && previousStatus !== newStatus) {
              // Update the stored status
              setOrderStatuses(prev => ({
                ...prev,
                [orderId]: newStatus
              }));
              
              // Format the status for display
              const formattedStatus = formatStatus(newStatus);
              
              // Create a more descriptive message based on the status
              let message = `Order #${orderId} `;
              switch (newStatus) {
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
                  ...order,
                  formattedStatus,
                  status: newStatus,
                  timestamp: new Date(),
                  restaurantName: order?.restaurant?.restaurantInfo?.restaurantName || 'Restaurant'
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
                  status: newStatus,
                  formattedStatus,
                  data: order
                }
              }));
            }
          }
        } catch (error) {
          console.error(`Error checking updates for order ${orderId}:`, error);
        }
      }
    };
    
    // Initial check
    checkOrderUpdates();
    
    // Set up polling interval (every 30 seconds)
    pollingIntervalRef.current = setInterval(checkOrderUpdates, 30000);
    
    // Clean up polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [activeOrders, isLoading, orderStatuses, addNotification]);

  // This component doesn't render anything
  return null;
};

export default OrderUpdateListener; 