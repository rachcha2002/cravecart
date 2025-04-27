import React, { useState, useEffect } from 'react';
import {View,Text,StyleSheet,ScrollView,TouchableOpacity,SafeAreaView,Linking,Platform,ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import * as Location from 'expo-location';
import io from 'socket.io-client';
import { API_URLS } from '../../src/api/authApi';

interface Restaurant {
  _id: string;
  name: string;
  address: string;
  location: {
    type: string;
    coordinates: number[];
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface FoodItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  _id: string;
  orderId: string;
  user: User;
  restaurant: Restaurant;
  foods: FoodItem[];
  status: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  deliveryDistanceKM: number;
  paymentId: string;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryLocation: {
    latitude: number;
    longitude: number;
  };
  deliveryInstructions?: string;
  deliveryTimeline: {
    status: string;
    time: string;
    description: string;
    _id: string;
  }[];
  estimatedDeliveryTime: string;
  driver?: {
    _id: string;
    name: string;
  };
  priceCalculation?: {
    driverEarnings: number;
    foodSubtotal?: number;
    restaurantCommission?: number;
    baseDeliveryFee?: number;
    extraDistanceFee?: number;
    totalDeliveryFee?: number;
    tipAmount?: number;
    serviceFee?: number;
    tax?: number;
    total?: number;
    companyFee?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface DeliveryHistory {
  _id: string;
  orderId: string;
  driverId: string;
  acceptTime: string;
  pickupTime: string;
  deliveredTime: string;
  earnMoney: number
}

// Add an interface for the location received response
interface LocationReceivedResponse {
  success: boolean;
  timestamp: string;
  orderId: string;
}

export default function OrdersScreen() {
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Current' | 'Past'>('Current');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderTimes, setOrderTimes] = useState<{[orderId: string]: {acceptTime?: Date, pickupTime?: Date}}>({});
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryHistory[]>([]);
  const [locationTrackingActive, setLocationTrackingActive] = useState<{[orderId: string]: boolean}>({});
  const [socketInstance, setSocketInstance] = useState<any>(null);
  
  const auth = useAuth();
  const user = auth.user;

  // Initialize socket connection
  useEffect(() => {
    // Create socket connection using centralized config
    const socket = io(API_URLS.SOCKET_SERVICE);
    setSocketInstance(socket);

    // Socket event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Clean up on unmount
    return () => {
      if (socket) {
        // Stop all active location tracking
        Object.keys(locationTrackingActive).forEach(orderId => {
          if (locationTrackingActive[orderId]) {
            stopSendingLocation(orderId);
          }
        });
        socket.disconnect();
        console.log('Socket disconnected');
      }
    };
  }, []);

  useEffect(() => {
    const fetchNearbyOrders = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!user?.deliveryInfo?.currentLocation?.coordinates || 
            user.deliveryInfo.currentLocation.coordinates.length !== 2) {
          throw new Error('User location is not available');
        }
        
        const longitude = user.deliveryInfo.currentLocation.coordinates[0];
        const latitude = user.deliveryInfo.currentLocation.coordinates[1];
        
        const response = await fetch(`${API_URLS.ORDER_SERVICE}/nearbyorders`, {
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ latitude, longitude })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        if (!responseData.success) {
          throw new Error(responseData.message || 'Failed to fetch nearby orders');
        }
        
        const processedOrders = responseData.data.map((order: any) => ({
          ...order,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          deliveryTimeline: order.deliveryTimeline.map((event: any) => ({
            ...event,
            time: event.time
          }))
        }));

        setOrdersData(processedOrders);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error("Failed to fetch nearby orders:", e);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchNearbyOrders();
    }
  }, [user]);

  useEffect(() => {
    const fetchDeliveryHistory = async () => {
      if (activeTab !== 'Past' || !user?._id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_URLS.DELIVERY_SERVICE}/delivery/getdeliveriesbydriverid/${user._id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch delivery history');
        }
        
        setDeliveryHistory(data.data || []);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        setError(`Failed to fetch delivery history: ${errorMessage}`);
        console.error("Failed to fetch delivery history:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryHistory();
  }, [activeTab, user]);

  const openMapLink = (latitude: number, longitude: number, locationType: 'restaurant' | 'customer') => {
    const label = locationType === 'restaurant' ? 'Restaurant Location' : 'Delivery Address';
    let url;
    
    if (Platform.OS === 'ios') {
      url = `maps://app?saddr=Current%20Location&daddr=${latitude},${longitude}`;
    } else {
      url = `google.navigation:q=${latitude},${longitude}`;
    }

    Linking.openURL(url).catch(err => {
      console.error('An error occurred opening map link', err);
      setError('Could not open map navigation. Please make sure you have a maps app installed.');
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'order-received': return '#FFA500'; 
      case 'preparing-your-order': return '#1E90FF';
      case 'wrapping-up': return '#FFD700';
      case 'picking-up': return '#32CD32'; 
      case 'heading-your-way': return '#1E90FF';
      case 'delivered': return '#008000';
      case 'cancelled': return '#FF0000'; 
      default: return '#808080'; 
    }
  };

  const getStatusText = (status: string): string => {
    return status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleToggleDetails = (orderId: string) => {
    setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URLS.ORDER_SERVICE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'picking-up',
          driver: user  // Include the entire user object from useAuth
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update order status: ${response.statusText}`);
      }

      const updatedOrder = await response.json();
      
      // Store accept time
      setOrderTimes(prev => ({
        ...prev,
        [orderId]: { ...prev[orderId], acceptTime: new Date() }
      }));

      setOrdersData(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? updatedOrder.data : order
        )
      );
      
      // Send notification to user about status change
      try {
        const order = ordersData.find(o => o._id === orderId);
        if (order && order.user && order.user._id) {
          await fetch(`${API_URLS.NOTIFICATION_SERVICE}/senddirect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userIds: [order.user._id],
              title: 'Order Update',
              message: `Your order from ${order.restaurant.name} is now being picked up by your driver.`,
              channels: ['sms', 'in-app'] // As requested, SMS and in-app
            })
          });
          console.log('Pickup notification sent to user');
        }
      } catch (notificationError) {
        console.error('Failed to send pickup notification:', notificationError);
        // Continue with order flow despite notification failure
      }
      
      // Emit rider acceptance event to socket
      if (socketInstance && user?._id) {
        socketInstance.emit('riderAcceptOrder', {
          orderId,
          riderId: user._id,
          timestamp: new Date().toISOString()
        });
        
        // Start sending location updates
        startSendingLocation(orderId);
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(`Failed to accept order: ${errorMessage}`);
      console.error('Error accepting order:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePickupOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URLS.ORDER_SERVICE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'heading-your-way' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update order status: ${response.statusText}`);
      }

      const updatedOrder = await response.json();
      
      // Store pickup time
      setOrderTimes(prev => ({
        ...prev,
        [orderId]: { ...prev[orderId], pickupTime: new Date() }
      }));

      setOrdersData(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? updatedOrder.data : order
        )
      );

      // Send notification to user about status change
      try {
        const order = ordersData.find(o => o._id === orderId);
        if (order && order.user && order.user._id) {
          await fetch(`${API_URLS.NOTIFICATION_SERVICE}/senddirect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userIds: [order.user._id],
              title: 'Order Update',
              message: `Your order from ${order.restaurant.name} is on the way! Your driver has picked up your food.`,
              channels: ['sms', 'in-app']
            })
          });
          console.log('Heading your way notification sent to user');
        }
      } catch (notificationError) {
        console.error('Failed to send heading your way notification:', notificationError);
        // Continue with order flow despite notification failure
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(`Failed to pickup order: ${errorMessage}`);
      console.error('Error picking up order:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      setLoading(true);
      
      // Stop sending location updates for this order
      stopSendingLocation(orderId);
      
      const response = await fetch(`${API_URLS.ORDER_SERVICE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'delivered' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update order status: ${response.statusText}`);
      }

      const updatedOrder = await response.json();

      setOrdersData(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? updatedOrder.data : order
        )
      );

      // Send notification to user about status change
      try {
        const order = ordersData.find(o => o._id === orderId);
        if (order && order.user && order.user._id) {
          await fetch(`${API_URLS.NOTIFICATION_SERVICE}/senddirect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userIds: [order.user._id],
              title: 'Order Delivered',
              message: `Your order from ${order.restaurant.name} has been delivered! Enjoy your meal.`,
              channels: ['sms', 'in-app']
            })
          });
          console.log('Delivery completed notification sent to user');
        }
      } catch (notificationError) {
        console.error('Failed to send delivery completed notification:', notificationError);
        // Continue with order flow despite notification failure
      }

      if (user?._id) {
        const order = ordersData.find(o => o._id === orderId);
        const times = orderTimes[orderId] || {};
        const deliveredTime = new Date();
        
        // Use driverEarnings from priceCalculation if available
        const earnMoney = order?.priceCalculation?.driverEarnings || 
                         (order ? order.deliveryFee || (order.total * 0.15) : 0);
        
        const deliveryPayload = {
          orderId: order?.orderId || orderId,
          driverId: user._id,
          acceptTime: times.acceptTime || new Date(),
          pickupTime: times.pickupTime || new Date(),
          deliveredTime,
          earnMoney
        };
        
        console.log('Delivery payload:', deliveryPayload);
        
        const deliveryResponse = await fetch(`${API_URLS.DELIVERY_SERVICE}/delivery/createdelivery`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(deliveryPayload)
        });
        
        if (!deliveryResponse.ok) {
          console.warn('Failed to create delivery record:', await deliveryResponse.text());
        } else {
          console.log('Delivery record created successfully');
        }
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      if (currentLocation && user?._id) {
        const { longitude, latitude } = currentLocation.coords;
        console.log('Current GPS coordinates:', { longitude, latitude });
        const locationResponse = await fetch(`${API_URLS.AUTH_SERVICE}/users/delivery/updatelocation/${user._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ longitude, latitude })
        });
        
        if (!locationResponse.ok) {
          console.warn('Failed to update driver location after delivery', await locationResponse.text());
        } else {
          console.log('Driver location successfully updated with GPS coordinates');
        }
      } else {
        console.warn('Could not obtain current GPS location');
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(`Failed to complete order: ${errorMessage}`);
      console.error('Error completing order:', e);
    } finally {
      setLoading(false);
    }
  };

  // Start sending location updates
  const startSendingLocation = async (orderId: string) => {
    if (!socketInstance || !user?._id) return;
    
    try {
      // Request permission if not already granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }
      
      // Create an interval ID for this order
      const intervalId = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High
          });
          
          if (location && socketInstance) {
            // Ensure socket is still connected
            if (!socketInstance.connected) {
              console.log('Socket disconnected, attempting to reconnect...');
              socketInstance.connect();
            }
            
            // Emit location to socket server with the correct event name and structure
            socketInstance.emit('riderLocation', {
              orderId,
              riderId: user._id,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: new Date().toISOString()
            });
            
            console.log(`Location sent for order ${orderId}:`, {
              lat: location.coords.latitude,
              lng: location.coords.longitude
            });
            
            // Add a confirmation event listener with proper typing
            socketInstance.once('locationReceived', (data: LocationReceivedResponse) => {
              console.log('Server confirmed location receipt:', data);
            });
          }
        } catch (err) {
          console.error('Error getting or sending location:', err);
        }
      }, 10000); // Update every 10 seconds
      
      // Store the interval ID in state with the order ID
      setLocationTrackingActive(prev => ({
        ...prev,
        [orderId]: true
      }));
      
      // Store the interval ID as a property on the component
      // This is a bit of a hack but works for cleanup
      // @ts-ignore
      window[`locationInterval_${orderId}`] = intervalId;
      
      console.log(`Started location tracking for order ${orderId}`);
    } catch (err) {
      console.error('Failed to start location tracking:', err);
    }
  };
  
  // Stop sending location updates
  const stopSendingLocation = (orderId: string) => {
    // @ts-ignore
    const intervalId = window[`locationInterval_${orderId}`];
    
    if (intervalId) {
      clearInterval(intervalId);
      // @ts-ignore
      delete window[`locationInterval_${orderId}`];
      
      setLocationTrackingActive(prev => ({
        ...prev,
        [orderId]: false
      }));
      
      console.log(`Stopped location tracking for order ${orderId}`);
    }
  };

  const getActionButton = (order: Order) => {
    switch (order.status) {
      case 'wrapping-up':
        return (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleAcceptOrder(order._id)}>
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
        );
      case 'picking-up':
        return (
          <>
            <TouchableOpacity style={styles.navigateButton} onPress={() => openMapLink(
              order.restaurant.location.coordinates[1], 
              order.restaurant.location.coordinates[0], 
              'restaurant')}>
              <Text style={styles.actionButtonText}>To Restaurant</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handlePickupOrder(order._id)}>
              <Text style={styles.actionButtonText}>Pick Up</Text>
            </TouchableOpacity>
          </>
        );
      case 'heading-your-way':
        return (
          <>
            <TouchableOpacity style={styles.navigateButton} onPress={() => openMapLink(
              order.deliveryLocation.latitude, 
              order.deliveryLocation.longitude, 
              'customer')}>
              <Text style={styles.actionButtonText}>To Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleCompleteOrder(order._id)}>
              <Text style={styles.actionButtonText}>Complete</Text>
            </TouchableOpacity>
          </>
        );
      case 'delivered':
      case 'cancelled':
        return null;
      default:
        return null;
    }
  };

  // Modify the filteredOrders to include delivery history when on Past tab
  const filteredOrders = activeTab === 'Current' 
    ? ordersData.filter(order => order.status !== 'delivered' && order.status !== 'cancelled')
    : ordersData.filter(order => order.status === 'delivered' || order.status === 'cancelled');

  // Render a delivery history item
  const renderDeliveryHistoryItem = (delivery: DeliveryHistory) => {
    const deliveryDate = new Date(delivery.deliveredTime).toLocaleDateString();
    const deliveryTime = new Date(delivery.deliveredTime).toLocaleTimeString();
    
    return (
      <TouchableOpacity key={delivery._id} style={styles.orderCard}>
        <View style={styles.orderContent}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>Delivery #{delivery._id.substring(0, 6)}...</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#008000' }]}>
              <Text style={styles.statusText}>Completed</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#555" style={styles.icon} />
            <Text style={styles.infoText}>{deliveryDate} at {deliveryTime}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={16} color="#555" style={styles.icon} />
            <Text style={styles.infoText}>Earned: ${delivery.earnMoney.toFixed(2)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="receipt-outline" size={16} color="#555" style={styles.icon} />
            <Text style={styles.infoText}>Order ID: {delivery.orderId}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Current' ? styles.activeTab : {}]}
          onPress={() => setActiveTab('Current')}
        >
          <Text style={[styles.tabText, activeTab === 'Current' ? styles.activeTabText : {}]}>Current</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Past' ? styles.activeTab : {}]}
          onPress={() => setActiveTab('Past')}
        >
          <Text style={[styles.tabText, activeTab === 'Past' ? styles.activeTabText : {}]}>Past</Text>
        </TouchableOpacity>
      </View>

      {loading && (
          <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
          </View>
      )}
      {error && <Text style={styles.errorText}>Error: {error}</Text>}

      {!loading && !error && (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer}>
          {activeTab === 'Current' ? (
            // Display current orders
            filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <TouchableOpacity key={order._id} style={styles.orderCard} onPress={() => handleToggleDetails(order._id)} activeOpacity={0.8}>
                  <View style={styles.orderContent}>
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderId}>Order #{order._id.substring(0, 6)}...</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                        <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                       <Ionicons name="restaurant-outline" size={16} color="#555" style={styles.icon} />
                       <Text style={styles.infoText} numberOfLines={1}>{order.restaurant.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                       <Ionicons name="location-outline" size={16} color="#555" style={styles.icon} />
                       <Text style={styles.infoText} numberOfLines={1}>{order.deliveryAddress}</Text>
                    </View>

                    <View style={styles.orderFooter}>
                       <Text style={styles.totalText}>${order.total.toFixed(2)}</Text>
                       <View style={styles.actionButtonContainer}>
                          {getActionButton(order)}
                       </View>
                    </View>

                    {expandedOrderId === order._id && (
                      <View style={styles.expandedDetails}>
                        <Text style={styles.detailTitle}>Details</Text>
                        <Text style={styles.detailText}>Restaurant: {order.restaurant.name} ({order.restaurant.address})</Text>
                        <Text style={styles.detailText}>Customer: {order.user.name}</Text>
                        <Text style={styles.detailText}>Deliver To: {order.deliveryAddress}</Text>
                        {order.deliveryInstructions && <Text style={styles.detailText}>Instructions: {order.deliveryInstructions}</Text>}
                        <Text style={styles.detailText}>Payment: {order.paymentMethod} ({order.paymentStatus})</Text>
                        <Text style={styles.detailText}>Created: {new Date(order.createdAt).toLocaleString()}</Text>

                        <Text style={styles.detailTitle}>Items:</Text>
                        {order.foods.map(item => (
                           <Text key={item.id} style={styles.detailText}> - {item.name} (x{item.quantity}) @ ${item.price.toFixed(2)}</Text>
                        ))}
                        <Text style={styles.detailText}>Subtotal: ${order.subtotal.toFixed(2)}</Text>
                        <Text style={styles.detailText}>Delivery Fee: ${order.deliveryFee.toFixed(2)}</Text>
                        <Text style={styles.detailText}>Tax: ${order.tax.toFixed(2)}</Text>
                        <Text style={[styles.detailText, styles.boldText]}>Total: ${order.total.toFixed(2)}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noOrdersText}>No current orders found.</Text>
            )
          ) : (
            // Display past deliveries in Past tab
            deliveryHistory.length > 0 ? (
              deliveryHistory.map((delivery) => renderDeliveryHistoryItem(delivery))
            ) : (
              <Text style={styles.noOrdersText}>No past deliveries found.</Text>
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0', 
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  tab: {
    flex: 1, 
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 20,
    fontSize: 16,
  },
  noOrdersText: {
     textAlign: 'center',
     marginTop: 50,
     fontSize: 16,
     color: '#888',
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderContent: {
    padding: 15,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalText: {
     fontSize: 16,
     fontWeight: 'bold',
     color: '#333',
  },
  actionButtonContainer: {
     flexDirection: 'row',
     alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 5,
    marginLeft: 8,
  },
  navigateButton: {
    backgroundColor: '#34C759', 
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 5,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  expandedDetails: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailTitle: {
     fontSize: 15,
     fontWeight: '600',
     color: '#333',
     marginBottom: 8,
     marginTop: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    lineHeight: 20, 
  },
  boldText: {
      fontWeight: 'bold',
  }
});