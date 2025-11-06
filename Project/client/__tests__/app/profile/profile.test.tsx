import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import ProfilePage from '@/app/profile/page'
import * as api from '@/lib/api'

jest.mock('next/navigation')
jest.mock('@/context/auth-context')
jest.mock('@/lib/api')

describe('Profile Page', () => {
  const mockRouter = {
    push: jest.fn(),
  }

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'customer' as const,
  }

  const mockAuth = {
    user: mockUser,
    logout: jest.fn(),
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    signup: jest.fn(),
    ownerSignup: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue(mockAuth)
  })

  describe('Authentication', () => {
    it('redirects to login if user is not authenticated', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        user: null,
        isAuthenticated: false,
      })

      render(<ProfilePage />)

      expect(mockRouter.push).toHaveBeenCalledWith('/login')
    })

    it('renders profile page when user is authenticated', async () => {
      ;(api.getProfile as jest.Mock).mockResolvedValue(mockUser)

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })
    })
  })

  describe('Profile Display', () => {
    it('displays user email (read-only)', async () => {
      ;(api.getProfile as jest.Mock).mockResolvedValue(mockUser)

      render(<ProfilePage />)

      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('test@example.com')
        expect(emailInput).toBeDisabled()
      })
    })

    it('displays user name (editable)', async () => {
      ;(api.getProfile as jest.Mock).mockResolvedValue(mockUser)

      render(<ProfilePage />)

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('Test User')
        expect(nameInput).not.toBeDisabled()
      })
    })

    it('displays user role (read-only)', async () => {
      ;(api.getProfile as jest.Mock).mockResolvedValue(mockUser)

      render(<ProfilePage />)

      await waitFor(() => {
        const roleInput = screen.getByDisplayValue('customer')
        expect(roleInput).toBeDisabled()
      })
    })

    it('shows loading state while fetching profile', () => {
      ;(api.getProfile as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      )

      render(<ProfilePage />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('Update Profile', () => {
    it('updates user name successfully', async () => {
      ;(api.getProfile as jest.Mock).mockResolvedValue(mockUser)
      ;(api.updateProfile as jest.Mock).mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
      })

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      })

      const nameInput = screen.getByDisplayValue('Test User')
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } })

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(api.updateProfile).toHaveBeenCalledWith({ name: 'Updated Name' })
        expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
      })
    })

    it('shows error message on update failure', async () => {
      ;(api.getProfile as jest.Mock).mockResolvedValue(mockUser)
      ;(api.updateProfile as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      )

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      })

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument()
      })
    })

    it('disables save button while saving', async () => {
      ;(api.getProfile as jest.Mock).mockResolvedValue(mockUser)
      ;(api.updateProfile as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      )

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      })

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument()
        expect(saveButton).toBeDisabled()
      })
    })
  })

  describe('Delete Account', () => {
    it('shows confirmation dialog when delete is clicked', async () => {
      ;(api.getProfile as jest.Mock).mockResolvedValue(mockUser)

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /delete account/i })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument()
      })
    })

    it('deletes account and logs out on confirmation', async () => {
      ;(api.getProfile as jest.Mock).mockResolvedValue(mockUser)
      ;(api.deleteAccount as jest.Mock).mockResolvedValue({ ok: true })

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /delete account/i })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete account/i })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(api.deleteAccount).toHaveBeenCalled()
        expect(mockAuth.logout).toHaveBeenCalled()
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })
    })

    it('shows error message on delete failure', async () => {
      ;(api.getProfile as jest.Mock).mockResolvedValue(mockUser)
      ;(api.deleteAccount as jest.Mock).mockRejectedValue(
        new Error('Delete failed')
      )

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /delete account/i })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete account/i })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error when profile fetch fails', async () => {
      ;(api.getProfile as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch profile')
      )

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch profile')).toBeInTheDocument()
      })
    })
  })
})
