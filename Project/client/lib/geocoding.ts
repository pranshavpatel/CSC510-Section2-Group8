// Mapbox Geocoding API utilities
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export interface GeocodingResult {
  latitude: number
  longitude: number
  place_name: string
}

/**
 * Geocode an address to get latitude and longitude using Mapbox Geocoding API
 * @param address - The address string to geocode
 * @returns Promise with latitude, longitude, and formatted place name
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  if (!address || address.trim().length === 0) {
    throw new Error('Address is required')
  }

  if (!MAPBOX_TOKEN) {
    throw new Error('Mapbox access token is not configured')
  }

  const encodedAddress = encodeURIComponent(address)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&limit=1`

  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      throw new Error('No results found for this address. Please try a more specific address.')
    }

    const feature = data.features[0]
    const [longitude, latitude] = feature.center

    return {
      latitude,
      longitude,
      place_name: feature.place_name,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to geocode address')
  }
}

/**
 * Reverse geocode coordinates to get an address
 * @param latitude - Latitude
 * @param longitude - Longitude
 * @returns Promise with formatted address
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  if (!MAPBOX_TOKEN) {
    throw new Error('Mapbox access token is not configured')
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&limit=1`

  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      throw new Error('No address found for these coordinates')
    }

    return data.features[0].place_name
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to reverse geocode coordinates')
  }
}

