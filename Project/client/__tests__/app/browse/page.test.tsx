import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSearchParams, useRouter } from 'next/navigation'
import BrowsePage from '@/app/browse/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('BrowsePage', () => {
  const mockPush = jest.fn()
  const mockGet = jest.fn()
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
      name: 'Pizza Palace',
      address: '123 Main St',
      owner_id: 'owner1',
      created_at: '2024-01-01',
    },
    {
      id: '2',
      name: 'Burger Barn',
      address: '456 Oak Ave',
      owner_id: 'owner2',
      created_at: '2024-01-02',
    },
    {
      id: '3',
      name: 'Sushi Station',
      address: '789 Pine Rd',
      owner_id: 'owner3',
      created_at: '2024-01-03',
    },
  ]

  const mockMeals = [
    {
      id: 'meal1',
      restaurant_id: '1',
      name: 'Margherita Pizza',
      tags: ['vegetarian', 'italian'],
      base_price: 15.99,
      surplus_qty: 5,
      surplus_price: 9.99,
      allergens: ['gluten', 'dairy'],
      calories: 800,
      created_at: '2024-01-01',
    },
    {
      id: 'meal2',
      restaurant_id: '1',
      name: 'Pepperoni Pizza',
      tags: ['italian'],
      base_price: 17.99,
      surplus_qty: 0,
      surplus_price: null,
      allergens: ['gluten', 'dairy'],
      calories: 950,
      created_at: '2024-01-01',
    },
    {
      id: 'meal3',
      restaurant_id: '2',
      name: 'Classic Burger',
      tags: ['american'],
      base_price: 12.99,
      surplus_qty: 3,
      surplus_price: 7.99,
      allergens: ['gluten'],
      calories: 650,
      created_at: '2024-01-02',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    })
    mockGet.mockReturnValue(null)
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Initial Rendering and Restaurant View', () => {
    it('should render the restaurants header', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRestaurants,
      })

      render(<BrowsePage />)

      await waitFor(() => {
        expect(screen.getByText('Browse Restaurants')).toBeInTheDocument()
      })
      expect(screen.getByText(/Discover restaurants offering surplus meals/)).toBeInTheDocument()
    })

    it('should fetch restaurants on mount', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRestaurants,
      })

      render(<BrowsePage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/catalog/restaurants')
        )
      })
    })

    it('should display all restaurants after loading', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRestaurants,
      })

      render(<BrowsePage />)

      await waitFor(() => {
        expect(screen.getByText('Pizza Palace')).toBeInTheDocument()
        expect(screen.getByText('Burger Barn')).toBeInTheDocument()
        expect(screen.getByText('Sushi Station')).toBeInTheDocument()
      })
    })

    it('should show loading state while fetching restaurants', () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(() => {})
      )

      const { container } = render(<BrowsePage />)

      // Check for loading spinner by class
      const loader = container.querySelector('.animate-spin')
      expect(loader).toBeInTheDocument()
    })

    it('should show restaurant count', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRestaurants,
      })

      render(<BrowsePage />)

      await waitFor(() => {
        expect(screen.getByText('Showing 3 restaurants')).toBeInTheDocument()
      })
    })
  })

  describe('Restaurant Search', () => {
    it('should filter restaurants by name', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRestaurants,
      })

      render(<BrowsePage />)

      await waitFor(() => {
        expect(screen.getByText('Pizza Palace')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search restaurants...')
      fireEvent.change(searchInput, { target: { value: 'Pizza' } })

      await waitFor(() => {
        expect(screen.getByText('Pizza Palace')).toBeInTheDocument()
        expect(screen.queryByText('Burger Barn')).not.toBeInTheDocument()
        expect(screen.queryByText('Sushi Station')).not.toBeInTheDocument()
      })
    })

    it('should filter restaurants by address', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRestaurants,
      })

      render(<BrowsePage />)

      await waitFor(() => {
        expect(screen.getByText('Pizza Palace')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search restaurants...')
      fireEvent.change(searchInput, { target: { value: 'Oak' } })

      await waitFor(() => {
        expect(screen.getByText('Burger Barn')).toBeInTheDocument()
        expect(screen.queryByText('Pizza Palace')).not.toBeInTheDocument()
      })
    })

    it('should show no results message when search has no matches', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRestaurants,
      })

      render(<BrowsePage />)

      await waitFor(() => {
        expect(screen.getByText('Pizza Palace')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search restaurants...')
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

      await waitFor(() => {
        expect(screen.getByText('No restaurants found')).toBeInTheDocument()
      })
    })

    it('should show clear search button when no results', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRestaurants,
      })

      render(<BrowsePage />)

      await waitFor(() => {
        expect(screen.getByText('Pizza Palace')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search restaurants...')
      fireEvent.change(searchInput, { target: { value: 'xyz' } })

      await waitFor(() => {
        const clearButton = screen.getByText('Clear Search')
        expect(clearButton).toBeInTheDocument()
        fireEvent.click(clearButton)
      })

      expect(searchInput).toHaveValue('')
    })

    it('should be case insensitive', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRestaurants,
      })

      render(<BrowsePage />)

      await waitFor(() => {
        expect(screen.getByText('Pizza Palace')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search restaurants...')
      fireEvent.change(searchInput, { target: { value: 'PIZZA' } })

      await waitFor(() => {
        expect(screen.getByText('Pizza Palace')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when restaurant fetch fails', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      render(<BrowsePage />)

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument()
        expect(screen.getByText(/Failed to fetch restaurants/)).toBeInTheDocument()
      })
    })

    it('should show try again button on error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      render(<BrowsePage />)

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })
    })

    it('should retry fetch when try again is clicked', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })

      render(<BrowsePage />)

      await waitFor(() => {
        const tryAgainButton = screen.getByText('Try Again')
        fireEvent.click(tryAgainButton)
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      render(<BrowsePage />)

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument()
      })
    })
  })

  describe('Restaurant Selection and Meals View', () => {
    it('should switch to meals view when restaurant is clicked', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMeals,
        })

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.getByText('Pizza Palace')).toBeInTheDocument()
        expect(screen.getByText('123 Main St')).toBeInTheDocument()
      })
    })

    it('should fetch meals when switching to meals view', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMeals,
        })

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/catalog/meals')
        )
      })
    })

    it('should show back to restaurants button in meals view', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMeals,
        })

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.getByText('Back to Restaurants')).toBeInTheDocument()
      })
    })

    it('should return to restaurants view when back button is clicked', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMeals,
        })

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        const backButton = screen.getByText('Back to Restaurants')
        fireEvent.click(backButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Browse Restaurants')).toBeInTheDocument()
      })
    })
  })

  describe('Meals Display', () => {
    beforeEach(async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMeals,
        })
    })

    it('should display meals for selected restaurant', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.getByText('Margherita Pizza')).toBeInTheDocument()
        expect(screen.getByText('Pepperoni Pizza')).toBeInTheDocument()
      })
    })

    it('should show surplus meals section', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.getByText(/Surplus Meals/)).toBeInTheDocument()
      })
    })

    it('should show regular menu section', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.getByText('Regular Menu')).toBeInTheDocument()
      })
    })

    it('should display meal tags', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        const vegetarianTags = screen.getAllByText('vegetarian')
        const italianTags = screen.getAllByText('italian')
        expect(vegetarianTags.length).toBeGreaterThan(0)
        expect(italianTags.length).toBeGreaterThan(0)
      })
    })

    it('should display meal calories', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.getByText('800 kcal')).toBeInTheDocument()
        expect(screen.getByText('950 kcal')).toBeInTheDocument()
      })
    })

    it('should display meal allergens', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        const allergensText = screen.getAllByText('gluten, dairy')
        expect(allergensText.length).toBeGreaterThan(0)
      })
    })

    it('should show discount percentage for surplus meals', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.getByText('38% OFF')).toBeInTheDocument()
      })
    })

    it('should show surplus quantity', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.getByText('5 left')).toBeInTheDocument()
      })
    })

    it('should display both original and surplus prices', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.getByText('$9.99')).toBeInTheDocument()
        expect(screen.getByText('$15.99')).toBeInTheDocument()
      })
    })

    it('should show Order Now button for surplus meals', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        const orderButtons = screen.getAllByText('Order Now')
        expect(orderButtons.length).toBeGreaterThan(0)
      })
    })

    it('should show Sold Out button for non-surplus meals', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.getByText('Sold Out')).toBeInTheDocument()
      })
    })
  })

  describe('Meal Search and Filtering', () => {
    beforeEach(async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMeals,
        })
    })

    it('should filter meals by name', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.getByText('Margherita Pizza')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search meals...')
      fireEvent.change(searchInput, { target: { value: 'Margherita' } })

      await waitFor(() => {
        expect(screen.getByText('Margherita Pizza')).toBeInTheDocument()
        expect(screen.queryByText('Pepperoni Pizza')).not.toBeInTheDocument()
      })
    })

    it('should filter meals by tags', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.getByText('Margherita Pizza')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search meals...')
      fireEvent.change(searchInput, { target: { value: 'vegetarian' } })

      await waitFor(() => {
        expect(screen.getByText('Margherita Pizza')).toBeInTheDocument()
        expect(screen.queryByText('Pepperoni Pizza')).not.toBeInTheDocument()
      })
    })

    it('should show no meals message when search has no matches', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.getByText('Margherita Pizza')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search meals...')
      fireEvent.change(searchInput, { target: { value: 'sushi' } })

      await waitFor(() => {
        expect(screen.getByText('No meals found for this restaurant')).toBeInTheDocument()
      })
    })
  })

  describe('URL Parameter Handling', () => {
    it('should load meals view when restaurant parameter is in URL', async () => {
      mockGet.mockReturnValue('1')
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMeals,
        })

      render(<BrowsePage />)

      await waitFor(() => {
        expect(screen.getByText('Pizza Palace')).toBeInTheDocument()
        expect(screen.getByText('123 Main St')).toBeInTheDocument()
      })
    })

    it('should navigate to /browse when back button clicked from URL parameter', async () => {
      mockGet.mockReturnValue('1')
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMeals,
        })

      render(<BrowsePage />)

      await waitFor(() => {
        const backButton = screen.getByText('Back to Restaurants')
        fireEvent.click(backButton)
      })

      expect(mockPush).toHaveBeenCalledWith('/browse')
    })
  })

  describe('Discount Calculation', () => {
    it('should calculate correct discount percentage', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMeals,
        })

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        // (15.99 - 9.99) / 15.99 = ~37.52% -> 38%
        expect(screen.getByText('38% OFF')).toBeInTheDocument()
      })
    })

    it('should handle zero base price', async () => {
      const mealsWithZeroPrice = [
        {
          ...mockMeals[0],
          base_price: 0,
          surplus_price: 5,
        },
      ]

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mealsWithZeroPrice,
        })

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.queryByText(/% OFF/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no restaurants', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      render(<BrowsePage />)

      await waitFor(() => {
        expect(screen.getByText('Showing 0 restaurants')).toBeInTheDocument()
      })
    })

    it('should show empty meals message', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.getByText('No meals found for this restaurant')).toBeInTheDocument()
      })
    })
  })
})

