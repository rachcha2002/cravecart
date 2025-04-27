// restaurantService.ts
import { RestaurantsResponse, RestaurantResponse } from '../types/restaurant';
import {  MenuResponse } from '../types/menu';

const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api` || 'http://localhost:3001/api';
const API_MENU_URL = `${process.env.REACT_APP_MENU_URL}/api/menus` || 'http://localhost:5004/api/menus';

export const restaurantService = {
  /**
   * Get all restaurants
   * @returns Promise with restaurants data
   */
  getAllRestaurants: async (): Promise<RestaurantsResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/restaurants`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch restaurants');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw error;
    }
  },
  
  /**
   * Get a single restaurant by ID
   * @param id Restaurant ID
   * @returns Promise with restaurant data
   */
  getRestaurantById: async (id: string): Promise<RestaurantResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/restaurants/${id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch restaurant');
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching restaurant with id ${id}:`, error);
      throw error;
    }
  },

  /**
 * Get menu by restaurant ID
 * @param restaurantId Restaurant ID
 * @returns Promise with menu data
 */
  getMenuByRestaurantId: async (restaurantId: string): Promise<MenuResponse> => {
   try {
    const response = await fetch(`${API_MENU_URL}/getmenus/${restaurantId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch restaurant menu');
    }
    console.log('Menu data:', data); // Log the menu data for debugging
    return data;
  } catch (error) {
    console.error(`Error fetching menu for restaurant ${restaurantId}:`, error);
    throw error;
  }
}
};