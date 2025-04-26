/**
 * Utility functions for calculating distances between coordinates
 */

interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param coord1 First coordinate (latitude, longitude)
 * @param coord2 Second coordinate (latitude, longitude)
 * @returns Distance in kilometers
 */
export const calculateDistance = (coord1: Coordinates, coord2: Coordinates): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(coord1.latitude)) * Math.cos(toRadians(coord2.latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  
  // Round to 1 decimal place
  return Math.round(distance * 10) / 10;
};

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};