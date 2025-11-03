import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import SignupPage from '@/app/signup/page'
import { useAuth } from '@/context/auth-context'
import { hashPassword } from '@/lib/crypto-utils'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock auth context
jest.mock('@/context/auth-context', () => ({
  useAuth: jest.fn(),
}))

// Mock crypto utils
jest.mock('@/lib/crypto-utils', () => ({
  hashPassword: jest.fn(),
}))

// Mock toast
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

describe('SignupPage', () => {
  const mockPush = jest.fn()
  const mockSignup = jest.fn()
  const mockRouter = {
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue({
      signup: mockSignup,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
    ;(hashPassword as jest.Mock).mockResolvedValue('hashedpassword123')
  })

  describe('Initial Rendering', () => {
    it('should render the signup page', () => {
      render(<SignupPage />)
      
      expect(screen.getByText('Join VibeDish')).toBeInTheDocument()
      expect(screen.getByText('Create an account to get started')).toBeInTheDocument()
    })

    it('should render Create Customer Account card', () => {
      render(<SignupPage />)
      
      expect(screen.getByText('Create Customer Account')).toBeInTheDocument()
      expect(screen.getByText('Start discovering mood-based meal recommendations')).toBeInTheDocument()
    })

    it('should render full name input field', () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      expect(nameInput).toBeInTheDocument()
      expect(nameInput).toHaveAttribute('type', 'text')
      expect(nameInput).toHaveAttribute('placeholder', 'John Doe')
    })

    it('should render email input field', () => {
      render(<SignupPage />)
      
      const emailInput = screen.getByLabelText('Email')
      expect(emailInput).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('placeholder', 'you@example.com')
    })

    it('should render password input field', () => {
      render(<SignupPage />)
      
      const passwordInput = screen.getByLabelText('Password')
      expect(passwordInput).toBeInTheDocument()
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('placeholder', '••••••••')
    })

    it('should render confirm password input field', () => {
      render(<SignupPage />)
      
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      expect(confirmPasswordInput).toBeInTheDocument()
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('placeholder', '••••••••')
    })

    it('should render password requirement hint', () => {
      render(<SignupPage />)
      
      expect(screen.getByText('Must be at least 6 characters')).toBeInTheDocument()
    })

    it('should render Create Account button', () => {
      render(<SignupPage />)
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      expect(createAccountButton).toBeInTheDocument()
      expect(createAccountButton).not.toBeDisabled()
    })

    it('should render link to login page', () => {
      render(<SignupPage />)
      
      expect(screen.getByText('Already have an account?')).toBeInTheDocument()
      const signInLink = screen.getByRole('link', { name: /sign in/i })
      expect(signInLink).toHaveAttribute('href', '/login')
    })

    it('should render logo with Leaf icon', () => {
      const { container } = render(<SignupPage />)
      
      const logo = container.querySelector('.bg-primary')
      expect(logo).toBeInTheDocument()
    })
  })

  describe('Form Input Handling', () => {
    it('should update name state when typing', () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name') as HTMLInputElement
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      
      expect(nameInput.value).toBe('John Doe')
    })

    it('should update email state when typing', () => {
      render(<SignupPage />)
      
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      
      expect(emailInput.value).toBe('test@example.com')
    })

    it('should update password state when typing', () => {
      render(<SignupPage />)
      
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      expect(passwordInput.value).toBe('password123')
    })

    it('should update confirm password state when typing', () => {
      render(<SignupPage />)
      
      const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      expect(confirmPasswordInput.value).toBe('password123')
    })

    it('should clear input when value is deleted', () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name') as HTMLInputElement
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(nameInput, { target: { value: '' } })
      
      expect(nameInput.value).toBe('')
    })
  })

  describe('Validation - Empty Fields', () => {
    it('should show error when submitting empty form', async () => {
      render(<SignupPage />)
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please fill in all fields',
          variant: 'destructive',
        })
      })
    })

    it('should show error when name is empty', async () => {
      render(<SignupPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please fill in all fields',
          variant: 'destructive',
        })
      })
    })

    it('should show error when email is empty', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please fill in all fields',
          variant: 'destructive',
        })
      })
    })

    it('should show error when password is empty', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please fill in all fields',
          variant: 'destructive',
        })
      })
    })

    it('should show error when confirm password is empty', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please fill in all fields',
          variant: 'destructive',
        })
      })
    })
  })

  describe('Validation - Email Format', () => {
    it('should show error for invalid email format', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'invalidemail' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        })
      })
    })

    it('should show error for email without @', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'testexample.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        })
      })
    })

    it('should accept valid email format', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).not.toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Please enter a valid email address',
          })
        )
      })
    })
  })

  describe('Validation - Password Length', () => {
    it('should show error when password is less than 6 characters', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: '12345' } })
      fireEvent.change(confirmPasswordInput, { target: { value: '12345' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Password must be at least 6 characters long',
          variant: 'destructive',
        })
      })
    })

    it('should accept password with exactly 6 characters', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: '123456' } })
      fireEvent.change(confirmPasswordInput, { target: { value: '123456' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).not.toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Password must be at least 6 characters long',
          })
        )
      })
    })
  })

  describe('Validation - Password Matching', () => {
    it('should show error when passwords do not match', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Passwords do not match',
          variant: 'destructive',
        })
      })
    })

    it('should accept when passwords match', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).not.toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Passwords do not match',
          })
        )
      })
    })
  })

  describe('Successful Signup', () => {
    it('should hash password before signup', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(hashPassword).toHaveBeenCalledWith('password123')
      })
    })

    it('should call signup with correct parameters', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith('test@example.com', 'hashedpassword123', 'John Doe')
      })
    })

    it('should show success toast on successful signup', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Account created successfully. Please login to continue.',
        })
      })
    })

    it('should redirect to login page after successful signup', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('should show loading state during signup', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      expect(screen.getByText('Creating account...')).toBeInTheDocument()
    })

    it('should disable button during signup', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      const loadingButton = screen.getByRole('button', { name: /creating account/i })
      expect(loadingButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should show error toast on signup failure', async () => {
      mockSignup.mockRejectedValueOnce(new Error('Email already exists'))
      
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Email already exists',
          variant: 'destructive',
        })
      })
    })

    it('should show generic error message for non-Error objects', async () => {
      mockSignup.mockRejectedValueOnce('String error')
      
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Signup failed. Please try again.',
          variant: 'destructive',
        })
      })
    })

    it('should re-enable button after error', async () => {
      mockSignup.mockRejectedValueOnce(new Error('Signup failed'))
      
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled()
      })
      
      const button = screen.getByRole('button', { name: /create account/i })
      expect(button).not.toBeDisabled()
    })

    it('should handle network errors', async () => {
      mockSignup.mockRejectedValueOnce(new Error('Network error'))
      
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Network error',
          variant: 'destructive',
        })
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle name with special characters', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: "O'Brien" } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith('test@example.com', 'hashedpassword123', "O'Brien")
      })
    })

    it('should handle email with subdomain', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@mail.example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith('test@mail.example.com', 'hashedpassword123', 'John Doe')
      })
    })

    it('should handle password with special characters', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'P@ssw0rd!' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'P@ssw0rd!' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(hashPassword).toHaveBeenCalledWith('P@ssw0rd!')
      })
    })

    it('should handle long names', async () => {
      const longName = 'John Jacob Jingleheimer Schmidt'
      
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: longName } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith('test@example.com', 'hashedpassword123', longName)
      })
    })
  })

  describe('Validation Order', () => {
    it('should validate required fields before email format', async () => {
      render(<SignupPage />)
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please fill in all fields',
          variant: 'destructive',
        })
      })
      
      expect(mockToast).not.toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Please enter a valid email address',
        })
      )
    })

    it('should validate email format before password length', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'invalid' } })
      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: '123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        })
      })
    })

    it('should validate password length before password matching', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: '456' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Password must be at least 6 characters long',
          variant: 'destructive',
        })
      })
    })
  })

  describe('Multiple Submission Prevention', () => {
    it('should not allow multiple simultaneous submissions', async () => {
      render(<SignupPage />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(createAccountButton)
      fireEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledTimes(1)
      })
    })
  })
})

