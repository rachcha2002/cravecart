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
        menu.categories.map((category) => (
          <CategoryCard key={category._id} category={category} restaurantId={restaurantId} onUpdate={fetchMenu} />
        ))
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
