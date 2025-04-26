import React, { useState } from "react";
import { User } from "../pages/AdminUsers";

interface RestaurantDetailsProps {
  restaurant: User;
  onClose: () => void;
  onVerify: (userId: string) => void;
}

interface RestaurantImage {
  url: string;
  description: string;
  isPrimary?: boolean;
  _id: string;
  uploadedAt: string;
}

const RestaurantDetails: React.FC<RestaurantDetailsProps> = ({
  restaurant,
  onClose,
  onVerify,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(restaurant.isVerified);

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      await onVerify(restaurant._id);
      setIsVerified(true);
      // Close the modal after successful verification
      onClose();
    } catch (error) {
      console.error("Failed to verify restaurant:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative p-8 bg-white w-full max-w-4xl m-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {restaurant.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Basic Information
              </h3>
              <div className="mt-2 space-y-2">
                <p>
                  <span className="font-medium">Email:</span> {restaurant.email}
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  {restaurant.phoneNumber}
                </p>
                <p>
                  <span className="font-medium">Address:</span>{" "}
                  {restaurant.address}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      restaurant.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {restaurant.status}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Verification Status:</span>{" "}
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      isVerified
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {isVerified ? "Verified" : "Unverified"}
                  </span>
                </p>
              </div>
            </div>

            {/* Restaurant Information */}
            {restaurant.restaurantInfo && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Restaurant Information
                </h3>
                <div className="mt-2 space-y-2">
                  <p>
                    <span className="font-medium">Restaurant Name:</span>{" "}
                    {restaurant.restaurantInfo.restaurantName}
                  </p>
                  <p>
                    <span className="font-medium">Cuisine:</span>{" "}
                    {restaurant.restaurantInfo.cuisine.join(", ")}
                  </p>
                  <p>
                    <span className="font-medium">Description:</span>{" "}
                    {restaurant.restaurantInfo.description}
                  </p>
                  <p>
                    <span className="font-medium">Business Hours:</span>{" "}
                    {restaurant.restaurantInfo.businessHours.open} -{" "}
                    {restaurant.restaurantInfo.businessHours.close}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Restaurant Images */}
          {restaurant.restaurantInfo?.images &&
            restaurant.restaurantInfo.images.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Restaurant Images
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {restaurant.restaurantInfo.images.map(
                    (image: RestaurantImage, index: number) => (
                      <div key={index} className="relative">
                        <img
                          src={image.url}
                          alt={`Restaurant ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        {image.isPrimary && (
                          <span className="absolute top-2 right-2 bg-[#f29f05] text-white text-xs px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          {!isVerified && (
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isVerifying
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#f29f05] hover:bg-[#d88f04]"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f29f05]`}
            >
              {isVerifying ? "Verifying..." : "Verify Restaurant"}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f29f05]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;
