# Aro Feature Integration Guide

This document provides step-by-step instructions for integrating new features into the Aro platform, specifically focusing on location-based search and style filtering.

## Table of Contents

1. [Location Radius Search](#location-radius-search)
2. [Style Chips Filtering](#style-chips-filtering)

## Location Radius Search

This feature allows users to search for service providers within a specified radius of their location.

### 1. Backend Implementation

#### 1.1 Update Database Schema

First, extend the `ServiceProvider` model to include geolocation data:

**File: `/backend/prisma/schema.prisma`**

```prisma
model ServiceProvider {
  id            String    @id @default(uuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
  // Existing fields
  
  // Add these new fields
  locationLat   Float?    // Latitude coordinate
  locationLong  Float?    // Longitude coordinate
  address       String?   // Full address string
  city          String?
  state         String?
  zipCode       String?
  
  // Existing relations and other fields
}
```

#### 1.2 Create Database Migration

```bash
cd backend
npx prisma migrate dev --name add_geolocation_fields
```

#### 1.3 Add Geocoding Service

**File: `/backend/services/geocodingService.js`**

```javascript
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Geocodes an address to get latitude and longitude
 * @param {string} address The full address to geocode
 * @returns {Promise<{lat: number, lng: number}>} Coordinates object
 */
export const geocodeAddress = async (address) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      return { lat, lng };
    } else {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};
```

#### 1.4 Update Service Provider Routes

**File: `/backend/routes/serviceProvider.js`**

```javascript
import { geocodeAddress } from '../services/geocodingService.js';

// Add to existing POST route or create a new one
router.post("/details", requireAuth, upload.fields([/* existing fields */]), async (req, res) => {
  try {
    // Existing code...
    
    const { location, /* other fields */ } = req.body;
    
    // Geocode the location if provided
    let coordinates = {};
    if (location) {
      try {
        coordinates = await geocodeAddress(location);
      } catch (geoError) {
        console.error("Geocoding error:", geoError);
        // Continue even if geocoding fails
      }
    }
    
    // Update with existing code, but add new fields
    const serviceProviderData = {
      // Existing fields...
      
      // Add location data
      locationLat: coordinates.lat || null,
      locationLong: coordinates.lng || null,
      address: location || null,
      // Extract city, state, zipCode if needed from the location
    };
    
    // Continue with creating/updating service provider...
  } catch (error) {
    // Error handling
  }
});
```

#### 1.5 Create Nearby Search Endpoint

**File: `/backend/routes/search.js`**

```javascript
// Add a new endpoint for location-based search
router.get("/nearby", requireAuth, async (req, res) => {
  try {
    const { lat, lng, radius = 10, query = '', filter = 'all' } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }
    
    const radiusInMiles = parseFloat(radius);
    // Convert miles to meters for PostgreSQL
    const radiusInMeters = radiusInMiles * 1609.34;
    
    // Use PostGIS to find service providers within the radius
    const serviceProviders = await prisma.$queryRaw`
      SELECT sp.*, 
             u.id as "userId", 
             u.name, 
             u.username, 
             u."profilePicture",
             p.name as "professionName",
             ST_Distance(
               ST_MakePoint(sp."locationLong", sp."locationLat")::geography,
               ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)})::geography
             ) as distance
      FROM "ServiceProvider" sp
      JOIN "User" u ON sp."userId" = u.id
      LEFT JOIN "Profession" p ON sp."professionId" = p.id
      WHERE ST_DWithin(
        ST_MakePoint(sp."locationLong", sp."locationLat")::geography,
        ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)})::geography,
        ${radiusInMeters}
      )
      ${query ? sql`AND (u.name ILIKE ${`%${query}%`} OR u.username ILIKE ${`%${query}%`} OR p.name ILIKE ${`%${query}%`})` : sql``}
      ORDER BY distance
    `;
    
    // Format the response
    const results = serviceProviders.map(sp => ({
      id: sp.userId,
      serviceProviderId: sp.id,
      name: sp.name,
      username: sp.username,
      profilePicture: sp.profilePicture,
      profession: sp.professionName,
      distance: Math.round((sp.distance / 1609.34) * 10) / 10, // Convert back to miles and round to 1 decimal
      role: "service_provider"
    }));
    
    res.json(results);
  } catch (error) {
    console.error("Nearby search error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
```

### 2. Frontend Implementation

#### 2.1 Create Location Search Component

**File: `/frontend/src/Components/Search/LocationFilter.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import { GooglePlacesAutocomplete } from 'react-google-places-autocomplete';

const LocationFilter = ({ onChange }) => {
  const [value, setValue] = useState(null);
  const [radius, setRadius] = useState(10); // Default 10 miles
  const [coordinates, setCoordinates] = useState(null);
  
  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.googleMapsLoaded = true;
      };
      document.body.appendChild(script);
    };
    
    if (!window.googleMapsLoaded) {
      loadGoogleMapsScript();
    }
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  // Handle place selection
  const handlePlaceSelect = (place) => {
    setValue(place);
    
    if (window.google && window.google.maps && place.value.place_id) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ placeId: place.value.place_id }, (results, status) => {
        if (status === "OK" && results[0]) {
          const location = results[0].geometry.location;
          const coords = {
            lat: location.lat(),
            lng: location.lng()
          };
          
          setCoordinates(coords);
          onChange({ ...coords, radius });
        }
      });
    }
  };
  
  // Handle radius change
  const handleRadiusChange = (e) => {
    const newRadius = parseInt(e.target.value, 10);
    setRadius(newRadius);
    
    if (coordinates) {
      onChange({ ...coordinates, radius: newRadius });
    }
  };
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">Location</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search near
        </label>
        <GooglePlacesAutocomplete
          apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
          selectProps={{
            value,
            onChange: handlePlaceSelect,
            placeholder: 'Enter location...',
            styles: {
              control: (provided) => ({
                ...provided,
                borderRadius: '0.375rem',
                borderColor: '#e2e8f0',
              }),
            },
          }}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Distance: {radius} miles
        </label>
        <input
          type="range"
          min="1"
          max="50"
          step="1"
          value={radius}
          onChange={handleRadiusChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 mile</span>
          <span>50 miles</span>
        </div>
      </div>
    </div>
  );
};

export default LocationFilter;
```

#### 2.2 Create Search API Service

**File: `/frontend/src/services/searchService.js`**

```javascript
import api from '../utils/axiosInstance';

/**
 * Search for service providers near a location
 */
export const searchProvidersNearby = async ({ lat, lng, radius, query, filter }) => {
  try {
    const response = await api.get('/search/nearby', { 
      params: { 
        lat,
        lng, 
        radius,
        query,
        filter
      } 
    });
    return response.data;
  } catch (error) {
    console.error('Error searching providers:', error);
    throw error.response?.data || error;
  }
};
```

#### 2.3 Integrate with Search Component

**File: `/frontend/src/Components/Search/ProviderSearch.jsx`**

```jsx
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import LocationFilter from './LocationFilter';
import { searchProvidersNearby } from '../../services/searchService';

const ProviderSearch = () => {
  const [searchParams, setSearchParams] = useState({
    query: '',
    filter: 'all',
    locationParams: null
  });
  
  // React Query for API calls
  const { data: providers, isLoading, error } = useQuery(
    ['nearbyProviders', searchParams],
    () => searchProvidersNearby({
      ...searchParams.locationParams,
      query: searchParams.query,
      filter: searchParams.filter
    }),
    { 
      enabled: !!searchParams.locationParams,
      staleTime: 1000 * 60 * 5 // 5 minutes
    }
  );
  
  const handleLocationChange = (locationParams) => {
    setSearchParams(prev => ({
      ...prev,
      locationParams
    }));
  };
  
  const handleQueryChange = (e) => {
    setSearchParams(prev => ({
      ...prev,
      query: e.target.value
    }));
  };
  
  return (
    <div className="provider-search p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Find Service Providers</h2>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search providers..."
          className="w-full p-2 border border-gray-300 rounded"
          value={searchParams.query}
          onChange={handleQueryChange}
        />
      </div>
      
      <LocationFilter onChange={handleLocationChange} />
      
      {/* Results section */}
      <div className="search-results mt-6">
        {isLoading ? (
          <div className="text-center">Loading...</div>
        ) : error ? (
          <div className="text-red-500">Error loading results: {error.message}</div>
        ) : providers?.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-semibold">{providers.length} providers found</h3>
            {providers.map(provider => (
              <div key={provider.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {provider.profilePicture && (
                    <img 
                      src={provider.profilePicture} 
                      alt={provider.name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-medium">{provider.name}</h4>
                    <div className="text-sm text-gray-500">{provider.profession}</div>
                    <div className="text-xs text-blue-600">{provider.distance} miles away</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : searchParams.locationParams ? (
          <div className="text-center text-gray-500">
            No providers found in this area. Try increasing your search radius.
          </div>
        ) : (
          <div className="text-center text-gray-500">
            Select a location to find providers near you.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderSearch;
```

## Style Chips Filtering

This feature allows users to filter service providers by service style types (e.g., hair, nails, lashes).

### 1. Backend Implementation for Style Filtering

#### 1.1 Add Style Types to Database Schema

**File: `/backend/prisma/schema.prisma`**

```prisma
// Add enum for style types
enum StyleType {
  HAIR
  NAILS
  LASHES
  MAKEUP
  SKINCARE
  MASSAGE
  OTHER
}

model Service {
  id                String          @id @default(uuid())
  name              String
  price             Float
  depositAmount     Float?
  duration          Int              // Duration in minutes
  serviceProviderId String
  serviceProvider   ServiceProvider @relation(fields: [serviceProviderId], references: [id])
  
  // Add style types field
  styleTypes        StyleType[]     // New field for style categorization
  
  // Existing fields...
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  // ... other fields
}
```

#### 1.2 Create Database Migration for Style Types

```bash
cd backend
npx prisma migrate dev --name add_style_types_to_service
```

#### 1.3 Update Service Provider Routes

**File: `/backend/routes/serviceProvider.js`**

```javascript
// Update to existing POST route
router.post("/details", requireAuth, upload.fields([/* existing fields */]), async (req, res) => {
  try {
    // ... existing code
    
    const { services, /* other fields */ } = req.body;
    const parsedServices = JSON.parse(services);
    
    // Create or update services with style types
    const serviceOperations = parsedServices.map(service => {
      // Parse style types from the service object
      const styleTypes = service.styleTypes || [];
      
      return prisma.service.create({
        data: {
          name: service.name,
          price: parseFloat(service.price),
          duration: parseInt(service.duration),
          depositAmount: parseFloat(service.depositAmount || 0),
          serviceProviderId: serviceProviderId,
          styleTypes: styleTypes, // Add style types
        }
      });
    });
    
    // ... continue with transaction
  } catch (error) {
    // Error handling
  }
});
```

#### 1.4 Update Search API for Style Filtering

**File: `/backend/routes/search.js`**

```javascript
// Add to existing search endpoint or nearby endpoint
router.get("/nearby", requireAuth, async (req, res) => {
  try {
    const { lat, lng, radius = 10, query = '', filter = 'all', styles } = req.query;
    
    // Parse styles from comma-separated string
    const styleFilters = styles ? styles.split(',').map(style => style.toUpperCase()) : [];
    
    // ... existing location query setup
    
    // Modify the SQL query to include style filtering if needed
    let styleFilterQuery = '';
    if (styleFilters.length > 0) {
      // When using PostgreSQL with array support:
      styleFilterQuery = `
        AND EXISTS (
          SELECT 1 FROM "Service" s 
          WHERE s."serviceProviderId" = sp.id 
          AND s."styleTypes" && ARRAY[${styleFilters.map(s => `'${s}'`).join(',')}]::"StyleType"[]
        )
      `;
    }
    
    // Use raw SQL to query with location and style filters combined
    const serviceProviders = await prisma.$queryRaw`
      SELECT DISTINCT sp.*, 
             u.id as "userId", 
             u.name, 
             u.username, 
             u."profilePicture",
             p.name as "professionName",
             ST_Distance(
               ST_MakePoint(sp."locationLong", sp."locationLat")::geography,
               ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)})::geography
             ) as distance
      FROM "ServiceProvider" sp
      JOIN "User" u ON sp."userId" = u.id
      LEFT JOIN "Profession" p ON sp."professionId" = p.id
      WHERE ST_DWithin(
        ST_MakePoint(sp."locationLong", sp."locationLat")::geography,
        ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)})::geography,
        ${radiusInMeters}
      )
      ${query ? sql`AND (u.name ILIKE ${`%${query}%`} OR u.username ILIKE ${`%${query}%`} OR p.name ILIKE ${`%${query}%`})` : sql``}
      ${styleFilters.length > 0 ? sql.raw(styleFilterQuery) : sql``}
      ORDER BY distance
    `;
    
    // ... existing response formatting
  } catch (error) {
    // Error handling
  }
});
```

### 2. Frontend Implementation for Style Filtering

#### 2.1 Create Style Chips Component

**File: `/frontend/src/Components/Search/StyleChips.jsx`**

```jsx
import React, { useState } from 'react';

const StyleChips = ({ onChange }) => {
  const [selectedStyles, setSelectedStyles] = useState([]);
  
  const styleOptions = [
    { id: 'HAIR', label: 'Hair' },
    { id: 'NAILS', label: 'Nails' },
    { id: 'LASHES', label: 'Lashes' },
    { id: 'MAKEUP', label: 'Makeup' },
    { id: 'SKINCARE', label: 'Skincare' },
    { id: 'MASSAGE', label: 'Massage' }
  ];
  
  const toggleStyle = (styleId) => {
    let newSelectedStyles;
    
    if (selectedStyles.includes(styleId)) {
      newSelectedStyles = selectedStyles.filter(id => id !== styleId);
    } else {
      newSelectedStyles = [...selectedStyles, styleId];
    }
    
    setSelectedStyles(newSelectedStyles);
    onChange(newSelectedStyles);
  };
  
  return (
    <div className="style-chips mb-6">
      <h3 className="text-lg font-semibold mb-3">Service Types</h3>
      
      <div className="flex flex-wrap gap-2">
        {styleOptions.map(style => (
          <button
            key={style.id}
            type="button"
            onClick={() => toggleStyle(style.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedStyles.includes(style.id)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {style.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StyleChips;
```

#### 2.2 Integrate Style Chips with Search Component

**File: `/frontend/src/Components/Search/ProviderSearch.jsx`**

```jsx
// Add import for StyleChips
import StyleChips from './StyleChips';

// Update ProviderSearch component
const ProviderSearch = () => {
  const [searchParams, setSearchParams] = useState({
    query: '',
    filter: 'all',
    locationParams: null,
    styles: [] // Add styles array
  });
  
  // ... existing query and handlers
  
  // Add styles handler
  const handleStylesChange = (styles) => {
    setSearchParams(prev => ({
      ...prev,
      styles
    }));
  };
  
  return (
    <div className="provider-search p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Find Service Providers</h2>
      
      {/* Search input */}
      <div className="mb-4">...</div>
      
      {/* Add style chips above location filter */}
      <StyleChips onChange={handleStylesChange} />
      
      {/* Location filter */}
      <LocationFilter onChange={handleLocationChange} />
      
      {/* Results section */}
      <div className="search-results mt-6">...</div>
    </div>
  );
};
```

#### 2.3 Update Search Service

**File: `/frontend/src/services/searchService.js`**

```javascript
// Update the existing function
export const searchProvidersNearby = async ({ lat, lng, radius, query, filter, styles = [] }) => {
  try {
    // Convert styles array to comma-separated string for API
    const stylesParam = styles.length > 0 ? styles.join(',') : undefined;
    
    const response = await api.get('/search/nearby', { 
      params: { 
        lat,
        lng, 
        radius,
        query,
        filter,
        styles: stylesParam // Add styles parameter
      } 
    });
    return response.data;
  } catch (error) {
    console.error('Error searching providers:', error);
    throw error.response?.data || error;
  }
};
```

## Integration Summary

### Environment Variables

Update your `.env` files to include Google Maps API keys:

**Backend `.env`:**

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Frontend `.env`:**

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Installation Requirements

Add these npm packages to your project:

**Backend:**

```bash
npm install axios
```

**Frontend:**

```bash
npm install react-google-places-autocomplete react-query
```

### Implementation Notes

1. **PostGIS Extension**: The location search feature requires PostgreSQL with PostGIS extension enabled. Make sure your database server has this extension installed and activated.

2. **Geocoding Rate Limits**: Be aware of Google's geocoding API rate limits in production. Consider implementing caching strategies for addresses you've already geocoded.

3. **Style Type Migration**: When adding the `StyleType` enum to an existing database, you'll need to handle the migration carefully to ensure existing services aren't affected.

4. **Performance Considerations**: Location-based queries can be resource-intensive. Consider implementing pagination and result limits for the search API endpoints.

5. **Security**: Always validate location inputs on the server side to prevent SQL injection via the raw queries.
