import React, { useState, useEffect, useRef } from "react";
import {
  MapPinIcon,
  MapIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import MapPreview from "./MapPreview";

// Define window with Google Maps objects
declare global {
  interface Window {
    google: any;
  }
}

interface LocationSelectorProps {
  initialAddress?: string;
  onAddressChange: (address: string) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  initialAddress = "",
  onAddressChange,
  onLocationSelect,
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [attemptedLocationAccess, setAttemptedLocationAccess] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [geocoder, setGeocoder] = useState<any>(null);

  // API key
  const GOOGLE_MAPS_API_KEY = "AIzaSyCgPYZ5K8EXB0Ip5jGMASp-mAXOVzw7BTk";

  // Load Google Maps script if not already loaded
  useEffect(() => {
    // If Google Maps API is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initGeocoder();
      return;
    }

    // Otherwise, load it
    const googleMapScript = document.createElement("script");
    googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    googleMapScript.async = true;
    googleMapScript.defer = true;

    // Add listener for when the script loads
    googleMapScript.addEventListener("load", initGeocoder);

    // Add error handling
    googleMapScript.addEventListener("error", () => {
      setError(
        "Failed to load Google Maps. Please check your internet connection and try again."
      );
    });

    // Add the script to the document
    document.head.appendChild(googleMapScript);

    // Cleanup
    return () => {
      googleMapScript.removeEventListener("load", initGeocoder);
      if (document.head.contains(googleMapScript)) {
        document.head.removeChild(googleMapScript);
      }
    };
  }, []);

  // Initialize geocoder once Google Maps is loaded
  const initGeocoder = () => {
    if (!window.google || !window.google.maps) {
      console.error("Google Maps not loaded correctly");
      setError("Google Maps failed to load. Please refresh the page.");
      return;
    }

    try {
      setGeocoder(new window.google.maps.Geocoder());
    } catch (err) {
      console.error("Error initializing Google Maps Geocoder:", err);
      setError("There was a problem initializing the location service.");
    }
  };

  // Search for places using the Geocoding API
  const searchPlaces = (query: string) => {
    if (!query || query.length < 3) {
      setError("Please enter at least 3 characters to search");
      return;
    }

    setIsSearching(true);
    setError(null);

    // Using fetch for geocoding search to avoid PlacesService issues
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query
      )}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
    )
      .then((response) => response.json())
      .then((data) => {
        setIsSearching(false);

        if (data.status === "OK" && data.results && data.results.length > 0) {
          // Format results similar to Places API
          const formattedResults = data.results.map((result: any) => ({
            place_id: result.place_id,
            name: result.formatted_address.split(",")[0], // First part of address as name
            formatted_address: result.formatted_address,
            geometry: result.geometry,
          }));

          setSearchResults(formattedResults);
        } else if (data.status === "ZERO_RESULTS") {
          setSearchResults([]);
          setError("No locations found. Try a different search.");
        } else {
          console.error(
            "Geocoding search error:",
            data.status,
            data.error_message
          );
          setSearchResults([]);
          setError(`Error searching for location: ${data.status}`);
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setIsSearching(false);
        setSearchResults([]);
        setError("Network error. Please check your connection and try again.");
      });
  };

  // Get details for a place and select it
  const selectPlace = (result: any) => {
    try {
      setLoading(true);
      setSearchResults([]);

      const location = result.geometry.location;
      const lat = location.lat ?? location.lat();
      const lng = location.lng ?? location.lng();
      const formattedAddress = result.formatted_address;

      setAddress(formattedAddress);
      setCoordinates({ lat, lng });

      // Update the search input
      if (searchInputRef.current) {
        searchInputRef.current.value = formattedAddress;
      }

      // Notify parent components
      onAddressChange(formattedAddress);
      if (onLocationSelect) {
        onLocationSelect(lat, lng);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error selecting place:", err);
      setError("Failed to select this location. Please try again.");
      setLoading(false);
    }
  };

  // Automatically try to get the user's location on component mount
  useEffect(() => {
    if (!attemptedLocationAccess && initialAddress === "") {
      getCurrentLocation();
      setAttemptedLocationAccess(true);
    }
  }, [initialAddress, attemptedLocationAccess]);

  // Function to get current location
  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);
    setShowMap(true); // Show map immediately so user can see it's working

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setCoordinates({ lat, lng });

          // Notify parent component of the location change if callback exists
          if (onLocationSelect) {
            onLocationSelect(lat, lng);
          }

          // Reverse geocode the coordinates to get the address
          try {
            if (geocoder) {
              geocoder.geocode(
                { location: { lat, lng } },
                (results: any, status: any) => {
                  if (status === "OK" && results && results[0]) {
                    const formattedAddress = results[0].formatted_address;
                    setAddress(formattedAddress);

                    // Update the search input value
                    if (searchInputRef.current) {
                      searchInputRef.current.value = formattedAddress;
                    }

                    // Notify parent component of the address change
                    onAddressChange(formattedAddress);
                  } else {
                    setError("Could not determine address from your location");
                  }
                  setLoading(false);
                }
              );
            } else {
              // Fallback to the fetch API if geocoder is not available
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
              );
              const data = await response.json();

              if (
                data.status === "OK" &&
                data.results &&
                data.results.length > 0
              ) {
                const formattedAddress = data.results[0].formatted_address;
                setAddress(formattedAddress);

                // Update the search input value
                if (searchInputRef.current) {
                  searchInputRef.current.value = formattedAddress;
                }

                // Notify parent component of the address change
                onAddressChange(formattedAddress);
              } else {
                setError("Could not determine address from your location");
              }
              setLoading(false);
            }
          } catch (geocodeError) {
            console.error("Error reverse geocoding:", geocodeError);
            setLoading(false);
            setError("Failed to get address from your location");
          }
        } catch (error) {
          setError("Failed to get address from coordinates");
          setLoading(false);
        }
      },
      (error) => {
        let errorMessage = "Error getting location";

        // Provide more helpful error messages
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please enable location services in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Location information is unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
          default:
            errorMessage = `Error getting location: ${error.message}`;
        }

        setError(errorMessage);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Toggle map display
  const toggleMap = () => {
    setShowMap(!showMap);
  };

  // Manual address input handler
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);

    // Clear search results if input is empty
    if (!value) {
      setSearchResults([]);
      return;
    }
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address) {
      searchPlaces(address);
    }
  };

  // Handle location selection from map
  const handleLocationSelect = (
    lat: number,
    lng: number,
    formattedAddress: string
  ) => {
    console.log("Location selected:", lat, lng, formattedAddress);
    setCoordinates({ lat, lng });
    setAddress(formattedAddress);
    setSearchResults([]);

    // Update the search input
    if (searchInputRef.current) {
      searchInputRef.current.value = formattedAddress;
    }

    // Force update the parent component immediately with the new address
    onAddressChange(formattedAddress);

    // Notify parent component of the location coordinates if callback exists
    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-3">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center space-x-2"
        >
          <MapPinIcon className="h-5 w-5 md:h-6 md:w-6 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for a location..."
              className="w-full p-2 md:p-3 text-base md:text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              defaultValue={address}
              onChange={handleAddressChange}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              disabled={isSearching}
            >
              {isSearching ? (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <MagnifyingGlassIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 bg-white dark:bg-gray-800 mt-1 w-full max-w-md rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
            <ul className="py-1">
              {searchResults.map((result, index) => (
                <li
                  key={result.place_id || index}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => selectPlace(result)}
                >
                  <p className="font-medium text-gray-800 dark:text-white">
                    {result.name}
                  </p>
                  {result.formatted_address && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {result.formatted_address}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            type="button"
            onClick={getCurrentLocation}
            className="w-full flex items-center justify-center px-3 py-2 md:py-3 text-sm md:text-base font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 md:h-5 md:w-5 text-blue-700 dark:text-blue-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Getting Location...
              </>
            ) : (
              "Use Current Location"
            )}
          </button>

          <button
            type="button"
            onClick={toggleMap}
            className="w-full flex items-center justify-center px-3 py-2 md:py-3 text-sm md:text-base font-medium bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <MapIcon className="h-4 w-4 md:h-5 md:w-5 mr-2" />
            {showMap ? "Hide Map" : "Select on Map"}
          </button>
        </div>

        {error && (
          <p className="text-sm md:text-base text-red-600 dark:text-red-400 font-medium">
            {error}
          </p>
        )}
      </div>

      {showMap && (
        <div className="mt-4 border rounded-md overflow-hidden dark:border-gray-700">
          <div className="h-60 sm:h-80 md:h-96">
            {" "}
            {/* Taller map for better visualization */}
            <MapPreview
              address={address}
              onLocationSelect={handleLocationSelect}
            />
          </div>
          <div className="p-2 md:p-3 bg-gray-50 dark:bg-gray-700 text-xs md:text-sm text-gray-600 dark:text-gray-300">
            <span className="hidden sm:inline">
              Click on the map to select a location or use the search box to
              find an address
            </span>
            <span className="sm:hidden">
              Tap on the map to select a location
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
