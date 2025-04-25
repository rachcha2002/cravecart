import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LocationSelector from './LocationSelector';
import { useAuth } from '../../contexts/AuthContext';
import { useLocations } from '../../hooks/useLocations';
import MapPreview from './MapPreview';
import { calculateOrderPrices, formatCurrency } from '../../utils/priceCalculator';
import { generateOrderNumber, calculateEstimatedDelivery, formatEstimatedDelivery } from '../../utils/orderUtils';
import orderService from '../../services/orderService';
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

// Static restaurant data
const restaurantData = {
  _id: "6803d14c69261470e97ecc5b",
  name: "Janaka Perera",
  restaurantName: "Perera Indian Restaurant",
  email: "jperera@gmail.com",
  phoneNumber: "0714804203",
  address: "213 Siri Dhamma Mawatha, Colombo 01000, Sri Lanka",
  cuisine: ["indian"],
  description: "Perera Indian Restaurant offers authentic Indian cuisine in a warm, cozy setting with elegant decor and a welcoming vibe.",
  businessHours: {
    open: "10:00",
    close: "21:00"
  },
  location: {
    type: "Point",
    coordinates: [79.8747612487793, 6.928292856723946]
  },
  images: [
    {
      url: "https://res.cloudinary.com/dn1w8k2l1/image/upload/v1745080636/xfawdqq9rcke1kwr1fw2.png",
      isPrimary: true
    }
  ]
};

// Generate a new order number for this order
const generatedOrderNumber = generateOrderNumber();

// Define order data with pricing parameters
const orderData = {
  id: generatedOrderNumber,
  restaurantName: restaurantData.restaurantName,
  items: [
    { id: 1, name: 'Chicken Curry', quantity: 2, price: 12.99 },
    { id: 2, name: 'Garlic Naan', quantity: 3, price: 3.99 },
    { id: 3, name: 'Mango Lassi', quantity: 2, price: 1.99 },
  ],
  baseDeliveryFee: 2.99,
  deliveryPerKmRate: 0.50,
  freeDeliveryThresholdKM: 3,
  restaurantCommissionRate: 15,
  serviceFeeRate: 5,
  tipAmount: 2,
  deliveryTime: '30-45 min',
  paymentMethod: 'Credit Card',
};

// Define location selection methods
type LocationMethod = 'saved' | 'map';

const OrderSummary: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locations, defaultLocation, isLoading: locationsLoading } = useLocations();
  
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
  const [deliveryDistanceKM, setDeliveryDistanceKM] = useState(4.5); // Default for demo
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Calculate prices
  const foodSubtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const priceBreakdown = calculateOrderPrices({
    foodSubtotal,
    deliveryDistanceKM,
    tipAmount: orderData.tipAmount,
    baseDeliveryFee: orderData.baseDeliveryFee,
    deliveryPerKmRate: orderData.deliveryPerKmRate,
    freeDeliveryThresholdKM: orderData.freeDeliveryThresholdKM,
    restaurantCommissionRate: orderData.restaurantCommissionRate,
    serviceFeeRate: orderData.serviceFeeRate,
  });

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

  const handleLocationSelect = (lat: number, lng: number) => {
    setLocationCoordinates({
      latitude: lat,
      longitude: lng,
    });
    
    // In a real app, we would calculate the actual distance
    // For demo purposes, we'll simulate a random distance
    const newDistance = Math.round((2 + Math.random() * 6) * 10) / 10; // Between 2 and 8 km
    setDeliveryDistanceKM(newDistance);
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
      
      // Simulate distance calculation for the selected location
      const newDistance = Math.round((2 + Math.random() * 6) * 10) / 10; // Between 2 and 8 km
      setDeliveryDistanceKM(newDistance);
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
    if (!addressValidated || !locationCoordinates) {
      toast.error('Please confirm your delivery address first');
      return;
    }

    if (!user) {
      toast.error('Please log in to place an order');
      navigate('/login');
      return;
    }

    setIsProcessingOrder(true);

    try {
      // Use the same order number generated for display
      const orderNumber = orderData.id;
      
      // Calculate estimated delivery time based on distance
      const estimatedDeliveryTime = calculateEstimatedDelivery(deliveryDistanceKM);
      
      // Create order object with all required fields
      const newOrder = {
        orderId: orderNumber,
        user: {
          _id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phoneNumber || ''
        },
        restaurant: restaurantData,
        foods: orderData.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        })),
        priceCalculation: {
          foodSubtotal: priceBreakdown.foodSubtotal,
          restaurantCommission: priceBreakdown.restaurantCommission,
          baseDeliveryFee: priceBreakdown.baseDeliveryFee,
          extraDistanceFee: priceBreakdown.extraDistanceFee,
          totalDeliveryFee: priceBreakdown.totalDeliveryFee,
          tipAmount: priceBreakdown.tipAmount,
          serviceFee: priceBreakdown.serviceFee,
          tax: priceBreakdown.tax,
          total: priceBreakdown.total,
          driverEarnings: priceBreakdown.driverEarnings,
          companyFee: priceBreakdown.restaurantCommission + (priceBreakdown.totalDeliveryFee * 0.15)
        },
        // Legacy fields for backward compatibility
        subtotal: priceBreakdown.foodSubtotal,
        deliveryFee: priceBreakdown.totalDeliveryFee,
        tax: priceBreakdown.tax,
        total: priceBreakdown.total,
        
        deliveryDistanceKM: deliveryDistanceKM,
        paymentId: 'pending', // Will be updated after payment is processed
        paymentMethod: orderData.paymentMethod,
        deliveryAddress: deliveryAddress,
        deliveryLocation: {
          latitude: locationCoordinates.latitude,
          longitude: locationCoordinates.longitude
        },
        paymentStatus: 'pending',
        estimatedDeliveryTime: estimatedDeliveryTime
      };

      // Save the order to the database
      const response = await orderService.createOrder(newOrder);
      
      // Store order ID in local storage for the payment page
      localStorage.setItem('currentOrderId', response.data.orderId);
      
      // Navigate to payment page
      navigate('/payment');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 w-full min-h-screen md:min-h-0 md:max-w-5xl mx-auto">
      <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-6 dark:text-white">Order Summary</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-lg md:text-xl font-semibold mb-2 dark:text-white">Order #{orderData.id}</h3>
              <div className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">{orderData.id}</span>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg">Restaurant: {orderData.restaurantName}</p>
          </div>

          <div className="border-t border-b border-gray-200 dark:border-gray-700 py-3 md:py-4">
            <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 dark:text-white">Items</h3>
            {orderData.items.map((item) => (
              <div key={item.id} className="flex justify-between mb-3 text-base md:text-lg">
                <div>
                  <span className="font-medium dark:text-white">{item.quantity}x </span>
                  <span className="dark:text-gray-300">{item.name}</span>
                </div>
                <span className="dark:text-white">${formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between mb-2 text-base md:text-lg">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="dark:text-white">${formatCurrency(priceBreakdown.foodSubtotal)}</span>
            </div>
            <div className="flex justify-between mb-2 text-base md:text-lg">
              <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
              <span className="dark:text-white">${formatCurrency(priceBreakdown.totalDeliveryFee)}</span>
            </div>
            {deliveryDistanceKM > orderData.freeDeliveryThresholdKM && (
              <div className="flex justify-between mb-2 pl-6 text-sm md:text-base">
                <span className="text-gray-500 dark:text-gray-500">Base Fee</span>
                <span className="dark:text-gray-400">${formatCurrency(priceBreakdown.baseDeliveryFee)}</span>
              </div>
            )}
            {priceBreakdown.extraDistanceFee > 0 && (
              <div className="flex justify-between mb-2 pl-6 text-sm md:text-base">
                <span className="text-gray-500 dark:text-gray-500">Distance Fee ({(deliveryDistanceKM - orderData.freeDeliveryThresholdKM).toFixed(1)} km)</span>
                <span className="dark:text-gray-400">${formatCurrency(priceBreakdown.extraDistanceFee)}</span>
              </div>
            )}
            <div className="flex justify-between mb-2 text-base md:text-lg">
              <span className="text-gray-600 dark:text-gray-400">Service Fee</span>
              <span className="dark:text-white">${formatCurrency(priceBreakdown.serviceFee)}</span>
            </div>
            <div className="flex justify-between mb-2 text-base md:text-lg">
              <span className="text-gray-600 dark:text-gray-400">Tax</span>
              <span className="dark:text-white">${formatCurrency(priceBreakdown.tax)}</span>
            </div>
            <div className="flex justify-between mb-2 text-base md:text-lg">
              <span className="text-gray-600 dark:text-gray-400">Tip</span>
              <span className="dark:text-white">${formatCurrency(priceBreakdown.tipAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg md:text-xl mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="dark:text-white">Total</span>
              <span className="dark:text-white">${formatCurrency(priceBreakdown.total)}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg md:text-xl font-semibold mb-3 dark:text-white">Delivery Info</h3>
            <div className="flex items-center mb-1">
              <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg">Estimated Time: </p>
              <span className="ml-1 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded text-green-700 dark:text-green-400 text-sm font-medium">
                {formatEstimatedDelivery(calculateEstimatedDelivery(deliveryDistanceKM))}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-1 text-base md:text-lg">Distance: {deliveryDistanceKM.toFixed(1)} km</p>
            <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg">Payment Method: {orderData.paymentMethod}</p>
          </div>
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 pt-4 lg:pt-0 lg:pl-6">
          <h3 className="text-lg md:text-xl font-semibold mb-3 dark:text-white">Delivery Details</h3>
          
          <div className="mb-4">
            <div className="flex items-start mb-3">
              <MapPinIcon className={`h-6 w-6 mt-1 mr-2 flex-shrink-0 ${addressValidated ? 'text-green-500' : 'text-blue-500'}`} />
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-200 text-base md:text-lg">Delivery Address</p>
                {deliveryAddress && !isValidatingAddress ? (
                  <div className="flex items-center">
                    <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg">{deliveryAddress}</p>
                    {addressValidated && (
                      <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" />
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500 italic text-base md:text-lg">
                    {isValidatingAddress ? 'Getting your location...' : 'Please set your delivery address'}
                  </p>
                )}
              </div>
            </div>
            
            {/* Delivery location options with radio buttons */}
            <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3">Choose Delivery Location Method</h4>
              
              <div className="space-y-3">
                {/* Only show saved addresses option if user is logged in and has saved locations */}
                {user && locations.length > 0 && (
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      className="mt-1 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      checked={locationMethod === 'saved'}
                      onChange={() => handleLocationMethodChange('saved')}
                    />
                    <div className="ml-2">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Use a saved address</span>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Select from your saved addresses</p>
                    </div>
                  </label>
                )}
                
                <label className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    className="mt-1 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    checked={locationMethod === 'map'}
                    onChange={() => handleLocationMethodChange('map')}
                  />
                  <div className="ml-2">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Find a location on the map</span>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Search or pick a location from the map</p>
                  </div>
                </label>
              </div>
            </div>
            
            {/* Saved addresses section - only show when 'saved' method is selected */}
            {locationMethod === 'saved' && user && locations.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2">Select an Address</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                  {locations.map((location) => (
                            <div 
                              key={location.id}
                      onClick={() => handleSelectSavedLocation(location.id)}
                      className={`flex items-center p-2 rounded cursor-pointer ${
                        selectedSavedLocation === location.id 
                          ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                      }`}
                    >
                      <div className="flex-shrink-0 mr-2">
                        {location.isDefault ? (
                          <StarIcon className="h-5 w-5 text-amber-500" />
                        ) : (
                          <BookmarkIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                )}
                              </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{location.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{location.address}</p>
                      </div>
                      {selectedSavedLocation === location.id && (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 ml-1" />
                      )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
            
            {/* Map section - only show when 'map' method is selected */}
            {locationMethod === 'map' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700 dark:text-gray-200">Select on Map</h4>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleUseCurrentLocation}
                      className="text-sm text-blue-600 dark:text-blue-400 flex items-center hover:underline"
                    >
                      Use Current Location
                    </button>
                    
                    <button 
                      onClick={() => setShowMap(!showMap)}
                      className="text-sm text-blue-600 dark:text-blue-400 flex items-center hover:underline"
                    >
                      {showMap ? 'Hide Map' : 'Show Map'}
                      <MapIcon className="ml-1 h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Single map component that shows/hides based on state */}
                {showMap && (
                  <div className="h-64 md:h-80 mb-3 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                    <MapPreview 
                      address={deliveryAddress}
                      onLocationSelect={(lat, lng, address) => {
                        handleLocationSelect(lat, lng);
                        handleAddressChange(address);
                      }}
                    />
                  </div>
                )}
                
                {/* Always show location search when map method is selected */}
                <LocationSelector
                  initialAddress={deliveryAddress}
                  onAddressChange={handleAddressChange}
                  onLocationSelect={handleLocationSelect}
                />
              </div>
            )}
            
            {isValidatingAddress && (
              <p className="text-sm md:text-base text-blue-600 dark:text-blue-400 animate-pulse flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validating address...
              </p>
            )}
            
            {validationError && (
              <p className="text-sm md:text-base text-red-600 dark:text-red-400 mt-1">
                {validationError}
              </p>
            )}
            
            {addressChanged && addressValidated && !isValidatingAddress && (
              <p className="text-sm md:text-base text-green-600 dark:text-green-400 mt-1 flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-1" />
                Delivery address updated successfully!
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 shadow-md-up border-t border-gray-200 dark:border-gray-700 md:relative md:p-0 md:bg-transparent dark:md:bg-transparent md:shadow-none md:border-t-0 md:mt-6">
        <div className="flex flex-col sm:flex-row justify-between gap-2 md:mt-0 max-w-5xl mx-auto">
          <Link
            to="/"
            className="px-4 py-3 md:py-3 text-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 w-full md:w-auto text-base md:text-lg"
          >
            Back to Home
          </Link>
          <button 
            onClick={handleProceedToPayment}
            disabled={!addressValidated || !locationCoordinates || isProcessingOrder}
            className={`px-4 py-3 md:py-3 text-center text-white rounded w-full md:w-auto text-base md:text-lg flex items-center justify-center ${
              !addressValidated || !locationCoordinates || isProcessingOrder 
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
            }`}
          >
            {isProcessingOrder ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              !addressValidated || !locationCoordinates ? 'Please confirm your address' : 'Proceed to Payment'
            )}
          </button>
        </div>
      </div>

      {/* Add bottom padding to account for fixed button bar on mobile */}
      <div className="h-24 md:h-0 block md:hidden"></div>
    </div>
  );
};

export default OrderSummary;