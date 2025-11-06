"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MapView } from "@/components/map-view"

interface Restaurant {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
}

export default function MapPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL!}/catalog/restaurants`)
        if (!response.ok) {
          throw new Error('Failed to fetch restaurants')
        }
        const data = await response.json()
        setRestaurants(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [])

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    // Navigate to browse page with restaurant ID
    router.push(`/browse?restaurant=${restaurant.id}`)
  }

  return (
    <div className="container py-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Find Deals Near You</h1>
        <p className="text-lg text-muted-foreground">
          Explore surplus food deals from restaurants in your area
        </p>
      </div>
      
      <div className="h-[600px] rounded-lg overflow-hidden border">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-muted">
            <p className="text-lg text-muted-foreground">Loading restaurants...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full bg-muted">
            <p className="text-lg text-destructive">Error: {error}</p>
          </div>
        ) : (
          <MapView 
            restaurants={restaurants}
            onRestaurantSelect={handleRestaurantSelect}
          />
        )}
      </div>
    </div>
  )
}