import React, { useState } from 'react';
import { CustomizationGroup } from '../../types/menu.types';
import { Button } from '../ui/Button';
import AddCustomizationGroupModal from './AddCustomizationGroupModal';
import AddCustomizationOptionModal from './AddCustomizationOptionModal';

interface CustomizationGroupListProps {
  restaurantId: string;
  categoryId: string;
  itemId: string;
  groups: CustomizationGroup[];
  onRefresh: () => void;
}

const CustomizationGroupList: React.FC<CustomizationGroupListProps> = ({ restaurantId, categoryId, itemId, groups, onRefresh }) => {
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [addingOptionToGroupId, setAddingOptionToGroupId] = useState<string | null>(null);

  return (
    <div className="mt-4">
      <h3 className="text-xl font-bold mb-2">Customization Groups</h3>

      {groups.map(group => (
        <div key={group._id} className="border p-2 mb-4">
          <h4 className="text-lg">{group.name}</h4>
          <p>Required: {group.required ? 'Yes' : 'No'} | Multi Select: {group.multiSelect ? 'Yes' : 'No'}</p>

          <div className="mt-2">
            <strong>Options:</strong>
            {group.options.length === 0 ? (
              <p className="text-gray-500">No options yet</p>
            ) : (
              <ul className="list-disc ml-6">
                {group.options.map(option => (
                  <li key={option._id}>
                    {option.name} - Rs.{option.price}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button onClick={() => setAddingOptionToGroupId(group._id!)}>Add Option</Button>

          {addingOptionToGroupId === group._id && (
            <AddCustomizationOptionModal
              restaurantId={restaurantId}
              categoryId={categoryId}
              itemId={itemId}
              groupId={group._id!}
              onClose={() => setAddingOptionToGroupId(null)}
              onSuccess={onRefresh}
            />
          )}
        </div>
      ))}

      <Button onClick={() => setShowAddGroup(true)}>Add Customization Group</Button>

      {showAddGroup && (
        <AddCustomizationGroupModal
          restaurantId={restaurantId}
          categoryId={categoryId}
          itemId={itemId}
          onClose={() => setShowAddGroup(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
};

export default CustomizationGroupList;
