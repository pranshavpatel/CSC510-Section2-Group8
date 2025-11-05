"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Construction, Sparkles } from "lucide-react"

export default function RecommendationsPage() {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="max-w-2xl w-full border-2">
        <CardContent className="py-16 px-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 animate-pulse">
              <Construction className="h-10 w-10 text-primary" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">This Page is Yet to Develop</h1>
            <p className="text-lg text-muted-foreground">
              We're crafting an amazing mood-based recommendation system for you.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
            <Sparkles className="h-4 w-4" />
            <span>Coming soon with Spotify integration and personalized meal suggestions!</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
