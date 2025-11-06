"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Leaf, MapPin, Loader2, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { hashPasswordWithSalt } from "@/lib/crypto-utils"
import { geocodeAddress } from "@/lib/geocoding"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SALT = process.env.HASH_SALT!

type SignupStep = 1 | 2

export default function OwnerSignupPage() {
  // Step management
  const [currentStep, setCurrentStep] = useState<SignupStep>(1)

  // Step 1: Owner details
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Step 2: Restaurant details
  const [restaurantName, setRestaurantName] = useState("")
  const [restaurantAddress, setRestaurantAddress] = useState("")
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [formattedAddress, setFormattedAddress] = useState("")

  // Loading states
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)

  const { ownerSignup } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const validateEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email)
  }

  const handleStep1Continue = () => {
    // Validation for step 1
    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (!validateEmail(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    // Move to step 2
    setCurrentStep(2)
  }

  const handleGeocodeAddress = async () => {
    if (!restaurantAddress || restaurantAddress.trim().length === 0) {
      toast({
        title: "Error",
        description: "Please enter a restaurant address",
        variant: "destructive",
      })
      return
    }

    setIsGeocodingLoading(true)
    try {
      const result = await geocodeAddress(restaurantAddress)
      setLatitude(result.latitude)
      setLongitude(result.longitude)
      setFormattedAddress(result.place_name)
      
      toast({
        title: "Success",
        description: "Address located successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to locate address",
        variant: "destructive",
      })
    } finally {
      setIsGeocodingLoading(false)
    }
  }

  const handleOwnerSignup = async () => {
    // Validation for step 2
    if (!restaurantName || !restaurantAddress) {
      toast({
        title: "Error",
        description: "Please fill in all restaurant details",
        variant: "destructive",
      })
      return
    }

    if (latitude === null || longitude === null) {
      toast({
        title: "Error",
        description: "Please locate your restaurant address first",
        variant: "destructive",
      })
      return
    }

    setIsSubmitLoading(true)
    try {
      // Hash the password before sending to backend
      const hashedPassword = await hashPasswordWithSalt(password, SALT)
      
      await ownerSignup(email, hashedPassword, name, {
        name: restaurantName,
        address: formattedAddress || restaurantAddress,
        latitude,
        longitude,
      })

      toast({
        title: "Success",
        description: "Restaurant account created successfully. Please login to continue.",
      })
      router.push("/login")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Signup failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Leaf className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Join VibeDish as Restaurant Owner</h1>
          <p className="text-sm text-muted-foreground text-center">
            Create an account to list your surplus food
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className={`h-2 w-16 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-2 w-16 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {/* Step 1: Owner Details */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Owner Details</CardTitle>
              <CardDescription>Step 1 of 2: Enter your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleStep1Continue}>
                Continue to Restaurant Details
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Restaurant Details */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Details</CardTitle>
              <CardDescription>Step 2 of 2: Enter your restaurant information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="restaurant-name">Restaurant Name</Label>
                <Input
                  id="restaurant-name"
                  type="text"
                  placeholder="The Green Kitchen"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurant-address">Restaurant Address</Label>
                <Input
                  id="restaurant-address"
                  type="text"
                  placeholder="123 Main St, City, State, ZIP"
                  value={restaurantAddress}
                  onChange={(e) => {
                    setRestaurantAddress(e.target.value)
                    // Reset coordinates when address changes
                    setLatitude(null)
                    setLongitude(null)
                    setFormattedAddress("")
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the full address of your restaurant
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleGeocodeAddress}
                disabled={isGeocodingLoading || !restaurantAddress}
              >
                {isGeocodingLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Locating Address...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    Locate Address on Map
                  </>
                )}
              </Button>

              {/* Display coordinates when geocoded */}
              {latitude !== null && longitude !== null && (
                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Location Found</p>
                  {formattedAddress && (
                    <p className="text-sm font-medium">{formattedAddress}</p>
                  )}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Lat: {latitude.toFixed(6)}</span>
                    <span>Lng: {longitude.toFixed(6)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setCurrentStep(1)}
                  disabled={isSubmitLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleOwnerSignup}
                  disabled={isSubmitLoading || latitude === null || longitude === null}
                >
                  {isSubmitLoading ? "Creating account..." : "Create Restaurant Account"}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

