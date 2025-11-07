"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Search, Store, ArrowLeft, UtensilsCrossed, Loader2, Plus, Minus, Music, Sparkles } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { addToCart, getCart, updateCartItem, removeFromCart, getMoodRecommendations, checkSpotifyStatus, initiateSpotifyLogin } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

// Types based on DB schema
interface Restaurant {
  id: string
  name: string
  address: string
  owner_id: string | null
  created_at: string
}

interface Meal {
  id: string
  restaurant_id: string
  name: string
  tags: string[]
  base_price: number
  quantity: number
  surplus_price: number | null
  allergens: string[]
  calories: number
  image_link?: string | null
  created_at: string
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "")

export default function BrowsePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const restaurantIdFromUrl = searchParams.get('restaurant')
  const spotifyConnected = searchParams.get('spotify_connected')
  
  const [view, setView] = useState<"restaurants" | "meals">("restaurants")
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [meals, setMeals] = useState<Meal[]>([])

  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingMeals, setUpdatingMeals] = useState<Set<string>>(new Set())
  const [mealQuantities, setMealQuantities] = useState<Record<string, { qty: number, itemId: string }>>({})
  
  // Recommendation states
  const [recommendedMealIds, setRecommendedMealIds] = useState<string[]>([])
  const [showSpotifyConnect, setShowSpotifyConnect] = useState(false)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  // Fetch restaurants on mount
  useEffect(() => {
    fetchRestaurants()
  }, [])

  // Load cart to get current quantities when viewing meals
  useEffect(() => {
    if (isAuthenticated && view === "meals") {
      loadCartQuantities()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, view])

  // Handle Spotify connection callback
  useEffect(() => {
    if (spotifyConnected === 'true' && selectedRestaurant) {
      toast({
        title: "Spotify Connected!",
        description: "Fetching your personalized recommendations...",
      })
      // Clean URL
      const url = new URL(window.location.href)
      url.searchParams.delete('spotify_connected')
      window.history.replaceState({}, '', url.toString())
      // Fetch recommendations
      fetchRecommendations(selectedRestaurant.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifyConnected])

  // Fetch recommendations when meals are loaded and user is authenticated
  useEffect(() => {
    if (isAuthenticated && view === "meals" && selectedRestaurant && meals.length > 0) {
      fetchRecommendations(selectedRestaurant.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, view, selectedRestaurant, meals.length])

  // Handle restaurant selection from URL parameter
  useEffect(() => {
    if (restaurantIdFromUrl && restaurants.length > 0) {
      const restaurant = restaurants.find(r => r.id === restaurantIdFromUrl)
      if (restaurant && selectedRestaurant?.id !== restaurant.id) {
        handleRestaurantClick(restaurant)
      }
    } else if (!restaurantIdFromUrl && view === "meals") {
      // Reset to restaurants view when URL parameter is removed
      setView("restaurants")
      setSelectedRestaurant(null)
      setMeals([])
      setSearchQuery("")
    }
  }, [restaurantIdFromUrl, restaurants])

  const fetchRestaurants = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/catalog/restaurants`)
      if (!response.ok) throw new Error("Failed to fetch restaurants")
      const data = await response.json()
      setRestaurants(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error fetching restaurants:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMeals = async (restaurantId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/catalog/restaurants/${restaurantId}/meals`)
      if (!response.ok) throw new Error("Failed to fetch meals")
      const data = await response.json()
      setMeals(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error fetching meals:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadCartQuantities = async () => {
    if (!isAuthenticated) return
    try {
      const cart = await getCart()
      const quantities: Record<string, { qty: number, itemId: string }> = {}
      cart.items.forEach((item: any) => {
        quantities[item.meal_id] = {
          qty: item.qty,
          itemId: item.item_id
        }
      })
      setMealQuantities(quantities)
    } catch (err) {
      console.error("Error loading cart:", err)
    }
  }

  const fetchRecommendations = async (restaurantId: string) => {
    if (!isAuthenticated) return
    
    setLoadingRecommendations(true)
    setShowSpotifyConnect(false)
    setRecommendedMealIds([])
    
    try {
      const response = await getMoodRecommendations(restaurantId)
      
      if (response.recommended_foods && Array.isArray(response.recommended_foods)) {
        // Extract meal IDs directly from the response
        const matchedIds = response.recommended_foods
          .map((food: any) => food.id)
          .filter((id: string) => id)
        
        setRecommendedMealIds(matchedIds)
        
        if (matchedIds.length > 0) {
          toast({
            title: "Recommendations ready!",
            description: `We found ${matchedIds.length} perfect meal${matchedIds.length > 1 ? 's' : ''} for your mood`,
          })
        }
      }
    } catch (err: any) {
      console.error("Error fetching recommendations:", err)
      
      // Check for 404 error indicating Spotify not connected
      if (err.status === 404 || err.message?.includes("User Spotify authentication not found")) {
        setShowSpotifyConnect(true)
      }
      // Silently ignore other errors (no tracks found, API issues, etc.)
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const handleSpotifyConnect = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "Please login to connect Spotify",
        variant: "destructive",
      })
      router.push('/login')
      return
    }

    try {
      // This will redirect to Spotify OAuth
      await initiateSpotifyLogin()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to connect to Spotify. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
    setView("meals")
    setSearchQuery("")
    fetchMeals(restaurant.id)
  }

  const handleBackToRestaurants = () => {
    // If we came from another page (e.g., map), navigate to clean browse page
    if (restaurantIdFromUrl) {
      router.push('/browse')
    } else {
      // Otherwise just reset the view state
      setView("restaurants")
      setSelectedRestaurant(null)
      setMeals([])
      setSearchQuery("")
    }
  }

  // Filter restaurants by search
  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter meals by search (meals are already filtered by restaurant from API)
  const filteredMeals = meals.filter((meal) => {
    const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  // Calculate discount percentage
  const getDiscountPercentage = (basePrice: number, surplusPrice: number | null) => {
    if (!surplusPrice || basePrice <= 0) return 0
    return Math.round(((basePrice - surplusPrice) / basePrice) * 100)
  }

  const handleQuantityChange = async (mealId: string, mealName: string, newQty: number, maxQty: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Please login",
        description: "You need to be logged in to add items to cart",
        variant: "destructive",
      })
      router.push('/login')
      return
    }

    if (newQty < 0 || newQty > maxQty) return

    setUpdatingMeals(prev => new Set(prev).add(mealId))
    
    try {
      const currentItem = mealQuantities[mealId]
      
      if (newQty === 0 && currentItem) {
        // Remove from cart
        await removeFromCart(currentItem.itemId)
        setMealQuantities(prev => {
          const next = { ...prev }
          delete next[mealId]
          return next
        })
        toast({
          title: "Removed from cart",
          description: `${mealName} has been removed from your cart`,
        })
      } else if (currentItem) {
        // Update quantity
        await updateCartItem(currentItem.itemId, newQty)
        setMealQuantities(prev => ({
          ...prev,
          [mealId]: { ...prev[mealId], qty: newQty }
        }))
        toast({
          title: "Cart updated",
          description: `${mealName} quantity updated to ${newQty}`,
        })
      } else if (newQty > 0) {
        // Add new item
        const cart = await addToCart(mealId, newQty)
        // Find the item_id for this meal from the returned cart
        const addedItem = cart.items.find((item: any) => item.meal_id === mealId)
        if (addedItem) {
          setMealQuantities(prev => ({
            ...prev,
            [mealId]: { qty: newQty, itemId: addedItem.item_id }
          }))
        }
        toast({
          title: "Added to cart",
          description: `${mealName} has been added to your cart`,
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update cart",
        variant: "destructive",
      })
      // Reload cart to sync state
      loadCartQuantities()
    } finally {
      setUpdatingMeals(prev => {
        const next = new Set(prev)
        next.delete(mealId)
        return next
      })
    }
  }

  return (
    <div className="container py-12 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        {view === "restaurants" ? (
          <>
            <div className="flex items-center gap-2">
              <Store className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">Browse Restaurants</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Discover restaurants offering surplus meals. Save money while reducing food waste.
            </p>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={handleBackToRestaurants}
              className="mb-4 -ml-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Restaurants
            </Button>
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">{selectedRestaurant?.name}</h1>
            </div>
            <p className="text-lg text-muted-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {selectedRestaurant?.address}
            </p>
          </>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={view === "restaurants" ? "Search restaurants..." : "Search meals..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          <p className="font-medium">Error: {error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={view === "restaurants" ? fetchRestaurants : () => selectedRestaurant && fetchMeals(selectedRestaurant.id)}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Restaurants View */}
      {!loading && view === "restaurants" && (
        <>
          <div className="text-sm text-muted-foreground">
            Showing {filteredRestaurants.length} {filteredRestaurants.length === 1 ? "restaurant" : "restaurants"}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                className="overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleRestaurantClick(restaurant)}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight">{restaurant.name}</CardTitle>
                      <CardDescription className="flex items-start gap-1 text-xs">
                        <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{restaurant.address}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" size="sm">
                    View Meals
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRestaurants.length === 0 && !loading && (
            <div className="text-center py-16 space-y-3">
              <p className="text-lg text-muted-foreground">No restaurants found</p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Meals View */}
      {!loading && view === "meals" && (
        <>
          {/* Spotify Connection Card */}
          {isAuthenticated && showSpotifyConnect && (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                    <Music className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Get Personalized Recommendations
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Connect your Spotify account to get meal recommendations based on your current mood and listening habits
                      </p>
                    </div>
                    <Button onClick={handleSpotifyConnect} className="gap-2">
                      <Music className="h-4 w-4" />
                      Connect Spotify
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading Recommendations */}
          {loadingRecommendations && (
            <Card className="border-2 border-primary/20">
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Analyzing your music taste to find the perfect meals...
                </p>
              </CardContent>
            </Card>
          )}

          {(() => {
            // Split meals into recommended, surplus and regular
            const recommendedMeals = filteredMeals.filter((meal) => recommendedMealIds.includes(meal.id))
            const surplusMeals = filteredMeals.filter((meal) => meal.quantity > 0 && meal.surplus_price !== null && !recommendedMealIds.includes(meal.id))
            const regularMeals = filteredMeals.filter((meal) => (meal.quantity === 0 || meal.surplus_price === null) && !recommendedMealIds.includes(meal.id))

            const renderMealCard = (meal: Meal) => {
              const discountPercent = getDiscountPercentage(meal.base_price, meal.surplus_price)
              const hasSurplus = meal.quantity > 0
              const hasSurplusPrice = meal.surplus_price !== null
              const isUpdating = updatingMeals.has(meal.id)
              const currentQty = mealQuantities[meal.id]?.qty || 0

              return (
                <Card key={meal.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  {/* Meal Image */}
                  {meal.image_link ? (
                    <div className="relative w-full h-48 overflow-hidden bg-muted">
                      <img
                        src={meal.image_link}
                        alt={meal.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {hasSurplus && hasSurplusPrice && discountPercent > 0 && (
                        <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground font-semibold shadow-lg">
                          {discountPercent}% OFF
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full h-48 bg-muted flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <UtensilsCrossed className="h-12 w-12 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No image available</p>
                      </div>
                      {hasSurplus && hasSurplusPrice && discountPercent > 0 && (
                        <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground font-semibold shadow-lg">
                          {discountPercent}% OFF
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="space-y-1">
                      <CardTitle className="text-lg leading-tight">{meal.name}</CardTitle>
                      {meal.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {meal.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Calories:</span>
                        <span className="font-medium">{meal.calories} kcal</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-muted-foreground">Allergens:</span>
                        {meal.allergens.length > 0 ? (
                          <span className="font-medium text-right text-xs">
                            {meal.allergens.join(", ")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">--</span>
                        )}
                      </div>

                      {hasSurplus && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Available:</span>
                          <Badge variant="outline" className="text-xs">
                            {meal.quantity} left
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      {hasSurplus && hasSurplusPrice && meal.surplus_price! < meal.base_price ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-primary">
                            ${meal.surplus_price!.toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            ${meal.base_price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold">
                          ${meal.base_price.toFixed(2)}
                        </span>
                      )}
                      
                      {!hasSurplus ? (
                        <Button size="sm" disabled>
                          Sold Out
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          {currentQty > 0 && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => handleQuantityChange(meal.id, meal.name, currentQty - 1, meal.quantity)}
                              disabled={isUpdating}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {currentQty > 0 && (
                            <div className="min-w-[2rem] text-center">
                              <span className="font-semibold text-lg">{currentQty}</span>
                            </div>
                          )}
                          
                          <Button
                            variant={currentQty > 0 ? "outline" : "default"}
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => handleQuantityChange(meal.id, meal.name, currentQty + 1, meal.quantity)}
                            disabled={isUpdating || currentQty >= meal.quantity}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            }

            return (
              <>
                {/* Recommended Meals Section */}
                {recommendedMeals.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                          <Sparkles className="h-6 w-6" />
                          Perfect for Your Mood
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Based on your recent Spotify listening
                        </p>
                      </div>
                      <Badge variant="default" className="text-sm">
                        {recommendedMeals.length} {recommendedMeals.length === 1 ? "pick" : "picks"}
                      </Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recommendedMeals.map(renderMealCard)}
                    </div>
                  </div>
                )}

                {/* Surplus Meals Section */}
                {surplusMeals.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-primary">🔥 Surplus Meals</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Limited availability - grab them before they're gone!
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-sm">
                        {surplusMeals.length} {surplusMeals.length === 1 ? "deal" : "deals"}
                      </Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {surplusMeals.map(renderMealCard)}
                    </div>
                  </div>
                )}

                {/* Regular Meals Section */}
                {regularMeals.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">Regular Menu</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Full menu at standard prices
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-sm">
                        {regularMeals.length} {regularMeals.length === 1 ? "item" : "items"}
                      </Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {regularMeals.map(renderMealCard)}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {filteredMeals.length === 0 && (
                  <div className="text-center py-16 space-y-3">
                    <p className="text-lg text-muted-foreground">No meals found for this restaurant</p>
                    {searchQuery && (
                      <Button variant="outline" onClick={() => setSearchQuery("")}>
                        Clear Search
                      </Button>
                    )}
                  </div>
                )}
              </>
            )
          })()}
        </>
      )}
    </div>
  )
}
