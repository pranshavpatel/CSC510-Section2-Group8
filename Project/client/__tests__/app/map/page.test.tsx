import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import MapPage from '@/app/map/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock MapView component
jest.mock('@/components/map-view', () => ({
  MapView: ({ restaurants, onRestaurantSelect }: any) => (
    <div data-testid="map-view">
      <div data-testid="restaurant-count">{restaurants.length}</div>
      {restaurants.map((restaurant: any) => (
        <div key={restaurant.id} data-testid={`restaurant-${restaurant.id}`}>
          {restaurant.name}
        </div>
      ))}
      <button
        data-testid="select-restaurant-btn"
        onClick={() => onRestaurantSelect(restaurants[0])}
      >
        Select First Restaurant
      </button>
    </div>
  ),
}))

// Mock fetch
global.fetch = jest.fn()

describe('MapPage', () => {
  const mockPush = jest.fn()
  const mockRouter = {
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }

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

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should render the page title and description', () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<MapPage />)

    expect(screen.getByText('Find Deals Near You')).toBeInTheDocument()
    expect(
      screen.getByText('Explore surplus food deals from restaurants in your area')
    ).toBeInTheDocument()
  })

  it('should display loading state initially', () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves
    )

    render(<MapPage />)

    expect(screen.getByText('Loading restaurants...')).toBeInTheDocument()
  })

  it('should fetch restaurants on mount', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRestaurants,
    })

    render(<MapPage />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${process.env.NEXT_PUBLIC_API_URL!}/catalog/restaurants`
      )
    })
  })

  it('should display MapView with fetched restaurants', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRestaurants,
    })

    render(<MapPage />)

    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeInTheDocument()
    })

    expect(screen.getByTestId('restaurant-count')).toHaveTextContent('3')
    expect(screen.getByTestId('restaurant-1')).toHaveTextContent('Restaurant One')
    expect(screen.getByTestId('restaurant-2')).toHaveTextContent('Restaurant Two')
    expect(screen.getByTestId('restaurant-3')).toHaveTextContent('Restaurant Three')
  })

  it('should handle fetch error and display error message', async () => {
    const errorMessage = 'Failed to fetch restaurants'
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    })

    render(<MapPage />)

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument()
      expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument()
    })
  })

  it('should handle network error', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    )

    render(<MapPage />)

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument()
      expect(screen.getByText(/Network error/)).toBeInTheDocument()
    })
  })

  it('should handle non-Error exceptions', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce('String error')

    render(<MapPage />)

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument()
      expect(screen.getByText(/An error occurred/)).toBeInTheDocument()
    })
  })

  it('should navigate to browse page when restaurant is selected', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRestaurants,
    })

    render(<MapPage />)

    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeInTheDocument()
    })

    const selectButton = screen.getByTestId('select-restaurant-btn')
    selectButton.click()

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/browse?restaurant=1')
    })
  })

  it('should pass correct onRestaurantSelect handler to MapView', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRestaurants,
    })

    render(<MapPage />)

    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeInTheDocument()
    })

    const selectButton = screen.getByTestId('select-restaurant-btn')
    selectButton.click()

    expect(mockPush).toHaveBeenCalledWith(`/browse?restaurant=${mockRestaurants[0].id}`)
  })

  it('should display empty state when no restaurants are returned', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<MapPage />)

    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeInTheDocument()
    })

    expect(screen.getByTestId('restaurant-count')).toHaveTextContent('0')
  })

  it('should have correct container styling', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRestaurants,
    })

    const { container } = render(<MapPage />)

    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeInTheDocument()
    })

    const mainContainer = container.querySelector('.container.py-8')
    expect(mainContainer).toBeInTheDocument()

    const mapContainer = container.querySelector('.h-\\[600px\\]')
    expect(mapContainer).toBeInTheDocument()
  })

  it('should render proper heading hierarchy', () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<MapPage />)

    const heading = screen.getByRole('heading', { name: 'Find Deals Near You' })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe('H1')
  })

  it('should show loading state with proper styling', () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {})
    )

    const { container } = render(<MapPage />)

    const loadingContainer = container.querySelector('.flex.items-center.justify-center.h-full')
    expect(loadingContainer).toBeInTheDocument()
    expect(screen.getByText('Loading restaurants...')).toBeInTheDocument()
  })

  it('should show error state with proper styling', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    })

    const { container } = render(<MapPage />)

    await waitFor(() => {
      const errorContainer = container.querySelector('.flex.items-center.justify-center.h-full')
      expect(errorContainer).toBeInTheDocument()
    })
  })

  it('should handle restaurant selection with different IDs', async () => {
    const customRestaurants = [
      {
        id: 'custom-id-123',
        name: 'Custom Restaurant',
        address: '999 Custom St',
        latitude: 40.7128,
        longitude: -74.0060,
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => customRestaurants,
    })

    render(<MapPage />)

    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeInTheDocument()
    })

    const selectButton = screen.getByTestId('select-restaurant-btn')
    selectButton.click()

    expect(mockPush).toHaveBeenCalledWith('/browse?restaurant=custom-id-123')
  })

  it('should maintain state after successful fetch', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRestaurants,
    })

    const { rerender } = render(<MapPage />)

    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeInTheDocument()
    })

    // Rerender the component
    rerender(<MapPage />)

    // Should still show the map (not loading)
    expect(screen.queryByText('Loading restaurants...')).not.toBeInTheDocument()
  })

  it('should call fetch exactly once on mount', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRestaurants,
    })

    render(<MapPage />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  it('should handle malformed JSON response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON')
      },
    })

    render(<MapPage />)

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument()
      expect(screen.getByText(/Invalid JSON/)).toBeInTheDocument()
    })
  })
})

