import axios from 'axios';

const ORDER_API_URL = `${process.env.REACT_APP_ORDER_API_URL}/api/orders` || 'http://localhost:5003/api/orders';

// Create an axios instance with a request interceptor for authorization
const orderApi = axios.create({
  baseURL: ORDER_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in all requests
orderApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle authentication errors
orderApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // For all error responses except getOrder requests, handle 401
    if (error.response && error.response.status === 401) {
      const url = error.config.url;
      
      // Check if this is a getOrder request (url will be like /{orderId})
      const isGetOrder = url && /^\/[^\/]+$/.test(url);
      
      // Only redirect to login for non-getOrder requests
      if (!isGetOrder) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Helper for better error handling
const handleApiError = (error: any, customMessage: string) => {
  if (error.response && error.response.data) {
    if (error.response.data.message) {
      throw new Error(error.response.data.message);
    }
  }
  throw error;
};

const orderService = {
  // Create a new order
  createOrder: async (orderData: any) => {
    try {
      const response = await orderApi.post('', orderData);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Error creating order');
    }
  },

  // Get order by ID
  getOrder: async (orderId: string) => {
    try {
      // Create a separate request without authentication headers for public access
      const response = await axios.get(`${ORDER_API_URL}/${orderId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Error fetching order');
    }
  },

  // Get orders for current user
  getUserOrders: async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Get user ID from the token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;
      
      if (!userId) {
        throw new Error('User ID not found in token');
      }
      
      const response = await orderApi.get(`/user/${userId}`);
      
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Error fetching user orders');
    }
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: string) => {
    try {
      const response = await orderApi.patch(`/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Error updating order status');
    }
  },

  // Update payment status
  updatePaymentStatus: async (orderId: string, paymentStatus: string) => {
    try {
      const response = await orderApi.patch(`/${orderId}/payment`, { paymentStatus });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Error updating payment status');
    }
  }
};

export default orderService; 