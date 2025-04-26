// components/Menu/AddCustomizationGroupModal.tsx
import React, { useState } from 'react';
import { menuService } from '../../services/menuService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

interface AddCustomizationGroupModalProps {
  restaurantId: string;
  categoryId: string;
  itemId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddCustomizationGroupModal: React.FC<AddCustomizationGroupModalProps> = ({ restaurantId, categoryId, itemId, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [required, setRequired] = useState(false);
  const [multiSelect, setMultiSelect] = useState(false);

  const handleSubmit = async () => {
    const response = await menuService.addCustomizationGroup(restaurantId, categoryId, itemId, {
      name,
      required,
      multiSelect,
      options: []
    });

    if (response.success) {
      onSuccess();
      onClose();
    } else {
      alert(response.message || 'Failed to create customization group.');
    }
  };

  return (
    <Modal open onClose={onClose} title="Add Customization Group">
      <div className="space-y-4">
        <Input placeholder="Group Name" value={name} onChange={(e) => setName(e.target.value)} />
        
        <div>
          <label>
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            Required
          </label>
        </div>

        <div>
          <label>
            <input type="checkbox" checked={multiSelect} onChange={(e) => setMultiSelect(e.target.checked)} />
            Allow Multiple Selections
          </label>
        </div>

        <Button onClick={handleSubmit} className="w-full">
          Create Group
        </Button>
      </div>
    </Modal>
  );
};

export default AddCustomizationGroupModal;
