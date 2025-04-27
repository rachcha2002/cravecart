import axios from 'axios';

// Fix the API URL to ensure we're using the correct format
// The error suggests the URL format might be wrong
const NOTIFICATION_API_URL = process.env.REACT_APP_NOTIFICATION_API_URL || 'http://localhost:5005/api';

const notificationApi = axios.create({
  baseURL: NOTIFICATION_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout to prevent hanging requests
});

// Helper for better error handling
const handleApiError = (error: any, customMessage: string) => {
  console.error(`${customMessage}:`, error);
  
  if (error.response && error.response.data) {
    if (error.response.data.message || error.response.data.error) {
      return { 
        success: false, 
        message: error.response.data.message || error.response.data.error
      };
    }
  }
  
  if (error.code === 'ECONNABORTED') {
    return { 
      success: false, 
      message: 'Request timed out. The notification service may be unavailable.'
    };
  }
  
  return { 
    success: false, 
    message: error.message || customMessage
  };
};

const notificationService = {
  /**
   * Send an email directly using the /sendmail endpoint
   * This is a simpler method that doesn't require user lookup
   * @param email Recipient's email address
   * @param subject Email subject
   * @param htmlContent HTML content of the email
   */
  sendDirectEmail: async (
    email: string,
    subject: string,
    htmlContent: string
  ) => {
    try {
      console.log('Sending direct email to:', email);
      
      // Using the correct endpoint from the backend routes
      const response = await notificationApi.post('/notifications/sendmail', {
        to: email,
        subject: subject,
        html: htmlContent
      });
      
      console.log('Direct email response:', response.status);
      return response.data;
    } catch (error: any) {
      console.error('Failed to send email:', error);
      
      // Check if it's a network error
      if (error.code === 'ERR_NETWORK') {
        console.warn('Network error - notification service might be down');
        return {
          success: false,
          message: 'Cannot connect to notification service. Email will not be sent.'
        };
      }
      
      // Check if it's a 404 Not Found error
      if (error.response && error.response.status === 404) {
        console.warn('Endpoint not found - route may be incorrect');
        return {
          success: false,
          message: 'Notification endpoint not found. Email will not be sent.'
        };
      }
      
      return handleApiError(error, 'Error sending direct email');
    }
  },

  /**
   * Send an order confirmation email to the customer
   * @param userId User ID to send notification to
   * @param email User's email address
   * @param orderNumber Order number/ID
   * @param restaurantName Name of the restaurant
   * @param orderTotal Total order amount
   * @param items Order items
   */
  sendOrderConfirmationEmail: async (
    userId: string,
    email: string,
    orderNumber: string,
    restaurantName: string,
    orderTotal: number,
    items: any[]
  ) => {
    try {
      // Validate inputs to prevent API errors
      if (!userId || !email || !orderNumber) {
        console.warn('Missing required parameters for sendOrderConfirmationEmail');
        return { 
          success: false, 
          message: 'Missing required parameters'
        };
      }
      
      // Log the user ID for debugging
      console.log('Sending notification with user ID:', userId);
      console.log('Sending to email address:', email);
      
      // Create an itemized list for the email
      const itemsList = items && items.length > 0
        ? items
            .map(item => `${item.quantity || 1} × ${item.name} - Rs. ${(item.price * (item.quantity || 1)).toFixed(2)}`)
            .join('<br>')
        : 'No items';

      // Format the order total
      const formattedTotal = `Rs. ${orderTotal.toFixed(2)}`;

      // Build the message with order details (simplified for reliability)
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 5px; overflow: hidden;">
        <div style="background-color: #FF6B35; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Order Confirmation</h1>
        </div>
        <div style="padding: 20px;">
            <h2>Order #${orderNumber}</h2>
            <p>Your order from ${restaurantName} has been confirmed and paid successfully.</p>
            
            <div style="margin: 20px 0; padding: 15px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
                <h3>Order Details:</h3>
                <p>${itemsList}</p>
                <p style="font-weight: bold; font-size: 18px;">Total: ${formattedTotal}</p>
            </div>
            
            <p>We'll notify you with updates as your order is being prepared and delivered.</p>
            <p>Thank you for using CraveCart!</p>
            
            <div style="margin-top: 25px;">
                <a href="${window.location.origin}/orders/${orderNumber}" 
                   style="display: inline-block; background-color: #FF6B35; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold;">
                   View Order Details
                </a>
            </div>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 14px; color: #777;">
            <p>© ${new Date().getFullYear()} CraveCart. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`;

      // Use the direct email method for sending
      return await notificationService.sendDirectEmail(
        email,
        `Order Confirmation - ${orderNumber}`,
        htmlContent
      );
    } catch (error) {
      return handleApiError(error, 'Error sending order confirmation email');
    }
  }
};

export default notificationService;