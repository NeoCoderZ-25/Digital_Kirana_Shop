// Geocoding service using OpenStreetMap Nominatim API (free, no API key required)

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  success: boolean;
  error?: string;
}

export interface ReverseGeocodingResult {
  address: string;
  city: string;
  state: string;
  pincode: string;
  success: boolean;
  error?: string;
}

// Convert address to coordinates
export const geocodeAddress = async (address: string): Promise<GeocodingResult> => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=in`,
      {
        headers: {
          'User-Agent': 'DigitalShopX/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const data = await response.json();

    if (data.length === 0) {
      return {
        latitude: 0,
        longitude: 0,
        displayName: '',
        success: false,
        error: 'Address not found. Please enter a more specific address.',
      };
    }

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      success: true,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      latitude: 0,
      longitude: 0,
      displayName: '',
      success: false,
      error: 'Failed to verify address. Please try again.',
    };
  }
};

// Convert coordinates to address (reverse geocoding)
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<ReverseGeocodingResult> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'User-Agent': 'DigitalShopX/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding service unavailable');
    }

    const data = await response.json();

    if (!data || data.error) {
      return {
        address: '',
        city: '',
        state: '',
        pincode: '',
        success: false,
        error: 'Could not determine address from location.',
      };
    }

    const addr = data.address || {};
    return {
      address: data.display_name || '',
      city: addr.city || addr.town || addr.village || addr.county || '',
      state: addr.state || '',
      pincode: addr.postcode || '',
      success: true,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      address: '',
      city: '',
      state: '',
      pincode: '',
      success: false,
      error: 'Failed to get address from location.',
    };
  }
};

// Validate if coordinates are within India bounds
export const isValidIndiaCoordinates = (lat: number, lng: number): boolean => {
  // India bounding box (approximate)
  const indiaBounds = {
    minLat: 6.5,
    maxLat: 35.5,
    minLng: 68.0,
    maxLng: 97.5,
  };

  return (
    lat >= indiaBounds.minLat &&
    lat <= indiaBounds.maxLat &&
    lng >= indiaBounds.minLng &&
    lng <= indiaBounds.maxLng
  );
};
