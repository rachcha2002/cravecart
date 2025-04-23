// services/restaurant.service.ts
import axios from 'axios';
import { ApiResponse } from '../types/restaurant';

export const fetchRestaurants = async (
  status?: string,
  isVerified?: boolean,
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse> => {
  try {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('Authentication required');
    }
    console.log("Token being used:", token);

    const response = await axios.get<ApiResponse>('http://localhost:3001/api/users', {
      params: {
        role: 'restaurant',
        status,
        isVerified: isVerified !== undefined ? isVerified.toString() : undefined,
        page,
        limit
      },
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    throw error;
  }
};
