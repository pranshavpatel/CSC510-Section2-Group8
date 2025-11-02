"use client"

import { MapView } from "@/components/map-view"
import { surplusItems } from "@/lib/mock-data"

export default function MapPage() {
  return (
    <div className="container py-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Find Deals Near You</h1>
        <p className="text-lg text-muted-foreground">
          Explore surplus food deals from restaurants in your area
        </p>
      </div>
      
      <div className="h-[600px] rounded-lg overflow-hidden border">
        <MapView 
          items={surplusItems}
          onItemSelect={(item) => {
            console.log('Selected item:', item)
          }}
        />
      </div>
    </div>
  )
}