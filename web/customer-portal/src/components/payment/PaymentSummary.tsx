import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Dummy data
const dummyPayment = {
  orderId: 'ORD-12345',
  restaurantName: 'Tasty Bites',
  total: 39.65,
  date: new Date().toLocaleDateString(),
};

const PaymentSummary: React.FC = () => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, this would process the payment
    // For demonstration purposes, we'll just redirect to success
    window.location.href = '/payment/success';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Payment Summary</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Order #{dummyPayment.orderId}</h3>
        <p className="text-gray-600">Restaurant: {dummyPayment.restaurantName}</p>
        <p className="text-gray-600">Date: {dummyPayment.date}</p>
        <p className="text-gray-600 font-bold mt-2">Total Amount: ${dummyPayment.total.toFixed(2)}</p>
      </div>
      
      <div className="border-t border-gray-200 pt-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
        
        <div className="flex space-x-4 mb-6">
          <div 
            className={`flex items-center border rounded-md p-3 cursor-pointer ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            onClick={() => setPaymentMethod('card')}
          >
            <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center mr-2">
              {paymentMethod === 'card' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
            </div>
            <span>Credit/Debit Card</span>
          </div>
          
          <div 
            className={`flex items-center border rounded-md p-3 cursor-pointer ${paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            onClick={() => setPaymentMethod('cash')}
          >
            <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center mr-2">
              {paymentMethod === 'cash' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
            </div>
            <span>Cash on Delivery</span>
          </div>
        </div>
        
        {paymentMethod === 'card' && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="cardNumber" className="block text-gray-700 mb-1">Card Number</label>
              <input 
                type="text" 
                id="cardNumber" 
                placeholder="1234 5678 9012 3456"
                className="w-full p-2 border border-gray-300 rounded" 
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="nameOnCard" className="block text-gray-700 mb-1">Name on Card</label>
              <input 
                type="text" 
                id="nameOnCard" 
                placeholder="John Doe"
                className="w-full p-2 border border-gray-300 rounded" 
                value={nameOnCard}
                onChange={(e) => setNameOnCard(e.target.value)}
                required
              />
            </div>
            
            <div className="flex space-x-4 mb-4">
              <div className="flex-1">
                <label htmlFor="expiryDate" className="block text-gray-700 mb-1">Expiry Date</label>
                <input 
                  type="text" 
                  id="expiryDate" 
                  placeholder="MM/YY"
                  className="w-full p-2 border border-gray-300 rounded" 
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="w-1/3">
                <label htmlFor="cvv" className="block text-gray-700 mb-1">CVV</label>
                <input 
                  type="text" 
                  id="cvv" 
                  placeholder="123"
                  className="w-full p-2 border border-gray-300 rounded" 
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">
              Pay ${dummyPayment.total.toFixed(2)}
            </button>
          </form>
        )}
        
        {paymentMethod === 'cash' && (
          <div className="mb-4">
            <p className="text-gray-600 mb-4">You'll pay the delivery person when your order arrives.</p>
            <Link 
              to="/payment/success"
              className="block w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
            >
              Confirm Order (Cash on Delivery)
            </Link>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <Link 
          to="/order/summary"
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
        >
          Back to Order Summary
        </Link>
      </div>
    </div>
  );
};

export default PaymentSummary; 