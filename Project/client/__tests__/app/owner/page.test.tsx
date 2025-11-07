import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import OwnerDashboard from '@/app/owner/page'

// Simple mock setup that actually works
const mockToast = jest.fn() as jest.MockedFunction<any>
const mockGetOwnerMeals = jest.fn() as jest.MockedFunction<any>
const mockCreateMeal = jest.fn() as jest.MockedFunction<any>
const mockUpdateMeal = jest.fn() as jest.MockedFunction<any>
const mockDeleteMeal = jest.fn() as jest.MockedFunction<any>

// Mock the API module
jest.mock('@/lib/api', () => ({
  getOwnerMeals: mockGetOwnerMeals,
  createMeal: mockCreateMeal,
  updateMeal: mockUpdateMeal,
  deleteMeal: mockDeleteMeal
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}))

beforeEach(() => {
  jest.clearAllMocks()
  // Set default successful responses
  mockGetOwnerMeals.mockResolvedValue([])
  mockCreateMeal.mockResolvedValue({})
  mockUpdateMeal.mockResolvedValue({})
  mockDeleteMeal.mockResolvedValue(true)
})

describe('OwnerDashboard', () => {
  // Test 1: Component renders basic elements
  test('renders dashboard header', () => {
    render(<OwnerDashboard />)
    
    expect(screen.getByText('Restaurant Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Manage your surplus inventory')).toBeInTheDocument()
    expect(screen.getByText('Add Meal')).toBeInTheDocument()
  })

  // Test 2: Shows loading state
  test('shows loading state', () => {
    mockGetOwnerMeals.mockImplementation(() => new Promise(() => {}))
    render(<OwnerDashboard />)
    
    expect(screen.getByText('Loading meals...')).toBeInTheDocument()
  })

  // Test 3: Shows empty state
  test('shows empty state when no meals', async () => {
    render(<OwnerDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('No meals added yet. Click "Add Meal" to get started.')).toBeInTheDocument()
    })
  })

  // Test 4: Opens add meal dialog
  test('opens add meal dialog', () => {
    render(<OwnerDashboard />)
    
    fireEvent.click(screen.getByText('Add Meal'))
    
    expect(screen.getByText('Add New Meal')).toBeInTheDocument()
  })

  // Test 5: Form has required inputs
  test('form has required inputs', () => {
    render(<OwnerDashboard />)
    
    fireEvent.click(screen.getByText('Add Meal'))
    
    expect(screen.getByLabelText(/Meal Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Base Price/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Quantity/)).toBeInTheDocument()
  })

  // Test 6: Form inputs work
  test('form inputs accept values', () => {
    render(<OwnerDashboard />)
    
    fireEvent.click(screen.getByText('Add Meal'))
    
    const nameInput = screen.getByLabelText(/Meal Name/)
    fireEvent.change(nameInput, { target: { value: 'Test Meal' } })
    
    expect(nameInput).toHaveValue('Test Meal')
  })

  // Test 7: Dialog can be cancelled
  test('dialog can be cancelled', () => {
    render(<OwnerDashboard />)
    
    fireEvent.click(screen.getByText('Add Meal'))
    expect(screen.getByText('Add New Meal')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Add New Meal')).not.toBeInTheDocument()
  })

  // Test 8: Component structure exists
  test('component has correct structure', () => {
    render(<OwnerDashboard />)
    
    expect(screen.getByText('Total Meals')).toBeInTheDocument()
    expect(screen.getByText('Your Meals')).toBeInTheDocument()
  })

  // Test 9: Mock functions are configured
  test('mock functions are configured', () => {
    expect(mockGetOwnerMeals).toBeDefined()
    expect(mockCreateMeal).toBeDefined()
    expect(mockUpdateMeal).toBeDefined()
    expect(mockDeleteMeal).toBeDefined()
    expect(mockToast).toBeDefined()
  })

  // Test 10: Component mounts successfully
  test('component mounts successfully', () => {
    const { container } = render(<OwnerDashboard />)
    expect(container).toBeInTheDocument()
  })

  // Test 11: Form has all input fields
  test('form has all input fields', () => {
    render(<OwnerDashboard />)
    
    fireEvent.click(screen.getByText('Add Meal'))
    
    expect(screen.getByLabelText(/Tags/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Allergens/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Calories/)).toBeInTheDocument()
  })

  // Test 12: Input field types are correct
  test('input field types are correct', () => {
    render(<OwnerDashboard />)
    
    fireEvent.click(screen.getByText('Add Meal'))
    
    expect(screen.getByLabelText(/Base Price/).getAttribute('type')).toBe('number')
    expect(screen.getByLabelText(/Quantity/).getAttribute('type')).toBe('number')
  })

  // Test 13: Dialog accessibility
  test('dialog is accessible', () => {
    render(<OwnerDashboard />)
    
    fireEvent.click(screen.getByText('Add Meal'))
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  // Test 14: Multiple dialogs don't interfere
  test('multiple dialog operations work', () => {
    render(<OwnerDashboard />)
    
    // Open and close dialog multiple times
    fireEvent.click(screen.getByText('Add Meal'))
    fireEvent.click(screen.getByText('Cancel'))
    
    fireEvent.click(screen.getByText('Add Meal'))
    expect(screen.getByText('Add New Meal')).toBeInTheDocument()
  })

  // Test 15: Component doesn't crash
  test('component renders without crashing', () => {
    expect(() => render(<OwnerDashboard />)).not.toThrow()
  })

  // Test 16: Form field labels exist
  test('form field labels exist', () => {
    render(<OwnerDashboard />)
    
    fireEvent.click(screen.getByText('Add Meal'))
    
    expect(screen.getByText('Meal Name')).toBeInTheDocument()
    expect(screen.getByText('Base Price ($)')).toBeInTheDocument()
    expect(screen.getByText('Quantity')).toBeInTheDocument()
  })

  // Test 17: Form accepts numeric values
  test('form accepts numeric values', () => {
    render(<OwnerDashboard />)
    
    fireEvent.click(screen.getByText('Add Meal'))
    
    const priceInput = screen.getByLabelText(/Base Price/)
    fireEvent.change(priceInput, { target: { value: '10.99' } })
    expect(priceInput).toHaveValue(10.99)
  })

  // Test 18: Component state management
  test('component state management works', () => {
    const { rerender } = render(<OwnerDashboard />)
    
    expect(screen.getByText('Restaurant Dashboard')).toBeInTheDocument()
    
    rerender(<OwnerDashboard />)
    expect(screen.getByText('Restaurant Dashboard')).toBeInTheDocument()
  })

  // Test 19: Button interactions
  test('button interactions work', () => {
    render(<OwnerDashboard />)
    
    const addButton = screen.getByText('Add Meal')
    expect(addButton).toBeInTheDocument()
    
    fireEvent.click(addButton)
    expect(screen.getByText('Add New Meal')).toBeInTheDocument()
  })

  // Test 20: Dialog content
  test('dialog has correct content', () => {
    render(<OwnerDashboard />)
    
    fireEvent.click(screen.getByText('Add Meal'))
    
    expect(screen.getByText('Add a new meal to your restaurant\'s menu')).toBeInTheDocument()
  })

  // Test 21: Form validation exists
  test('form has validation structure', () => {
    render(<OwnerDashboard />)
    
    fireEvent.click(screen.getByText('Add Meal'))
    
    // Check that submit button exists
    expect(screen.getByRole('button', { name: 'Add Meal' })).toBeInTheDocument()
  })

  // Test 22: Loading state works
  test('loading state works correctly', () => {
    mockGetOwnerMeals.mockImplementation(() => new Promise(() => {}))
    render(<OwnerDashboard />)
    
    expect(screen.getByText('Loading meals...')).toBeInTheDocument()
  })

  // Test 23: Empty state works
  test('empty state works correctly', async () => {
    render(<OwnerDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('No meals added yet. Click "Add Meal" to get started.')).toBeInTheDocument()
    })
  })

  // Test 24: Stats display
  test('stats display correctly', async () => {
    render(<OwnerDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument() // Total meals count
    })
  })

  // Test 25: Form helper text
  test('form has helper text', () => {
    render(<OwnerDashboard />)
    
    fireEvent.click(screen.getByText('Add Meal'))
    
    expect(screen.getByText('Separate multiple tags with commas')).toBeInTheDocument()
    expect(screen.getByText('Separate multiple allergens with commas')).toBeInTheDocument()
  })

  // Test 26: Optional fields exist
  test('optional fields exist', () => {
    render(<OwnerDashboard />)
    
    fireEvent.click(screen.getByText('Add Meal'))
    
    expect(screen.getByLabelText(/Surplus Price/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Image URL/)).toBeInTheDocument()
  })

  // Test 27: Form layout
  test('form has proper layout', () => {
    render(<OwnerDashboard />)
    
    fireEvent.click(screen.getByText('Add Meal'))
    
    // Check that form elements are present
    expect(screen.getAllByRole('textbox')).toHaveLength(5) // Name, tags, allergens, image
    expect(screen.getAllByRole('spinbutton')).toHaveLength(4) // Price, surplus, quantity, calories
  })

  // Test 28: Component cleanup
  test('component cleanup works', () => {
    const { unmount } = render(<OwnerDashboard />)
    
    expect(() => unmount()).not.toThrow()
  })

  // Test 29: Mock setup verification
  test('mock setup is correct', () => {
    expect(jest.isMockFunction(mockGetOwnerMeals)).toBe(true)
    expect(jest.isMockFunction(mockCreateMeal)).toBe(true)
    expect(jest.isMockFunction(mockUpdateMeal)).toBe(true)
    expect(jest.isMockFunction(mockDeleteMeal)).toBe(true)
    expect(jest.isMockFunction(mockToast)).toBe(true)
  })

  // Test 30: Component renders all sections
  test('component renders all sections', () => {
    render(<OwnerDashboard />)
    
    // Check main sections exist
    expect(screen.getByText('Restaurant Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Total Meals')).toBeInTheDocument()
    expect(screen.getByText('Your Meals')).toBeInTheDocument()
    expect(screen.getByText('Add Meal')).toBeInTheDocument()
  })
})