// components/Menu/AddCustomizationOptionModal.tsx
import React, { useState } from 'react';
import { menuService } from '../../services/menuService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

interface AddCustomizationOptionModalProps {
  restaurantId: string;
  categoryId: string;
  itemId: string;
  groupId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddCustomizationOptionModal: React.FC<AddCustomizationOptionModalProps> = ({ restaurantId, categoryId, itemId, groupId, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);

  const handleSubmit = async () => {
    const response = await menuService.addCustomizationOption(restaurantId, categoryId, itemId, groupId, {
      name,
      price
    });

    if (response.success) {
      onSuccess();
      onClose();
    } else {
      alert(response.message || 'Failed to create option.');
    }
  };

  return (
    <Modal open onClose={onClose} title="Add Customization Option">
      <div className="space-y-4">
        <Input placeholder="Option Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        <Button onClick={handleSubmit} className="w-full">
          Create Option
        </Button>
      </div>
    </Modal>
  );
};

export default AddCustomizationOptionModal;
