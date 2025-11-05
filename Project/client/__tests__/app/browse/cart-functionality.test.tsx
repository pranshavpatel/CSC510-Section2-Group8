import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSearchParams, useRouter } from 'next/navigation'
import BrowsePage from '@/app/browse/page'
import { useAuth } from '@/context/auth-context'
import * as api from '@/lib/api'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock auth context
jest.mock('@/context/auth-context', () => ({
  useAuth: jest.fn(),
}))

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Mock API functions
jest.mock('@/lib/api', () => ({
  addToCart: jest.fn(),
  getCart: jest.fn(),
  updateCartItem: jest.fn(),
  removeFromCart: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('BrowsePage Cart Functionality', () => {
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
  ]

  const mockEmptyCart = {
    cart_id: 'cart-1',
    items: [],
    cart_total: 0,
  }

  const mockCartWithItem = {
    cart_id: 'cart-1',
    items: [
      {
        item_id: 'item-1',
        meal_id: 'meal1',
        meal_name: 'Margherita Pizza',
        restaurant_id: '1',
        qty: 2,
        unit_price: 9.99,
        line_total: 19.98,
        surplus_left: 3,
      },
    ],
    cart_total: 19.98,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    })
    mockGet.mockReturnValue(null)
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Quantity Controls', () => {
    beforeEach(() => {
      ;(useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 'user-1', email: 'test@test.com' },
      })
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMeals,
        })
      ;(api.getCart as jest.Mock).mockResolvedValue(mockEmptyCart)
    })

    it('should show + button for meals with surplus', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        const plusButtons = screen.getAllByRole('button')
        const hasPlusButton = plusButtons.some(btn =>
          btn.querySelector('svg')?.classList.contains('lucide-plus')
        )
        expect(hasPlusButton).toBe(true)
      })
    })

    it('should not show + button for sold out meals', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.getByText('Sold Out')).toBeInTheDocument()
      })
    })

    it('should load cart quantities on mount', async () => {
      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(api.getCart).toHaveBeenCalled()
      })
    })

    it('should show current quantity from cart', async () => {
      ;(api.getCart as jest.Mock).mockResolvedValue(mockCartWithItem)

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })

    it('should show - button when quantity > 0', async () => {
      ;(api.getCart as jest.Mock).mockResolvedValue(mockCartWithItem)

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const hasMinusButton = buttons.some(btn =>
          btn.querySelector('svg')?.classList.contains('lucide-minus')
        )
        expect(hasMinusButton).toBe(true)
      })
    })
  })

  describe('Adding to Cart', () => {
    beforeEach(() => {
      ;(useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 'user-1', email: 'test@test.com' },
      })
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMeals,
        })
      ;(api.getCart as jest.Mock).mockResolvedValue(mockEmptyCart)
    })

    it('should call addToCart when + clicked on item with 0 quantity', async () => {
      ;(api.addToCart as jest.Mock).mockResolvedValue(mockCartWithItem)

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const plusButton = buttons.find(btn =>
          btn.querySelector('svg')?.classList.contains('lucide-plus')
        )
        if (plusButton) {
          fireEvent.click(plusButton)
        }
      })

      await waitFor(() => {
        expect(api.addToCart).toHaveBeenCalledWith('meal1', 1)
      })
    })

    it('should redirect to login if not authenticated', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      })

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const plusButton = buttons.find(btn => 
          btn.querySelector('svg')?.classList.contains('lucide-plus') &&
          !(btn as HTMLButtonElement).disabled
        )
        expect(plusButton).toBeDefined()
        if (plusButton) {
          fireEvent.click(plusButton)
        }
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      }, { timeout: 3000 })
    })

    it('should disable + button at max quantity', async () => {
      const cartAtMax = {
        ...mockCartWithItem,
        items: [{
          ...mockCartWithItem.items[0],
          qty: 5,
          surplus_left: 5,
        }],
      }
      ;(api.getCart as jest.Mock).mockResolvedValue(cartAtMax)

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const plusButtons = buttons.filter(btn =>
          btn.querySelector('svg')?.classList.contains('lucide-plus')
        )
        if (plusButtons.length > 0) {
          expect(plusButtons[0]).toBeDisabled()
        }
      })
    })
  })

  describe('Updating Quantity', () => {
    beforeEach(() => {
      ;(useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 'user-1', email: 'test@test.com' },
      })
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMeals,
        })
      ;(api.getCart as jest.Mock).mockResolvedValue(mockCartWithItem)
    })

    it('should call updateCartItem when incrementing', async () => {
      ;(api.updateCartItem as jest.Mock).mockResolvedValue(mockCartWithItem)

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const plusButton = buttons.find(btn =>
          btn.querySelector('svg')?.classList.contains('lucide-plus')
        )
        if (plusButton) {
          fireEvent.click(plusButton)
        }
      })

      await waitFor(() => {
        expect(api.updateCartItem).toHaveBeenCalledWith('item-1', 3)
      })
    })

    it('should call updateCartItem when decrementing', async () => {
      const cartWithThreeItems = {
        ...mockCartWithItem,
        items: [{
          ...mockCartWithItem.items[0],
          qty: 3,
        }],
      }
      ;(api.getCart as jest.Mock).mockResolvedValue(cartWithThreeItems)
      ;(api.updateCartItem as jest.Mock).mockResolvedValue(cartWithThreeItems)

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const minusButton = buttons.find(btn =>
          btn.querySelector('svg')?.classList.contains('lucide-minus')
        )
        if (minusButton) {
          fireEvent.click(minusButton)
        }
      })

      await waitFor(() => {
        expect(api.updateCartItem).toHaveBeenCalledWith('item-1', 2)
      })
    })
  })

  describe('Removing from Cart', () => {
    beforeEach(() => {
      ;(useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 'user-1', email: 'test@test.com' },
      })
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMeals,
        })
      const cartWithOneItem = {
        ...mockCartWithItem,
        items: [{
          ...mockCartWithItem.items[0],
          qty: 1,
        }],
      }
      ;(api.getCart as jest.Mock).mockResolvedValue(cartWithOneItem)
    })

    it('should call removeFromCart when quantity reaches 0', async () => {
      ;(api.removeFromCart as jest.Mock).mockResolvedValue(mockEmptyCart)

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const minusButton = buttons.find(btn =>
          btn.querySelector('svg')?.classList.contains('lucide-minus')
        )
        if (minusButton) {
          fireEvent.click(minusButton)
        }
      })

      await waitFor(() => {
        expect(api.removeFromCart).toHaveBeenCalledWith('item-1')
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      ;(useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 'user-1', email: 'test@test.com' },
      })
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMeals,
        })
      ;(api.getCart as jest.Mock).mockResolvedValue(mockEmptyCart)
    })

    it('should handle addToCart error', async () => {
      ;(api.addToCart as jest.Mock).mockRejectedValue(
        new Error('only 3 left for this item')
      )

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const plusButton = buttons.find(btn =>
          btn.querySelector('svg')?.classList.contains('lucide-plus')
        )
        if (plusButton) {
          fireEvent.click(plusButton)
        }
      })

      await waitFor(() => {
        expect(api.addToCart).toHaveBeenCalled()
      })
    })

    it('should reload cart on error', async () => {
      ;(api.updateCartItem as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      )
      ;(api.getCart as jest.Mock)
        .mockResolvedValueOnce(mockCartWithItem)
        .mockResolvedValueOnce(mockCartWithItem)

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const plusButton = buttons.find(btn =>
          btn.querySelector('svg')?.classList.contains('lucide-plus')
        )
        if (plusButton) {
          fireEvent.click(plusButton)
        }
      })

      await waitFor(() => {
        expect(api.getCart).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Loading States', () => {
    beforeEach(() => {
      ;(useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 'user-1', email: 'test@test.com' },
      })
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRestaurants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMeals,
        })
      ;(api.getCart as jest.Mock).mockResolvedValue(mockEmptyCart)
    })

    it('should show loading spinner during cart operation', async () => {
      ;(api.addToCart as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<BrowsePage />)

      await waitFor(() => {
        const restaurant = screen.getByText('Pizza Palace')
        fireEvent.click(restaurant)
      })

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const plusButton = buttons.find(btn =>
          btn.querySelector('svg')?.classList.contains('lucide-plus')
        )
        if (plusButton) {
          fireEvent.click(plusButton)
        }
      })

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const loadingButton = buttons.find(btn =>
          btn.querySelector('svg')?.classList.contains('animate-spin')
        )
        expect(loadingButton).toBeDefined()
      })
    })
  })
})

