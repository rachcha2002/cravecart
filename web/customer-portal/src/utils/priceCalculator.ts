/**
 * Utility functions for calculating order prices, fees, and commissions
 */

interface PriceCalculatorParams {
  foodSubtotal: number;
  deliveryDistanceKM: number;
  tipAmount?: number;
  baseDeliveryFee: number;
  deliveryPerKmRate: number;
  freeDeliveryThresholdKM?: number;
  restaurantCommissionRate: number;
  serviceFeeRate: number;
}

interface PriceBreakdown {
  foodSubtotal: number;
  restaurantCommission: number;
  baseDeliveryFee: number;
  extraDistanceFee: number;
  totalDeliveryFee: number;
  tipAmount: number;
  serviceFee: number;
  tax: number;
  total: number;
  driverEarnings: number;
}

/**
 * Calculate all fees and totals for an order
 */
export const calculateOrderPrices = ({
  foodSubtotal,
  deliveryDistanceKM,
  tipAmount = 0,
  baseDeliveryFee,
  deliveryPerKmRate,
  freeDeliveryThresholdKM = 3, // Default free threshold of 3km
  restaurantCommissionRate,
  serviceFeeRate,
}: PriceCalculatorParams): PriceBreakdown => {
  // Calculate restaurant commission (comes from the food subtotal)
  const restaurantCommission = foodSubtotal * (restaurantCommissionRate / 100);

  // Calculate delivery fee components
  const extraDistanceFee = deliveryDistanceKM > freeDeliveryThresholdKM
    ? (deliveryDistanceKM - freeDeliveryThresholdKM) * deliveryPerKmRate
    : 0;
  
  const totalDeliveryFee = baseDeliveryFee + extraDistanceFee;
  
  // Calculate service fee (percentage of food subtotal)
  const serviceFee = foodSubtotal * (serviceFeeRate / 100);
  
  // Calculate tax (assuming 8% for now, could be parameterized)
  // Applying tax to food subtotal and service fee, but not delivery fee or tips
  // This may vary by jurisdiction
  const taxRate = 0.08;
  const tax = (foodSubtotal + serviceFee) * taxRate;
  
  // Calculate driver earnings (delivery fee + tip)
  // Assuming the driver gets 100% of the tip and some percentage of delivery fee
  const driverDeliveryFeePercentage = 0.85; // Driver gets 85% of delivery fee
  const driverEarnings = (totalDeliveryFee * driverDeliveryFeePercentage) + tipAmount;
  
  // Calculate total
  const total = foodSubtotal + totalDeliveryFee + serviceFee + tax + tipAmount;
  
  return {
    foodSubtotal,
    restaurantCommission,
    baseDeliveryFee,
    extraDistanceFee,
    totalDeliveryFee,
    tipAmount,
    serviceFee,
    tax,
    total,
    driverEarnings
  };
};

/**
 * Format a number as currency
 */
export const formatCurrency = (amount: number): string => {
  return amount.toFixed(2);
};

/**
 * Format a percentage
 */
export const formatPercentage = (percentage: number): string => {
  return `${percentage}%`;
}; 