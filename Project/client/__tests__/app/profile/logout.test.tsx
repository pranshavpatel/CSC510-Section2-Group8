import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/context/auth-context'
import { Header } from '@/components/header'
import * as api from '@/lib/api'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))
jest.mock('@/context/auth-context')
jest.mock('@/lib/api')

describe('Logout Functionality', () => {
  const mockLogout = jest.fn()
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'customer' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      ownerSignup: jest.fn(),
    })
  })

  describe('Logout Button', () => {
    it('renders logout button when user is authenticated', () => {
      render(<Header />)

      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
    })

    it('does not render logout button when user is not authenticated', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: null,
        logout: mockLogout,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        signup: jest.fn(),
        ownerSignup: jest.fn(),
      })

      render(<Header />)

      expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    })

    it('calls logout function when clicked', async () => {
      render(<Header />)

      const logoutButton = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(logoutButton)

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Logout API Integration', () => {
    beforeEach(() => {
      Storage.prototype.getItem = jest.fn((key) => {
        if (key === 'access_token') return 'test-token'
        if (key === 'refresh_token') return 'test-refresh-token'
        if (key === 'user') return JSON.stringify(mockUser)
        return null
      })
      Storage.prototype.removeItem = jest.fn()
    })

    it('calls logout API with access token', async () => {
      ;(api.logoutUser as jest.Mock).mockResolvedValue({ ok: true })

      await api.logoutUser()

      expect(api.logoutUser).toHaveBeenCalled()
    })

    it('handles logout API success', async () => {
      ;(api.logoutUser as jest.Mock).mockResolvedValue({ ok: true })

      const result = await api.logoutUser()

      expect(result).toEqual({ ok: true })
    })

    it('handles logout API failure gracefully', async () => {
      ;(api.logoutUser as jest.Mock).mockRejectedValue(
        new Error('Logout failed')
      )

      await expect(api.logoutUser()).rejects.toThrow('Logout failed')
    })

    it('clears local storage on logout', async () => {
      const mockRemoveItem = jest.fn()
      Storage.prototype.removeItem = mockRemoveItem

      render(<Header />)

      const logoutButton = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(logoutButton)

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled()
      })
    })
  })

  describe('User Display', () => {
    it('displays user name when authenticated', () => {
      render(<Header />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('displays profile link when authenticated', () => {
      render(<Header />)

      const profileLink = screen.getByRole('link', { name: /test user/i })
      expect(profileLink).toHaveAttribute('href', '/profile')
    })
  })

  describe('Navigation After Logout', () => {
    it('shows login button after logout', async () => {
      const { rerender } = render(<Header />)

      const logoutButton = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(logoutButton)

      ;(useAuth as jest.Mock).mockReturnValue({
        user: null,
        logout: mockLogout,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        signup: jest.fn(),
        ownerSignup: jest.fn(),
      })

      rerender(<Header />)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Scenarios', () => {
    it('handles logout when no access token exists', async () => {
      Storage.prototype.getItem = jest.fn(() => null)
      ;(api.logoutUser as jest.Mock).mockResolvedValue({ ok: true })

      const result = await api.logoutUser()

      expect(result).toEqual({ ok: true })
    })

    it('continues logout even if API call fails', async () => {
      ;(api.logoutUser as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )

      render(<Header />)

      const logoutButton = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(logoutButton)

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled()
      })
    })
  })
})
