import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix for default marker icon
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface AddressMapProps {
  latitude: number;
  longitude: number;
  onLocationChange?: (lat: number, lng: number) => void;
  draggable?: boolean;
  height?: string;
}

// Component to handle map center updates
const MapCenterUpdater = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 15);
    }
  }, [lat, lng, map]);
  
  return null;
};

// Component to handle click events
const MapClickHandler = ({ 
  onLocationChange 
}: { 
  onLocationChange?: (lat: number, lng: number) => void 
}) => {
  useMapEvents({
    click: (e) => {
      if (onLocationChange) {
        onLocationChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Draggable marker component
const DraggableMarker = ({
  position,
  onPositionChange,
  draggable,
}: {
  position: LatLng;
  onPositionChange: (lat: number, lng: number) => void;
  draggable: boolean;
}) => {
  const markerRef = useRef<any>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newPos = marker.getLatLng();
        onPositionChange(newPos.lat, newPos.lng);
      }
    },
  };

  return (
    <Marker
      draggable={draggable}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={defaultIcon}
    />
  );
};

export const AddressMap = ({
  latitude,
  longitude,
  onLocationChange,
  draggable = true,
  height = '200px',
}: AddressMapProps) => {
  const [position, setPosition] = useState<LatLng>(new LatLng(latitude || 20.5937, longitude || 78.9629));

  useEffect(() => {
    if (latitude && longitude) {
      setPosition(new LatLng(latitude, longitude));
    }
  }, [latitude, longitude]);

  const handlePositionChange = (lat: number, lng: number) => {
    setPosition(new LatLng(lat, lng));
    if (onLocationChange) {
      onLocationChange(lat, lng);
    }
  };

  // Default to center of India if no coordinates
  const center = latitude && longitude ? [latitude, longitude] : [20.5937, 78.9629];

  return (
    <div className="relative rounded-lg overflow-hidden border" style={{ height }}>
      <MapContainer
        center={center as [number, number]}
        zoom={latitude && longitude ? 15 : 5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenterUpdater lat={latitude} lng={longitude} />
        {latitude && longitude && (
          <DraggableMarker
            position={position}
            onPositionChange={handlePositionChange}
            draggable={draggable}
          />
        )}
        {draggable && onLocationChange && (
          <MapClickHandler onLocationChange={handlePositionChange} />
        )}
      </MapContainer>
      {draggable && (
        <div className="absolute bottom-2 left-2 right-2 bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-muted-foreground flex items-center gap-1 z-[1000]">
          <MapPin className="w-3 h-3" />
          Drag marker or click to adjust location
        </div>
      )}
    </div>
  );
};

export default AddressMap;
