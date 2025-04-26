// components/Menu/MenuPage.tsx
import React, { useEffect, useState } from 'react';
import { menuService } from '../services/menuService';
import { Menu } from '../types/menu.types';
import CategoryCard from '../components/Menu/CategoryCard';
import AddCategoryModal from '../components/Menu/AddCategoryModal';
import { Button } from '../components/ui/Button';

interface MenuPageProps {
  restaurantId: string;
}

const MenuPage: React.FC<MenuPageProps> = ({ restaurantId }) => {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddCategory, setShowAddCategory] = useState<boolean>(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    const response = await menuService.getMenu(restaurantId);
    if (response.success && response.data) {
      setMenu(response.data);
    }
    setLoading(false);
  };

  const handleCreateMenu = async () => {
    const response = await menuService.createMenu(restaurantId);
    if (response.success && response.data) {
      setMenu(response.data);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!menu) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-2xl mb-4">No Menu Found</h2>
        <Button variant="success" onClick={handleCreateMenu}>Create Menu</Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Menu</h1>
        <Button variant='success' onClick={() => setShowAddCategory(true)}>Add Category</Button>
      </div>

      {menu.categories.length === 0 ? (
        <div className="text-center text-gray-500">No categories yet. Add one!</div>
      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMenuItems.map((item) => (
            <div key={item._id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="relative">
                <img 
                  src={item.imageUrl || "/api/placeholder/400/200"} 
                  alt={item.name} 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.isAvailable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                   {/*item.category*/}
                  </span>
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                  <div className="font-bold text-lg text-[#f29f05]">Rs. {item.price.toFixed(2)}</div>
                </div>
                
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{item.description}</p>
                
                <div className="flex justify-between mb-4">
                  <div className="flex items-center">
                    {item.isVegetarian ? (
                      <span className="flex items-center text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                        <span className="h-3 w-3 bg-green-600 rounded-full mr-1"></span>
                        Veg
                      </span>
                    ) : (
                      <span className="flex items-center text-xs text-red-700 bg-red-50 px-2 py-1 rounded">
                        <span className="h-3 w-3 bg-red-600 rounded-full mr-1"></span>
                        Non-Veg
                      </span>
                    )}
                  </div>
                  
                  {item.isFeatured && (
                    <span className="flex items-center text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                      <svg className="h-3 w-3 mr-1 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" clipRule="evenodd"></path>
                      </svg>
                      Featured
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => handleViewMenuItem(item)}
                    className="inline-flex items-center px-3 py-2 border border-[#f29f05] rounded-lg text-sm text-[#f29f05] bg-white hover:bg-[#f29f05]/5 font-medium transition-colors duration-300"
                  >
                    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit
                  </button>
                  
                  <button 
                   //onClick={() => handleToggleAvailability(item._id, item.isAvailable)}
                    className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors duration-300 ${
                      item.isAvailable
                        ? "border-red-300 text-red-700 hover:bg-red-50"
                        : "border-green-300 text-green-700 hover:bg-green-50"
                    }`}
                  >
                    {item.isAvailable ? (
                      <>
                        <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Mark Unavailable
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Mark Available
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

     

      {showAddCategory && (
        <AddCategoryModal
          restaurantId={restaurantId}
          onClose={() => setShowAddCategory(false)}
          onSuccess={fetchMenu}
        />
      )}
    </div>
  );
};

export default MenuPage;
