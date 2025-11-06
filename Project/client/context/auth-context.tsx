"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface User {
  id: string
  email: string
  name?: string
  role: "customer" | "owner"
}

interface RestaurantDetails {
  name: string
  address: string
  latitude: number
  longitude: number
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  ownerSignup: (email: string, password: string, name: string, restaurant: RestaurantDetails) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

interface TokenData {
  access_token: string
  refresh_token: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const accessToken = localStorage.getItem("access_token")
    
    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const signup = async (email: string, password: string, name: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Signup failed")
    }

    const data = await response.json()
    return data
  }

  const ownerSignup = async (
    email: string,
    password: string,
    name: string,
    restaurant: RestaurantDetails
  ) => {
    const response = await fetch(`${API_BASE_URL}/auth/owner/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        name,
        restaurant_name: restaurant.name,
        restaurant_address: restaurant.address,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Owner signup failed")
    }

    const data = await response.json()
    return data
  }

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Login failed")
    }

    const data = await response.json()
    
    // Store tokens and user data
    localStorage.setItem("access_token", data.access_token)
    localStorage.setItem("refresh_token", data.refresh_token)
    
    const userData: User = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: "customer",
    }
    
    localStorage.setItem("user", JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, ownerSignup, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// API helper with automatic token refresh on 401
export async function authenticatedFetch(url: string, options: RequestInit = {}, retryCount = 0): Promise<Response> {
  const accessToken = localStorage.getItem("access_token")
  
  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle 401 - try to refresh token
  if (response.status === 401 && retryCount < 3) {
    const refreshToken = localStorage.getItem("refresh_token")
    
    if (!refreshToken) {
      // No refresh token, logout
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user")
      window.location.href = "/login"
      throw new Error("Session expired")
    }

    try {
      // Try to refresh the token
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        localStorage.setItem("access_token", data.access_token)
        
        // Retry the original request with new token
        return authenticatedFetch(url, options, retryCount + 1)
      } else {
        // Refresh failed, logout
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user")
        window.location.href = "/login"
        throw new Error("Session expired")
      }
    } catch (error) {
      // Refresh failed, logout
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user")
      window.location.href = "/login"
      throw error
    }
  }

  return response
}
