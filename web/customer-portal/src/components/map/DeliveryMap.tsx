import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { toast } from 'react-hot-toast';

// Add missing type declarations for leaflet-routing-machine
declare module 'leaflet' {
  namespace Routing {
    function control(options: any): any;
  }
}

interface DeliveryMapProps {
  riderLocation: {latitude: number, longitude: number} | null;
  deliveryLocation: {latitude: number, longitude: number};
  restaurantLocation?: {latitude: number, longitude: number};
  height: string;
  showDirections?: boolean;
  directionsDestination?: 'restaurant' | 'customer';
}

// Add interfaces for the event parameters
interface RoutingErrorEvent {
  error: Error;
  target: any;
}

interface RoutesFoundEvent {
  routes: Array<any>;
  waypoints: Array<any>;
  target: any;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  riderLocation,
  deliveryLocation,
  restaurantLocation,
  height = '400px',
  showDirections = true, // Default to showing directions
  directionsDestination = 'customer'
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<any>(null);
  const mapInitializedRef = useRef<boolean>(false);
  const mapIdRef = useRef<string>(`map-${Math.random().toString(36).substr(2, 9)}`);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const routeLayersRef = useRef<{[key: string]: L.Layer}>({});
  
  // Add a state to track if the map is fully loaded and ready for routing
  const [mapReady, setMapReady] = useState<boolean>(false);
  
  // Initialize the map once
  useEffect(() => {
    if (!mapRef.current && !mapInitializedRef.current) {
      mapInitializedRef.current = true;
      
      try {
        // Initialize map with a bit of delay to ensure the container is rendered
        setTimeout(() => {
          // Safely initialize the map
          try {
            console.log(`Creating map with ID: ${mapIdRef.current}`);
            const map = L.map(mapIdRef.current, {
              renderer: L.canvas(), // Use canvas renderer for better performance
              preferCanvas: true
            }).setView([deliveryLocation.latitude, deliveryLocation.longitude], 15);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            // Set mapReady after a timeout to ensure map is fully initialized
            setTimeout(() => {
              setMapReady(true);
              console.log('Map is ready for routing');
            }, 1000);
  
            // Create custom markers
            const deliveryMarkerIcon = L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            });
  
            // Add delivery location marker with red icon
            L.marker([deliveryLocation.latitude, deliveryLocation.longitude], { 
              icon: deliveryMarkerIcon,
              zIndexOffset: 1000 // Ensure delivery marker is on top
            })
              .addTo(map)
              .bindPopup('<strong>Delivery Location</strong>');
  
            // Add restaurant location marker if available
            if (restaurantLocation && restaurantLocation.latitude && restaurantLocation.longitude) {
              const restaurantMarkerIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              });
              
              L.marker([restaurantLocation.latitude, restaurantLocation.longitude], { 
                icon: restaurantMarkerIcon 
              })
                .addTo(map)
                .bindPopup('Restaurant Location');
            }
  
            // Store map reference
            mapRef.current = map;
            
            // Trigger a resize after a short delay to ensure the map displays correctly
            setTimeout(() => {
              if (mapRef.current) {
                mapRef.current.invalidateSize();
              }
            }, 100);
          } catch (err) {
            console.error('Error initializing map:', err);
            toast.error('Could not initialize map. Please try again.');
          }
        }, 100);
        
      } catch (err) {
        console.error('Error in map initialization:', err);
      }
    }
    
    // Cleanup function
    return () => {};
  }, [deliveryLocation, restaurantLocation]);

  // Update rider marker and routing in a separate effect
  useEffect(() => {
    // Only proceed if map is initialized and ready
    if (!mapRef.current || !mapReady) {
      console.log('Map not ready for rider location update');
      return;
    }
    
    // Only update rider marker if we have rider location
    if (riderLocation) {
      const map = mapRef.current;

      try {
        // Create rider marker icon (green)
        const riderMarkerIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        // Remove previous rider marker if it exists
        if (riderMarkerRef.current) {
          map.removeLayer(riderMarkerRef.current);
        }

        // Add new rider marker
        riderMarkerRef.current = L.marker([riderLocation.latitude, riderLocation.longitude], {
          icon: riderMarkerIcon
        }).addTo(map).bindPopup('Delivery Driver');

        // Handle routing separately, only when map is ready
        if (showDirections) {
          try {
            // First remove any existing routing control safely
            if (routingControlRef.current) {
              try {
                // Store reference to layers before removing control
                const layers = routingControlRef.current.getPlan().getWaypoints();
                console.log('Removing existing routing control');
                
                // Remove each layer explicitly first to avoid removeLayer errors
                routingControlRef.current.getPlan()._dragMarkerLayerGroup.clearLayers();
                routingControlRef.current._line.clearLayers();
                
                map.removeControl(routingControlRef.current);
                routingControlRef.current = null;
                
                // Clear any stored route layers
                Object.values(routeLayersRef.current).forEach(layer => {
                  if (map.hasLayer(layer)) {
                    map.removeLayer(layer);
                  }
                });
                routeLayersRef.current = {};
              } catch (routingErr) {
                console.warn('Non-fatal error removing routing control:', routingErr);
              }
            }

            // Add routing with a safe delay
            setTimeout(() => {
              if (!mapRef.current || !riderLocation) return;
              
              try {
                const destLat = directionsDestination === 'restaurant' && restaurantLocation
                  ? restaurantLocation.latitude
                  : deliveryLocation.latitude;

                const destLng = directionsDestination === 'restaurant' && restaurantLocation
                  ? restaurantLocation.longitude
                  : deliveryLocation.longitude;
                
                console.log('Creating new routing control');
                
                // Create a new routing control with safer options
                const routingControl = L.Routing.control({
                  waypoints: [
                    L.latLng(riderLocation.latitude, riderLocation.longitude),
                    L.latLng(destLat, destLng)
                  ],
                  routeWhileDragging: false,
                  showAlternatives: false,
                  fitSelectedRoutes: false,
                  show: false,
                  createMarker: function() { return null; }, // Don't create markers
                  lineOptions: {
                    styles: [{ color: '#3388ff', opacity: 0.7, weight: 5 }]
                  },
                  addWaypoints: false,
                  draggableWaypoints: false,
                  useZoomParameter: false,
                  autoRoute: true
                });
                
                // Add route error handling with proper typing
                routingControl.on('routingerror', function(e: RoutingErrorEvent) {
                  console.error('Routing error:', e.error);
                });
                
                // Store custom references to route layers for cleanup with proper typing
                routingControl.on('routesfound', function(e: RoutesFoundEvent) {
                  const routes = e.routes;
                  if (routes && routes.length > 0) {
                    // Store reference to route layers for manual cleanup
                    const routeId = `route-${Date.now()}`;
                    routeLayersRef.current[routeId] = routingControl._line;
                  }
                });
                
                // Add to map and store reference
                routingControl.addTo(mapRef.current);
                routingControlRef.current = routingControl;
                
              } catch (err) {
                console.error('Error creating routing:', err);
              }
            }, 1000); // Longer delay for routing creation
          } catch (err) {
            console.error('Error in routing setup:', err);
          }
        }

        // Fit bounds to include all points
        const bounds = L.latLngBounds(
          [riderLocation.latitude, riderLocation.longitude],
          [deliveryLocation.latitude, deliveryLocation.longitude]
        );

        if (restaurantLocation && restaurantLocation.latitude && restaurantLocation.longitude) {
          bounds.extend([restaurantLocation.latitude, restaurantLocation.longitude]);
        }

        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (err) {
        console.error('Error updating rider position:', err);
      }
    }
    
  }, [riderLocation, mapReady, deliveryLocation, restaurantLocation, showDirections, directionsDestination]);

  // Enhanced cleanup effect
  useEffect(() => {
    return () => {
      console.log('Cleaning up map component');
      // Safely cleanup routing control
      try {
        if (routingControlRef.current && mapRef.current) {
          // Remove each layer type explicitly
          try {
            const plan = routingControlRef.current.getPlan();
            if (plan && plan._dragMarkerLayerGroup) {
              plan._dragMarkerLayerGroup.clearLayers();
            }
          } catch (e) {
            console.log('Error cleaning routing plan:', e);
          }
          
          // Remove routing control from map
          mapRef.current.removeControl(routingControlRef.current);
          routingControlRef.current = null;
          
          // Remove stored route layers
          Object.values(routeLayersRef.current).forEach(layer => {
            if (mapRef.current && mapRef.current.hasLayer(layer)) {
              mapRef.current.removeLayer(layer);
            }
          });
          routeLayersRef.current = {};
        }
      } catch (err) {
        console.log('Cleanup routing error:', err);
      }
      
      // Remove rider marker if it exists
      if (riderMarkerRef.current && mapRef.current) {
        try {
          mapRef.current.removeLayer(riderMarkerRef.current);
          riderMarkerRef.current = null;
        } catch (err) {
          console.log('Error removing rider marker:', err);
        }
      }
      
      // Safely remove the map
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        mapInitializedRef.current = false;
        setMapReady(false);
      }
    };
  }, []);

  return <div id={mapIdRef.current} style={{ height, width: '100%' }}></div>;
};

export default DeliveryMap;
