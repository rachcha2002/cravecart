import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useCart } from '../../contexts/CartContext';
import paymentService from '../../services/paymentService';
import orderService from '../../services/orderService';
import { formatCurrency } from '../../utils/priceCalculator';
import { toast } from 'react-hot-toast';

// Define options for CardElement with better styling
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': {
        color: '#aab7c4',
      },
      iconColor: '#6366F1',
      padding: '16px',
      lineHeight: '1.5',
      fontSmoothing: 'antialiased',
    },
    invalid: {
      color: '#EF4444',
      iconColor: '#EF4444',
    },
  },
  hidePostalCode: true
};

// This is where we'll display the payment form with Stripe components
const PaymentForm = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentInitialized, setPaymentInitialized] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const stripe = useStripe();
  const elements = useElements();
  const { items, clearCart, addItem, restoreCart } = useCart();

  // Get the calculated price from location.state if available
  const calculatedOrderData = location.state?.orderData;
  const calculatedOrderTotal = location.state?.orderTotal;
  const orderNumber = location.state?.orderNumber;

  // Calculate exchange rate (in a real app, this would come from an API)
  const USD_TO_LKR_RATE = 1; // Changed from 325 to 1 to remove conversion
  // Calculate payment amount based on the total from price breakdown
  const PAYMENT_AMOUNT = calculatedOrderTotal 
    ? Math.round(calculatedOrderTotal) 
    : 1000; // Fallback to fixed amount
  const PAYMENT_CURRENCY = 'lkr'; // Must be lowercase for Stripe

  // Log state data to ensure we're getting the right information
  useEffect(() => {
    if (calculatedOrderData) {
      // Console log removed
    }
  }, [calculatedOrderData]);

  // Create a payment intent once
  useEffect(() => {
    // Skip if already initialized or successful
    if (paymentInitialized || paymentSuccess) return;

    // Create order data from cart or location state - Use calculated amount if available
    const orderDetails = {
      orderId: orderNumber || `ORD-${Math.floor(Math.random() * 100000)}`,
      amount: PAYMENT_AMOUNT,
      currency: PAYMENT_CURRENCY,
      customerEmail: localStorage.getItem('userEmail') || 'customer@example.com',
      customerName: localStorage.getItem('userName') || 'Customer',
      items: calculatedOrderData?.items || items, // Prefer items from order data
      calculatedOrderData: calculatedOrderData, // Include the complete price breakdown
      restaurantName: calculatedOrderData?.restaurantName,
      deliveryAddress: calculatedOrderData?.deliveryAddress
    };
    
    setOrderData(orderDetails);

    // Function to create a payment intent
    const createIntent = async () => {
      try {
        setIsProcessing(true);
        setPaymentError(null);
        // Mark as initialized immediately to prevent duplicate calls
        setPaymentInitialized(true);
        
        // Console log removed
        
        // Check if payment service is available
        try {
        const result = await paymentService.createPaymentIntent(orderDetails);
        // Console log removed
        
        if (result && result.clientSecret) {
          setClientSecret(result.clientSecret);
          setPaymentIntentId(result.paymentIntentId);
          
          // If the server returns a message about using an existing intent, log it
          if (result.message) {
            // Console log removed
          }
        } else {
            throw new Error(result?.message || 'Invalid response from payment service');
          }
        } catch (paymentServiceError: any) {
          console.error('Payment service error:', paymentServiceError);
          
          // If in development mode, create a fake client secret for testing
          if (process.env.NODE_ENV === 'development') {
            // Console log removed
            setClientSecret('fake_client_secret_for_development');
            setPaymentIntentId('fake_payment_intent_id');
          } else {
            throw paymentServiceError;
          }
        }
      } catch (error: any) {
        console.error('Failed to create payment intent:', error);
        
        // Check if it's a 409 conflict (another request in progress)
        if (error.response && error.response.status === 409) {
          // Console log removed
          
          // Reset the initialized flag and retry after a delay
          setTimeout(() => {
            setPaymentInitialized(false);
          }, 2000);
          
        } else {
          setPaymentError(error.message || 'Failed to initialize payment. Please try again.');
          setPaymentInitialized(false); // Reset if there was a non-conflict error
        }
      } finally {
        setIsProcessing(false);
      }
    };

    // Only create an intent if we haven't already done so
    if (!clientSecret && !paymentInitialized) {
      createIntent();
    }
    
  }, [location.state, navigate, paymentSuccess, paymentInitialized, clientSecret, calculatedOrderData, calculatedOrderTotal, orderNumber, PAYMENT_AMOUNT, items]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setPaymentError('Stripe has not been initialized yet. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setPaymentError('Card element not found. Please refresh and try again.');
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentError(null);

      // For development mode, bypass actual payment confirmation
      if (process.env.NODE_ENV === 'development' && clientSecret === 'fake_client_secret_for_development') {
        // Remove development bypass logging
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing
        await handlePaymentSuccess({ id: 'fake_payment_intent_id', status: 'succeeded' });
        return;
      }
      
      // Confirm the payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: orderData.customerName,
            email: orderData.customerEmail,
            address: {
              city: 'Colombo',
              country: 'LK',
              line1: '123 Main St',
              postal_code: '10000',
              state: 'Western Province'
            }
          }
        },
        return_url: window.location.origin + '/payment/success'  // Important for 3D Secure
      });

      if (result.error) {
        console.error('Payment error:', result.error);
        
        if (result.error.type === 'card_error') {
          // Update order payment status to 'failed' for card errors
          if (orderData.orderId) {
            try {
              // Remove update logging
              orderService.updatePaymentStatus(orderData.orderId, 'failed')
                .then(result => {/* Remove status update logging */})
                .catch(error => console.error('Failed to update order payment status to failed:', error));
            } catch (error) {
              console.error('Error updating order payment status to failed:', error);
            }
          }
          
          // Handle card errors (like declined card)
          handlePaymentError(result.error.message || 'Your card was declined', false);
        } else {
          // Handle other types of errors
          handlePaymentError(result.error.message || 'An error occurred while processing your payment.', true);
        }
      } else if (result.paymentIntent?.status === 'succeeded') {
        // Remove success logging
        await handlePaymentSuccess(result.paymentIntent);
      } else if (result.paymentIntent?.status === 'requires_action') {
        // Handle 3D Secure authentication if required
        // Remove authentication logging
        setPaymentError('This payment requires additional authentication. Please complete the authentication process.');
      } else {
        // Handle other potential statuses
        // Remove status logging
        handlePaymentError(`Payment status: ${result.paymentIntent?.status}. Please try again.`);
      }
    } catch (err: any) {
      console.error('Payment confirmation error:', err);
      handlePaymentError(err.message || 'An error occurred while processing your payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payment errors - can either show inline or navigate to error page
  const handlePaymentError = (errorMessage: string, navigateAway = false) => {
    // Always set the error message
    setPaymentError(errorMessage);
    
    // Get the orderId from location state or orderData
    const realOrderId = location.state?.orderNumber || orderData?.orderId;
    
    // Update order payment status to 'failed' for serious errors
    if (realOrderId) {
      try {
        console.log('Updating order payment status to failed for order:', realOrderId);
        orderService.updatePaymentStatus(realOrderId, 'failed')
          .then(result => console.log('Order payment status updated to failed:', result))
          .catch(error => console.error('Failed to update order payment status to failed:', error));
      } catch (error) {
        console.error('Error updating order payment status to failed:', error);
      }
    } else {
      console.error('No orderId found to update payment status to failed');
    }
    
    // For serious errors, navigate to the failed payment page
    if (navigateAway) {
      navigate('/payment/failed', {
        state: {
          error: errorMessage,
          orderId: realOrderId || orderData?.orderId
        }
      });
    }
    // Otherwise the error will be displayed inline
  };

  // On successful payment, prepare complete data for the success page
  const handlePaymentSuccess = async (paymentIntentResult: any) => {
    try {
      // Confirm the payment in our backend
      const confirmation = await paymentService.confirmPayment(paymentIntentId);
      
      // Mark payment as successful
      setPaymentSuccess(true);
      
      // Clear the cart only after successful payment
      clearCart();
      
      // Also clear the pendingCart from localStorage
      localStorage.removeItem('pendingCart');
      
      // Get the orderId from location state or orderData
      const realOrderId = location.state?.orderNumber || orderData?.orderId;
      
      // Update the order payment status to 'completed'
      if (realOrderId) {
        try {
          const orderUpdateResult = await orderService.updatePaymentStatus(realOrderId, 'completed');
        } catch (orderUpdateError) {
          console.error('Failed to update order payment status:', orderUpdateError);
          // Continue with navigation even if order update fails - payment was successful
          toast.error('Payment successful but order status update failed. Please contact support.');
        }
      } else {
        console.error('No orderId found to update payment status');
        toast.error('Payment successful but order reference not found. Please contact support.');
      }
      
      // Navigate to success page with complete order data
      navigate('/payment/success', { 
        state: { 
          orderData,
          paymentId: paymentIntentId,
          orderNumber: realOrderId || orderNumber,
          orderTotal: calculatedOrderTotal,
          calculatedOrderData: calculatedOrderData,
          paymentAmount: PAYMENT_AMOUNT,
          paymentCurrency: PAYMENT_CURRENCY
        } 
      });
    } catch (confirmError: any) {
      console.error('Backend confirmation error:', confirmError);
      handlePaymentError('Payment succeeded but we had trouble confirming it. Please contact support.');
    }
  };

  // Add useEffect to handle cart recovery
  useEffect(() => {
    // Check if we have a pendingCart in localStorage (user might have navigated back)
    const pendingCart = localStorage.getItem('pendingCart');
    
    // If there's a pending cart and our current cart is empty, restore it
    if (pendingCart && items.length === 0) {
      try {
        const parsedCart = JSON.parse(pendingCart);
        // Remove cart restore logging
        
        // Use the new restoreCart function to restore the entire cart at once
        restoreCart(parsedCart);
        
        toast.success('Your cart has been restored');
      } catch (e) {
        console.error('Error restoring cart:', e);
      }
    }
  }, []);

  // Display amounts in LKR format
  const formatLKR = (amount: number) => {
    return formatCurrency(amount);
  };

  // For displaying order items (convert USD to LKR for display)
  const displayItemPrice = (priceUSD: number, quantity: number = 1) => {
    // No conversion needed
    return formatCurrency(priceUSD * quantity);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800">
      {/* Order Summary Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Order Summary</h2>
        
        {calculatedOrderData && calculatedOrderData.priceBreakdown ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Food Subtotal</span>
              <span className="font-medium dark:text-white">{formatCurrency(calculatedOrderData.foodSubtotal)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Delivery Fee</span>
              <span className="font-medium dark:text-white">{formatCurrency(calculatedOrderData.priceBreakdown.totalDeliveryFee)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Service & Tax</span>
              <span className="font-medium dark:text-white">{formatCurrency(calculatedOrderData.priceBreakdown.serviceFee + calculatedOrderData.priceBreakdown.tax)}</span>
            </div>
            
            <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="font-semibold dark:text-white">Total</span>
                <div className="text-right">
                  <div className="font-bold text-lg dark:text-white">{formatCurrency(calculatedOrderData.priceBreakdown.total)}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
          <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="dark:text-white">{formatLKR(PAYMENT_AMOUNT * 0.85)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
              <span className="dark:text-white">{formatLKR(PAYMENT_AMOUNT * 0.07)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Service & Tax</span>
              <span className="dark:text-white">{formatLKR(PAYMENT_AMOUNT * 0.08)}</span>
          </div>
            <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between font-semibold">
            <span className="dark:text-white">Total</span>
            <span className="text-primary-600 dark:text-primary-400">
                  {formatLKR(PAYMENT_AMOUNT)}
            </span>
              </div>
            </div>
          </div>
        )}
            </div>
            
      {/* Payment Form */}
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Payment Details</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-gray-300 dark:border-gray-600 p-4 rounded-md">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        
          {paymentError && (
          <div className="text-red-500 p-3 bg-red-50 dark:bg-red-900/20 rounded-md text-sm">
              {paymentError}
            </div>
          )}
              
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full py-3 px-4 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isProcessing ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              <span>Processing...</span>
              </div>
          ) : (
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Complete Order</span>
            </div>
          )}
            </button>
          </form>
    </div>
  );
};

// The main component that wraps the Stripe Elements provider
const PaymentSummary = () => {
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize Stripe with publishable key from API
    const loadStripeInstance = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Get the publishable key from our payment service
        const stripeConfig = await paymentService.getStripeConfig();
        
        if (!stripeConfig || !stripeConfig.publishableKey) {
          throw new Error('No publishable key returned from server');
        }
        
        // Remove publishable key logging
        const stripeInstance = await loadStripe(stripeConfig.publishableKey);
        
        if (!stripeInstance) {
          throw new Error('Failed to initialize Stripe');
        }
        
        setStripePromise(stripeInstance);
      } catch (error: any) {
        console.error('Error loading Stripe:', error);
        
        // Try hardcoded key as fallback (this is only for development)
        try {
          // Remove fallback logging
          const hardcodedKey = 'pk_test_51RFf3THsCzKYEOA9CjWeShqLww38lou7qbkfI4Z4hJpsuvB36qyNwje4y6qHyuPISY0emyW21kJVImnQojYSDYvp00kDL5H1mu';
          const stripeInstance = await loadStripe(hardcodedKey);
          
          if (stripeInstance) {
            // Remove success logging
            setStripePromise(stripeInstance);
            setLoadError(null);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback loading also failed:', fallbackError);
        }
        
        setLoadError('Could not connect to payment processor. Make sure the payment service is running.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStripeInstance();
  }, []);

  if (loadError) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
        <p className="text-red-600 dark:text-red-400 font-medium mb-4">
          {loadError}
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          Please try refreshing the page or contact customer support.
        </p>
      </div>
    );
  }

  if (isLoading || !stripePromise) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600/30 border-t-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950/50 py-8 px-6 rounded-xl shadow-sm mb-8">
        <h2 className="text-2xl font-bold mb-4 text-primary-800 dark:text-primary-300">Payment Information</h2>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
              Your payment is secured with industry-standard encryption. All information is transmitted securely via SSL.
            </p>
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                <strong>Test Mode:</strong> Use card number <span className="font-mono bg-white dark:bg-gray-800 text-primary-700 dark:text-primary-400 px-2 py-1 rounded">4242 4242 4242 4242</span> with any future expiration date and any 3-digit CVV.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="rounded-lg bg-white dark:bg-gray-800 p-3 shadow-md">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/2560px-Stripe_Logo%2C_revised_2016.svg.png" 
                  alt="Stripe" className="h-8 dark:hidden" />
              <img src="https://www.vectorlogo.zone/logos/stripe/stripe-ar21.svg" 
                  alt="Stripe" className="h-8 hidden dark:block" />
            </div>
          </div>
        </div>
      </div>
      
      <Elements stripe={stripePromise}>
        <PaymentForm />
      </Elements>
    </div>
  );
};

export default PaymentSummary; 