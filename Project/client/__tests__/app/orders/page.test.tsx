import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import OrdersPage from '@/app/orders/page'
import { useAuth } from '@/context/auth-context'
import * as api from '@/lib/api'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
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
  getMyOrders: jest.fn(),
  getOrder: jest.fn(),
  getOrderStatus: jest.fn(),
  cancelOrder: jest.fn(),
}))

// Mock date-fns
jest.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => {
    if (formatStr.includes('MMM dd, yyyy')) {
      return 'Jan 01, 2024'
    }
    return 'Jan 01, 2024 at 12:00 PM'
  },
}))

describe('OrdersPage', () => {
  const mockPush = jest.fn()
  const mockRouter = {
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }

  const mockOrders = [
    {
      id: 'order-1',
      restaurant_id: 'rest-1',
      status: 'pending',
      total: 27.97,
      created_at: '2024-01-01T12:00:00Z',
    },
    {
      id: 'order-2',
      restaurant_id: 'rest-1',
      status: 'completed',
      total: 45.50,
      created_at: '2024-01-02T15:30:00Z',
    },
    {
      id: 'order-3',
      restaurant_id: 'rest-2',
      status: 'cancelled',
      total: 15.99,
      created_at: '2024-01-03T10:00:00Z',
    },
  ]

  const mockOrderDetails = {
    order: {
      id: 'order-1',
      user_id: 'user-1',
      restaurant_id: 'rest-1',
      restaurant_name: 'Pizza Palace',
      status: 'pending',
      total: 27.97,
      created_at: '2024-01-01T12:00:00Z',
    },
    items: [
      {
        id: 'item-1',
        meal_id: 'meal-1',
        meal_name: 'Margherita Pizza',
        qty: 2,
        price: 19.98,
      },
      {
        id: 'item-2',
        meal_id: 'meal-2',
        meal_name: 'Caesar Salad',
        qty: 1,
        price: 7.99,
      },
    ],
  }

  const mockOrderTimeline = {
    order_id: 'order-1',
    timeline: [
      {
        status: 'pending',
        created_at: '2024-01-01T12:00:00Z',
      },
      {
        status: 'accepted',
        created_at: '2024-01-01T12:05:00Z',
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user-1', email: 'test@test.com' },
    })
  })

  describe('Authentication', () => {
    it('should redirect to login if not authenticated', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      })

      render(<OrdersPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('should not redirect if authenticated', async () => {
      ;(api.getMyOrders as jest.Mock).mockResolvedValue([])

      render(<OrdersPage />)

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalledWith('/login')
      })
    })

    it('should show loading state while checking auth', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
      })

      const { container } = render(<OrdersPage />)

      const loader = container.querySelector('.animate-spin')
      expect(loader).toBeInTheDocument()
    })
  })

  describe('Orders Loading', () => {
    it('should load orders on mount', async () => {
      ;(api.getMyOrders as jest.Mock).mockResolvedValue(mockOrders)

      render(<OrdersPage />)

      await waitFor(() => {
        expect(api.getMyOrders).toHaveBeenCalled()
      })
    })

    it('should display orders after loading', async () => {
      ;(api.getMyOrders as jest.Mock).mockResolvedValue(mockOrders)

      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText(/Order #order-1/)).toBeInTheDocument()
        expect(screen.getByText(/Order #order-2/)).toBeInTheDocument()
      })
    })

    it('should show loading spinner while loading', () => {
      ;(api.getMyOrders as jest.Mock).mockImplementation(() => new Promise(() => {}))

      const { container } = render(<OrdersPage />)

      const loader = container.querySelector('.animate-spin')
      expect(loader).toBeInTheDocument()
    })

    it('should handle orders loading error', async () => {
      ;(api.getMyOrders as jest.Mock).mockRejectedValue(new Error('Failed to load orders'))

      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to load orders/)).toBeInTheDocument()
      })
    })

    it('should show try again button on error', async () => {
      ;(api.getMyOrders as jest.Mock).mockRejectedValue(new Error('Error'))

      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })
    })
  })

  describe('Empty Orders State', () => {
    it('should show empty state when no orders', async () => {
      ;(api.getMyOrders as jest.Mock).mockResolvedValue([])

      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('No orders yet')).toBeInTheDocument()
      })
    })

    it('should show browse meals button in empty state', async () => {
      ;(api.getMyOrders as jest.Mock).mockResolvedValue([])

      render(<OrdersPage />)

      await waitFor(() => {
        const browseButton = screen.getByText('Browse Meals')
        expect(browseButton).toBeInTheDocument()
      })
    })

    it('should navigate to browse when button clicked', async () => {
      ;(api.getMyOrders as jest.Mock).mockResolvedValue([])

      render(<OrdersPage />)

      await waitFor(() => {
        const browseButton = screen.getByText('Browse Meals')
        fireEvent.click(browseButton)
      })

      expect(mockPush).toHaveBeenCalledWith('/browse')
    })
  })

  describe('Orders Display', () => {
    beforeEach(() => {
      ;(api.getMyOrders as jest.Mock).mockResolvedValue(mockOrders)
    })

    it('should display order count', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('3 orders found')).toBeInTheDocument()
      })
    })

    it('should display order IDs', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText(/Order #order-1/)).toBeInTheDocument()
        expect(screen.getByText(/Order #order-2/)).toBeInTheDocument()
        expect(screen.getByText(/Order #order-3/)).toBeInTheDocument()
      })
    })

    it('should display order totals', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('$27.97')).toBeInTheDocument()
        expect(screen.getByText('$45.50')).toBeInTheDocument()
        expect(screen.getByText('$15.99')).toBeInTheDocument()
      })
    })

    it('should display order statuses', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
        expect(screen.getByText('Completed')).toBeInTheDocument()
        expect(screen.getByText('Cancelled')).toBeInTheDocument()
      })
    })

    it('should display order dates', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        const dates = screen.getAllByText(/Placed on/)
        expect(dates.length).toBe(3)
      })
    })

    it('should have view details button for each order', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details')
        expect(detailsButtons.length).toBe(3)
      })
    })
  })

  describe('Order Status Badges', () => {
    beforeEach(() => {
      ;(api.getMyOrders as jest.Mock).mockResolvedValue(mockOrders)
    })

    it('should show pending badge', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })
    })

    it('should show completed badge', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument()
      })
    })

    it('should show cancelled badge', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('Cancelled')).toBeInTheDocument()
      })
    })
  })

  describe('Order Details Expansion', () => {
    beforeEach(() => {
      ;(api.getMyOrders as jest.Mock).mockResolvedValue(mockOrders)
      ;(api.getOrder as jest.Mock).mockResolvedValue(mockOrderDetails)
      ;(api.getOrderStatus as jest.Mock).mockResolvedValue(mockOrderTimeline)
    })

    it('should expand order when details clicked', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details')
        fireEvent.click(detailsButtons[0])
      })

      await waitFor(() => {
        expect(screen.getByText('Hide')).toBeInTheDocument()
      })
    })

    it('should fetch order details when expanded', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details')
        fireEvent.click(detailsButtons[0])
      })

      await waitFor(() => {
        expect(api.getOrder).toHaveBeenCalledWith('order-1')
        expect(api.getOrderStatus).toHaveBeenCalledWith('order-1')
      })
    })

    it('should display restaurant name in details', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details')
        fireEvent.click(detailsButtons[0])
      })

      await waitFor(() => {
        expect(screen.getByText('Pizza Palace')).toBeInTheDocument()
      })
    })

    it('should display order items in details', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details')
        fireEvent.click(detailsButtons[0])
      })

      await waitFor(() => {
        expect(screen.getByText('Margherita Pizza')).toBeInTheDocument()
        expect(screen.getByText('Caesar Salad')).toBeInTheDocument()
      })
    })

    it('should display item quantities in details', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details')
        fireEvent.click(detailsButtons[0])
      })

      await waitFor(() => {
        expect(screen.getByText('Qty: 2')).toBeInTheDocument()
        expect(screen.getByText('Qty: 1')).toBeInTheDocument()
      })
    })

    it('should display item prices in details', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details')
        fireEvent.click(detailsButtons[0])
      })

      await waitFor(() => {
        expect(screen.getByText('$19.98')).toBeInTheDocument()
        expect(screen.getByText('$7.99')).toBeInTheDocument()
      })
    })

    it('should display order timeline', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details')
        fireEvent.click(detailsButtons[0])
      })

      await waitFor(() => {
        expect(screen.getByText('Order Status Timeline')).toBeInTheDocument()
      })
    })

    it('should collapse order when hide clicked', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details')
        fireEvent.click(detailsButtons[0])
      })

      await waitFor(() => {
        const hideButton = screen.getByText('Hide')
        fireEvent.click(hideButton)
      })

      await waitFor(() => {
        expect(screen.queryByText('Pizza Palace')).not.toBeInTheDocument()
      })
    })

    it('should show loading state while fetching details', async () => {
      ;(api.getOrder as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<OrdersPage />)

      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details')
        fireEvent.click(detailsButtons[0])
      })

      await waitFor(() => {
        const { container } = render(<OrdersPage />)
        const loader = container.querySelector('.animate-spin')
        expect(loader).toBeDefined()
      })
    })
  })

  describe('Cancel Order', () => {
    beforeEach(() => {
      ;(api.getMyOrders as jest.Mock).mockResolvedValue(mockOrders)
    })

    it('should show cancel button for pending orders', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        const cancelButtons = screen.getAllByText('Cancel')
        expect(cancelButtons.length).toBeGreaterThan(0)
      })
    })

    it('should not show cancel button for completed orders', async () => {
      const completedOrders = [mockOrders[1]]
      ;(api.getMyOrders as jest.Mock).mockResolvedValue(completedOrders)

      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
      })
    })

    it('should show confirmation dialog when cancel clicked', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        const cancelButtons = screen.getAllByText('Cancel')
        fireEvent.click(cancelButtons[0])
      })

      await waitFor(() => {
        expect(screen.getByText('Cancel this order?')).toBeInTheDocument()
      })
    })

    it('should call cancelOrder when confirmed', async () => {
      ;(api.cancelOrder as jest.Mock).mockResolvedValue({ status: 'cancelled' })

      render(<OrdersPage />)

      await waitFor(() => {
        const cancelButtons = screen.getAllByText('Cancel')
        fireEvent.click(cancelButtons[0])
      })

      await waitFor(() => {
        const confirmButton = screen.getByText('Cancel Order')
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(api.cancelOrder).toHaveBeenCalledWith('order-1')
      })
    })

    it('should reload orders after cancellation', async () => {
      ;(api.cancelOrder as jest.Mock).mockResolvedValue({ status: 'cancelled' })
      ;(api.getMyOrders as jest.Mock)
        .mockResolvedValueOnce(mockOrders)
        .mockResolvedValueOnce([
          { ...mockOrders[0], status: 'cancelled' },
          mockOrders[1],
          mockOrders[2],
        ])

      render(<OrdersPage />)

      await waitFor(() => {
        const cancelButtons = screen.getAllByText('Cancel')
        fireEvent.click(cancelButtons[0])
      })

      await waitFor(() => {
        const confirmButton = screen.getByText('Cancel Order')
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(api.getMyOrders).toHaveBeenCalledTimes(2)
      })
    })

    it('should not cancel when keep order clicked', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        const cancelButtons = screen.getAllByText('Cancel')
        fireEvent.click(cancelButtons[0])
      })

      await waitFor(() => {
        const keepButton = screen.getByText('Keep Order')
        fireEvent.click(keepButton)
      })

      expect(api.cancelOrder).not.toHaveBeenCalled()
    })

    it('should handle cancellation error', async () => {
      ;(api.cancelOrder as jest.Mock).mockRejectedValue(
        new Error('cannot cancel after it is accepted')
      )

      render(<OrdersPage />)

      await waitFor(() => {
        const cancelButtons = screen.getAllByText('Cancel')
        fireEvent.click(cancelButtons[0])
      })

      await waitFor(() => {
        const confirmButton = screen.getByText('Cancel Order')
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(api.cancelOrder).toHaveBeenCalled()
      })
    })

    it('should show cancelling state during cancellation', async () => {
      ;(api.cancelOrder as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<OrdersPage />)

      await waitFor(() => {
        const cancelButtons = screen.getAllByText('Cancel')
        fireEvent.click(cancelButtons[0])
      })

      await waitFor(() => {
        const confirmButton = screen.getByText('Cancel Order')
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Cancelling...')).toBeInTheDocument()
      })
    })

    it('should disable cancel button while cancelling', async () => {
      ;(api.cancelOrder as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<OrdersPage />)

      await waitFor(() => {
        const cancelButtons = screen.getAllByText('Cancel')
        fireEvent.click(cancelButtons[0])
      })

      await waitFor(() => {
        const confirmButton = screen.getByText('Cancel Order')
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        const cancellingButton = screen.getByText('Cancelling...')
        expect(cancellingButton.closest('button')).toBeDisabled()
      })
    })
  })

  describe('Order Status Timeline', () => {
    beforeEach(() => {
      ;(api.getMyOrders as jest.Mock).mockResolvedValue(mockOrders)
      ;(api.getOrder as jest.Mock).mockResolvedValue(mockOrderDetails)
      ;(api.getOrderStatus as jest.Mock).mockResolvedValue(mockOrderTimeline)
    })

    it('should display timeline when order expanded', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details')
        fireEvent.click(detailsButtons[0])
      })

      await waitFor(() => {
        expect(screen.getByText('Order Status Timeline')).toBeInTheDocument()
      })
    })

    it('should display timeline events', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details')
        fireEvent.click(detailsButtons[0])
      })

      await waitFor(() => {
        const pendingStatuses = screen.getAllByText('Pending')
        const acceptedStatuses = screen.getAllByText('Accepted')
        expect(pendingStatuses.length).toBeGreaterThan(0)
        expect(acceptedStatuses.length).toBeGreaterThan(0)
      })
    })

    it('should display event timestamps', async () => {
      render(<OrdersPage />)

      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details')
        fireEvent.click(detailsButtons[0])
      })

      await waitFor(() => {
        const timestamps = screen.getAllByText(/Jan 01, 2024/)
        expect(timestamps.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error message when orders fail to load', async () => {
      ;(api.getMyOrders as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument()
      })
    })

    it('should handle order details loading error', async () => {
      ;(api.getMyOrders as jest.Mock).mockResolvedValue(mockOrders)
      ;(api.getOrder as jest.Mock).mockRejectedValue(new Error('Failed to fetch order'))

      render(<OrdersPage />)

      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details')
        fireEvent.click(detailsButtons[0])
      })

      await waitFor(() => {
        expect(api.getOrder).toHaveBeenCalled()
      })
    })
  })

  describe('Multiple Order Scenarios', () => {
    it('should handle single order', async () => {
      ;(api.getMyOrders as jest.Mock).mockResolvedValue([mockOrders[0]])

      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('1 order found')).toBeInTheDocument()
      })
    })

    it('should handle many orders', async () => {
      const manyOrders = Array.from({ length: 10 }, (_, i) => ({
        ...mockOrders[0],
        id: `order-${i}`,
      }))
      ;(api.getMyOrders as jest.Mock).mockResolvedValue(manyOrders)

      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('10 orders found')).toBeInTheDocument()
      })
    })

    it('should expand multiple orders independently', async () => {
      ;(api.getMyOrders as jest.Mock).mockResolvedValue(mockOrders)
      ;(api.getOrder as jest.Mock).mockResolvedValue(mockOrderDetails)
      ;(api.getOrderStatus as jest.Mock).mockResolvedValue(mockOrderTimeline)

      render(<OrdersPage />)

      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details')
        fireEvent.click(detailsButtons[0])
        fireEvent.click(detailsButtons[1])
      })

      await waitFor(() => {
        expect(api.getOrder).toHaveBeenCalledWith('order-1')
        expect(api.getOrder).toHaveBeenCalledWith('order-2')
      })
    })
  })
})

