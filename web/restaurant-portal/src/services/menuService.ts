// services/menuService.ts

import axios from 'axios';
import { Menu, MenuCategory, MenuItem, CustomizationGroup, CustomizationOption, ApiResponse } from '../types/menu.types';

const API_URL = process.env.REACT_APP_MENU_SERVICE_URL || 'http://localhost:5004/api/menus';

export const menuService = {
  // Get menu for a restaurant
  getMenu: async (restaurantId: string): Promise<ApiResponse<Menu>> => {
    try {
      const response = await axios.get(`${API_URL}/getmenus/${restaurantId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as ApiResponse<Menu>;
      }
      return {
        success: false,
        message: 'Failed to fetch menu. Please try again later.'
      };
    }
  },

  // Create a new menu
  createMenu: async (restaurantId: string): Promise<ApiResponse<Menu>> => {
    try {
      const response = await axios.post(`${API_URL}/create/${restaurantId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as ApiResponse<Menu>;
      }
      return {
        success: false,
        message: 'Failed to create menu. Please try again later.'
      };
    }
  },

  // Add a new category
  addCategory: async (restaurantId: string, categoryData: Partial<MenuCategory>): Promise<ApiResponse<MenuCategory>> => {
    try {
      const response = await axios.post(`${API_URL}/createcategory/${restaurantId}`, categoryData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as ApiResponse<MenuCategory>;
      }
      return {
        success: false,
        message: 'Failed to add category. Please try again later.'
      };
    }
  },

  // Update a category
  updateCategory: async (restaurantId: string, categoryId: string, categoryData: Partial<MenuCategory>): Promise<ApiResponse<MenuCategory>> => {
    try {
      const response = await axios.put(`${API_URL}/editcategory/${restaurantId}/${categoryId}`, categoryData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as ApiResponse<MenuCategory>;
      }
      return {
        success: false,
        message: 'Failed to update category. Please try again later.'
      };
    }
  },

  // Delete a category
  deleteCategory: async (restaurantId: string, categoryId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await axios.delete(`${API_URL}/deletecategory/${restaurantId}/${categoryId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as ApiResponse<any>;
      }
      return {
        success: false,
        message: 'Failed to delete category. Please try again later.'
      };
    }
  },

  // Add a menu item to a category
  addMenuItem: async (restaurantId: string, categoryId: string, itemData: Partial<MenuItem>): Promise<ApiResponse<MenuItem>> => {
    try {
      const response = await axios.post(`${API_URL}/${restaurantId}/menu/categories/${categoryId}/items`, itemData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as ApiResponse<MenuItem>;
      }
      return {
        success: false,
        message: 'Failed to add menu item. Please try again later.'
      };
    }
  },

  // Update a menu item
  updateMenuItem: async (restaurantId: string, categoryId: string, itemId: string, itemData: Partial<MenuItem>): Promise<ApiResponse<MenuItem>> => {
    try {
      const response = await axios.put(`${API_URL}/${restaurantId}/menu/categories/${categoryId}/items/${itemId}`, itemData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as ApiResponse<MenuItem>;
      }
      return {
        success: false,
        message: 'Failed to update menu item. Please try again later.'
      };
    }
  },

  // Delete a menu item
  deleteMenuItem: async (restaurantId: string, categoryId: string, itemId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await axios.delete(`${API_URL}/${restaurantId}/menu/categories/${categoryId}/items/${itemId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as ApiResponse<any>;
      }
      return {
        success: false,
        message: 'Failed to delete menu item. Please try again later.'
      };
    }
  },

  // Add a customization group to a menu item
  addCustomizationGroup: async (
    restaurantId: string, 
    categoryId: string, 
    itemId: string, 
    groupData: Partial<CustomizationGroup>
  ): Promise<ApiResponse<CustomizationGroup>> => {
    try {
      const response = await axios.post(
        `${API_URL}/${restaurantId}/menu/categories/${categoryId}/items/${itemId}/customization-groups`, 
        groupData
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as ApiResponse<CustomizationGroup>;
      }
      return {
        success: false,
        message: 'Failed to add customization group. Please try again later.'
      };
    }
  },

  // Add a customization option to a group
  addCustomizationOption: async (
    restaurantId: string,
    categoryId: string,
    itemId: string,
    groupId: string,
    optionData: Partial<CustomizationOption>
  ): Promise<ApiResponse<CustomizationOption>> => {
    try {
      const response = await axios.post(
        `${API_URL}/${restaurantId}/menu/categories/${categoryId}/items/${itemId}/customization-groups/${groupId}/options`,
        optionData
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as ApiResponse<CustomizationOption>;
      }
      return {
        success: false,
        message: 'Failed to add customization option. Please try again later.'
      };
    }
  },


// Upload an image for a menu item
uploadMenuItemImage: async (
  restaurantId: string,
  categoryId: string,
  itemId: string,
  url: string,
  description: string = ''
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(`${API_URL}/addmenuitemimage`, {
      restaurantId,
      categoryId,
      itemId,
      url,
      description
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ApiResponse<any>;
    }
    return {
      success: false,
      message: 'Failed to upload image for menu item. Please try again later.'
    };
  }
}
};

