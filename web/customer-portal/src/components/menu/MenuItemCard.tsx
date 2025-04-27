import React, { useState } from 'react';
import { MenuItem } from '../../types/menu';
import { useCart } from '../../contexts/CartContext';

interface MenuItemCardProps {
  item: MenuItem;
  restaurantId: string;
  restaurantName: string;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, restaurantId, restaurantName }) => {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAddToCart = () => {
    // Add item to cart
    addItem({
      id: item._id,
      name: item.name,
      price: item.price,
      image: item.imageUrl,
      restaurantId,
      restaurantName
    });
    
    // Show feedback to user
    setIsAdding(true);
    setTimeout(() => setIsAdding(false), 1500);
  };
  
  return (
    <div className={`border rounded-lg overflow-hidden flex ${!item.isAvailable ? 'opacity-60' : ''}`}>
      {/* Image Section */}
      {item.imageUrl && (
        <div className="w-1/3">
          <img 
            src={item.imageUrl}  
            alt={item.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/default-food.jpg'; // fallback if image fails
            }}
          />
        </div>
      )}
      
      <div className={`p-4 ${item.imageUrl ? 'w-2/3' : 'w-full'}`}>
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-lg">{item.name}</h4>
          <span className="font-semibold">Rs. {item.price.toFixed(2)}</span>
        </div>
        <p className="text-gray-600 text-sm mt-1">{item.description}</p>
        
        {/* Dietary and Spicy Indicators */}
        <div className="mt-2 flex flex-wrap gap-1">
          {/* Boolean indicators - These should only show the label */}
          {item.isVegetarian && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Vegetarian
            </span>
          )}
          {item.isVegan && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Vegan
            </span>
          )}
          {item.isGlutenFree && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              Gluten Free
            </span>
          )}
          
          {/* Numeric indicators - Only show when value is greater than 0 */}
          {item.spicyLevel !== undefined && item.spicyLevel > 0 && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              <span className="font-semibold">Spicy Level:</span>
              {/* Display spicy level as chili peppers */}
              {Array(item.spicyLevel).fill('🌶️').join('')}
            </span>
          )}
          
          {/* Array indicators - Only show when array has items */}
          {item.allergens && item.allergens.length > 0 && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              <span className="font-semibold">Allergens:</span> {item.allergens.join(', ')}
            </span>
          )}
          
          {/* Other boolean indicators */}
          {item.popularItem && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Popular
            </span>
          )}
        </div>
        
        {/* Item Status and Add to Cart Button */}
        <div className="mt-3 flex justify-between items-center">
          {!item.isAvailable ? (
            <span className="text-red-600 text-sm">Currently unavailable</span>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!item.isAvailable || isAdding}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isAdding 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isAdding ? 'Added!' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard; 