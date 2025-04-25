export interface CustomizationOption {
    _id?: string;
    name: string;
    price: number;
  }
  
export interface CustomizationGroup {
    _id?: string;
    name: string;
    required: boolean;
    multiSelect: boolean;
    options: CustomizationOption[];
  }
  
export interface MenuItem {
    _id?: string;
    name: string;
    description: string;
    price: number;
    discountedPrice?: number;
    imageUrl?: string;
    calories?: number;
    preparationTime: number;
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    spicyLevel: number;
    allergens: string[];
    customizationGroups: CustomizationGroup[];
    isAvailable: boolean;
    isFeatured: boolean;
  }
  
export interface MenuCategory {
    _id?: string;
    name: string;
    description: string;
    imageUrl?: string;
    items: MenuItem[];
    availabilityTimes: {
      allDay: boolean;
      specificHours?: {
        from: string;
        to: string;
      };
    };
    sortOrder: number;
    isAvailable: boolean;
  }
  
export interface Menu {
    _id?: string;
    restaurantId: string;
    categories: MenuCategory[];
    createdAt?: Date;
    updatedAt?: Date;
  }