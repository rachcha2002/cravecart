import React, { useRef, useEffect, useState } from 'react';

interface MapPreviewProps {
  address?: string;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

// Define window with optional initMap property and string indexing
declare global {
  interface Window {
    google: any;
    initMap?: () => void;
    [key: string]: any;  // This allows string indexing on window
  }
}

// Use the provided Google Maps API key
const GOOGLE_MAPS_API_KEY = "AIzaSyCgPYZ5K8EXB0Ip5jGMASp-mAXOVzw7BTk";

const MapPreview: React.FC<MapPreviewProps> = ({ address, onLocationSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [geocoder, setGeocoder] = useState<any>(null);
  const [searchBox, setSearchBox] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocationFound, setUserLocationFound] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [currentLocationSelected, setCurrentLocationSelected] = useState(false);
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);

  // Check if viewport is mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Try to get user location before loading the map
  useEffect(() => {
    if (navigator.geolocation && !userLocationFound) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocationFound(true);
        },
        (error) => {
          console.log("Geolocation error:", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [userLocationFound]);

  // Check if Google Maps is already loaded
  useEffect(() => {
    if (window.google && window.google.maps) {
      setGoogleScriptLoaded(true);
      setInitializing(false);
      return;
    }

    // If script not already loaded by LocationSelector, load it here
    // This creates a unique callback name to avoid conflicts
    const callbackName: string = 'initMapCallback_' + Math.random().toString(36).substring(2, 9);
    window[callbackName] = () => {
      setGoogleScriptLoaded(true);
      setInitializing(false);
    };

    // Check if script is already in the document
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com/maps/api"]`);
    if (existingScript) {
      // Script exists but may still be loading
      if (window.google && window.google.maps) {
        window[callbackName]();
      } else {
        // Wait for the existing script to load
        existingScript.addEventListener('load', window[callbackName]);
      }
      return;
    }

    // Load Google Maps script if not already loading
      const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      
      // Handle script load error
      script.onerror = () => {
        setError('Failed to load Google Maps. Please check your internet connection and try again.');
        setInitializing(false);
      };
      
      document.head.appendChild(script);
      
      return () => {
      // Clean up the callback
      if (window[callbackName]) {
        delete window[callbackName];
        }
      
      // Don't remove the script as it might be used by other components
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (googleScriptLoaded && mapRef.current && !map) {
      try {
        console.log("Initializing map...");
        
        // Default to central Sri Lanka if no user location
        let defaultCenter = { lat: 7.8731, lng: 80.7718 }; // Sri Lanka center
        let defaultZoom = 8;
        
        const newMap = new window.google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: defaultZoom,
          mapTypeControl: isMobile ? false : true,
          streetViewControl: false,
          fullscreenControl: !isMobile,
          zoomControl: !isMobile, // Hide zoom controls on mobile for more map space
          // Apply dark mode styles if user prefers dark mode
          styles: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 
            [
              { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
              {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
              },
              {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
              },
              {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#263c3f" }],
              },
              {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }],
              },
              {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#38414e" }],
              },
              {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#212a37" }],
              },
              {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca5b3" }],
              },
              {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#746855" }],
              },
              {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1f2835" }],
              },
              {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#f3d19c" }],
              },
              {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ color: "#2f3948" }],
              },
              {
                featureType: "transit.station",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
              },
              {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#17263c" }],
              },
              {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#515c6d" }],
              },
              {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#17263c" }],
              },
            ] 
            : []
        });
        
        const newMarker = new window.google.maps.Marker({
          map: newMap,
          draggable: true,
          position: newMap.getCenter(),
          animation: window.google.maps.Animation.DROP,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: new window.google.maps.Size(isMobile ? 32 : 40, isMobile ? 32 : 40),
            origin: new window.google.maps.Point(0, 0),
            anchor: new window.google.maps.Point(isMobile ? 16 : 20, isMobile ? 32 : 40)
          }
        });
        
        const newGeocoder = new window.google.maps.Geocoder();
        
        // Set up marker drag event
        newMarker.addListener('dragend', function() {
          const position = newMarker.getPosition();
          if (position) {
            const lat = position.lat();
            const lng = position.lng();
            updateLocationAndUI(lat, lng);
          }
        });

        // Set up map click event
        newMap.addListener('click', function(e: any) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          
          // Update marker position
          newMarker.setPosition(e.latLng);
          
          // Update location in UI and notify parent
          updateLocationAndUI(lat, lng);
        });
        
        // Define a more robust update function that ensures UI updates
        const updateLocationAndUI = (lat: number, lng: number) => {
          console.log("updateLocationAndUI called with", lat, lng);
          
          // Create a message to show marker movement is detected
          const messageDiv = document.createElement('div');
          messageDiv.textContent = 'Updating location...';
          messageDiv.style.position = 'absolute';
          messageDiv.style.top = '60px';
          messageDiv.style.left = '50%';
          messageDiv.style.transform = 'translateX(-50%)';
          messageDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
          messageDiv.style.color = 'white';
          messageDiv.style.padding = '8px 16px';
          messageDiv.style.borderRadius = '4px';
          messageDiv.style.zIndex = '9999';
          
          if (mapRef.current) {
            mapRef.current.appendChild(messageDiv);
            
            // Auto-remove after 2 seconds
            setTimeout(() => {
              if (mapRef.current && mapRef.current.contains(messageDiv)) {
                mapRef.current.removeChild(messageDiv);
              }
            }, 2000);
          }
          
          // Do the geocoding
          newGeocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
            if (status === 'OK' && results[0]) {
              const formattedAddress = results[0].formatted_address;
              
              // Update the search box
              if (searchBoxRef.current) {
                searchBoxRef.current.value = formattedAddress;
              }
              
              // Notify parent component
              onLocationSelect(lat, lng, formattedAddress);
            } else {
              console.error("Geocoding failed:", status);
              
              // If geocoding fails, still notify with coordinates but use a placeholder address
              onLocationSelect(lat, lng, `Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
            }
          });
        };
        
        // Initialize search box if available
        if (searchBoxRef.current) {
          const searchBoxInstance = new window.google.maps.places.SearchBox(searchBoxRef.current);
          
          // Listen for search box changes
          searchBoxInstance.addListener('places_changed', function() {
            const places = searchBoxInstance.getPlaces();
            
            if (places.length === 0) {
              return;
            }
            
            const place = places[0];
            
            if (!place.geometry || !place.geometry.location) {
              console.error("No geometry found for this place");
              return;
            }
            
            // Update map and marker
              newMap.setCenter(place.geometry.location);
            newMap.setZoom(15); // Zoom in when a place is selected
            newMarker.setPosition(place.geometry.location);
            
            // Get coordinates
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            // Notify parent
            onLocationSelect(lat, lng, place.formatted_address || '');
          });
          
          setSearchBox(searchBoxInstance);
        }
        
        // Set states
        setMap(newMap);
        setMarker(newMarker);
        setGeocoder(newGeocoder);
        
        // If we already have an address, try to center the map on it
        if (address) {
          geocodeAddress(address, newGeocoder, newMap, newMarker);
        }
        
        console.log("Map initialized successfully");
      } catch (err) {
        console.error("Error initializing map:", err);
        setError("There was a problem initializing the map. Please try refreshing the page.");
      }
    }
  }, [googleScriptLoaded, mapRef.current]);

  // Update map when address changes
  useEffect(() => {
    if (map && geocoder && marker && address && !isUpdatingAddress) {
      geocodeAddress(address, geocoder, map, marker);
    }
  }, [address, map, geocoder, marker]);

  // Geocode an address and update the map
  const geocodeAddress = (
    address: string, 
    geocoder: any, 
    map: any, 
    marker: any
  ) => {
    if (!address) return;
    
    setIsUpdatingAddress(true);
    
    geocoder.geocode({ address }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        
        map.setCenter(location);
        map.setZoom(15); // Zoom in to show the area clearly
        marker.setPosition(location);
        
        // Notify parent component (disabled to prevent feedback loop)
        // onLocationSelect(location.lat(), location.lng(), results[0].formatted_address);
      } else {
        console.error("Geocoding failed:", status);
      }
      
      setIsUpdatingAddress(false);
    });
  };

  // Helper function to reverse geocode
  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoder) return;
      
    geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const formattedAddress = results[0].formatted_address;
          
        // Update the search box if available
          if (searchBoxRef.current) {
            searchBoxRef.current.value = formattedAddress;
          }
          
        // Notify parent component
            onLocationSelect(lat, lng, formattedAddress);
      }
    });
  };

  // Display error message if initialization fails
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
        <div className="text-red-500 font-medium mb-2">Error: {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
          }

  // Display loading message while initializing
  if (initializing || !googleScriptLoaded) {
  return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-300">Loading map...</div>
        </div>
        </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* Map container */}
      <div ref={mapRef} className="h-full w-full"></div>
      
      {/* Optional search box (hidden by default, can be enabled) */}
      <div className="hidden">
            <input
              ref={searchBoxRef}
              type="text"
          placeholder="Search for a location"
          className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
    </div>
  );
};

export default MapPreview; 