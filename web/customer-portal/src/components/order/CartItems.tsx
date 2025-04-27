import React from 'react';
import { TrashIcon, MinusIcon, PlusIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useCart } from '../../contexts/CartContext';

interface CartItemsProps {
  compact?: boolean;
}

const CartItems: React.FC<CartItemsProps> = ({ compact = false }) => {
  const { items, removeItem, updateQuantity } = useCart();

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      updateQuantity(itemId, newQuantity);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
      </div>
    );
  }

  return (
    <ul role="list" className={`divide-y divide-gray-200 dark:divide-gray-700 ${compact ? 'space-y-2' : 'space-y-4'}`}>
      {items.map((item) => (
        <li key={item.id} className={`${compact ? 'py-3' : 'py-4'} flex items-center`}>
          <div className={`${compact ? 'h-16 w-16' : 'h-24 w-24'} flex-shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700`}>
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-xs">No image</span>
              </div>
            )}
          </div>
          <div className="ml-4 flex flex-1 flex-col">
            <div>
              <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
                <h3 className={compact ? 'text-sm' : 'text-base'}>{item.name}</h3>
                <p className="ml-4">Rs. {(item.price * (item.quantity ?? 1)).toFixed(2)}</p>
              </div>
              {!compact && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Rs. {item.price.toFixed(2)} each
                </p>
              )}
              <div className="mt-1 flex items-center">
                {item.restaurantName && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-0.5 px-2 rounded-full flex items-center">
                    <span className="font-medium">{item.restaurantName}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-1 items-end justify-between text-sm mt-2">
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                <button
                  onClick={() => handleUpdateQuantity(item.id, (item.quantity ?? 1) - 1)}
                  className={`${compact ? 'p-1' : 'p-2'} text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white`}
                >
                  <MinusIcon className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </button>
                <span className={`${compact ? 'px-2 py-1' : 'px-4 py-2'} text-gray-700 dark:text-gray-200`}>
                  {item.quantity ?? 1}
                </span>
                <button
                  onClick={() => handleUpdateQuantity(item.id, (item.quantity ?? 1) + 1)}
                  className={`${compact ? 'p-1' : 'p-2'} text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white`}
                >
                  <PlusIcon className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-700 dark:text-red-400"
              >
                <TrashIcon className={`${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default CartItems; 