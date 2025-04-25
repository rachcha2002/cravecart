/**
 * Utility functions for order management
 */

/**
 * Generates a random order number in the format ORD-XXXXXXXX
 * where X is a random alphanumeric character
 * @returns A unique order number string
 */
export const generateOrderNumber = (): string => {
  const prefix = 'ORD-';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  
  // Generate 8 random characters
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  // Add timestamp to ensure uniqueness (last 4 digits)
  const timestamp = Date.now().toString().slice(-4);
  result += timestamp;
  
  return result;
};

/**
 * Formats a date as a string for estimated delivery
 * @param date The date to format
 * @returns Formatted date string
 */
export const formatEstimatedDelivery = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Calculates an estimated delivery time based on
 * distance and restaurant preparation time
 * 
 * @param distanceKM The delivery distance in kilometers
 * @param prepTimeMinutes Preparation time in minutes (defaults to 20)
 * @returns Estimated delivery Date object
 */
export const calculateEstimatedDelivery = (
  distanceKM: number,
  prepTimeMinutes = 20
): Date => {
  // Assume average speed of 25 km/h for delivery
  const speedKMperHour = 25;
  
  // Calculate travel time in minutes
  const travelTimeMinutes = (distanceKM / speedKMperHour) * 60;
  
  // Add 10 minutes buffer
  const totalMinutes = prepTimeMinutes + travelTimeMinutes + 10;
  
  // Create new date with estimated delivery time
  const deliveryTime = new Date();
  deliveryTime.setMinutes(deliveryTime.getMinutes() + Math.ceil(totalMinutes));
  
  return deliveryTime;
}; 