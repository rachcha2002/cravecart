export const API_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

export const orderStatuses = [
  'order-received',
  'preparing-your-order',
  'wrapping-up',
  'picking-up',
  'heading-your-way',
  'delivered',
  'cancelled'
];

export const paymentStatuses = [
  'pending',
  'completed',
  'failed'
];

export const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toFixed(2)}`;
}; 