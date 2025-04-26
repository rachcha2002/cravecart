// components/Menu/ManageCustomizationsModal.tsx
import React from 'react';
import { Modal } from '../ui/Modal';
import { MenuItem } from '../../types/menu.types';
import CustomizationGroupList from './CustomizationGroupList';

interface ManageCustomizationsModalProps {
  restaurantId: string;
  categoryId: string;
  item: MenuItem;
  onClose: () => void;
  onRefresh: () => void;
}

const ManageCustomizationsModal: React.FC<ManageCustomizationsModalProps> = ({ restaurantId, categoryId, item, onClose, onRefresh }) => {
  return (
    <Modal open onClose={onClose} title={`Manage Customizations for ${item.name}`}>
      <CustomizationGroupList
        restaurantId={restaurantId}
        categoryId={categoryId}
        itemId={item._id!}
        groups={item.customizationGroups}
        onRefresh={onRefresh}
      />
    </Modal>
  );
};

export default ManageCustomizationsModal;
