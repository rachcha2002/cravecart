import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const getMenuItems = async () => {
  const response = await api.get('/menu');
  return response.data;
};

export const updateMenuItem = async (id: number, data: any) => {
  const response = await api.put(`/menu/${id}`, data);
  return response.data;
};

export const createMenuItem = async (data: any) => {
  const response = await api.post('/menu', data);
  return response.data;
};

export const updateOrderStatus = async (id: number, status: string) => {
  const response = await api.put(`/orders/${id}/status`, { status });
  return response.data;
};

export const getRestaurantProfile = async () => {
  const response = await api.get('/restaurant/profile');
  return response.data;
};

export const updateRestaurantProfile = async (data: any) => {
  const response = await api.put('/restaurant/profile', data);
  return response.data;
};

export default api; 