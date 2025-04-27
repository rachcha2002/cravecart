// restaurantService.ts
import { RestaurantsResponse, RestaurantResponse } from '../types/restaurant.types';


const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL}/api` || 'http://localhost:3001/api';

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
};