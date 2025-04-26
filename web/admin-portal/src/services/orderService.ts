import axios from 'axios';
import { API_URL } from '../config/constants';

// Order service is running on port 5003
const ORDER_SERVICE_URL = process.env.REACT_APP_ORDER_SERVICE_URL || "http://localhost:5003";

// Create an instance of axios with default config for order service
const orderServiceAxios = axios.create({
  baseURL: ORDER_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

interface OrderFilter {
  restaurantName?: string;
  customerName?: string;
}

export const orderService = {
  // Get all orders with optional filtering
  getAllOrders: async (filters?: OrderFilter) => {
    try {
      const response = await orderServiceAxios.get('/api/orders', {
        params: filters,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Get order by ID
  getOrderById: async (orderId: string) => {
    try {
      const response = await orderServiceAxios.get(`/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: string, description: string) => {
    try {
      const response = await orderServiceAxios.patch(
        `/api/orders/${orderId}/status`,
        { status, description },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },
}; 