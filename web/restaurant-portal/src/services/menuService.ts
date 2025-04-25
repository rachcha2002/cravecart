import axios from 'axios';

const MENU_API_URL = process.env.REACT_APP_MENU_SERVICE_URL || 'http://localhost:5004/api';

// Create axios instance
const menuApiClient = axios.create({
  baseURL: MENU_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for token
menuApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Menu service functions
export const menuService = {
  // Get menu for a restaurant
  getRestaurantMenu: async (restaurantId: string) => {
    try {
      const response = await menuApiClient.get(`/menus/restaurant/${restaurantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching restaurant menu:', error);
      throw error;
    }
  },

  // Create a new menu
  createMenu: async (menuData: { restaurantId: string, categories: any[] }) => {
    try {
      const response = await menuApiClient.post('/menus', menuData);
      return response.data;
    } catch (error) {
      console.error('Error creating menu:', error);
      throw error;
    }
  },

  // Update an existing menu
  updateMenu: async (menuId: string, menuData: any) => {
    try {
      const response = await menuApiClient.put(`/menus/${menuId}`, menuData);
      return response.data;
    } catch (error) {
      console.error('Error updating menu:', error);
      throw error;
    }
  },

  // Add a new category to a menu
  addMenuCategory: async (menuId: string, categoryData: any) => {
    try {
      const response = await menuApiClient.post(`/menus/${menuId}/category`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error adding menu category:', error);
      throw error;
    }
  },

  // Update an existing category
  updateMenuCategory: async (menuId: string, categoryId: string, categoryData: any) => {
    try {
      const response = await menuApiClient.put(`/menus/${menuId}/category/${categoryId}`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error updating menu category:', error);
      throw error;
    }
  },

  // Delete a category
  deleteMenuCategory: async (menuId: string, categoryId: string) => {
    try {
      const response = await menuApiClient.delete(`/menus/${menuId}/category/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting menu category:', error);
      throw error;
    }
  },

  // Add a new item to a category
  addMenuItem: async (menuId: string, categoryId: string, itemData: any) => {
    try {
      const response = await menuApiClient.post(`/menus/${menuId}/category/${categoryId}/item`, itemData);
      return response.data;
    } catch (error) {
      console.error('Error adding menu item:', error);
      throw error;
    }
  },

  // Update an existing item
  updateMenuItem: async (menuId: string, categoryId: string, itemId: string, itemData: any) => {
    try {
      const response = await menuApiClient.put(`/menus/${menuId}/category/${categoryId}/item/${itemId}`, itemData);
      return response.data;
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  },

  // Delete an item
  deleteMenuItem: async (menuId: string, categoryId: string, itemId: string) => {
    try {
      const response = await menuApiClient.delete(`/menus/${menuId}/category/${categoryId}/item/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  },

  // Toggle item availability
  toggleItemAvailability: async (menuId: string, categoryId: string, itemId: string, isAvailable: boolean) => {
    try {
      const response = await menuApiClient.patch(`/menus/${menuId}/category/${categoryId}/item/${itemId}/toggle`, {
        isAvailable
      });
      return response.data;
    } catch (error) {
      console.error('Error toggling item availability:', error);
      throw error;
    }
  }
};