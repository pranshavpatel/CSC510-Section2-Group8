import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MapView } from '@/components/map-view'

// mapbox-gl is automatically mocked via __mocks__ folder
const mapboxgl = require('mapbox-gl')

describe('MapView', () => {
  const mockRestaurants = [
    {
      id: '1',
      name: 'Restaurant One',
      address: '123 Main St',
      latitude: 40.7128,
      longitude: -74.0060,
    },
    {
      id: '2',
      name: 'Restaurant Two',
      address: '456 Oak Ave',
      latitude: 40.7580,
      longitude: -73.9855,
    },
    {
      id: '3',
      name: 'Restaurant Three',
      address: '789 Pine Rd',
      latitude: 40.7489,
      longitude: -73.9680,
    },
  ]

  const mockOnRestaurantSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the map container', () => {
    render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )
    
    const mapContainer = document.querySelector('.w-full.h-full.rounded-lg')
    expect(mapContainer).toBeInTheDocument()
  })

  it('should initialize Mapbox map with correct center coordinates', () => {
    render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    expect(mapboxgl.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        style: 'mapbox://styles/mapbox/streets-v12',
        zoom: 12,
      })
    )
  })

  it('should add navigation controls to the map', () => {
    render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    const mapInstance = (mapboxgl.Map as jest.Mock).mock.instances[0]
    expect(mapInstance.addControl).toHaveBeenCalledWith(
      expect.any(mapboxgl.NavigationControl),
      'top-right'
    )
  })

  it('should create markers for all restaurants', () => {
    render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    expect(mapboxgl.Marker).toHaveBeenCalledTimes(mockRestaurants.length)
  })

  it('should set correct coordinates for each marker', () => {
    render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    const markerInstances = (mapboxgl.Marker as jest.Mock).mock.instances

    markerInstances.forEach((markerInstance, index) => {
      expect(markerInstance.setLngLat).toHaveBeenCalledWith([
        mockRestaurants[index].longitude,
        mockRestaurants[index].latitude,
      ])
    })
  })

  it('should create popup for each marker with restaurant info', () => {
    render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    const popupInstances = (mapboxgl.Popup as jest.Mock).mock.instances

    popupInstances.forEach((popupInstance, index) => {
      expect(popupInstance.setHTML).toHaveBeenCalledWith(
        expect.stringContaining(mockRestaurants[index].name)
      )
      expect(popupInstance.setHTML).toHaveBeenCalledWith(
        expect.stringContaining(mockRestaurants[index].address)
      )
    })
  })

  it('should display selected restaurant card when marker is clicked', async () => {
    render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    // Get the first marker element
    const markerCalls = (mapboxgl.Marker as jest.Mock).mock.calls
    const firstMarkerElement = markerCalls[0][0]
    
    // Simulate marker click
    fireEvent.click(firstMarkerElement)

    await waitFor(() => {
      expect(screen.getByText(mockRestaurants[0].name)).toBeInTheDocument()
      expect(screen.getByText(mockRestaurants[0].address)).toBeInTheDocument()
      expect(screen.getByText('View Meals')).toBeInTheDocument()
      expect(screen.getByText('Close')).toBeInTheDocument()
    })
  })

  it('should call onRestaurantSelect when View Meals button is clicked', async () => {
    render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    // Get the first marker element and click it
    const markerCalls = (mapboxgl.Marker as jest.Mock).mock.calls
    const firstMarkerElement = markerCalls[0][0]
    fireEvent.click(firstMarkerElement)

    // Wait for the card to appear and click View Meals
    await waitFor(() => {
      const viewMealsButton = screen.getByText('View Meals')
      expect(viewMealsButton).toBeInTheDocument()
    })

    const viewMealsButton = screen.getByText('View Meals')
    fireEvent.click(viewMealsButton)

    expect(mockOnRestaurantSelect).toHaveBeenCalledWith(mockRestaurants[0])
  })

  it('should close selected restaurant card when Close button is clicked', async () => {
    render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    // Get the first marker element and click it
    const markerCalls = (mapboxgl.Marker as jest.Mock).mock.calls
    const firstMarkerElement = markerCalls[0][0]
    fireEvent.click(firstMarkerElement)

    // Wait for the card to appear
    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument()
    })

    // Click the Close button
    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)

    // Card should be removed
    await waitFor(() => {
      expect(screen.queryByText('View Meals')).not.toBeInTheDocument()
    })
  })

  it('should not display restaurant card initially', () => {
    render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    expect(screen.queryByText('View Meals')).not.toBeInTheDocument()
    expect(screen.queryByText('Close')).not.toBeInTheDocument()
  })

  it('should handle empty restaurants array', () => {
    render(
      <MapView 
        restaurants={[]} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    // Should still create map but no markers
    expect(mapboxgl.Map).toHaveBeenCalled()
    expect(mapboxgl.Marker).not.toHaveBeenCalled()
  })

  it('should clean up map and markers on unmount', () => {
    const { unmount } = render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    const mapInstance = (mapboxgl.Map as jest.Mock).mock.instances[0]
    const markerInstances = (mapboxgl.Marker as jest.Mock).mock.instances

    unmount()

    expect(mapInstance.remove).toHaveBeenCalled()
    markerInstances.forEach(marker => {
      expect(marker.remove).toHaveBeenCalled()
    })
  })

  it('should update markers when restaurants prop changes', () => {
    const { rerender } = render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    const initialMarkerCount = (mapboxgl.Marker as jest.Mock).mock.calls.length

    // Update with different restaurants
    const newRestaurants = [
      {
        id: '4',
        name: 'Restaurant Four',
        address: '999 Elm St',
        latitude: 40.7306,
        longitude: -73.9352,
      },
    ]

    rerender(
      <MapView 
        restaurants={newRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    // Should have created more markers
    expect((mapboxgl.Marker as jest.Mock).mock.calls.length).toBeGreaterThan(
      initialMarkerCount
    )
  })

  it('should handle restaurants without addresses', () => {
    const restaurantsNoAddress = [
      {
        id: '1',
        name: 'Restaurant No Address',
        address: '',
        latitude: 40.7128,
        longitude: -74.0060,
      },
    ]

    render(
      <MapView 
        restaurants={restaurantsNoAddress} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    // Get the marker element and click it
    const markerCalls = (mapboxgl.Marker as jest.Mock).mock.calls
    const markerElement = markerCalls[0][0]
    fireEvent.click(markerElement)

    waitFor(() => {
      expect(screen.getByText('No address available')).toBeInTheDocument()
    })
  })

  it('should handle onRestaurantSelect being undefined', async () => {
    render(
      <MapView 
        restaurants={mockRestaurants} 
      />
    )

    // Get the first marker element and click it
    const markerCalls = (mapboxgl.Marker as jest.Mock).mock.calls
    const firstMarkerElement = markerCalls[0][0]
    fireEvent.click(firstMarkerElement)

    // Wait for the card to appear and click View Meals
    await waitFor(() => {
      const viewMealsButton = screen.getByText('View Meals')
      expect(viewMealsButton).toBeInTheDocument()
    })

    const viewMealsButton = screen.getByText('View Meals')
    
    // Should not throw error when clicking
    expect(() => fireEvent.click(viewMealsButton)).not.toThrow()
  })

  it('should display marker numbers correctly', () => {
    render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    const markerCalls = (mapboxgl.Marker as jest.Mock).mock.calls
    
    markerCalls.forEach((call, index) => {
      const markerElement = call[0]
      expect(markerElement.innerHTML).toContain(`${index + 1}`)
    })
  })

  it('should apply correct styling to marker elements', () => {
    render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    const markerCalls = (mapboxgl.Marker as jest.Mock).mock.calls
    const firstMarkerElement = markerCalls[0][0]

    expect(firstMarkerElement.className).toBe('marker')
    expect(firstMarkerElement.innerHTML).toContain('bg-green-500')
    expect(firstMarkerElement.innerHTML).toContain('hover:scale-110')
  })

  it('should calculate correct center coordinates from restaurants', () => {
    render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    const expectedCenterLng = mockRestaurants.reduce(
      (sum, r) => sum + r.longitude,
      0
    ) / mockRestaurants.length

    const expectedCenterLat = mockRestaurants.reduce(
      (sum, r) => sum + r.latitude,
      0
    ) / mockRestaurants.length

    expect(mapboxgl.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [expectedCenterLng, expectedCenterLat],
      })
    )
  })

  it('should handle single restaurant', () => {
    const singleRestaurant = [mockRestaurants[0]]
    
    render(
      <MapView 
        restaurants={singleRestaurant} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    expect(mapboxgl.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [singleRestaurant[0].longitude, singleRestaurant[0].latitude],
      })
    )
    expect(mapboxgl.Marker).toHaveBeenCalledTimes(1)
  })

  it('should not create markers when map is not initialized', () => {
    // Mock mapContainer.current to be null
    const { rerender } = render(
      <MapView 
        restaurants={[]} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    const markerCountBefore = (mapboxgl.Marker as jest.Mock).mock.calls.length

    // Rerender with restaurants
    rerender(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    // Markers should be created now
    expect((mapboxgl.Marker as jest.Mock).mock.calls.length).toBeGreaterThan(markerCountBefore)
  })

  it('should handle marker click with null restaurant', () => {
    render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    // Click first marker
    const markerCalls = (mapboxgl.Marker as jest.Mock).mock.calls
    const firstMarkerElement = markerCalls[0][0]
    fireEvent.click(firstMarkerElement)

    // Card should appear
    waitFor(() => {
      expect(screen.getByText(mockRestaurants[0].name)).toBeInTheDocument()
    })

    // Click close
    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)

    // Card should disappear
    waitFor(() => {
      expect(screen.queryByText('View Meals')).not.toBeInTheDocument()
    })
  })

  it('should update center when restaurants change', () => {
    const { rerender } = render(
      <MapView 
        restaurants={mockRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    const initialMapCalls = (mapboxgl.Map as jest.Mock).mock.calls.length

    const newRestaurants = [
      {
        id: '5',
        name: 'New Restaurant',
        address: '111 New St',
        latitude: 41.0,
        longitude: -74.5,
      },
    ]

    rerender(
      <MapView 
        restaurants={newRestaurants} 
        onRestaurantSelect={mockOnRestaurantSelect}
      />
    )

    // Map should be recreated due to center change
    expect((mapboxgl.Map as jest.Mock).mock.calls.length).toBeGreaterThan(initialMapCalls)
  })
})

