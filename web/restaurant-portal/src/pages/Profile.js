import React, { useState } from 'react';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'John Smith',
    role: 'Restaurant Manager',
    email: 'john.smith@example.com',
    phone: '+91 98765 43210',
    location: 'Mumbai, India',
    restaurantName: 'Spice Garden',
    type: 'Fine Dining',
    operatingHours: '11:00 AM - 11:00 PM',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Here you would typically make an API call to save the changes
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset any unsaved changes
    setIsEditing(false);
  };

  return (
    <div className="bg-white shadow-lg rounded-xl">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <div className="flex-shrink-0">
              <img
                className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover ring-4 ring-[#f29f05]/10"
                src={profileData.image}
                alt=""
              />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  className="text-2xl sm:text-3xl font-bold text-gray-900 border-b-2 border-[#f29f05] focus:outline-none focus:border-[#f29f05] bg-transparent w-full"
                />
              ) : (
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">{profileData.name}</h3>
              )}
              {isEditing ? (
                <input
                  type="text"
                  name="role"
                  value={profileData.role}
                  onChange={handleInputChange}
                  className="mt-2 text-lg sm:text-xl text-gray-600 border-b-2 border-gray-300 focus:outline-none focus:border-[#f29f05] bg-transparent w-full"
                />
              ) : (
                <p className="mt-2 text-lg sm:text-xl text-gray-600">{profileData.role}</p>
              )}
            </div>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border-2 border-[#f29f05] bg-white px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-medium text-[#f29f05] shadow-sm hover:bg-[#f29f05]/5 focus:outline-none focus:ring-2 focus:ring-[#f29f05] focus:ring-offset-2"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-8 sm:space-y-10">
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">Profile Information</h3>
            <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6">
                <div className="text-base sm:text-lg font-medium text-gray-600">Email</div>
                <div className="sm:col-span-2">
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      className="text-base sm:text-lg text-gray-900 w-full border-b-2 border-gray-300 focus:outline-none focus:border-[#f29f05] bg-transparent py-1"
                    />
                  ) : (
                    <div className="text-base sm:text-lg text-gray-900">{profileData.email}</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6">
                <div className="text-base sm:text-lg font-medium text-gray-600">Phone</div>
                <div className="sm:col-span-2">
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      className="text-base sm:text-lg text-gray-900 w-full border-b-2 border-gray-300 focus:outline-none focus:border-[#f29f05] bg-transparent py-1"
                    />
                  ) : (
                    <div className="text-base sm:text-lg text-gray-900">{profileData.phone}</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6">
                <div className="text-base sm:text-lg font-medium text-gray-600">Location</div>
                <div className="sm:col-span-2">
                  {isEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={profileData.location}
                      onChange={handleInputChange}
                      className="text-base sm:text-lg text-gray-900 w-full border-b-2 border-gray-300 focus:outline-none focus:border-[#f29f05] bg-transparent py-1"
                    />
                  ) : (
                    <div className="text-base sm:text-lg text-gray-900">{profileData.location}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">Restaurant Details</h3>
            <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6">
                <div className="text-base sm:text-lg font-medium text-gray-600">Restaurant Name</div>
                <div className="sm:col-span-2">
                  {isEditing ? (
                    <input
                      type="text"
                      name="restaurantName"
                      value={profileData.restaurantName}
                      onChange={handleInputChange}
                      className="text-base sm:text-lg text-gray-900 w-full border-b-2 border-gray-300 focus:outline-none focus:border-[#f29f05] bg-transparent py-1"
                    />
                  ) : (
                    <div className="text-base sm:text-lg text-gray-900">{profileData.restaurantName}</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6">
                <div className="text-base sm:text-lg font-medium text-gray-600">Type</div>
                <div className="sm:col-span-2">
                  {isEditing ? (
                    <input
                      type="text"
                      name="type"
                      value={profileData.type}
                      onChange={handleInputChange}
                      className="text-base sm:text-lg text-gray-900 w-full border-b-2 border-gray-300 focus:outline-none focus:border-[#f29f05] bg-transparent py-1"
                    />
                  ) : (
                    <div className="text-base sm:text-lg text-gray-900">{profileData.type}</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6">
                <div className="text-base sm:text-lg font-medium text-gray-600">Operating Hours</div>
                <div className="sm:col-span-2">
                  {isEditing ? (
                    <input
                      type="text"
                      name="operatingHours"
                      value={profileData.operatingHours}
                      onChange={handleInputChange}
                      className="text-base sm:text-lg text-gray-900 w-full border-b-2 border-gray-300 focus:outline-none focus:border-[#f29f05] bg-transparent py-1"
                    />
                  ) : (
                    <div className="text-base sm:text-lg text-gray-900">{profileData.operatingHours}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full sm:w-auto rounded-lg border-2 border-gray-300 bg-white px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#f29f05] focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="w-full sm:w-auto rounded-lg border-2 border-transparent bg-[#f29f05] px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-medium text-white shadow-sm hover:bg-[#f29f05]/90 focus:outline-none focus:ring-2 focus:ring-[#f29f05] focus:ring-offset-2"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 