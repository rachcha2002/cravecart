
export interface RestaurantImage {
  url: string;
  description: string;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface Location {
  type: string;
  coordinates: number[];
}

export interface RestaurantInfo {
  restaurantName: string;
  description: string;
  cuisine: string[];
  businessHours: {
    open: string;
    close: string;
  };
  location: Location;
  images: RestaurantImage[];
}

export interface Restaurant {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  profilePicture: string;
  restaurantInfo: RestaurantInfo;
}

export interface RestaurantsResponse {
  success: boolean;
  count: number;
  data: Restaurant[];
}

export interface RestaurantResponse {
  success: boolean;
  data: Restaurant;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  error?: string;
}