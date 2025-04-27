import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface MapFallbackProps {
  height: string;
  message?: string;
}

const MapFallback: React.FC<MapFallbackProps> = ({ 
  height = '300px',
  message = 'Map could not be loaded. Please try again later.'
}) => {
  return (
    <div 
      className="bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center"
      style={{ height, width: '100%', borderRadius: '0.5rem' }}
    >
      <MapPinIcon className="h-10 w-10 text-gray-400 mb-3" />
      <p className="text-gray-500 dark:text-gray-400 text-center px-4">
        {message}
      </p>
    </div>
  );
};

export default MapFallback;
