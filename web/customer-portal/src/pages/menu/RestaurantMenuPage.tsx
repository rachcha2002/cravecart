import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { restaurantService } from '../../services/restaurantService';
import { Restaurant } from '../../types/restaurant';

import { Menu, MenuCategory, MenuItem } from '../../types/menu'
import { useCart } from '../../contexts/CartContext';



interface RouteParams {
  id: string;
  [key: string]: string | undefined;
}

const RestaurantMenuPage: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurantAndMenu = async () => {
      try {
        setLoading(true);
        
        // Fetch restaurant details
       if(id){
        const restaurantResponse = await restaurantService.getRestaurantById(id);
        setRestaurant(restaurantResponse.data);
        
        // Fetch restaurant menu
        const menuResponse = await restaurantService.getMenuByRestaurantId(id);
        setMenu(menuResponse.data);
        
      
        // Set active category to first category if available
        if (menuResponse.data.categories && menuResponse.data.categories.length > 0) {
          setActiveCategory(menuResponse.data.categories[0]._id);
        }
        
        setError(null);
      }else{
        setError('Restaurant ID is missing');}
      } catch (err) {
        setError('Failed to load restaurant details or menu. Please try again later.');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchRestaurantAndMenu();
    } else {
      setError('Restaurant ID is missing');
      setLoading(false);
    }
  }, [id]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <div className="mt-4">
          <Link to="/restaurants" className="text-blue-600 hover:underline">
            ← Back to Restaurants
          </Link>
        </div>
      </div>
    );
  }
  
  if (!restaurant || !menu) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-10">
          <h2 className="text-2xl font-semibold mb-4">Restaurant or Menu Not Found</h2>
          <p className="text-gray-600">We couldn't find the requested restaurant or its menu.</p>
          <div className="mt-4">
            <Link to="/restaurants" className="text-blue-600 hover:underline">
              ← Back to Restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Find the active category
  const currentCategory = menu.categories.find(category => category._id === activeCategory);

  // Fix the JSX issue by getting the hero image from the restaurant data
  // Use a default image as fallback
  const heroImage = restaurant?.restaurantInfo?.images?.find(img => img.isPrimary)?.url || 
                    restaurant?.profilePicture || 
                    '/default-restaurant.jpg';
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant Hero Section */}
      <div 
        className="h-64 bg-cover bg-center relative" 
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="h-full w-full bg-black bg-opacity-50 flex items-end">
          <div className="container mx-auto px-4 py-6">
            <Link to="/restaurants" className="inline-block mb-4 text-white hover:underline">
              ← Back to Restaurants
            </Link>

            <h1 className="text-4xl font-bold text-white mb-2">{restaurant?.restaurantInfo?.restaurantName || restaurant?.name}</h1>

            <div className="flex items-center space-x-4 text-white">
              <span>{restaurant?.restaurantInfo?.cuisine?.join(', ')}</span>
              <span>•</span>
              <span>{restaurant?.restaurantInfo?.businessHours?.open} - {restaurant?.restaurantInfo?.businessHours?.close}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Restaurant Info and Menu */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-col gap-4">
          {/* Sidebar - Restaurant Info */}
          <div className="md:w-full md:mr-4">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-1">About</h2>
              <p className="text-gray-700 mb-1">
                {restaurant.restaurantInfo?.description || 'No description available'}
              </p>
              
              <h3 className="font-medium mt-4 mb-1">Address</h3>
              <p className="text-gray-700">{restaurant.address}</p>
              
              <h3 className="font-medium mt-4 mb-1">Contact</h3>
              <p className="text-gray-700">Phone: {restaurant.phoneNumber}</p>
              <p className="text-gray-700">Email: {restaurant.email}</p>
              
              <h3 className="font-medium mt-4 mb-1">Hours</h3>
              <p className="text-gray-700">
                {restaurant.restaurantInfo?.businessHours?.open} - {restaurant.restaurantInfo?.businessHours?.close}
              </p>
            </div>
            
            {/* Special Offers Section */}
            {menu.specialOffers && menu.specialOffers.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Special Offers</h2>
                {menu.specialOffers.map((offer, index) => (
                  <div key={index} className="mb-4 pb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                    <h3 className="font-medium text-lg text-red-600">{offer.name}</h3>
                    <p className="text-gray-700 mb-2">{offer.description}</p>
                    {offer.discountPercentage && (
                      <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        {offer.discountPercentage}% Off
                      </span>
                    )}
                    {offer.validUntil && (
                      <p className="text-xs text-gray-500 mt-1">
                        Valid until {new Date(offer.validUntil).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Main Content - Menu */}
          <div className="md:w-full md:ml-4">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold">Menu</h2>
                <p className="text-gray-600">
                  Last updated: {new Date(menu.updatedAt).toLocaleDateString()}
                </p>
              </div>
              
              {/* Category Tabs */}
              <div className="flex overflow-x-auto p-4 border-b border-gray-200 bg-gray-50">
                {menu.categories.map(category => (
                  <button
                    key={category._id}
                    className={`px-4 py-2 mx-1 whitespace-nowrap font-medium rounded-md transition-colors ${
                      activeCategory === category._id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setActiveCategory(category._id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              
              {/* Menu Items */}
              <div className="p-6">
                {currentCategory ? (
                  <>
                    <h3 className="text-xl font-semibold mb-2">{currentCategory.name}</h3>
                    {currentCategory.description && (
                      <p className="text-gray-600 mb-6">{currentCategory.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {currentCategory.items.map(item => (
                        <MenuItemCard key={item._id} item={item} />
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-center py-8 text-gray-500">
                    No menu categories available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MenuItemCardProps {
  item: MenuItem;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const { id } = useParams<{ id: string }>();
  
  const handleAddToCart = () => {
    if (!id) return;
    
    // Add item to cart
    addItem({
      id: item._id,
      name: item.name,
      price: item.price,
      image: item.imageUrl,
      restaurantId: id,
      restaurantName: document.querySelector('h1')?.textContent || 'Restaurant'
    });
    
    // Show feedback to user
    setIsAdding(true);
    setTimeout(() => setIsAdding(false), 1500);
  };
  
  return (
    <div className={`border rounded-lg overflow-hidden flex flex-col h-full ${!item.isAvailable ? 'opacity-60' : ''}`}>
      {/* Image Section */}
      <div>
      {item.imageUrl && (
        <div>
          <img 
           src={item.imageUrl}  
           alt={item.name} 
           className="w-full h-40 object-cover rounded-md mt-2"
           onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/default-food.jpg'; // fallback if image fails
          }}
          />
        </div>
      )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
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
        <div className="mt-4 flex flex-col space-y-2">
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

export default RestaurantMenuPage;