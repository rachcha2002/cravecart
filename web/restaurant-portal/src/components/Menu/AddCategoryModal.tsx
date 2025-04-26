// components/Menu/AddCategoryModal.tsx
import React, { useState } from 'react';
import { menuService } from '../../services/menuService';
import { Button } from '../ui/Button'; 
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

interface AddCategoryModalProps {
  restaurantId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ restaurantId, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [allDay, setAllDay] = useState<boolean>(true);
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');

  const handleSubmit = async () => {
    const categoryData = {
      name,
      description,
      //image,
      sortOrder,
      availabilityTimes: allDay 
        ? { allDay: true }
        : { allDay: false, specificHours: { from: fromTime, to: toTime } }
    };

    const response = await menuService.addCategory(restaurantId, categoryData);
    if (response.success) {
      onSuccess();
      onClose();
    } else {
      alert(response.message);
    }
  };

  return (
    <Modal open onClose={onClose} title="Add New Category">
      <div className="max-h-[75vh] overflow-y-auto space-y-2 p-2">
        <label>Category Name</label>
        <Input placeholder="Category Name" value={name} onChange={(e) => setName(e.target.value)} />
        <label>Category Description</label>
        <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <label>Category Showing Order</label>
        <Input type="number" placeholder="Sort Order" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />

        <div>
          <label>
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            Available All Day
          </label>
        </div>

        {!allDay && (
          <div>
            <Input type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} />
            <Input type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} />
          </div>
        )}

        <Button onClick={handleSubmit}>
          Create Category
        </Button>
      </div>
    </Modal>
  );
};

export default AddCategoryModal;
