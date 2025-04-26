// components/Menu/EditMenuItemModal.tsx
import React, { useState } from 'react';
import { menuService } from '../../services/menuService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { MenuItem } from '../../types/menu.types';
import ImageUploader from '../ImageUploader';


interface EditMenuItemModalProps {
  restaurantId: string;
  categoryId: string;
  item: MenuItem;
  onClose: () => void;
  onSuccess: () => void;
}

const ALLERGEN_OPTIONS = [
  'Dairy',
  'Eggs',
  'Fish',
  'Shellfish',
  'Tree nuts',
  'Peanuts',
  'Wheat',
  'Soy'
];

const EditMenuItemModal: React.FC<EditMenuItemModalProps> = ({ restaurantId, categoryId, item, onClose, onSuccess }) => {
  const [name, setName] = useState(item.name || '');
  const [description, setDescription] = useState(item.description || '');
  const [price, setPrice] = useState(item.price || 0);
  const [discountedPrice, setDiscountedPrice] = useState(item.discountedPrice || 0);
  const [imageUrl, setImageUrl] = useState(item.imageUrl || '');
  const [calories, setCalories] = useState(item.calories || 0);
  const [preparationTime, setPreparationTime] = useState(item.preparationTime || 15);
  const [isVegetarian, setIsVegetarian] = useState(item.isVegetarian || false);
  const [isVegan, setIsVegan] = useState(item.isVegan || false);
  const [isGlutenFree, setIsGlutenFree] = useState(item.isGlutenFree || false);
  const [spicyLevel, setSpicyLevel] = useState(item.spicyLevel || 0);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(item.allergens || []);
  const [isAvailable, setIsAvailable] = useState<boolean>(item.isAvailable || true);
  const [isFeatured, setIsFeatured] = useState(item.isFeatured || false);

  const handleAllergenChange = (allergen: string) => {
    if (selectedAllergens.includes(allergen)) {
      setSelectedAllergens(selectedAllergens.filter((a) => a !== allergen));
    } else {
      setSelectedAllergens([...selectedAllergens, allergen]);
    }
  };

  const handleSubmit = async () => {
    const updatedItem = {
      name,
      description,
      price,
      discountedPrice,
      imageUrl,
      calories,
      preparationTime,
      isVegetarian,
      isVegan,
      isGlutenFree,
      spicyLevel,
      allergens: selectedAllergens,
      customizationGroups: item.customizationGroups || [],
      isAvailable,
      isFeatured
    };

    const response = await menuService.updateMenuItem(restaurantId, categoryId, item._id!, updatedItem);
    if (response.success) {
      onSuccess();
    } else {
      alert(response.message || 'Failed to update item.');
    }
  };

  return (
    <Modal open onClose={onClose} title="Edit Menu Item">
      <div className="max-h-[75vh] overflow-y-auto space-y-2 p-2">
        <label className="block text-sm font-medium text-gray-700">Item Name</label>
        <Input placeholder="Item Name" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">Upload New Image (optional)</label>
  
  <ImageUploader
    onUploadSuccess={(url) => setImageUrl(url)}
    buttonText="Upload New Image"
  />

  {/* Show existing image if available */}
  {imageUrl && (
    <img 
      src={imageUrl} 
      alt="Existing Image"
      className="w-full h-40 object-cover rounded-md mt-2"
    />
  )}
</div>

        <span> Price
        <Input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </span>
        <span> Discounted Price
        <Input type="number" placeholder="Discounted Price" value={discountedPrice} onChange={(e) => setDiscountedPrice(Number(e.target.value))} />
        </span>
        <span> Calories
        <Input type="number" placeholder="Calories" value={calories} onChange={(e) => setCalories(Number(e.target.value))} />
        </span>
        <span> Preparation Time (minutes)
        <Input type="number" placeholder="Preparation Time (minutes)" value={preparationTime} onChange={(e) => setPreparationTime(Number(e.target.value))} />
        </span>
        <span> Spicy Level (0-3)
        <Input type="number" placeholder="Spicy Level (0-3)" value={spicyLevel} onChange={(e) => setSpicyLevel(Number(e.target.value))} />
        </span>
        <div>
          <strong>Allergens:</strong>
          {ALLERGEN_OPTIONS.map((allergen) => (
            <label key={allergen} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={selectedAllergens.includes(allergen)}
                onChange={() => handleAllergenChange(allergen)}
              />
              {allergen}
            </label>
          ))}
        </div>

        <div>
          <label>
            <input type="checkbox" checked={isVegetarian} onChange={(e) => setIsVegetarian(e.target.checked)} />
            Vegetarian
          </label>
          <label>
            <input type="checkbox" checked={isVegan} onChange={(e) => setIsVegan(e.target.checked)} />
            Vegan
          </label>
          <label>
            <input type="checkbox" checked={isGlutenFree} onChange={(e) => setIsGlutenFree(e.target.checked)} />
            Gluten Free
          </label>
        </div>

        <div>
          <label>
            <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
            Available
          </label>
          <label>
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            Featured
          </label>
        </div>

        <Button onClick={handleSubmit} className="w-full">
          Save Changes
        </Button>
      </div>
    </Modal>
  );
};

export default EditMenuItemModal;
