// types/restaurant.ts

export interface User {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: 'customer' | 'restaurant' | 'delivery' | 'admin';
    address?: string;
    profilePicture?: string;
    restaurantInfo?: RestaurantInfo;
    defaultLocations?: DefaultLocation[];
    deliveryInfo?: DeliveryInfo;
    isVerified: boolean;
    status: 'active' | 'inactive' | 'suspended';
    createdAt: string;
    updatedAt: string;
  }
  
  export interface RestaurantInfo {
    restaurantName?: string;
    description?: string;
    cuisine?: string[];
    businessHours?: {
      open: string;
      close: string;
    };
    location?: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
    images?: RestaurantImage[];
  }
  
  export interface RestaurantImage {
    url: string;
    description?: string;
    isPrimary: boolean;
    uploadedAt: string;
  }
  
  export interface DefaultLocation {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    location: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
    isDefault: boolean;
    createdAt: string;
  }
  
  export interface DeliveryInfo {
    vehicleType?: string;
    vehicleNumber?: string;
    licenseNumber?: string;
    availabilityStatus: 'online' | 'offline';
    currentLocation?: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
    documents?: {
      driverLicense?: Document;
      vehicleRegistration?: Document;
      insurance?: Document;
    };
  }
  
  export interface Document {
    url: string;
    verified: boolean;
    uploadedAt?: string;
  }
  
  export interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    pages: number;
  }
  
  export interface RestaurantFilters {
    cuisine?: string;
    status?: 'active' | 'inactive' | 'suspended' | '';
    isVerified?: boolean;
  }
  
  export interface ApiResponse {
    users: User[];
    pagination: PaginationInfo;
  }
  
  export interface RestaurantListProps {
    initialFilters?: RestaurantFilters;
    initialPage?: number;
    initialLimit?: number;
  }