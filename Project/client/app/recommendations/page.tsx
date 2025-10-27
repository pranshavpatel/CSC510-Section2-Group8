"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { moodRecommendations } from "@/lib/mock-data"
import { Music, Heart, Sparkles } from "lucide-react"
import Image from "next/image"

export default function RecommendationsPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [currentMood, setCurrentMood] = useState<string | null>(null)

  const handleConnect = () => {
    // Simulate Spotify connection
    setIsConnected(true)
    // Simulate mood detection
    setTimeout(() => {
      setCurrentMood("Happy")
    }, 1000)
  }

  return (
    <div className="container py-12 space-y-8">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Your Mood-Based Recommendations</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Connect your Spotify account to get personalized meal recommendations based on your current mood
        </p>
      </div>

      {/* Spotify Connection */}
      {!isConnected ? (
        <Card className="max-w-2xl mx-auto border-2">
          <CardContent className="py-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Music className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Connect Your Spotify</h2>
              <p className="text-muted-foreground">
                We'll analyze your current listening to understand your mood and recommend the perfect meal
              </p>
            </div>
            <Button size="lg" onClick={handleConnect} className="gap-2">
              <Music className="h-5 w-5" />
              Connect Spotify
            </Button>
            <p className="text-xs text-muted-foreground">
              We only access your currently playing track. Your data is never stored.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current Mood */}
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 via-secondary/5 to-background border-2">
            <CardContent className="py-8 text-center space-y-4">
              <Badge variant="secondary" className="text-base px-4 py-1.5">
                <Heart className="h-4 w-4 mr-2" />
                Current Mood: {currentMood}
              </Badge>
              <p className="text-muted-foreground">
                Based on your Spotify listening, we've detected you're feeling {currentMood?.toLowerCase()}!
              </p>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Perfect Meals for Your Mood</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {moodRecommendations.map((item) => (
                <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-3 right-3 bg-background/90 text-foreground border">
                      {item.mood}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg leading-tight">{item.name}</CardTitle>
                    <CardDescription className="text-xs">{item.restaurant}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">₹{item.price}</span>
                      <Button size="sm">Order</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Disconnect */}
          <div className="text-center">
            <Button variant="outline" onClick={() => setIsConnected(false)}>
              Disconnect Spotify
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
