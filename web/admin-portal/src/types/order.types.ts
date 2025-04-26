export interface PriceCalculation {
  foodSubtotal: number;
  restaurantCommission: number;
  baseDeliveryFee: number;
  extraDistanceFee?: number;
  totalDeliveryFee: number;
  tipAmount?: number;
  serviceFee?: number;
  tax?: number;
  total: number;
  driverEarnings?: number;
  companyFee?: number;
}

export interface DeliveryTimelineEvent {
  status: string;
  time: Date;
  description: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  updatedAt?: Date;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  // Additional user fields
}

export interface Restaurant {
  _id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  // Additional restaurant fields
}

export interface Driver {
  _id: string;
  name: string;
  phoneNumber?: string;
  // Additional driver fields
}

export interface FoodItem {
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  // Additional food fields
}

export interface Order {
  _id: string;
  orderId: string;
  user: User;
  restaurant: Restaurant;
  foods: FoodItem[];
  status: string;
  paymentStatus: string;
  priceCalculation: PriceCalculation;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  deliveryDistanceKM: number;
  paymentId: string;
  paymentMethod: string;
  deliveryAddress?: string;
  deliveryLocation: Location;
  deliveryInstructions?: string;
  deliveryTimeline: DeliveryTimelineEvent[];
  estimatedDeliveryTime?: Date;
  driver?: Driver;
  driverCurrentLocation?: Location;
  createdAt: Date;
  updatedAt?: Date;
} 