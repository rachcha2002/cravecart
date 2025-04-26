import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useCart } from '../contexts/CartContext';
import CartItems from './order/CartItems';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { 
    items,
    total, 
    tax, 
    deliveryFee, 
    orderTotal, 
    isEmpty,
    clearCart,
    restaurantName
  } = useCart();

  const handleCheckout = () => {
    // Close the modal first
    onClose();
    // Navigate to order summary page
    navigate('/order/summary');
  };

  const handleContinueShopping = () => {
    onClose();
  };

  const handleViewRestaurant = () => {
    if (items.length > 0) {
      onClose();
      navigate(`/restaurants/${items[0].restaurantId}`);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white dark:bg-gray-800 shadow-xl">
                    <div className="flex items-start justify-between py-4 px-6 border-b border-gray-200 dark:border-gray-700">
                      <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">Your Cart</Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                            onClick={onClose}
                          >
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                    <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                      {items.length > 0 && restaurantName && (
                        <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                              <ShoppingBagIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {restaurantName}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Your items from this restaurant
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-between">
                            <button 
                              onClick={handleViewRestaurant}
                              className="text-primary hover:text-primary-dark text-sm font-medium"
                            >
                              View Restaurant
                            </button>
                            <button 
                              onClick={() => clearCart()}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                              Clear Cart
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flow-root">
                        <CartItems compact />
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 py-6 px-4 sm:px-6">
                      <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
                        <p>Subtotal</p>
                        <p>${total.toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>Tax</p>
                        <p>${tax.toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>Delivery Fee</p>
                        <p>${deliveryFee.toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-base font-medium text-gray-900 dark:text-white">
                        <p>Total</p>
                        <p>${orderTotal.toFixed(2)}</p>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Shipping and taxes calculated at checkout.</p>
                      <div className="mt-6">
                        <button
                          onClick={handleCheckout}
                          className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          disabled={isEmpty}
                        >
                          Checkout
                        </button>
                      </div>
                      <div className="mt-6 flex justify-center text-center text-sm text-gray-500 dark:text-gray-400">
                        <p>
                          or{' '}
                          <button
                            type="button"
                            className="font-medium text-primary hover:text-primary-dark"
                            onClick={handleContinueShopping}
                          >
                            Continue Shopping
                            <span aria-hidden="true"> &rarr;</span>
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CartModal; 