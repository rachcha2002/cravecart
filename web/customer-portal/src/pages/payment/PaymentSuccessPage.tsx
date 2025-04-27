import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { formatCurrency } from '../../utils/priceCalculator';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import notificationService from '../../services/notificationService';
import { toast } from 'react-hot-toast';

const PaymentSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Get state from location
  const locationState = location.state || {};
  const { 
    orderData, 
    paymentId, 
    orderNumber, 
    orderTotal,
    calculatedOrderData: rawCalculatedData,
    paymentAmount,
    paymentCurrency
  } = locationState;
  
  // Redirect if no data is available
  useEffect(() => {
    if (!orderNumber && !orderData) {
      // If no order data, redirect to home page
      navigate('/');
      toast.error('Order information not found');
    }
  }, [orderNumber, orderData, navigate]);
  
  // Handle nested data structure
  const calculatedOrderData = rawCalculatedData || orderData?.calculatedOrderData || orderData;

  // Convert USD to LKR for display
  const USD_TO_LKR_RATE = 325;
  const paidAmount = paymentAmount || (calculatedOrderData?.priceBreakdown?.total 
    ? Math.round(calculatedOrderData.priceBreakdown.total * USD_TO_LKR_RATE) 
    : 0);
  const paidCurrency = paymentCurrency || 'lkr';

  // Clean up and send email notification
  useEffect(() => {
    // Prevent duplicate processing
    if (isProcessing) return;
    
    const processPayment = async () => {
      setIsProcessing(true);
      
      try {
        // Clear both the cart and pendingCart
        clearCart();
        localStorage.removeItem('pendingCart');
        
        // Only attempt to send email in production to avoid errors during development
        if (user && user.id && user.email && orderNumber && calculatedOrderData) {
          try {
            // Try to send the notification but don't block the UI if it fails
            const emailResult = await notificationService.sendOrderConfirmationEmail(
              user.id,
              user.email,
              orderNumber,
              calculatedOrderData.restaurantName || 'Restaurant',
              calculatedOrderData.priceBreakdown?.total || 0,
              calculatedOrderData.items || []
            );
            
            if (!emailResult?.success && emailResult?.message) {
              console.warn('Email notification issue:', emailResult.message);
              
              // Don't show this error to the user, the overall payment was still successful
              // and this is just a secondary confirmation email
            }
          } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
            // Don't block the UI or show error to the user - the payment was still successful
          }
        }
      } catch (error) {
        console.error('Error processing payment success:', error);
        // Continue normal operation even if there was an error
      }
    };
    
    processPayment();
    // We only want to run this effect once when the component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler for button clicks
  const handleButtonClick = (path: string) => {
    // Navigate programmatically to ensure it works even if there were issues with notification
    navigate(path);
  };

  // If we have no order data, show a loading state until the redirect happens
  if (!orderNumber && !orderData) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">Loading order information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircleIcon className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2 dark:text-white">Payment Successful!</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your order has been placed successfully.
        </p>
        
        {(orderData || calculatedOrderData) && (
          <div className="mb-6 text-left border-t border-b border-gray-200 dark:border-gray-700 py-4">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Order Details</h2>
            
            <div className="grid grid-cols-1 gap-3">
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Order ID:</span> {orderNumber || orderData?.orderId}
              </p>
              
              {calculatedOrderData?.restaurantName && (
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Restaurant:</span> {calculatedOrderData.restaurantName}
                </p>
              )}
              
              {calculatedOrderData?.deliveryAddress && (
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Delivery To:</span> {calculatedOrderData.deliveryAddress}
                </p>
              )}
              
              {calculatedOrderData?.priceBreakdown && (
                <div className="space-y-2">
                  <h3 className="font-medium dark:text-white">Order Summary</h3>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Food Subtotal:</span>
                    <span className="dark:text-white">{formatCurrency(calculatedOrderData.foodSubtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Delivery Fee:</span>
                    <span className="dark:text-white">{formatCurrency(calculatedOrderData.priceBreakdown.totalDeliveryFee)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Service & Tax:</span>
                    <span className="dark:text-white">{formatCurrency(calculatedOrderData.priceBreakdown.serviceFee + calculatedOrderData.priceBreakdown.tax)}</span>
                  </div>
                  
                  <div className="flex justify-between font-medium pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="dark:text-white">Total:</span>
                    <span className="dark:text-white">{formatCurrency(calculatedOrderData.priceBreakdown.total)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Paid (LKR):</span>
                    <span className="dark:text-white">Rs. {paidAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Display items if available */}
            {calculatedOrderData?.items && calculatedOrderData.items.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-medium mb-2 dark:text-white">Items Ordered:</h3>
                <ul className="space-y-1">
                  {calculatedOrderData.items.map((item: any, index: number) => (
                    <li key={index} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {item.quantity || 1} × {item.name}
                      </span>
                      <span className="dark:text-white">
                        {formatCurrency(item.price * (item.quantity || 1))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition-colors"
            onClick={() => handleButtonClick('/orders')}
          >
            View My Orders
          </button>
          <button
            className="px-6 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            onClick={() => handleButtonClick('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage; 