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

// ==================== CART API ====================

/**
 * Get current user's cart
 */
export async function getCart() {
  const response = await authenticatedFetch(`${API_BASE_URL}/cart`)
  
  if (!response.ok) {
    throw new Error("Failed to fetch cart")
  }
  
  return response.json()
}

/**
 * Add item to cart
 */
export async function addToCart(mealId: string, qty: number = 1) {
  const response = await authenticatedFetch(`${API_BASE_URL}/cart/items`, {
    method: "POST",
    body: JSON.stringify({ meal_id: mealId, qty }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to add item to cart")
  }
  
  return response.json()
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(itemId: string, qty: number) {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/cart/items/${itemId}?qty=${qty}`,
    {
      method: "PATCH",
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to update item quantity")
  }
  
  return response.json()
}

/**
 * Remove item from cart
 */
export async function removeFromCart(itemId: string) {
  const response = await authenticatedFetch(`${API_BASE_URL}/cart/items/${itemId}`, {
    method: "DELETE",
  })
  
  if (!response.ok) {
    throw new Error("Failed to remove item from cart")
  }
  
  return response.json()
}

/**
 * Clear entire cart
 */
export async function clearCart() {
  const response = await authenticatedFetch(`${API_BASE_URL}/cart`, {
    method: "DELETE",
  })
  
  if (!response.ok) {
    throw new Error("Failed to clear cart")
  }
  
  return response.json()
}

/**
 * Checkout cart (creates order)
 */
export async function checkoutCart() {
  const response = await authenticatedFetch(`${API_BASE_URL}/cart/checkout`, {
    method: "POST",
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to checkout")
  }
  
  return response.json()
}

// ==================== ORDERS API ====================

/**
 * List user's orders
 */
export async function getMyOrders(limit: number = 50) {
  const response = await authenticatedFetch(`${API_BASE_URL}/orders/mine?limit=${limit}`)
  
  if (!response.ok) {
    throw new Error("Failed to fetch orders")
  }
  
  return response.json()
}

/**
 * Get specific order details
 */
export async function getOrder(orderId: string) {
  const response = await authenticatedFetch(`${API_BASE_URL}/orders/${orderId}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to fetch order")
  }
  
  return response.json()
}

/**
 * Get order status timeline
 */
export async function getOrderStatus(orderId: string) {
  const response = await authenticatedFetch(`${API_BASE_URL}/orders/${orderId}/status`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to fetch order status")
  }
  
  return response.json()
}

/**
 * Cancel an order (only works for pending orders)
 */
export async function cancelOrder(orderId: string) {
  const response = await authenticatedFetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
    method: "PATCH",
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to cancel order")
  }
  
  return response.json()
}

// ==================== SPOTIFY & RECOMMENDATIONS API ====================

/**
 * Check if user has connected Spotify
 */
export async function checkSpotifyStatus() {
  const response = await authenticatedFetch(`${API_BASE_URL}/spotify/status`)
  
  if (!response.ok) {
    throw new Error("Failed to check Spotify status")
  }
  
  return response.json()
}

/**
 * Initiate Spotify OAuth by fetching the auth URL and redirecting
 * The backend returns the Spotify authorization URL as JSON
 */
export async function initiateSpotifyLogin() {
  const response = await authenticatedFetch(`${API_BASE_URL}/spotify/login`)
  
  if (!response.ok) {
    throw new Error("Failed to initiate Spotify login")
  }
  
  const data = await response.json()
  
  // Redirect browser to Spotify OAuth
  if (data.auth_url) {
    window.location.href = data.auth_url
  } else {
    throw new Error("No auth URL received from server")
  }
}

/**
 * Get mood-based meal recommendations for a restaurant (authenticated route)
 * Returns recommendations if Spotify is connected
 * Throws error with status code information for proper error handling
 */
export async function getMoodRecommendations(restaurantId: string) {
  const response = await authenticatedFetch(`${API_BASE_URL}/recsys/get_recommendations`, {
    method: "POST",
    body: JSON.stringify({ restaurant_id: restaurantId }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    const errorMessage = error.detail || "Failed to get recommendations"
    
    // Create error with status code for better error handling
    const err = new Error(errorMessage) as Error & { status: number }
    err.status = response.status
    throw err
  }
  
  return response.json()
}

// ==================== PROFILE API ====================

/**
 * Get current user profile
 */
export async function getProfile() {
  const response = await authenticatedFetch(`${API_BASE_URL}/me`)
  
  if (!response.ok) {
    throw new Error("Failed to fetch profile")
  }
  
  return response.json()
}

/**
 * Update user profile
 */
export async function updateProfile(data: { name?: string }) {
  const response = await authenticatedFetch(`${API_BASE_URL}/me`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to update profile")
  }
  
  return response.json()
}


/**
 * Logout user (invalidate session)
 */
export async function logoutUser() {
  const accessToken = localStorage.getItem("access_token")
  
  if (!accessToken) {
    return { ok: true }
  }
  
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to logout")
  }
  
  return response.json()
}
/**
 * Delete user account
 */
export async function deleteAccount() {
  const response = await authenticatedFetch(`${API_BASE_URL}/auth/me`, {
    method: "DELETE",
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to delete account")
  }
  
  return response.json()
}
// ==================== OWNER MEALS API ====================

/**
 * Get all meals for the owner's restaurant
 */
export async function getOwnerMeals() {
  const response = await authenticatedFetch(`${API_BASE_URL}/owner/meals`)
  
  if (!response.ok) {
    throw new Error("Failed to fetch owner meals")
  }
  
  return response.json()
}


export async function createMeal(mealData: {
  name: string
  tags?: string[]
  base_price: number
  quantity: number
  surplus_price?: number
  allergens?: string[]
  calories?: number
  image_link?: string
}) {
  const response = await authenticatedFetch(`${API_BASE_URL}/owner/meals`, {
    method: "POST",
    body: JSON.stringify(mealData),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to create meal")
  }
  
  return response.json()
}


export async function updateMeal(mealId: string, mealData: {
  name?: string
  tags?: string[]
  base_price?: number
  quantity?: number
  surplus_price?: number
  allergens?: string[]
  calories?: number
  image_link?: string
}) {
  const response = await authenticatedFetch(`${API_BASE_URL}/owner/meals/${mealId}`, {
    method: "PUT",
    body: JSON.stringify(mealData),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to update meal")
  }
  
  return response.json()
}

/**
 * Delete a meal
 */
export async function deleteMeal(mealId: string) {
  const response = await authenticatedFetch(`${API_BASE_URL}/owner/meals/${mealId}`, {
    method: "DELETE",
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to delete meal")
  }
  
  return true
}

// ==================== S3 / CDN API ====================

/**
 * Get presigned URL for uploading an image
 */
export async function getPresignedUploadUrl(filename: string, contentType: string) {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/s3/presigned-upload-url`, {
    method: "POST",
    body: JSON.stringify({ filename, content_type: contentType }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to get presigned URL")
  }
  
  return response.json() as Promise<{ upload_url: string; public_url: string }>
}

/**
 * Upload file to S3 using presigned URL
 */
export async function uploadFileToS3(presignedUrl: string, file: File) {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  })
  
  if (!response.ok) {
    throw new Error("Failed to upload file to S3")
  }
  
  return true
}

/**
 * Delete an image from S3
 */
export async function deleteImageFromS3(imageUrl: string) {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/s3/delete-image`, {
    method: "DELETE",
    body: JSON.stringify({ image_url: imageUrl }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to delete image")
  }
  
  return response.json()
}

