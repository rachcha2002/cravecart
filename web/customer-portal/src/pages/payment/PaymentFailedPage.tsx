import React, { useEffect } from 'react';
import PaymentFailed from '../../components/payment/PaymentFailed';

const PaymentFailedPage: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <PaymentFailed />
    </div>
  );
};

export default PaymentFailedPage; 