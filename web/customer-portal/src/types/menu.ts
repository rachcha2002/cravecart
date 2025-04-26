
export interface MenuItem {
    _id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    category: string;
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    spicyLevel?: number; // e.g., 0-3 representing not spicy to very spicy
    ingredients?: string[];
    allergens?: string[];
    isAvailable: boolean;
    popularItem?: boolean;
  }
  
  export interface MenuCategory {
    _id: string;
    name: string;
    description?: string;
    items: MenuItem[];
  }
  
  export interface Menu {
    _id: string;
    restaurantId: string;
    categories: MenuCategory[];
    specialOffers?: {
      name: string;
      description: string;
      discountPercentage?: number;
      discountAmount?: number;
      validUntil?: string;
      items: string[]; // Array of item IDs
    }[];
    updatedAt: string;
  }
  
  export interface MenuResponse {
    success: boolean;
    data: Menu;
  }