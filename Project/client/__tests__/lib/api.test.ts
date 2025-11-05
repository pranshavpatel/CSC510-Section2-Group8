import * as api from '@/lib/api'
import { authenticatedFetch } from '@/context/auth-context'

// Mock the auth context
jest.mock('@/context/auth-context', () => ({
  authenticatedFetch: jest.fn(),
}))

describe('API Functions', () => {
  const mockAuthFetch = authenticatedFetch as jest.MockedFunction<typeof authenticatedFetch>
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Cart API', () => {
    describe('getCart', () => {
      it('should call authenticated fetch with correct URL', async () => {
        const mockCart = { cart_id: 'cart-1', items: [], cart_total: 0 }
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCart,
        } as Response)

        await api.getCart()

        expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/cart`)
      })

      it('should return cart data on success', async () => {
        const mockCart = { cart_id: 'cart-1', items: [], cart_total: 0 }
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCart,
        } as Response)

        const result = await api.getCart()

        expect(result).toEqual(mockCart)
      })

      it('should throw error on failed response', async () => {
        mockAuthFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response)

        await expect(api.getCart()).rejects.toThrow('Failed to fetch cart')
      })
    })

    describe('addToCart', () => {
      it('should call authenticated fetch with correct parameters', async () => {
        const mockCart = { cart_id: 'cart-1', items: [], cart_total: 0 }
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCart,
        } as Response)

        await api.addToCart('meal-123', 2)

        expect(mockAuthFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/cart/items`,
          {
            method: 'POST',
            body: JSON.stringify({ meal_id: 'meal-123', qty: 2 }),
          }
        )
      })

      it('should use default quantity of 1', async () => {
        const mockCart = { cart_id: 'cart-1', items: [], cart_total: 0 }
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCart,
        } as Response)

        await api.addToCart('meal-123')

        expect(mockAuthFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/cart/items`,
          {
            method: 'POST',
            body: JSON.stringify({ meal_id: 'meal-123', qty: 1 }),
          }
        )
      })

      it('should throw error with detail on failed response', async () => {
        mockAuthFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ detail: 'Item not available' }),
        } as Response)

        await expect(api.addToCart('meal-123', 2)).rejects.toThrow('Item not available')
      })

      it('should throw default error if no detail provided', async () => {
        mockAuthFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        } as Response)

        await expect(api.addToCart('meal-123', 2)).rejects.toThrow('Failed to add item to cart')
      })
    })

    describe('updateCartItem', () => {
      it('should call authenticated fetch with correct parameters', async () => {
        const mockCart = { cart_id: 'cart-1', items: [], cart_total: 0 }
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCart,
        } as Response)

        await api.updateCartItem('item-123', 3)

        expect(mockAuthFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/cart/items/item-123?qty=3`,
          {
            method: 'PATCH',
          }
        )
      })

      it('should throw error on failed response', async () => {
        mockAuthFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ detail: 'Quantity exceeds available stock' }),
        } as Response)

        await expect(api.updateCartItem('item-123', 10)).rejects.toThrow(
          'Quantity exceeds available stock'
        )
      })
    })

    describe('removeFromCart', () => {
      it('should call authenticated fetch with correct parameters', async () => {
        const mockCart = { cart_id: 'cart-1', items: [], cart_total: 0 }
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCart,
        } as Response)

        await api.removeFromCart('item-123')

        expect(mockAuthFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/cart/items/item-123`,
          {
            method: 'DELETE',
          }
        )
      })

      it('should throw error on failed response', async () => {
        mockAuthFetch.mockResolvedValueOnce({
          ok: false,
        } as Response)

        await expect(api.removeFromCart('item-123')).rejects.toThrow(
          'Failed to remove item from cart'
        )
      })
    })

    describe('clearCart', () => {
      it('should call authenticated fetch with correct parameters', async () => {
        const mockCart = { cart_id: 'cart-1', items: [], cart_total: 0 }
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCart,
        } as Response)

        await api.clearCart()

        expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/cart`, {
          method: 'DELETE',
        })
      })

      it('should throw error on failed response', async () => {
        mockAuthFetch.mockResolvedValueOnce({
          ok: false,
        } as Response)

        await expect(api.clearCart()).rejects.toThrow('Failed to clear cart')
      })
    })

    describe('checkoutCart', () => {
      it('should call authenticated fetch with correct parameters', async () => {
        const mockCheckoutResult = { order_id: 'order-123', status: 'pending', total: 27.97 }
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCheckoutResult,
        } as Response)

        await api.checkoutCart()

        expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/cart/checkout`, {
          method: 'POST',
        })
      })

      it('should return checkout result on success', async () => {
        const mockCheckoutResult = { order_id: 'order-123', status: 'pending', total: 27.97 }
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCheckoutResult,
        } as Response)

        const result = await api.checkoutCart()

        expect(result).toEqual(mockCheckoutResult)
      })

      it('should throw error with detail on failed response', async () => {
        mockAuthFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ detail: 'cart is empty' }),
        } as Response)

        await expect(api.checkoutCart()).rejects.toThrow('cart is empty')
      })

      it('should throw default error if no detail provided', async () => {
        mockAuthFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        } as Response)

        await expect(api.checkoutCart()).rejects.toThrow('Failed to checkout')
      })
    })
  })

  describe('Orders API', () => {
    describe('getMyOrders', () => {
      it('should call authenticated fetch with correct URL and default limit', async () => {
        const mockOrders: Array<{ id: string; status: string; total: number }> = []
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockOrders,
        } as Response)

        await api.getMyOrders()

        expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/orders/mine?limit=50`)
      })

      it('should call authenticated fetch with custom limit', async () => {
        const mockOrders: Array<{ id: string; status: string; total: number }> = []
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockOrders,
        } as Response)

        await api.getMyOrders(20)

        expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/orders/mine?limit=20`)
      })

      it('should return orders list on success', async () => {
        const mockOrders = [
          { id: 'order-1', status: 'pending', total: 27.97 },
          { id: 'order-2', status: 'completed', total: 45.50 },
        ]
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockOrders,
        } as Response)

        const result = await api.getMyOrders()

        expect(result).toEqual(mockOrders)
      })

      it('should throw error on failed response', async () => {
        mockAuthFetch.mockResolvedValueOnce({
          ok: false,
        } as Response)

        await expect(api.getMyOrders()).rejects.toThrow('Failed to fetch orders')
      })
    })

    describe('getOrder', () => {
      it('should call authenticated fetch with correct URL', async () => {
        const mockOrder = {
          order: { id: 'order-123', total: 27.97 },
          items: [],
        }
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockOrder,
        } as Response)

        await api.getOrder('order-123')

        expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/orders/order-123`)
      })

      it('should return order details on success', async () => {
        const mockOrder = {
          order: { id: 'order-123', total: 27.97 },
          items: [{ id: 'item-1', meal_name: 'Pizza', qty: 2 }],
        }
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockOrder,
        } as Response)

        const result = await api.getOrder('order-123')

        expect(result).toEqual(mockOrder)
      })

      it('should throw error with detail on failed response', async () => {
        mockAuthFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ detail: 'Order not found' }),
        } as Response)

        await expect(api.getOrder('order-123')).rejects.toThrow('Order not found')
      })

      it('should throw default error if no detail provided', async () => {
        mockAuthFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        } as Response)

        await expect(api.getOrder('order-123')).rejects.toThrow('Failed to fetch order')
      })
    })

    describe('getOrderStatus', () => {
      it('should call authenticated fetch with correct URL', async () => {
        const mockTimeline = {
          order_id: 'order-123',
          timeline: [{ status: 'pending', created_at: '2024-01-01' }],
        }
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTimeline,
        } as Response)

        await api.getOrderStatus('order-123')

        expect(mockAuthFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/orders/order-123/status`
        )
      })

      it('should return order timeline on success', async () => {
        const mockTimeline = {
          order_id: 'order-123',
          timeline: [
            { status: 'pending', created_at: '2024-01-01' },
            { status: 'accepted', created_at: '2024-01-02' },
          ],
        }
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTimeline,
        } as Response)

        const result = await api.getOrderStatus('order-123')

        expect(result).toEqual(mockTimeline)
      })

      it('should throw error with detail on failed response', async () => {
        mockAuthFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ detail: 'Order not found' }),
        } as Response)

        await expect(api.getOrderStatus('order-123')).rejects.toThrow('Order not found')
      })

      it('should throw default error if no detail provided', async () => {
        mockAuthFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        } as Response)

        await expect(api.getOrderStatus('order-123')).rejects.toThrow(
          'Failed to fetch order status'
        )
      })
    })

    describe('cancelOrder', () => {
      it('should call authenticated fetch with correct parameters', async () => {
        const mockResult = { status: 'cancelled', order_id: 'order-123' }
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResult,
        } as Response)

        await api.cancelOrder('order-123')

        expect(mockAuthFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/orders/order-123/cancel`,
          {
            method: 'PATCH',
          }
        )
      })

      it('should return cancellation result on success', async () => {
        const mockResult = { status: 'cancelled', order_id: 'order-123' }
        mockAuthFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResult,
        } as Response)

        const result = await api.cancelOrder('order-123')

        expect(result).toEqual(mockResult)
      })

      it('should throw error with detail on failed response', async () => {
        mockAuthFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ detail: 'cannot cancel after it is accepted' }),
        } as Response)

        await expect(api.cancelOrder('order-123')).rejects.toThrow(
          'cannot cancel after it is accepted'
        )
      })

      it('should throw default error if no detail provided', async () => {
        mockAuthFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        } as Response)

        await expect(api.cancelOrder('order-123')).rejects.toThrow('Failed to cancel order')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors in getCart', async () => {
      mockAuthFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(api.getCart()).rejects.toThrow('Network error')
    })

    it('should handle network errors in addToCart', async () => {
      mockAuthFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(api.addToCart('meal-123', 1)).rejects.toThrow('Network error')
    })

    it('should handle network errors in getMyOrders', async () => {
      mockAuthFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(api.getMyOrders()).rejects.toThrow('Network error')
    })

    it('should handle network errors in cancelOrder', async () => {
      mockAuthFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(api.cancelOrder('order-123')).rejects.toThrow('Network error')
    })
  })
})

