"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { surplusItems } from "@/lib/mock-data"
import { MapPin, Search, TrendingDown } from "lucide-react"
import Image from "next/image"

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [cuisineFilter, setCuisineFilter] = useState("all")

  const filteredItems = surplusItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.restaurant.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCuisine = cuisineFilter === "all" || item.cuisine === cuisineFilter
    return matchesSearch && matchesCuisine
  })

  const cuisines = ["all", ...Array.from(new Set(surplusItems.map((item) => item.cuisine)))]

  return (
    <div className="container py-12 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Browse Surplus Deals</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Discover amazing deals on quality meals from top restaurants. Save money while reducing food waste.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meals or restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by cuisine" />
          </SelectTrigger>
          <SelectContent>
            {cuisines.map((cuisine) => (
              <SelectItem key={cuisine} value={cuisine}>
                {cuisine === "all" ? "All Cuisines" : cuisine}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredItems.length} {filteredItems.length === 1 ? "deal" : "deals"}
      </div>

      {/* Items Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="relative h-56 overflow-hidden">
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground font-semibold">
                {item.discount}% OFF
              </Badge>
            </div>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg leading-tight">{item.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3" />
                    {item.restaurant}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {item.cuisine}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">${item.price}</span>
                  <span className="text-sm text-muted-foreground line-through">${item.originalPrice}</span>
                </div>
                <Button size="sm">Order Now</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-lg text-muted-foreground">No deals found matching your criteria</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("")
              setCuisineFilter("all")
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}
