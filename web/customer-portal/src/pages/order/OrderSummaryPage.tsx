import React from 'react';
import OrderSummary from '../../components/order/OrderSummary';
import { useAuth } from '../../contexts/AuthContext';

const OrderSummaryPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Review Your Order</h1>
      {isAuthenticated && user ? (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
          <p className="text-blue-800 dark:text-blue-300">
            Welcome, {user.name}! Your saved delivery locations are available for selection.
          </p>
        </div>
      ) : null}
      <OrderSummary />
    </div>
  );
};

export default OrderSummaryPage; 