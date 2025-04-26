import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import LocationSelector from './LocationSelector';
import { useAuth } from '../../contexts/AuthContext';
import { useLocations } from '../../hooks/useLocations';
import MapPreview from './MapPreview';
import { calculateOrderPrices, formatCurrency } from '../../utils/priceCalculator';
import { generateOrderNumber, calculateEstimatedDelivery, formatEstimatedDelivery } from '../../utils/orderUtils';
import { calculateDistance } from '../../utils/distanceUtils';
import orderService from '../../services/orderService';
import { restaurantService } from '../../services/restaurantService';
import { useCart } from '../../contexts/CartContext';
import toast from 'react-hot-toast';
import { 
  MapPinIcon, 
  CheckCircleIcon, 
  StarIcon, 
  BookmarkIcon,
  MapIcon,
  DocumentTextIcon
} from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

// Generate a new order number for this order
const generatedOrderNumber = generateOrderNumber();

const OrderSummary: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { locations, defaultLocation, isLoading: locationsLoading } = useLocations();
  const { 
    items, 
    total: foodSubtotal, 
    tax,
    deliveryFee,
    orderTotal,
    restaurantId,
    isEmpty,
    clearCart
  } = useCart();
  
  // Check for any pre-calculated data passed from CartPage
  const passedState = location.state;
  
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addressChanged, setAddressChanged] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressValidated, setAddressValidated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [locationCoordinates, setLocationCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedSavedLocation, setSelectedSavedLocation] = useState<string | null>(null);
  const [locationMethod, setLocationMethod] = useState<LocationMethod>(
    user && locations.length > 0 ? 'saved' : 'map'
  );
  // Use passed distance if available
  const [deliveryDistanceKM, setDeliveryDistanceKM] = useState(
    passedState?.deliveryDistanceKM || 4.5
  );
  const [priceBreakdown, setPriceBreakdown] = useState<any>(passedState?.priceBreakdown || null);
  const [restaurantLocation, setRestaurantLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [fullRestaurantData, setFullRestaurantData] = useState<any>(null);
  
  // Default price calculation parameters - use passed parameters if available
  const calculationParams = passedState?.calculationParams || {};
  const baseDeliveryFee = calculationParams.baseDeliveryFee || 2.99;
  const deliveryPerKmRate = calculationParams.deliveryPerKmRate || 0.5;
  const restaurantCommissionRate = calculationParams.restaurantCommissionRate || 15;
  const serviceFeeRate = calculationParams.serviceFeeRate || 5;
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Log received data for debugging
  useEffect(() => {
    if (passedState) {
      console.log('OrderSummary received state:', passedState);
    }
  }, [passedState]);

  // Get restaurant name from first item in cart (they're all from the same restaurant)
  const restaurantName = items.length > 0 ? items[0].restaurantName : '';

  // Get restaurant location and calculate initial price breakdown
  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (restaurantId) {
        try {
          // Fetch the complete restaurant data using the restaurantService
          const response = await restaurantService.getRestaurantById(restaurantId);
          
          if (response.success) {
            const restaurant = response.data;
            setFullRestaurantData(restaurant);
            
            // Extract coordinates for delivery calculation
            const location = restaurant.restaurantInfo.location;
            if (location && location.coordinates && location.coordinates.length === 2) {
              setRestaurantLocation({
                latitude: location.coordinates[1],
                longitude: location.coordinates[0]
              });
            }
          }
        } catch (error) {
          console.error("Error fetching restaurant data:", error);
        }
      }
    };
    
    fetchRestaurantData();
  }, [restaurantId]);

  // Calculate price breakdown whenever relevant values change
  useEffect(() => {
    if (foodSubtotal > 0) {
      const prices = calculateOrderPrices({
        foodSubtotal,
        deliveryDistanceKM,
        baseDeliveryFee,
        deliveryPerKmRate,
        restaurantCommissionRate,
        serviceFeeRate
      });
      
      setPriceBreakdown(prices);
    }
  }, [foodSubtotal, deliveryDistanceKM, baseDeliveryFee, deliveryPerKmRate, restaurantCommissionRate, serviceFeeRate]);

  useEffect(() => {
    // If cart is empty, redirect to restaurants page
    // But only do this check if we've been on the page for a moment
    // to prevent immediate redirect when entering the page
    let timeoutId: NodeJS.Timeout;
    
    if (isEmpty && !isProcessingOrder) {
      // Small delay to prevent immediate redirection
      timeoutId = setTimeout(() => {
        // Only navigate if the component is still mounted and cart is still empty
    if (isEmpty) {
      navigate('/restaurants');
      toast.error('Your cart is empty');
    }
      }, 500);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isEmpty, navigate, isProcessingOrder]);

  // Set default location if available
  useEffect(() => {
    if (defaultLocation && !deliveryAddress) {
            setDeliveryAddress(defaultLocation.address);
            setLocationCoordinates({
              latitude: defaultLocation.latitude,
              longitude: defaultLocation.longitude,
            });
            setAddressValidated(true);
      setSelectedSavedLocation(defaultLocation.id);
      setLocationMethod('saved');
    }
  }, [defaultLocation]);

  // Automatically try to get user's location on component mount
  useEffect(() => {
    if (useCurrentLocation && navigator.geolocation && !defaultLocation && locationMethod === 'map') {
      setIsValidatingAddress(true);
      navigator.geolocation.getCurrentPosition(
        () => {
          // Success - the LocationSelector will handle the actual geolocation
          // We're just checking if geolocation is available here
          setIsValidatingAddress(false);
        },
        (error) => {
          // Error getting location
          console.log("Geolocation error:", error);
          setIsValidatingAddress(false);
          setUseCurrentLocation(false);
        }
      );
    }
  }, [useCurrentLocation, defaultLocation, locationMethod]);

  const handleAddressChange = (newAddress: string) => {
    console.log("OrderSummary received address change:", newAddress);

    // Reset states if the address is empty
    if (!newAddress) {
      setValidationError(null);
      setAddressValidated(false);
      setDeliveryAddress('');
      return;
    }

    // Reset states
    setValidationError(null);
    setAddressValidated(false);
    setSelectedSavedLocation(null);

    // In a real app, you would validate the address with your delivery service
    // For demo purposes, we'll simulate a brief validation process
    setIsValidatingAddress(true);

    setTimeout(() => {
      setDeliveryAddress(newAddress);

      // Simulate validation success (in a real app, this would be a real validation)
      // For demo, just check if address is long enough to be valid
      if (newAddress.length < 10) {
        setValidationError('Please enter a more specific address for accurate delivery.');
      } else {
        setAddressValidated(true);
        setAddressChanged(true);
      }

      setIsValidatingAddress(false);
      console.log("Address validation complete:", newAddress, "Validated:", newAddress.length >= 10);
    }, 500); // Reduced timeout for better UX
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setLocationCoordinates({
      latitude: lat,
      longitude: lng,
    });
    
    // If address is provided, update it
    if (address) {
      handleAddressChange(address);
    }
    
    // Calculate actual distance if restaurant location is available
    if (restaurantLocation) {
      const calculatedDistance = calculateDistance(
        { latitude: lat, longitude: lng },
        restaurantLocation
      );
      setDeliveryDistanceKM(calculatedDistance);
    } else {
      // Fallback to simulated distance
    const newDistance = Math.round((2 + Math.random() * 6) * 10) / 10; // Between 2 and 8 km
    setDeliveryDistanceKM(newDistance);
    }
  };

  const handleSelectSavedLocation = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    if (location) {
      setDeliveryAddress(location.address);
      setLocationCoordinates({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setAddressValidated(true);
      setAddressChanged(true);
      setSelectedSavedLocation(locationId);
      setLocationMethod('saved');
      
      // Calculate actual distance if restaurant location is available
      if (restaurantLocation) {
        const calculatedDistance = calculateDistance(
          { latitude: location.latitude, longitude: location.longitude },
          restaurantLocation
        );
        setDeliveryDistanceKM(calculatedDistance);
      } else {
        // Fallback to simulated distance
        const newDistance = Math.round((2 + Math.random() * 6) * 10) / 10;
      setDeliveryDistanceKM(newDistance);
      }
    }
  };

  const handleLocationMethodChange = (method: LocationMethod) => {
    setLocationMethod(method);
    
    if (method === 'map') {
      setShowMap(true);
      setSelectedSavedLocation(null);
    } else {
      setShowMap(false);
      // If there's a default location and no saved location selected yet, select it
      if (defaultLocation && !selectedSavedLocation) {
        handleSelectSavedLocation(defaultLocation.id);
      }
    }
  };

  const handleUseCurrentLocation = () => {
    setUseCurrentLocation(true);
    
    if (navigator.geolocation) {
      setIsValidatingAddress(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          handleLocationSelect(lat, lng);
          
          // For the demo, we'll just set some placeholder address
          // In a real app, you would reverse geocode these coordinates
          handleAddressChange("Current Location");
          setIsValidatingAddress(false);
        },
        (error) => {
          console.log("Geolocation error:", error);
          setIsValidatingAddress(false);
          setUseCurrentLocation(false);
          setValidationError("Could not access your location. Please allow location access or enter an address manually.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  const handleProceedToPayment = async () => {
    // Add validation to prevent proceeding without a validated address
    if (!addressValidated) {
      toast.error("Please provide a valid delivery address before proceeding to payment.");
      return;
    }

    // Check again if cart is empty before proceeding
    if (isEmpty) {
      toast.error("Your cart is empty. Please add items before checkout.");
      navigate('/restaurants');
      return;
    }

    setIsProcessingOrder(true);

    try {
      // Create a modified version of fullRestaurantData with coordinates limited to 7 decimal points
      let restaurantWithLimitedCoords = null;
      if (fullRestaurantData) {
        restaurantWithLimitedCoords = {
          ...fullRestaurantData
        };
        
        // Check if restaurant has location with coordinates
        if (restaurantWithLimitedCoords.restaurantInfo?.location?.coordinates?.length === 2) {
          // Deep clone and modify the coordinates to 7 decimal places
          restaurantWithLimitedCoords.restaurantInfo = {
            ...restaurantWithLimitedCoords.restaurantInfo,
            location: {
              ...restaurantWithLimitedCoords.restaurantInfo.location,
              type: "Point", // Ensure type is "Point" as shown in the image
              coordinates: [
                Number(restaurantWithLimitedCoords.restaurantInfo.location.coordinates[0].toFixed(7)),
                Number(restaurantWithLimitedCoords.restaurantInfo.location.coordinates[1].toFixed(7))
              ]
            }
          };
        }
      }
      
      // Create order data according to the Order model structure
      const orderData = {
        orderId: generatedOrderNumber,
        user: user ? {
          _id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber || '',
          address: user.address || '',
          role: user.role || 'customer',
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          // Include all other user properties
          ...Object.keys(user)
            .filter(key => !['id', 'name', 'email', 'phoneNumber', 'address', 'role', 'isActive', 'createdAt', 'updatedAt'].includes(key))
            .reduce((obj, key) => ({ ...obj, [key]: (user as any)[key] }), {})
        } : {
          _id: 'guest-user',
          name: 'Guest',
          email: 'guest@example.com'
        },
        restaurant: restaurantWithLimitedCoords || {
          _id: restaurantId,
          restaurantName: restaurantName,
          name: restaurantName
        },
        foods: items.map(item => ({
          _id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1
        })),
        status: 'order-received',
        paymentStatus: 'pending',
        priceCalculation: {
          foodSubtotal: foodSubtotal,
          restaurantCommission: priceBreakdown?.restaurantCommission || 0,
          baseDeliveryFee: priceBreakdown?.baseDeliveryFee || 0,
          extraDistanceFee: priceBreakdown?.extraDistanceFee || 0,
          totalDeliveryFee: priceBreakdown?.totalDeliveryFee || 0,
          serviceFee: priceBreakdown?.serviceFee || 0,
          tax: priceBreakdown?.tax || 0,
          total: priceBreakdown?.total || orderTotal,
          driverEarnings: priceBreakdown?.driverEarnings || 0,
          companyFee: 0
        },
        // Legacy fields for backward compatibility
          subtotal: foodSubtotal,
        deliveryFee: priceBreakdown?.totalDeliveryFee || deliveryFee,
        tax: priceBreakdown?.tax || tax,
        total: priceBreakdown?.total || orderTotal,
        deliveryDistanceKM: deliveryDistanceKM,
        paymentId: 'pending-payment',
        paymentMethod: 'card',
        deliveryAddress: deliveryAddress,
        deliveryLocation: {
          latitude: locationCoordinates ? Number(locationCoordinates.latitude.toFixed(7)) : 0,
          longitude: locationCoordinates ? Number(locationCoordinates.longitude.toFixed(7)) : 0
        }
      };

      console.log("Creating order with data:", orderData);

      try {
        // Create the order with pending payment status
        const orderResult = await orderService.createOrder(orderData);
        console.log("Order creation result:", orderResult);

        if (orderResult && orderResult.success) {
          console.log("Order created successfully with pending payment status, navigating to payment");
          
          const paymentState = {
            orderNumber: generatedOrderNumber,
            orderTotal: priceBreakdown.total,
            orderData: {
              foodSubtotal: foodSubtotal,
              deliveryDistance: deliveryDistanceKM,
              priceBreakdown: priceBreakdown,
              // Add calculation parameters
              calculationParams: {
                baseDeliveryFee,
                deliveryPerKmRate,
                restaurantCommissionRate,
                serviceFeeRate,
                freeDeliveryThreshold: 3.0
              },
              restaurantName,
              deliveryAddress,
              items
            }
          };
          
          // Store cart data in localStorage for recovery if needed
          localStorage.setItem('pendingCart', JSON.stringify(items));
      
          // Navigate to payment page with the order information
          navigate(`/payment`, { state: paymentState });
          
          // We'll clear the cart in PaymentSummary component after successful payment
          // This avoids losing cart items if user navigates back before payment
        } else {
          throw new Error(orderResult?.message || "Failed to create order - no success response");
        }
      } catch (orderError: any) {
        console.error("Order creation error:", orderError);
        
        // For development - if order service is down, still allow navigation
        if (process.env.NODE_ENV === 'development') {
          console.log("Development mode: continuing to payment despite order error");
      
          // Store cart data in localStorage for recovery if needed
          localStorage.setItem('pendingCart', JSON.stringify(items));
          
          navigate(`/payment`, {
            state: {
              orderNumber: generatedOrderNumber,
              orderTotal: priceBreakdown.total,
              orderData: {
                foodSubtotal: foodSubtotal,
                deliveryDistance: deliveryDistanceKM,
                priceBreakdown: priceBreakdown,
                calculationParams: {
                  baseDeliveryFee,
                  deliveryPerKmRate,
                  restaurantCommissionRate,
                  serviceFeeRate,
                  freeDeliveryThreshold: 3.0
                },
                restaurantName,
                deliveryAddress,
                items
              }
            }
          });
          
          // We'll clear the cart in PaymentSummary component after successful payment
          return;
        }
        
        throw orderError;
      }
    } catch (error: any) {
      console.error("Error processing order:", error);
      toast.error(error.message || "There was a problem creating your order. Please try again.");
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Define location selection methods
  type LocationMethod = 'saved' | 'map';
  
  // Early return while cart is fetching
  if (isEmpty) {
    return <div className="text-center py-12">Loading order details...</div>;
  }

  // Show the estimated delivery time based on distance
  const estimatedDelivery = calculateEstimatedDelivery(deliveryDistanceKM);
  const formattedDeliveryTime = formatEstimatedDelivery(estimatedDelivery);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Order Details Column */}
      <div className="lg:col-span-2">
        {/* Restaurant Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-medium">Restaurant</h2>
          </div>
          <div className="p-4 flex items-center">
            <div className="mr-4 w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <StarIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-medium text-lg">{restaurantName}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Estimated delivery time: {formattedDeliveryTime}
              </p>
            </div>
          </div>
            </div>

        {/* Delivery Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-medium">Delivery Location</h2>
          </div>
          <div className="p-4">
            {user && locations.length > 0 ? (
          <div className="mb-4">
                <div className="flex mb-4">
                  <button
                    onClick={() => handleLocationMethodChange('saved')}
                    className={`flex-1 py-2 border-b-2 ${
                      locationMethod === 'saved'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500'
                    }`}
                  >
                    Saved Locations
                  </button>
                  <button
                    onClick={() => handleLocationMethodChange('map')}
                    className={`flex-1 py-2 border-b-2 ${
                      locationMethod === 'map'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500'
                    }`}
                  >
                    Map
                  </button>
                    </div>
                
                {locationMethod === 'saved' ? (
                  <div className="space-y-3">
                    {locations.map(location => (
                            <div 
                              key={location.id}
                      onClick={() => handleSelectSavedLocation(location.id)}
                        className={`cursor-pointer p-3 border rounded-lg flex items-start ${
                        selectedSavedLocation === location.id 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                        }`}
                      >
                        <div className="mr-3">
                          <MapPinIcon className={`h-5 w-5 ${
                            selectedSavedLocation === location.id
                              ? 'text-blue-500'
                              : 'text-gray-400'
                          }`} />
                              </div>
                        <div className="flex-1">
                          <p className="font-medium">{location.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{location.address}</p>
                          {location.isDefault && (
                            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full mt-1 inline-block">
                              Default
                            </span>
                          )}
                        </div>
                        {selectedSavedLocation === location.id && (
                          <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => handleLocationMethodChange('map')}
                      className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 mt-2 flex items-center justify-center"
                    >
                      <MapIcon className="h-4 w-4 mr-2" />
                      Select on Map
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3">
                      <LocationSelector
                        onAddressChange={handleAddressChange}
                        onLocationSelect={handleLocationSelect}
                        initialAddress={deliveryAddress}
                      />
                      <div className="mt-2">
                        <button
                          onClick={handleUseCurrentLocation}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Use my current location
                        </button>
                      </div>
                      {validationError && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{validationError}</p>
                      )}
                      {locationCoordinates && addressValidated && (
                        <div className="mt-3 flex items-center text-sm text-green-600 dark:text-green-400">
                          <CheckCircleIcon className="h-5 w-5 mr-1" />
                          <span>Location validated ({deliveryDistanceKM.toFixed(1)} km away)</span>
                        </div>
                      )}
                </div>
                    {showMap && locationCoordinates && (
                      <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden h-60">
                    <MapPreview 
                      address={deliveryAddress}
                          onLocationSelect={(lat, lng, address) => handleLocationSelect(lat, lng, address)}
                    />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <LocationSelector
                  onAddressChange={handleAddressChange}
                  onLocationSelect={handleLocationSelect}
                  initialAddress={deliveryAddress}
                />
                <div className="mt-2">
                  <button
                    onClick={handleUseCurrentLocation}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Use my current location
                  </button>
                </div>
                {validationError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{validationError}</p>
                )}
                {locationCoordinates && addressValidated && (
                  <div className="mt-3 flex items-center text-sm text-green-600 dark:text-green-400">
                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                    <span>Location validated ({deliveryDistanceKM.toFixed(1)} km away)</span>
                  </div>
                )}
                {showMap && locationCoordinates && (
                  <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden h-60">
                    <MapPreview
                      address={deliveryAddress}
                      onLocationSelect={(lat, lng, address) => handleLocationSelect(lat, lng, address)}
                    />
                  </div>
                )}
                {!user && (
                  <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
                    <p className="text-blue-800 dark:text-blue-300">
                      <Link to="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        Sign in
                      </Link>{' '}
                      to save this address for future orders.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-medium">Order Items</h2>
          </div>
          <div className="p-4">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item) => (
                <li key={item.id} className="py-4 flex">
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden mr-4">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <DocumentTextIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex justify-between">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${(item.price * (item.quantity ?? 1)).toFixed(2)}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Price Summary Column */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-6">
          <h2 className="text-xl font-medium mb-4">Order Summary</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Food Subtotal</span>
              <span>${formatCurrency(foodSubtotal)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
              <span>${formatCurrency(priceBreakdown?.totalDeliveryFee || deliveryFee)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Service & Tax</span>
              <span>${formatCurrency((priceBreakdown?.serviceFee || 0) + (priceBreakdown?.tax || tax))}</span>
            </div>
            
            <div className="pt-3 mt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                  ${formatCurrency(priceBreakdown ? priceBreakdown.total : orderTotal)}
                </span>
              </div>
              
              {deliveryDistanceKM > 0 && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
                  Delivery Distance: {deliveryDistanceKM.toFixed(1)} km
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
          <button 
            onClick={handleProceedToPayment}
              disabled={!addressValidated || isProcessingOrder}
              className={`w-full py-3 rounded-lg font-medium ${
                !addressValidated
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isProcessingOrder
                    ? 'bg-blue-300 text-blue-700 cursor-wait'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isProcessingOrder
                ? 'Processing...'
                : !addressValidated
                  ? 'Please Add Delivery Address'
                  : 'Proceed to Payment'}
          </button>
            
            <Link
              to="/restaurants"
              className="block w-full py-3 text-center rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750"
            >
              Back to Restaurants
            </Link>
          </div>
          
          <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
            <p>By proceeding, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;