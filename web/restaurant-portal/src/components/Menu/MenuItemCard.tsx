// components/Menu/MenuItemCard.tsx
import React, { useState } from 'react';
import { MenuItem } from '../../types/menu.types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { menuService } from '../../services/menuService';
import ManageCustomizationsModal from './ManageCustomizationsModal';
import EditMenuItemModal from './EditMenuItemModal';

interface MenuItemCardProps {
  item: MenuItem;
  restaurantId: string;
  categoryId: string;
  onUpdate: () => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, restaurantId, categoryId, onUpdate }) => {
  const [showManageCustomization, setShowManageCustomization] = useState(false);
   const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

   const handleDeleteItem = async (itemId: string) => {
       const confirmDelete = window.confirm('Are you sure you want to delete this menu item?');
       if (!confirmDelete) return;
   
       const response = await menuService.deleteMenuItem(restaurantId, categoryId, itemId);
       if (response.success) {
         onUpdate();
       } else {
         alert(response.message || 'Failed to delete item.');
       }
     };

  return (
    <>
      <Card className="p-4 shadow-md flex flex-col h-full">
        {item.imageUrl && (
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-full h-32 object-cover rounded-md mb-2"
          />
        )}

        <h3 className="text-lg font-bold">{item.name}</h3>

        {item.description && (
          <p className="text-gray-500 text-sm mt-1">{item.description}</p>
        )}

        <div className="mt-2 font-bold text-green-600">
          Rs.{item.price.toFixed(2)}
        </div>

        {item.discountedPrice && (
          <div className="text-red-500 text-sm">
            Discount: Rs.{item.discountedPrice.toFixed(2)}
          </div>
        )}

        {item.isVegetarian && (
          <div className="text-green-500 text-xs mt-1">
            Vegetarian
          </div>
        )}

        <Button 
          onClick={() => setShowManageCustomization(true)} 
          className="mt-auto w-full"
          variant='warning'
        >
          Manage Customizations
        </Button>
         <div className="flex space-x-2 mt-2">
            <Button variant='success' onClick={() => setEditingItem(item)}>Edit</Button>
            <Button variant='danger' onClick={() => handleDeleteItem(item._id!)}>Delete</Button>
         </div>
      </Card>

      {showManageCustomization && (
        <ManageCustomizationsModal
          restaurantId={restaurantId}
          categoryId={categoryId}
          item={item}
          onClose={() => setShowManageCustomization(false)}
          onRefresh={onUpdate}
        />
      )}
       {editingItem && (
        <EditMenuItemModal
          restaurantId={restaurantId}
          categoryId={categoryId!}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            setEditingItem(null);
            onUpdate();
          }}
        />
      )}
    </>
  );
};

export default MenuItemCard;
