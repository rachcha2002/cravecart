// components/Menu/CategoryCard.tsx
import React, { useState } from 'react';
import { MenuCategory, MenuItem } from '../../types/menu.types';
import MenuItemCard from './MenuItemCard';
import AddMenuItemModal from './AddMenuItemModal';
import EditMenuItemModal from './EditMenuItemModal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface CategoryCardProps {
  category: MenuCategory;
  restaurantId: string;
  onUpdate: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, restaurantId, onUpdate }) => {
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  return (
    <Card className="p-4 mb-4 shadow-md rounded-lg bg-white">
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">{category.name}</h2>
        <Button onClick={() => setShowAddItem(true)}>Add Menu Item</Button>
      </div>

      {category.items.length === 0 ? (
        <div className="text-center text-gray-500">No items in this category yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {category.items.map((item) => (
            <div key={item._id} className="relative">
             <MenuItemCard 
                item={item} 
                restaurantId={restaurantId} 
                categoryId={category._id!} 
                onUpdate={onUpdate} 
             />
            </div>
          ))}
        </div>
      )}

      {showAddItem && (
        <AddMenuItemModal
          restaurantId={restaurantId}
          categoryId={category._id!}
          onClose={() => setShowAddItem(false)}
          onSuccess={onUpdate}
        />
      )}

      {editingItem && (
        <EditMenuItemModal
          restaurantId={restaurantId}
          categoryId={category._id!}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            setEditingItem(null);
            onUpdate();
          }}
        />
      )}
    </div>
    </Card>
  );
};

export default CategoryCard;
