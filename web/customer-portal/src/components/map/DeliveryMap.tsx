import React, { useEffect, useRef } from 'react';

interface DeliveryMapProps {
  riderLocation: { latitude: number; longitude: number } | null;
  deliveryLocation: { latitude: number; longitude: number };
  height?: string;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({ 
  riderLocation, 
  deliveryLocation,
  height = '400px' 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const routingControlRef = useRef<any>(null);
  const deliveryMarkerRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const leafletLoadedRef = useRef(false);
  
  // Load Leaflet dynamically on client-side only
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !leafletLoadedRef.current) {
        try {
          // Import Leaflet
          const L = await import('leaflet');
          
          // Store Leaflet in window
          window.L = L;
          
          // Fix icon paths without using _getIconUrl
          window.L.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.9.4/dist/images/';
          
          // Create custom default icon options
          const defaultIconOptions = {
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          };
          
          // Set as default icon
          window.L.Marker.prototype.options.icon = window.L.icon(defaultIconOptions);
          
          // Import routing machine explicitly
          try {
            await import('leaflet-routing-machine');
            console.log('✅ Leaflet routing machine loaded successfully');
          } catch (routingError) {
            console.error('❌ Error loading routing machine:', routingError);
          }
          
          leafletLoadedRef.current = true;
          console.log('✅ Leaflet loaded successfully');
          
          // Initialize map
          initializeMap();
        } catch (error) {
          console.error('❌ Failed to load Leaflet:', error);
        }
      }
    };

    loadLeaflet();
    
    return () => {
      // Cleanup
      if (mapInstanceRef.current) {
        console.log('🧹 Cleaning up map instance');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Initialize map when component mounts and Leaflet is loaded
  const initializeMap = () => {
    if (!mapRef.current || !window.L || mapInstanceRef.current) return;
    
    const L = window.L;
    
    try {
      console.log('🗺️ Creating map with delivery location:', deliveryLocation);
      
      // Create map instance
      const map = L.map(mapRef.current).setView(
        [deliveryLocation.latitude, deliveryLocation.longitude],
        15
      );

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Store map instance
      mapInstanceRef.current = map;

      // Create delivery location marker
      const deliveryIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        shadowSize: [41, 41],
        shadowAnchor: [12, 41]
      });
      
      // Add marker for delivery location
      deliveryMarkerRef.current = L.marker([deliveryLocation.latitude, deliveryLocation.longitude], { 
        icon: deliveryIcon 
      })
      .addTo(map)
      .bindPopup('Delivery Location')
      .openPopup();

      // If rider location is already available, update it
      if (riderLocation) {
        console.log('🚚 Initial rider location available:', riderLocation);
        updateRiderLocation(riderLocation);
      } else {
        console.log('⚠️ No rider location available yet');
      }
      
      console.log('✅ Map initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing map:', error);
    }
  };

  // Update map when delivery location changes
  useEffect(() => {
    if (!window.L || !mapInstanceRef.current) return;
    
    const L = window.L;
    
    try {
      console.log('📍 Updating delivery location on map:', deliveryLocation);
      
      // Update delivery marker position
      if (deliveryMarkerRef.current) {
        mapInstanceRef.current.removeLayer(deliveryMarkerRef.current);
      }

      const deliveryIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        shadowSize: [41, 41],
        shadowAnchor: [12, 41]
      });
      
      deliveryMarkerRef.current = L.marker([deliveryLocation.latitude, deliveryLocation.longitude], { 
        icon: deliveryIcon 
      })
      .addTo(mapInstanceRef.current)
      .bindPopup('Delivery Location')
      .openPopup();

      // Update routing if rider location exists
      if (riderLocation) {
        updateRiderLocation(riderLocation);
      } else {
        // If no rider location, just center on delivery location
        mapInstanceRef.current.setView([deliveryLocation.latitude, deliveryLocation.longitude], 15);
      }
    } catch (error) {
      console.error('❌ Error updating delivery location:', error);
    }
  }, [deliveryLocation]);

  // Update rider location and routing
  const updateRiderLocation = (location: { latitude: number; longitude: number }) => {
    if (!window.L || !mapInstanceRef.current) return;
    
    const L = window.L;
    
    try {
      const map = mapInstanceRef.current;
      
      console.log('🚚 Updating rider location on map:', location);
      
      // Create or update rider marker
      const riderIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        shadowSize: [41, 41],
        shadowAnchor: [12, 41]
      });
      
      // Remove previous routing if it exists
      if (routingControlRef.current) {
        routingControlRef.current.remove();
        routingControlRef.current = null;
      }

      // Remove previous rider marker if exists
      if (riderMarkerRef.current) {
        map.removeLayer(riderMarkerRef.current);
      }

      // Create new rider marker
      riderMarkerRef.current = L.marker([location.latitude, location.longitude], {
        icon: riderIcon
      }).addTo(map)
      .bindPopup('Driver Location')
      .openPopup();

      // Create routing from rider to delivery location
      if (L.Routing) {
        try {
          console.log('🧭 Creating route between rider and delivery location');
          
          routingControlRef.current = L.Routing.control({
            waypoints: [
              L.latLng(location.latitude, location.longitude),
              L.latLng(deliveryLocation.latitude, deliveryLocation.longitude)
            ],
            routeWhileDragging: false,
            showAlternatives: false,
            fitSelectedRoutes: true,
            lineOptions: {
              styles: [{ color: '#6366F1', opacity: 0.7, weight: 6 }],
              extendToWaypoints: true,
              missingRouteTolerance: 0
            },
            createMarker: function() { return null; } // Don't create additional markers
          }).addTo(map);
          
          console.log('✅ Route created successfully');
        } catch (routingError) {
          console.error("❌ Error creating routing:", routingError);
          
          // Fallback: just add a simple line if routing fails
          try {
            console.log('⚠️ Using fallback simple line route');
            const line = L.polyline([
              [location.latitude, location.longitude],
              [deliveryLocation.latitude, deliveryLocation.longitude]
            ], {
              color: '#6366F1',
              weight: 4,
              opacity: 0.7,
              dashArray: '10, 10',
            }).addTo(map);
            
            routingControlRef.current = { 
              remove: () => map.removeLayer(line) 
            };
          } catch (lineError) {
            console.error("❌ Error creating fallback line:", lineError);
          }
        }
      } else {
        console.warn('⚠️ L.Routing not available - adding simple line instead');
        
        // Simple line fallback if routing isn't available
        const line = L.polyline([
          [location.latitude, location.longitude],
          [deliveryLocation.latitude, deliveryLocation.longitude]
        ], {
          color: '#6366F1',
          weight: 4,
          opacity: 0.7,
          dashArray: '10, 10',
        }).addTo(map);
        
        routingControlRef.current = { 
          remove: () => map.removeLayer(line) 
        };
      }

      // Fit map bounds to include both points with padding
      const bounds = L.latLngBounds(
        L.latLng(location.latitude, location.longitude),
        L.latLng(deliveryLocation.latitude, deliveryLocation.longitude)
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } catch (error) {
      console.error('❌ Error updating rider location:', error);
    }
  };

  // Update when rider location changes
  useEffect(() => {
    if (!window.L || !mapInstanceRef.current) return;
    
    if (riderLocation) {
      console.log('🔄 Rider location received, updating map:', riderLocation);
      updateRiderLocation(riderLocation);
    } else {
      console.log('⚠️ No rider location data available yet');
    }
  }, [riderLocation]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%', borderRadius: '0.5rem' }}
      className="bg-gray-100 dark:bg-gray-700"
      data-testid="delivery-map"
    />
  );
};

// Add global type definitions
declare global {
  interface Window {
    L: any;
  }
}

export default DeliveryMap;
