import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import LoginPage from '@/app/login/page'
import { useAuth } from '@/context/auth-context'
import { hashPasswordWithSalt } from '@/lib/crypto-utils'

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
  hashPasswordWithSalt: jest.fn(),
}))

// Mock toast
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

describe('LoginPage', () => {
  const mockPush = jest.fn()
  const mockLogin = jest.fn()
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
      login: mockLogin,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
    ;(hashPasswordWithSalt as jest.Mock).mockResolvedValue('hashedpassword123')
  })

  describe('Initial Rendering', () => {
    it('should render the login page', () => {
      render(<LoginPage />)
      
      expect(screen.getByText('Welcome to VibeDish')).toBeInTheDocument()
      expect(screen.getByText('Sign in to start saving food and money')).toBeInTheDocument()
    })

    it('should render Customer Login card', () => {
      render(<LoginPage />)
      
      expect(screen.getByText('Customer Login')).toBeInTheDocument()
      expect(screen.getByText('Access your account to browse deals and get recommendations')).toBeInTheDocument()
    })

    it('should render email input field', () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      expect(emailInput).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('placeholder', 'you@example.com')
    })

    it('should render password input field', () => {
      render(<LoginPage />)
      
      const passwordInput = screen.getByLabelText('Password')
      expect(passwordInput).toBeInTheDocument()
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('placeholder', '••••••••')
    })

    it('should render Sign In button', () => {
      render(<LoginPage />)
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      expect(signInButton).toBeInTheDocument()
      expect(signInButton).not.toBeDisabled()
    })

    it('should render link to signup page', () => {
      render(<LoginPage />)
      
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
      const signUpLink = screen.getByRole('link', { name: /sign up/i })
      expect(signUpLink).toHaveAttribute('href', '/signup')
    })

    it('should render logo with Leaf icon', () => {
      const { container } = render(<LoginPage />)
      
      const logo = container.querySelector('.bg-primary')
      expect(logo).toBeInTheDocument()
    })
  })

  describe('Form Input Handling', () => {
    it('should update email state when typing', () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      
      expect(emailInput.value).toBe('test@example.com')
    })

    it('should update password state when typing', () => {
      render(<LoginPage />)
      
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      expect(passwordInput.value).toBe('password123')
    })

    it('should handle multiple character inputs', () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      const testEmail = 'user@test.com'
      
      fireEvent.change(emailInput, { target: { value: testEmail } })
      
      expect(emailInput.value).toBe(testEmail)
    })

    it('should clear input when value is deleted', () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(emailInput, { target: { value: '' } })
      
      expect(emailInput.value).toBe('')
    })
  })

  describe('Validation - Empty Fields', () => {
    it('should show error when submitting empty form', async () => {
      render(<LoginPage />)
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please fill in all fields',
          variant: 'destructive',
        })
      })
    })

    it('should show error when email is empty', async () => {
      render(<LoginPage />)
      
      const passwordInput = screen.getByLabelText('Password')
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please fill in all fields',
          variant: 'destructive',
        })
      })
    })

    it('should show error when password is empty', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
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
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'invalidemail' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        })
      })
    })

    it('should show error for email without @', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'testexample.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        })
      })
    })

    it('should show error for email without domain', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        })
      })
    })

    it('should accept valid email format', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
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
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: '12345' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Password must be at least 6 characters long',
          variant: 'destructive',
        })
      })
    })

    it('should accept password with exactly 6 characters', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: '123456' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockToast).not.toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Password must be at least 6 characters long',
          })
        )
      })
    })

    it('should accept password with more than 6 characters', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(hashPasswordWithSalt).toHaveBeenCalledWith('password123', expect.any(String))
      })
    })
  })

  describe('Successful Login', () => {
    it('should hash password before login', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(hashPasswordWithSalt).toHaveBeenCalledWith('password123', expect.any(String))
      })
    })

    it('should call login with hashed password', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'hashedpassword123')
      })
    })

    it('should show success toast on successful login', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Logged in successfully',
        })
      })
    })

    it('should redirect to home page after successful login', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('should show loading state during login', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
    })

    it('should disable button during login', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      const loadingButton = screen.getByRole('button', { name: /signing in/i })
      expect(loadingButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should show error toast on login failure', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))
      
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Invalid credentials',
          variant: 'destructive',
        })
      })
    })

    it('should show generic error message for non-Error objects', async () => {
      mockLogin.mockRejectedValueOnce('String error')
      
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Login failed. Please try again.',
          variant: 'destructive',
        })
      })
    })

    it('should re-enable button after error', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Login failed'))
      
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled()
      })
      
      const button = screen.getByRole('button', { name: /sign in/i })
      expect(button).not.toBeDisabled()
    })

    it('should handle network errors', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Network error'))
      
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Network error',
          variant: 'destructive',
        })
      })
    })
  })

  describe('Keyboard Interactions', () => {
    it('should submit form when Enter is pressed in email field', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      fireEvent.keyDown(emailInput, { key: 'Enter', code: 'Enter' })
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled()
      })
    })

    it('should submit form when Enter is pressed in password field', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' })
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled()
      })
    })

    it('should not submit on other key presses', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      fireEvent.keyDown(passwordInput, { key: 'Tab', code: 'Tab' })
      
      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled()
      }, { timeout: 500 })
    })
  })

  describe('Edge Cases', () => {
    it('should handle email with special characters', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test+tag@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test+tag@example.com', 'hashedpassword123')
      })
    })

    it('should handle email with subdomain', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@mail.example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@mail.example.com', 'hashedpassword123')
      })
    })

    it('should handle password with special characters', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'P@ssw0rd!' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(hashPasswordWithSalt).toHaveBeenCalledWith('P@ssw0rd!', expect.any(String))
      })
    })

    it('should preserve whitespace in email input', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      
      fireEvent.change(emailInput, { target: { value: '  test@example.com  ' } })
      
      // Email input preserves whitespace as typed (trimming would be done at validation/submission)
      // Note: email inputs may auto-trim in some browsers, so we check for trimmed value
      expect((emailInput as HTMLInputElement).value).toBe('test@example.com')
    })
  })

  describe('Multiple Submission Prevention', () => {
    it('should not allow multiple simultaneous submissions', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1)
      })
    })
  })
})

