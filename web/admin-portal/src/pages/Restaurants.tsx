// RestaurantPage.tsx

import React, { useState, useEffect } from 'react';
import { restaurantService } from '../services/restaurantService';
import { Restaurant, RestaurantsResponse, ErrorResponse } from '../types/restaurant.types';

const Restaurants: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const response = await restaurantService.getAllRestaurants();
        setRestaurants(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load restaurants. Please try again later.');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurants();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }
  
  if (restaurants.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-10">
          <h2 className="text-2xl font-semibold mb-4">No Restaurants Found</h2>
          <p className="text-gray-600">We couldn't find any restaurants at the moment. Please check back later.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-4">
      <h1 className="text-3xl font-bold mb-6">Restaurants</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant._id} restaurant={restaurant} />
        ))}
      </div>
    </div>
  );
};

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  // Default image if profile picture is not available
  const imageUrl = restaurant.profilePicture || 
    (restaurant.restaurantInfo?.images?.find(img => img.isPrimary)?.url);
  
  // Get first cuisine type or default text
  const cuisineType = restaurant.restaurantInfo?.cuisine?.length > 0 
    ? restaurant.restaurantInfo.cuisine[0] 
    : 'Various Cuisines';
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={restaurant.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/default-restaurant.jpg';
          }}
        />
      </div>
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">{restaurant.restaurantInfo?.restaurantName || restaurant.name}</h2>
        <p className="text-gray-600 text-sm mb-3">
          {restaurant.restaurantInfo?.description?.slice(0, 100) || 'No description available'}
          {restaurant.restaurantInfo?.description?.length > 100 ? '...' : ''}
        </p>
        <div className="flex justify-between items-center">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {cuisineType}
          </span>
          <div className="text-sm text-gray-500">
            {restaurant.restaurantInfo?.businessHours?.open} - {restaurant.restaurantInfo?.businessHours?.close}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Restaurants;