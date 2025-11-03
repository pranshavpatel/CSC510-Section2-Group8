// API utilities for making authenticated requests
import { authenticatedFetch } from "@/context/auth-context"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/**
 * Example: Get user profile
 */
export async function getUserProfile() {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/profile`)
  
  if (!response.ok) {
    throw new Error("Failed to fetch user profile")
  }
  
  return response.json()
}

/**
 * Example: Get meals/catalog
 */
export async function getMeals() {
  const response = await authenticatedFetch(`${API_BASE_URL}/catalog/meals`)
  
  if (!response.ok) {
    throw new Error("Failed to fetch meals")
  }
  
  return response.json()
}

/**
 * Example: Place an order
 */
export async function placeOrder(orderData: any) {
  const response = await authenticatedFetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    body: JSON.stringify(orderData),
  })
  
  if (!response.ok) {
    throw new Error("Failed to place order")
  }
  
  return response.json()
}

/**
 * Example: Get recommendations
 */
export async function getRecommendations(mood?: string) {
  const url = mood 
    ? `${API_BASE_URL}/recommendations?mood=${encodeURIComponent(mood)}`
    : `${API_BASE_URL}/recommendations`
    
  const response = await authenticatedFetch(url)
  
  if (!response.ok) {
    throw new Error("Failed to fetch recommendations")
  }
  
  return response.json()
}

