import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { menuService } from "../services/menuService";
import { MenuItem, MenuCategory } from "../types/menu.types";
import MenuItemModal from "../components/MenuItemModal";
//import CategoryFilterDropdown from "../components/CategoryFilterDropdown";

const Menu: React.FC = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<MenuCategory | "all" | "available" | "unavailable">("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [categories, setCategories] = useState<MenuCategory[]>([]); 

  const fetchMenuItems = async () => {
    if (!user || !user._id) return;
    
    try {
      setLoading(true);
      const response = await menuService.getRestaurantMenu(user._id);
      if (response.success) {
        const menuData = response.data; // Assuming this is of type `Menu`
        const menuId = menuData._id; // Get the menu ID from the response
        setMenuId(menuId);
        // Flatten items and add category info
        const allItems: (MenuItem & { categoryName: string })[] = [];
  
        const categories = menuData.categories.map((category: MenuCategory) => {
          category.items.forEach(item => {
            allItems.push({
              ...item,
              categoryName: category.name // attach category info to each item
            });
          });
          return category;
        });
  
        setMenuItems(allItems); // use this in your filtered view
        setCategories(categories); // for category tabs, filters etc.
      }
    } catch (err) {
      console.error("Error fetching menu items:", err);
      setError("Failed to load menu items. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMenuItems();
    setRefreshing(false);
  };

  const handleViewMenuItem = (menuItem:MenuItem) => {
    setSelectedMenuItem(menuItem);
    setIsModalOpen(true);
  };

  const handleAddMenuItem = () => {
    setSelectedMenuItem(null);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsAddModalOpen(false);
  };

  // Extend MenuItem to include categoryId for this function
  type MenuItemWithCategory = MenuItem & { categoryId: string };

  const handleSaveMenuItem = async (menuItemData: MenuItemWithCategory) => {
    if (!menuId || !menuItemData.categoryId) return;
  
    try {
      let response: { success: boolean; data: MenuItem };
  
      if (menuItemData._id) {
        // ✅ Update existing menu item
        response = await menuService.updateMenuItem(
          menuId,
          menuItemData.categoryId,
          menuItemData._id,
          menuItemData
        );
  
        if (response.success) {
          setMenuItems(menuItems.map(item =>
            item._id === menuItemData._id ? { ...response.data } : item
          ));
        }
      } else {
        // ✅ Add new menu item
        response = await menuService.addMenuItem(
          menuId,
          menuItemData.categoryId,
          menuItemData
        );
  
        if (response.success) {
          setMenuItems([...menuItems, { ...response.data }]);
        }
      }
  
      handleCloseModal();
    } catch (err) {
      console.error("Error saving menu item:", err);
      setError("Failed to save menu item. Please try again.");
    }
  };
  
/*
  const handleToggleAvailability = async (itemId : string, currentAvailability : boolean) => {
    try {
      const newAvailability = !currentAvailability;
      await menuService.updateItemAvailability(itemId, newAvailability);
      
      // Update local state after successful API call
      setMenuItems(menuItems.map(item => 
        item._id === itemId ? { ...item, available: newAvailability } : item
      ));
    } catch (err) {
      console.error("Error updating item availability:", err);
      setError("Failed to update item availability. Please try again.");
    }
  };*/

  const handleDeleteMenuItem = async (itemId : string,menuId: string, categoryId: string) => {
    try {
      const response = await menuService.deleteMenuItem(itemId,menuId, categoryId);
      
      if (response.success) {
        setMenuItems(menuItems.filter(item => item._id !== itemId));
        handleCloseModal();
      }
    } catch (err) {
      console.error("Error deleting menu item:", err);
      setError("Failed to delete menu item. Please try again.");
    }
  };

  // Filter menu items based on selected filter
  const filteredMenuItems = menuItems.filter(item => {
    if (activeFilter === "all") return true;
    if (activeFilter === "available") return item.isAvailable;
    if (activeFilter === "unavailable") return !item.isAvailable;
    //return item.categoryName === activeFilter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-md p-8">
        <div className="w-16 h-16 border-t-4 border-b-4 border-[#f29f05] rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Loading menu items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-md p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-red-600 mb-4 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#f29f05] hover:bg-[#f29f05]/90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f29f05]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <svg className="w-8 h-8 mr-3 text-[#f29f05]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Menu Management
            </h1>
            <p className="mt-2 text-gray-600">
              Create, edit, and manage your restaurant menu items.
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAddMenuItem}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-[#f29f05] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#f29f05]/90 focus:outline-none focus:ring-2 focus:ring-[#f29f05] focus:ring-offset-2 transition-all duration-300"
            >
              <svg 
                className="h-5 w-5 mr-2" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Menu Item
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#f29f05] focus:ring-offset-2 transition-all duration-300"
              disabled={refreshing}
            >
              <svg 
                className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-gradient-to-r from-[#f29f05]/5 to-[#f29f05]/10 p-4 rounded-lg border border-[#f29f05]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{menuItems.length}</p>
              </div>
              <div className="h-12 w-12 bg-[#f29f05]/20 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-[#f29f05]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Available</p>
                <p className="text-2xl font-bold text-gray-900">{menuItems.filter(item => item.isAvailable).length}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Unavailable</p>
                <p className="text-2xl font-bold text-gray-900">{menuItems.filter(item => !item.isAvailable).length}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex overflow-x-auto pb-2 space-x-4">
          <button 
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeFilter === "all" 
                ? "bg-[#f29f05] text-white shadow-sm" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All Items
          </button>
          <button 
            onClick={() => setActiveFilter("available")}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeFilter === "available" 
                ? "bg-green-500 text-white shadow-sm" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Available
          </button>
          <button 
            onClick={() => setActiveFilter("unavailable")}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeFilter === "unavailable" 
                ? "bg-red-500 text-white shadow-sm" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Unavailable
          </button>
          {categories.map(category => (
            <button 
              key={String(category)}
              onClick={() => setActiveFilter(category)}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                activeFilter === category 
                  ? "bg-[#f29f05] text-white shadow-sm" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {String(category)}
              Category
            </button>
          ))}
        </div>
      </div>

      {filteredMenuItems.length === 0 ? (
        <div className="bg-white shadow-sm rounded-xl p-12 text-center">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="mt-2 text-xl font-medium text-gray-900">No menu items found</h3>
          <p className="mt-1 text-gray-500">
            {activeFilter === "all" 
              ? "You don't have any menu items at the moment." 
              : activeFilter === "available"
              ? "No available menu items found."
              : activeFilter === "unavailable"
              ? "No unavailable menu items found."
              : `No menu items in category "${activeFilter}" found.`}
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleAddMenuItem}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#f29f05] hover:bg-[#f29f05]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f29f05] transition-all duration-300"
            >
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Menu Item
            </button>
          </div>
        </div>
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
                  <div className="font-bold text-lg text-[#f29f05]">₹{item.price.toFixed(2)}</div>
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

      {/* Menu Item Modal - For Editing */}
      {isModalOpen && selectedMenuItem && (
        <MenuItemModal
          menuItem={null}
          onClose={handleCloseModal}
          onSave={handleSaveMenuItem}
          //onDelete={handleDeleteMenuItem}
          categories={categories}
        />
      )}

      {/* Menu Item Modal - For Adding */}
      {isAddModalOpen && (
        <MenuItemModal
          menuItem={null}
          onClose={handleCloseModal}
          onSave={handleSaveMenuItem}
          categories={categories}
        />
      )}
    </div>
  );
};

export default Menu;