import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { calculateOrderPrices, formatCurrency } from '../../utils/priceCalculator';

// Dummy food items data
const dummyFoodItems = [
  {
    id: '1',
    name: 'Chicken Burger',
    price: 12.99,
    restaurantId: 'rest1',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fGJ1cmdlcnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
  },
  {
    id: '2',
    name: 'Veggie Pizza',
    price: 15.99,
    restaurantId: 'rest1',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cGl6emF8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
  },
  {
    id: '3',
    name: 'French Fries',
    price: 4.99,
    restaurantId: 'rest1',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8OXx8ZnJpZXN8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
  },
  {
    id: '4',
    name: 'Chocolate Milkshake',
    price: 6.99,
    restaurantId: 'rest1',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8bWlsa3NoYWtlfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
  },
];

const CartPage: React.FC = () => {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    isEmpty, 
    total: foodSubtotal,
    restaurantId
  } = useCart();

  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  const [restaurantLocation, setRestaurantLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [deliveryDistanceKM, setDeliveryDistanceKM] = useState(3.0); // Default distance
  
  // Default commission and service fee rates
  const restaurantCommissionRate = 15;

  const navigate = useNavigate();

  // Get restaurant location
  useEffect(() => {
    const fetchRestaurantLocation = async () => {
      if (restaurantId) {
        try {
          const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
          const response = await fetch(`${baseUrl}/api/restaurants/${restaurantId}`);

          const data = await response.json();
          
          if (response.ok && data.success) {
            const restaurant = data.data;
            const location = restaurant.restaurantInfo.location;
            
            // Extract coordinates
            if (location && location.coordinates && location.coordinates.length === 2) {
              setRestaurantLocation({
                latitude: location.coordinates[1],
                longitude: location.coordinates[0]
              });
            }
          }
        } catch (error) {
          console.error("Error fetching restaurant location:", error);
        }
      }
    };
    
    if (restaurantId) {
      fetchRestaurantLocation();
    }
  }, [restaurantId]);

  // Calculate price breakdown whenever relevant values change
  useEffect(() => {
    if (foodSubtotal > 0) {
      const prices = calculateOrderPrices({
        foodSubtotal,
        deliveryDistanceKM,
        restaurantCommissionRate
      });
      
      setPriceBreakdown(prices);
    }
  }, [foodSubtotal, deliveryDistanceKM, restaurantCommissionRate]);

  // Handle quantity update
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      updateQuantity(itemId, newQuantity);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">Your Cart</h1>

      {isEmpty ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Your cart is empty</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Add some delicious items to your cart!</p>
          <Link
            to="/restaurants"
            className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            Browse Restaurants
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 dark:text-white">
                  Order Items ({items.length})
                </h2>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item) => (
                    <div key={item.id} className="py-4 flex items-center">
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-1 flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
                            <h3>{item.name}</h3>
                            <p className="ml-4">Rs. {(item.price * (item.quantity ?? 1)).toFixed(2)}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Rs. {item.price.toFixed(2)} each
                          </p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {item.restaurantName}
                          </p>
                        </div>
                        <div className="flex flex-1 items-end justify-between text-sm">
                          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, (item.quantity ?? 1) - 1)}
                              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                            >
                              <MinusIcon className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 text-gray-700 dark:text-gray-200">
                              {item.quantity ?? 1}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, (item.quantity ?? 1) + 1)}
                              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                  <span className="font-medium dark:text-white">{formatCurrency(foodSubtotal)}</span>
                </div>
                
                {priceBreakdown && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Base Delivery Fee</span>
                      <span className="font-medium dark:text-white">{formatCurrency(priceBreakdown.baseDeliveryFee)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Distance Fee ({deliveryDistanceKM.toFixed(1)} km)
                      </span>
                      <span className="font-medium dark:text-white">{formatCurrency(priceBreakdown.extraDistanceFee)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Total Delivery Fee</span>
                      <span className="font-medium dark:text-white">{formatCurrency(priceBreakdown.totalDeliveryFee)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Service Fee (2%)
                      </span>
                      <span className="font-medium dark:text-white">{formatCurrency(priceBreakdown.serviceFee)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Restaurant Commission ({restaurantCommissionRate}%)
                      </span>
                      <span className="font-medium dark:text-white">{formatCurrency(priceBreakdown.restaurantCommission)}</span>
                    </div>
                    
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Tax</span>
                      <span className="font-medium dark:text-white">{formatCurrency(priceBreakdown.tax)}</span>
                </div>
                    
                <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Driver Earnings</span>
                      <span className="font-medium dark:text-white">{formatCurrency(priceBreakdown.driverEarnings)}</span>
                </div>
                    
                <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span className="font-semibold dark:text-white">Total</span>
                        <span className="font-semibold dark:text-white">{formatCurrency(priceBreakdown.total)}</span>
                      </div>
                    </div>
                  </>
                )}
                  </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md my-4 text-sm">
                <h3 className="font-medium mb-2 dark:text-white">Price Calculation Parameters:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-600 dark:text-gray-300">Base Fee:</div>
                  <div className="text-right dark:text-white">Rs. {priceBreakdown?.baseDeliveryFee?.toFixed(2) || '150.00'}</div>
                  
                  <div className="text-gray-600 dark:text-gray-300">Per KM Rate:</div>
                  <div className="text-right dark:text-white">Rs. {priceBreakdown?.deliveryPerKmRate?.toFixed(2) || '75.00'}/km</div>
                  
                  <div className="text-gray-600 dark:text-gray-300">Free Threshold:</div>
                  <div className="text-right dark:text-white">1.0 km</div>
                  
                  <div className="text-gray-600 dark:text-gray-300">Service Fee Rate:</div>
                  <div className="text-right dark:text-white">2%</div>
                  
                  <div className="text-gray-600 dark:text-gray-300">Commission Rate:</div>
                  <div className="text-right dark:text-white">{restaurantCommissionRate}%</div>
                  
                  <div className="text-gray-600 dark:text-gray-300">Distance:</div>
                  <div className="text-right dark:text-white">{deliveryDistanceKM.toFixed(1)} km</div>
                </div>
              </div>
              
              <Link
                to="/order/summary"
                className="mt-6 w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary/90 transition-colors inline-block text-center font-medium"
                onClick={() => {
                  // Navigate with state to pass price calculation data
                  navigate("/order/summary", {
                    state: {
                      foodSubtotal,
                      deliveryDistanceKM,
                      priceBreakdown,
                      // Add calculation parameters
                      calculationParams: {
                        baseDeliveryFee: priceBreakdown?.baseDeliveryFee,
                        deliveryPerKmRate: priceBreakdown?.deliveryPerKmRate,
                        restaurantCommissionRate,
                        serviceFeeRate: 0.02,
                        freeDeliveryThreshold: 1.0
                      }
                    }
                  });
                }}
              >
                Proceed to Checkout
              </Link>
              <Link
                to="/restaurants"
                className="mt-4 w-full text-gray-600 dark:text-gray-300 py-3 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors inline-block text-center border border-gray-300 dark:border-gray-600"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage; 