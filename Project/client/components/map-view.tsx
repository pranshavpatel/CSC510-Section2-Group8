"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { SurplusItem } from "@/lib/mock-data"
import Image from "next/image"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example"

interface MapViewProps {
  items: SurplusItem[]
  onItemSelect?: (item: SurplusItem) => void
}

export function MapView({ items, onItemSelect }: MapViewProps) {
  const [selectedItem, setSelectedItem] = useState<SurplusItem | null>(null)
  const [hoveredItem, setHoveredItem] = useState<SurplusItem | null>(null)

  // Calculate center point from all items
  const centerLng = items.reduce((sum, item) => sum + item.lng, 0) / items.length
  const centerLat = items.reduce((sum, item) => sum + item.lat, 0) / items.length

  // Create markers string for Static API
  const markers = items
    .map((item, index) => {
      const color = selectedItem?.id === item.id ? "f97316" : "4ade80"
      return `pin-s-${index + 1}+${color}(${item.lng},${item.lat})`
    })
    .join(",")

  // Mapbox Static API URL
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markers}/${centerLng},${centerLat},12,0/800x600@2x?access_token=${MAPBOX_TOKEN}`

  const handleItemClick = (item: SurplusItem) => {
    setSelectedItem(item)
    onItemSelect?.(item)
  }

  return (
    <div className="relative w-full h-full">
      {/* Map Image */}
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-muted">
        <Image
          src={mapUrl || "/placeholder.svg"}
          alt="Map showing restaurant locations"
          fill
          className="object-cover"
        />
      </div>

      {/* Interactive Markers Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {items.map((item, index) => {
          // Calculate approximate pixel position (this is a simplified calculation)
          const relativeX = ((item.lng - centerLng) * 5000) / Math.pow(2, 12 - 12) + 400
          const relativeY = 300 - ((item.lat - centerLat) * 5000) / Math.pow(2, 12 - 12)

          return (
            <button
              key={item.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${(relativeX / 800) * 100}%`,
                top: `${(relativeY / 600) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div
                className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white transition-all ${
                  selectedItem?.id === item.id ? "bg-orange-500 scale-125" : "bg-green-500 hover:scale-110"
                }`}
              >
                {index + 1}
              </div>
              {hoveredItem?.id === item.id && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-2 whitespace-nowrap z-10">
                  <p className="text-sm font-semibold">{item.restaurant}</p>
                  <p className="text-xs text-muted-foreground">{item.name}</p>
                </div>
              )}
            </button>
          )
        })}
      </div>

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
