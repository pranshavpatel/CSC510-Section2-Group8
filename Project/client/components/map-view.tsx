"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { SurplusItem } from "@/lib/mock-data"
import mapboxgl from 'mapbox-gl'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example"
mapboxgl.accessToken = MAPBOX_TOKEN

interface MapViewProps {
  items: SurplusItem[]
  onItemSelect?: (item: SurplusItem) => void
}

export function MapView({ items, onItemSelect }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const [selectedItem, setSelectedItem] = useState<SurplusItem | null>(null)

  // Calculate center point from all items
  const centerLng = items.reduce((sum, item) => sum + item.lng, 0) / items.length
  const centerLat = items.reduce((sum, item) => sum + item.lat, 0) / items.length

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

  // Update markers when items change
  useEffect(() => {
    if (!map.current) return

    // Remove existing markers
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    // Add new markers
    items.forEach((item, index) => {
      const el = document.createElement('div')
      el.className = 'marker'
      el.innerHTML = `
        <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white bg-green-500 hover:scale-110 transition-transform cursor-pointer">
          ${index + 1}
        </div>
      `
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat([item.lng, item.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <p class="font-semibold">${item.restaurant}</p>
                <p class="text-sm text-gray-600">${item.name}</p>
              </div>
            `)
        )
        .addTo(map.current!)

      markers.current.push(marker)

      el.addEventListener('click', () => {
        setSelectedItem(item)
        onItemSelect?.(item)
      })
    })
  }, [items, onItemSelect])

  const handleItemClick = (item: SurplusItem) => {
    setSelectedItem(item)
    onItemSelect?.(item)
  }

  return (
    <div className="relative w-full h-full">
      {/* Mapbox Container */}
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden bg-muted" />

      {/* Selected Item Card */}
      {selectedItem && (
        <Card className="absolute bottom-4 left-4 right-4 p-4 shadow-lg max-w-sm">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{selectedItem.name}</h3>
            <p className="text-sm text-muted-foreground">{selectedItem.restaurant}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-primary">${selectedItem.price}</span>
                <span className="text-sm text-muted-foreground line-through">${selectedItem.originalPrice}</span>
              </div>
              <Button size="sm" onClick={() => setSelectedItem(null)}>
                Close
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
