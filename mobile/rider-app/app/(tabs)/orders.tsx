import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Platform,
  ActivityIndicator, // Import ActivityIndicator
  Dimensions, // Import Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming Ionicons is installed

// Define the structure for Restaurant, User, Item, Address, Timeline
// Adjust these based on your actual data models
interface Restaurant {
  _id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface User {
  _id: string;
  name: string;
  // Add other relevant user fields if needed
}

interface Item {
  _id: string;
  name: string;
  price: number;
  quantity: number;
}

interface DeliveryAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface TimelineEvent {
  status: OrderStatus;
  time: Date;
  description?: string;
}

// Define possible order statuses
type OrderStatus = 'pending' | 'accepted' | 'ready_for_pickup' | 'picked_up' | 'on_the_way' | 'delivered' | 'cancelled';

// Define the main Order type
type Order = {
  _id: string;
  status: OrderStatus;
  restaurant: Restaurant;
  user: User;
  items: Item[];
  paymentStatus: 'pending' | 'paid' | 'failed'; // Example payment statuses
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  paymentMethod: string; // Example: 'card', 'cash'
  deliveryAddress: DeliveryAddress;
  deliveryInstructions?: string; // Optional
  deliveryTimeline: TimelineEvent[];
  estimatedDeliveryTime?: Date; // Optional
  driver?: { // Optional, might be assigned later
    _id: string;
    name: string;
  };
  driverCurrentLocation?: { // Optional
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  updatedAt: Date;
};


export default function OrdersScreen() {
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Current' | 'Past'>('Current');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Replace with your actual API endpoint and authentication
        // Example: const token = await AsyncStorage.getItem('userToken');
        const response = await fetch('http://localhost:3004/api/orders'); // Replace with your API
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = await response.json();

        // Ensure date fields are parsed correctly
        data = data.map((order: any) => ({
            ...order,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
            estimatedDeliveryTime: order.estimatedDeliveryTime ? new Date(order.estimatedDeliveryTime) : undefined,
            deliveryTimeline: order.deliveryTimeline.map((event: any) => ({
                ...event,
                time: new Date(event.time)
            }))
        }));

        setOrdersData(data);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error("Failed to fetch orders:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    // TODO: Add dependencies if needed (e.g., user ID)
  }, []);

  // --- Helper Functions ---
  const openMapLink = (latitude: number, longitude: number, locationType: 'restaurant' | 'customer') => {
    const label = locationType === 'restaurant' ? 'Restaurant Location' : 'Delivery Address';
    const scheme = Platform.OS === 'ios' ? 'maps://0,0?q=' : 'geo:0,0?q=';
    const latLng = `${latitude},${longitude}`;
    const url = Platform.OS === 'ios' ? `${scheme}${label}@${latLng}` : `${scheme}${latLng}(${label})`;

    Linking.openURL(url).catch(err => {
        console.error('An error occurred opening map link', err);
        setError('Could not open map application.'); // Inform user
    });
  };

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return '#FFA500'; // Orange
      case 'accepted': return '#1E90FF'; // DodgerBlue
      case 'ready_for_pickup': return '#FFD700'; // Gold
      case 'picked_up': return '#32CD32'; // LimeGreen
      case 'on_the_way': return '#1E90FF'; // DodgerBlue
      case 'delivered': return '#008000'; // Green
      case 'cancelled': return '#FF0000'; // Red
      default: return '#808080'; // Gray
    }
  };

  const getStatusText = (status: OrderStatus): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleToggleDetails = (orderId: string) => {
    setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
  };

  // --- Action Handlers (API Calls) ---
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, driverId?: string) => {
      console.log(`Updating order ${orderId} to status ${newStatus}`);
      setError(null); // Clear previous errors
      try {
          // TODO: Replace with your actual API endpoint, method, and authentication
          const response = await fetch(`http://localhost:3004/api/orders/${orderId}/status`, { // Example endpoint
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  // 'Authorization': `Bearer ${your_token}` // Add auth if needed
              },
              body: JSON.stringify({ status: newStatus, driverId: driverId }), // Send new status and potentially driverId
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || `Failed to update order status: ${response.statusText}`);
          }

          const updatedOrder = await response.json();

          // Update local state
          setOrdersData(prevOrders =>
              prevOrders.map(order =>
                  order._id === orderId ? {
                      ...order,
                      status: updatedOrder.status, // Use status from response
                      driver: updatedOrder.driver // Update driver info if returned
                  } : order
              )
          );
      } catch (e) {
          const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
          console.error(`Error updating order ${orderId} to ${newStatus}:`, e);
          setError(`Failed to update order: ${errorMessage}`); // Show error to user
      }
  };

  // Specific handlers calling the generic update function
  const handleAcceptOrder = (orderId: string) => {
      // TODO: Get the current driver's ID
      const currentDriverId = 'DRIVER_ID_123'; // Replace with actual driver ID logic
      updateOrderStatus(orderId, 'accepted', currentDriverId);
  };

  const handlePickupOrder = (orderId: string) => {
      updateOrderStatus(orderId, 'picked_up');
  };

  const handleCompleteOrder = (orderId: string) => {
      updateOrderStatus(orderId, 'delivered');
  };

  // --- Render Action Buttons ---
  const getActionButton = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleAcceptOrder(order._id)}>
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
        );
      case 'accepted':
         return (
           <>
             <TouchableOpacity style={styles.navigateButton} onPress={() => openMapLink(order.restaurant.location.latitude, order.restaurant.location.longitude, 'restaurant')}>
               <Text style={styles.actionButtonText}>To Restaurant</Text>
             </TouchableOpacity>
             {/* Add Ready for Pickup button if applicable, or handle via status update */}
           </>
         );
      case 'ready_for_pickup':
        return (
          <TouchableOpacity style={styles.actionButton} onPress={() => handlePickupOrder(order._id)}>
            <Text style={styles.actionButtonText}>Pick Up</Text>
          </TouchableOpacity>
        );
      case 'picked_up':
        return (
          <TouchableOpacity style={styles.navigateButton} onPress={() => openMapLink(order.deliveryAddress.latitude, order.deliveryAddress.longitude, 'customer')}>
            <Text style={styles.actionButtonText}>To Customer</Text>
          </TouchableOpacity>
        );
      case 'on_the_way':
        return (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleCompleteOrder(order._id)}>
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
        );
      case 'delivered':
      case 'cancelled':
        return null; // No action needed
      default:
        return null;
    }
  };

  // --- Filtering Logic ---
  const filteredOrders = ordersData.filter(order => {
      const isPast = order.status === 'delivered' || order.status === 'cancelled';
      return activeTab === 'Past' ? isPast : !isPast;
  });

  // --- Render Component ---
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
          {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <TouchableOpacity key={order._id} style={styles.orderCard} onPress={() => handleToggleDetails(order._id)} activeOpacity={0.8}>
                  <View style={styles.orderContent}>
                    {/* Header: ID and Status */}
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderId}>Order #{order._id.substring(0, 6)}...</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                        <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                      </View>
                    </View>

                    {/* Restaurant Info */}
                    <View style={styles.infoRow}>
                       <Ionicons name="restaurant-outline" size={16} color="#555" style={styles.icon} />
                       <Text style={styles.infoText} numberOfLines={1}>{order.restaurant.name}</Text>
                    </View>
                    {/* Delivery Address Info */}
                    <View style={styles.infoRow}>
                       <Ionicons name="location-outline" size={16} color="#555" style={styles.icon} />
                       <Text style={styles.infoText} numberOfLines={1}>{order.deliveryAddress.street}, {order.deliveryAddress.city}</Text>
                    </View>

                    {/* Footer: Total and Action Button */}
                    <View style={styles.orderFooter}>
                       <Text style={styles.totalText}>${order.total.toFixed(2)}</Text>
                       <View style={styles.actionButtonContainer}>
                          {getActionButton(order)}
                       </View>
                    </View>

                    {/* Expanded Details */}
                    {expandedOrderId === order._id && (
                      <View style={styles.expandedDetails}>
                        <Text style={styles.detailTitle}>Details</Text>
                        <Text style={styles.detailText}>Restaurant: {order.restaurant.name} ({order.restaurant.address})</Text>
                        <Text style={styles.detailText}>Customer: {order.user.name}</Text>
                        <Text style={styles.detailText}>Deliver To: {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.postalCode}</Text>
                        {order.deliveryInstructions && <Text style={styles.detailText}>Instructions: {order.deliveryInstructions}</Text>}
                        <Text style={styles.detailText}>Payment: {order.paymentMethod} ({order.paymentStatus})</Text>
                        <Text style={styles.detailText}>Created: {new Date(order.createdAt).toLocaleString()}</Text>

                        <Text style={styles.detailTitle}>Items:</Text>
                        {order.items.map(item => (
                           <Text key={item._id} style={styles.detailText}> - {item.name} (x{item.quantity}) @ ${item.price.toFixed(2)}</Text>
                        ))}
                        <Text style={styles.detailText}>Subtotal: ${order.subtotal.toFixed(2)}</Text>
                        <Text style={styles.detailText}>Delivery Fee: ${order.deliveryFee.toFixed(2)}</Text>
                        <Text style={styles.detailText}>Tax: ${order.tax.toFixed(2)}</Text>
                        <Text style={[styles.detailText, styles.boldText]}>Total: ${order.total.toFixed(2)}</Text>

                        {/* Optionally show timeline */}
                        {/* <Text style={styles.detailTitle}>Timeline:</Text>
                        {order.deliveryTimeline.map((event, index) => (
                           <Text key={index} style={styles.detailText}> - {getStatusText(event.status)} at {event.time.toLocaleTimeString()}</Text>
                        ))} */}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
          ) : (
              <Text style={styles.noOrdersText}>No {activeTab.toLowerCase()} orders found.</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Slightly off-white background
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
    fontWeight: '600', // Semibold
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  tab: {
    flex: 1, // Make tabs take equal width
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent', // Default inactive border
  },
  activeTab: {
    borderBottomColor: '#007AFF', // Active tab indicator color
  },
  tabText: {
    fontSize: 16,
    color: '#888', // Inactive tab text color
  },
  activeTabText: {
    color: '#007AFF', // Active tab text color
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20, // Add padding at the bottom
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
    flex: 1, // Allow text to wrap or truncate
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
    borderTopColor: '#f0f0f0', // Lighter border
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
    backgroundColor: '#34C759', // Green for navigation
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
    lineHeight: 20, // Improve readability
  },
  boldText: {
      fontWeight: 'bold',
  }
});