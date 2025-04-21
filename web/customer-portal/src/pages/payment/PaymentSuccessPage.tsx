import React, { useEffect } from 'react';
import PaymentSuccess from '../../components/payment/PaymentSuccess';

const PaymentSuccessPage: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <PaymentSuccess />
    </div>
  );
};

export default PaymentSuccessPage; 