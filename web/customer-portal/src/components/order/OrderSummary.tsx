import React from 'react';
import { Link } from 'react-router-dom';

// Dummy data
const dummyOrder = {
  id: 'ORD-12345',
  restaurantName: 'Tasty Bites',
  items: [
    { id: 1, name: 'Chicken Burger', quantity: 2, price: 12.99 },
    { id: 2, name: 'French Fries', quantity: 1, price: 3.99 },
    { id: 3, name: 'Coke', quantity: 2, price: 1.99 },
  ],
  subtotal: 33.95,
  tax: 2.71,
  deliveryFee: 2.99,
  total: 39.65,
  paymentMethod: 'Credit Card',
  deliveryAddress: '123 Main St, Anytown, USA',
  deliveryTime: '30-45 min',
};

const OrderSummary: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Order #{dummyOrder.id}</h3>
        <p className="text-gray-600">Restaurant: {dummyOrder.restaurantName}</p>
      </div>
      
      <div className="border-t border-b border-gray-200 py-4 mb-4">
        <h3 className="text-lg font-semibold mb-3">Items</h3>
        {dummyOrder.items.map((item) => (
          <div key={item.id} className="flex justify-between mb-2">
            <div>
              <span className="font-medium">{item.quantity}x </span>
              <span>{item.name}</span>
            </div>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Subtotal</span>
          <span>${dummyOrder.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Tax</span>
          <span>${dummyOrder.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Delivery Fee</span>
          <span>${dummyOrder.deliveryFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg mt-2">
          <span>Total</span>
          <span>${dummyOrder.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Delivery Details</h3>
        <p className="text-gray-600 mb-1">Address: {dummyOrder.deliveryAddress}</p>
        <p className="text-gray-600 mb-1">Estimated Time: {dummyOrder.deliveryTime}</p>
        <p className="text-gray-600">Payment Method: {dummyOrder.paymentMethod}</p>
      </div>
      
      <div className="flex justify-between">
        <Link 
          to="/"
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
        >
          Back to Home
        </Link>
        <Link 
          to="/payment"
          className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
        >
          Proceed to Payment
        </Link>
      </div>
    </div>
  );
};

export default OrderSummary; 