import React, { useState, useEffect, ChangeEvent, JSX } from 'react';
import axios from 'axios';
import { fetchRestaurants } from '../services/restaurantService';

import { 
  User, 
  PaginationInfo, 
  RestaurantFilters, 
  ApiResponse, 
  RestaurantImage 
} from '../types/restaurant';

interface RestaurantListProps {
  initialFilters?: RestaurantFilters;
  initialPage?: number;
  initialLimit?: number;
}

const RestaurantList: React.FC<RestaurantListProps> = ({
  initialFilters = {
    status: 'active',
    isVerified: true
  },
  initialPage = 1,
  initialLimit = 10
}) => {
  const [restaurants, setRestaurants] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: initialPage,
    limit: initialLimit,
    pages: 0
  });
  const [filters, setFilters] = useState<RestaurantFilters>(initialFilters);

  useEffect(() => {
    fetchRestaurantsData();
  }, [pagination.page, pagination.limit, filters]);

  const fetchRestaurantsData = async (): Promise<void> => {
    try {
      setLoading(true);
      const { page, limit } = pagination;
      const { status, isVerified } = filters;
  
      // Get token from localStorage
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      console.log("Token being used:", token);
      const data = await fetchRestaurants(status, isVerified, page, limit);
      setRestaurants(data.users);
      setPagination(data.pagination);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch restaurants');
      setLoading(false);
      console.error('Error fetching restaurants:', err);
    }
  };

  const handlePageChange = (newPage: number): void => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFilters({
      ...filters,
      [name]: type === 'checkbox' ? checked : value
    });
    // Reset to page 1 when filters change
    setPagination({ ...pagination, page: 1 });
  };

  const getPrimaryImage = (images?: RestaurantImage[]): RestaurantImage | undefined => {
    return images?.find(img => img.isPrimary);
  };

  const renderPagination = (): JSX.Element => {
    const pages: JSX.Element[] = [];
    for (let i = 1; i <= pagination.pages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`w-10 h-10 rounded-md ${
            pagination.page === i
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }
    return (
      <div className="flex justify-center space-x-2 mt-6">
        <button 
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="px-4 py-2 rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {pages}
        <button 
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.pages}
          className="px-4 py-2 rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="text-center text-red-500 py-10">{error}</div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Restaurants</h1>
      
      <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              name="status" 
              value={filters.status || ''} 
              onChange={handleFilterChange}
              className="rounded-md border-gray-300 shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="">All</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                name="isVerified" 
                checked={!!filters.isVerified} 
                onChange={handleFilterChange} 
                className="rounded text-blue-500 focus:ring-blue-500 h-4 w-4"
              /> 
              <span className="ml-2 text-sm text-gray-700">Verified Only</span>
            </label>
          </div>
        </div>
      </div>

      {restaurants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map(restaurant => (
            <div key={restaurant._id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="h-48 relative">
                {restaurant.restaurantInfo && restaurant.restaurantInfo.images && 
                getPrimaryImage(restaurant.restaurantInfo.images) ? (
                  <img 
                    src={getPrimaryImage(restaurant.restaurantInfo.images)?.url} 
                    alt={restaurant.restaurantInfo.restaurantName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                    No Image Available
                  </div>
                )}
                {restaurant.isVerified && (
                  <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                    ✓ Verified
                  </span>
                )}
              </div>
              
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {restaurant.restaurantInfo?.restaurantName || restaurant.name}
                </h2>
                
                {restaurant.restaurantInfo?.cuisine && restaurant.restaurantInfo.cuisine.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {restaurant.restaurantInfo.cuisine.map((type, index) => (
                      <span key={index} className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-xs">
                        {type}
                      </span>
                    ))}
                  </div>
                )}
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {restaurant.restaurantInfo?.description || "No description available"}
                </p>
                
                {restaurant.restaurantInfo?.businessHours && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Hours:</span> {restaurant.restaurantInfo.businessHours.open} - {restaurant.restaurantInfo.businessHours.close}
                  </p>
                )}
                
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Address:</span> {restaurant.address || "No address provided"}
                </p>
                
                <div className="text-sm text-gray-600">
                  <p className="mb-1"><span className="font-medium">Contact:</span> {restaurant.phoneNumber}</p>
                  <p><span className="font-medium">Email:</span> {restaurant.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No restaurants found with the selected filters
        </div>
      )}
      
      {pagination.pages > 1 && renderPagination()}
      
      <div className="text-center text-gray-500 text-sm mt-4">
        Showing {restaurants.length} of {pagination.total} restaurants
      </div>
    </div>
  );
};

export default RestaurantList;