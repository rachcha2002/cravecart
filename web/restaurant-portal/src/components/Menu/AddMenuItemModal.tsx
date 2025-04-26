// components/Menu/AddMenuItemModal.tsx
import React, { useState } from 'react';
import { menuService } from '../../services/menuService';
import { Button } from '../ui/Button'; 
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import ImageUploader from '../ImageUploader'; 


interface AddMenuItemModalProps {
  restaurantId: string;
  categoryId: string;
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

const AddMenuItemModal: React.FC<AddMenuItemModalProps> = ({ restaurantId, categoryId, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [discountedPrice, setDiscountedPrice] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [calories, setCalories] = useState<number>(0);
  const [preparationTime, setPreparationTime] = useState<number>(15);
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isVegan, setIsVegan] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [spicyLevel, setSpicyLevel] = useState<number>(0);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  const handleAllergenChange = (allergen: string) => {
    if (selectedAllergens.includes(allergen)) {
      setSelectedAllergens(selectedAllergens.filter((a) => a !== allergen));
    } else {
      setSelectedAllergens([...selectedAllergens, allergen]);
    }
  };

  

  const handleSubmit = async () => {
    const response = await menuService.addMenuItem(restaurantId, categoryId, {
      name,
      description,
      price,
      discountedPrice,
      imageUrl: previewUrl,
      calories,
      preparationTime,
      isVegetarian,
      isVegan,
      isGlutenFree,
      spicyLevel,
      allergens: selectedAllergens,
      customizationGroups: [],
      isAvailable: true,
      isFeatured: false
    });

    if (response.success) {
      onSuccess();
      onClose();
    } else {
      alert(response.message || 'Failed to add item.');
    }
  };

  return (
    <Modal open onClose={onClose} title="Add New Menu Item">
      <div className="max-h-[75vh] overflow-y-auto space-y-2 p-2">
        <label className="block text-sm font-medium text-gray-700">Item Name</label>
        <Input placeholder="Item Name" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Upload Image</label>
          <ImageUploader
             onUploadSuccess={(url) => setPreviewUrl(url)}
           />
  
  {previewUrl && (
    <img 
      src={previewUrl} 
      alt="Preview" 
      className="w-full h-40 object-cover rounded-md mt-2"
    />
  )}
</div>
        <label className="block text-sm font-medium text-gray-700">Price
        <Input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Discounted Price
        <Input type="number" placeholder="Discounted Price" value={discountedPrice} onChange={(e) => setDiscountedPrice(Number(e.target.value))} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Calories
        <Input type="number" placeholder="Calories" value={calories} onChange={(e) => setCalories(Number(e.target.value))} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Preparation Time (minutes)
        <Input type="number" placeholder="Preparation Time (minutes)" value={preparationTime} onChange={(e) => setPreparationTime(Number(e.target.value))} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Spicy Level (0-3)
        <Input type="number" placeholder="Spicy Level (0-3)" value={spicyLevel} onChange={(e) => setSpicyLevel(Number(e.target.value))} />
        </label>
        <div>
          <strong>Allergens:</strong>
          <div>
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

        <Button onClick={handleSubmit} className="w-full">
          Add Menu Item
        </Button>
      </div>
    </Modal>
  );
};

export default AddMenuItemModal;
