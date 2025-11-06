"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example"
mapboxgl.accessToken = MAPBOX_TOKEN

interface Restaurant {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
}

interface MapViewProps {
  restaurants: Restaurant[]
  onRestaurantSelect?: (restaurant: Restaurant) => void
}

export function MapView({ restaurants, onRestaurantSelect }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)

  // Calculate center point from all restaurants
  const centerLng = restaurants.reduce((sum, restaurant) => sum + restaurant.longitude, 0) / restaurants.length 
  const centerLat = restaurants.reduce((sum, restaurant) => sum + restaurant.latitude, 0) / restaurants.length 

  useEffect(() => {
    if (!mapContainer.current) return

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [centerLng, centerLat],
      zoom: 12
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Clean up on unmount
    return () => {
      map.current?.remove()
      markers.current.forEach(marker => marker.remove())
      markers.current = []
    }
  }, [centerLat, centerLng])

  // Update markers when restaurants change
  useEffect(() => {
    if (!map.current) return

    // Remove existing markers
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    // Add new markers
    restaurants.forEach((restaurant, index) => {
      const el = document.createElement('div')
      el.className = 'marker'
      el.innerHTML = `
        <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white bg-green-500 hover:scale-110 transition-transform cursor-pointer">
          ${index + 1}
        </div>
      `
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat([restaurant.longitude, restaurant.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <p class="font-semibold">${restaurant.name}</p>
                <p class="text-sm text-gray-600">${restaurant.address || 'No address available'}</p>
              </div>
            `)
        )
        .addTo(map.current!)

      markers.current.push(marker)

      el.addEventListener('click', () => {
        setSelectedRestaurant(restaurant)
      })
    })
  }, [restaurants])

  return (
    <div className="relative w-full h-full">
      {/* Mapbox Container */}
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden bg-muted" />

      {/* Selected Restaurant Card */}
      {selectedRestaurant && (
        <Card className="absolute bottom-4 left-4 right-4 p-4 shadow-lg max-w-sm">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{selectedRestaurant.name}</h3>
            <p className="text-sm text-muted-foreground">{selectedRestaurant.address || 'No address available'}</p>
            <div className="flex items-center justify-between gap-2">
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => onRestaurantSelect?.(selectedRestaurant)}
              >
                View Meals
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setSelectedRestaurant(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
