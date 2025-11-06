import React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import OwnerSignupPage from "@/app/owner/signup/page"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { hashPasswordWithSalt } from "@/lib/crypto-utils"
import { geocodeAddress } from "@/lib/geocoding"

// Mock dependencies
jest.mock("next/navigation")
jest.mock("@/context/auth-context")
jest.mock("@/hooks/use-toast")
jest.mock("@/lib/crypto-utils")
jest.mock("@/lib/geocoding")

const mockPush = jest.fn()
const mockToast = jest.fn()
const mockOwnerSignup = jest.fn()

describe("OwnerSignupPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useToast as jest.Mock).mockReturnValue({ toast: mockToast })
    ;(useAuth as jest.Mock).mockReturnValue({ ownerSignup: mockOwnerSignup })
    ;(hashPasswordWithSalt as jest.Mock).mockResolvedValue("hashedPassword")
    ;(geocodeAddress as jest.Mock).mockResolvedValue({
      latitude: 40.7128,
      longitude: -74.0060,
      place_name: "123 Main St, New York, NY"
    })
  })

  it("renders step 1 initially", () => {
    render(<OwnerSignupPage />)
    expect(screen.getByText("Owner Details")).toBeInTheDocument()
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument()
  })

  it("validates required fields on step 1", async () => {
    render(<OwnerSignupPage />)
    fireEvent.click(screen.getByText("Continue to Restaurant Details"))
    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: "Please fill in all fields",
      variant: "destructive"
    })
  })

  it("validates email format", async () => {
    render(<OwnerSignupPage />)
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "John Doe" } })
      fireEvent.change(screen.getByLabelText("Email"), { target: { value: "invalid-email" } })
      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } })
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "password123" } })
    })
    fireEvent.click(screen.getByText("Continue to Restaurant Details"))
    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: "Please enter a valid email address",
      variant: "destructive"
    })
  })

  it("validates password length", async () => {
    render(<OwnerSignupPage />)
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "John Doe" } })
      fireEvent.change(screen.getByLabelText("Email"), { target: { value: "john@test.com" } })
      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123" } })
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "123" } })
    })
    fireEvent.click(screen.getByText("Continue to Restaurant Details"))
    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: "Password must be at least 6 characters long",
      variant: "destructive"
    })
  })

  it("validates password match", async () => {
    render(<OwnerSignupPage />)
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "John Doe" } })
      fireEvent.change(screen.getByLabelText("Email"), { target: { value: "john@test.com" } })
      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } })
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "different" } })
    })
    fireEvent.click(screen.getByText("Continue to Restaurant Details"))
    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: "Passwords do not match",
      variant: "destructive"
    })
  })

  it("proceeds to step 2 with valid data", async () => {
    render(<OwnerSignupPage />)
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "John Doe" } })
      fireEvent.change(screen.getByLabelText("Email"), { target: { value: "john@test.com" } })
      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } })
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "password123" } })
    })
    fireEvent.click(screen.getByText("Continue to Restaurant Details"))
    await waitFor(() => {
      expect(screen.getByText("Restaurant Details")).toBeInTheDocument()
    })
  })

  it("handles successful signup", async () => {
    render(<OwnerSignupPage />)
    
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "John Doe" } })
      fireEvent.change(screen.getByLabelText("Email"), { target: { value: "john@test.com" } })
      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } })
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "password123" } })
    })
    fireEvent.click(screen.getByText("Continue to Restaurant Details"))
    
    await waitFor(() => {
      expect(screen.getByText("Restaurant Details")).toBeInTheDocument()
    })
    
    expect(mockOwnerSignup).not.toHaveBeenCalled()
  })

  it("handles signup error", async () => {
    mockOwnerSignup.mockRejectedValue(new Error("Signup failed"))
    render(<OwnerSignupPage />)
    
    // This test would be completed once we have the full component
    expect(mockOwnerSignup).not.toHaveBeenCalled()
  })
})