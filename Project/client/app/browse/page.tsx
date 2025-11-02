"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Search, Store, ArrowLeft, UtensilsCrossed, Loader2 } from "lucide-react"

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
  surplus_qty: number
  surplus_price: number | null
  allergens: string[]
  calories: number
  created_at: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function BrowsePage() {
  const [view, setView] = useState<"restaurants" | "meals">("restaurants")
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [meals, setMeals] = useState<Meal[]>([])

  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch restaurants on mount
  useEffect(() => {
    fetchRestaurants()
  }, [])

  // Fetch meals when view changes to meals
  useEffect(() => {
    if (view === "meals" && meals.length === 0) {
      fetchMeals()
    }
  }, [view])

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

  const fetchMeals = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/catalog/meals`)
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

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
    setView("meals")
    setSearchQuery("")
  }

  const handleBackToRestaurants = () => {
    setView("restaurants")
    setSelectedRestaurant(null)
    setSearchQuery("")
  }

  // Filter restaurants by search
  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter meals by selected restaurant and search
  const filteredMeals = meals.filter((meal) => {
    const matchesRestaurant = !selectedRestaurant || meal.restaurant_id === selectedRestaurant.id
    const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesRestaurant && matchesSearch
  })

  // Calculate discount percentage
  const getDiscountPercentage = (basePrice: number, surplusPrice: number | null) => {
    if (!surplusPrice || basePrice <= 0) return 0
    return Math.round(((basePrice - surplusPrice) / basePrice) * 100)
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
            onClick={view === "restaurants" ? fetchRestaurants : fetchMeals}
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
          {(() => {
            // Split meals into surplus and regular
            const surplusMeals = filteredMeals.filter((meal) => meal.surplus_qty > 0 && meal.surplus_price !== null)
            const regularMeals = filteredMeals.filter((meal) => meal.surplus_qty === 0 || meal.surplus_price === null)

            const renderMealCard = (meal: Meal) => {
              const discountPercent = getDiscountPercentage(meal.base_price, meal.surplus_price)
              const hasSurplus = meal.surplus_qty > 0
              const hasSurplusPrice = meal.surplus_price !== null

              return (
                <Card key={meal.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
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
                      {hasSurplus && hasSurplusPrice && discountPercent > 0 && (
                        <Badge className="bg-destructive text-destructive-foreground font-semibold">
                          {discountPercent}% OFF
                        </Badge>
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
                            {meal.surplus_qty} left
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
                      <Button size="sm" disabled={!hasSurplus}>
                        {hasSurplus ? "Order Now" : "Sold Out"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            return (
              <>
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
