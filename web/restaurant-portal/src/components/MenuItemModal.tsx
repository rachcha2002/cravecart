import React, { useState, useEffect } from "react";
import { MenuItem, MenuCategory } from "../types/menu.types";

interface MenuItemModalProps {
  menuItem: (MenuItem & { categoryId: string }) | null;
  onSave: (item: MenuItem & { categoryId: string }) => void;
  onClose: () => void;
  onDelete?: (itemId: string, categoryId: string) => void;
  categories: MenuCategory[];
}

const MenuItemModal: React.FC<MenuItemModalProps> = ({ menuItem, onSave, onClose, onDelete, categories }) => {
  const [formData, setFormData] = useState<MenuItem & { categoryId: string }>({
    _id: menuItem?._id || undefined,
    name: menuItem?.name || "",
    description: menuItem?.description || "",
    price: menuItem?.price || 0,
    discountedPrice: menuItem?.discountedPrice,
    imageUrl: menuItem?.imageUrl || "",
    calories: menuItem?.calories,
    preparationTime: menuItem?.preparationTime || 0,
    isVegetarian: menuItem?.isVegetarian || false,
    isVegan: menuItem?.isVegan || false,
    isGlutenFree: menuItem?.isGlutenFree || false,
    spicyLevel: menuItem?.spicyLevel || 0,
    allergens: menuItem?.allergens || [],
    customizationGroups: menuItem?.customizationGroups || [],
    isAvailable: menuItem?.isAvailable || true,
    isFeatured: menuItem?.isFeatured || false,
    categoryId: menuItem?.categoryId || categories[0]?._id || "",
    //menuId: menuItem?.menuId || "",
  });

  useEffect(() => {
    if (menuItem) {
      setFormData({ ...formData, _id: menuItem._id });
    }
  }, [menuItem]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.price || !formData.categoryId) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {menuItem ? "Edit" : "Add"} Menu Item
        </h2>

        <input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          name="price"
          type="number"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <select
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
        <div className="flex justify-between items-center gap-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isVegetarian" checked={formData.isVegetarian} onChange={handleChange} />
            Vegetarian
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isVegan" checked={formData.isVegan} onChange={handleChange} />
            Vegan
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isGlutenFree" checked={formData.isGlutenFree} onChange={handleChange} />
            Gluten Free
          </label>
        </div>

        <div className="flex justify-end gap-2">
          {menuItem && onDelete && (
            <button
              onClick={() => onDelete(formData._id!, formData.categoryId)}
              className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#f29f05] text-white rounded hover:bg-[#f29f05]/90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemModal;
