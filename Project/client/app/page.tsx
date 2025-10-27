import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { moodRecommendations } from "@/lib/mock-data"
import { Music, Leaf, TrendingDown, Heart } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-1.5">
              <Leaf className="h-3 w-3 mr-1.5" />
              Sustainable Food Delivery
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance">
              Food that matches your <span className="text-primary">mood</span>, saves the{" "}
              <span className="text-primary">planet</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto text-pretty">
              Connect your Spotify to get personalized meal recommendations based on your current mood. Enjoy surplus
              restaurant meals at amazing discounts while reducing food waste.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-base">
                <Link href="/recommendations">
                  <Music className="h-5 w-5 mr-2" />
                  Connect Spotify
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base bg-transparent">
                <Link href="/browse">Browse Deals</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Mood-Based Recommendations</CardTitle>
              <CardDescription className="leading-relaxed">
                Connect your Spotify and get meal suggestions that match your current vibe
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 mb-4">
                <TrendingDown className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle>Surplus Deals</CardTitle>
              <CardDescription className="leading-relaxed">
                Save up to 50% on quality meals from top restaurants while reducing waste
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Eco-Friendly</CardTitle>
              <CardDescription className="leading-relaxed">
                Every order helps reduce food waste and supports sustainable practices
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Sample Recommendations */}
      <section className="container py-20">
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Meals for Every Mood</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Here's a taste of what we recommend based on different moods
            </p>
          </div>

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
                  <Badge className="absolute top-3 right-3 bg-background/90 text-foreground border">{item.mood}</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.restaurant}</span>
                    <span className="font-semibold">${item.price}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" asChild>
              <Link href="/recommendations">
                <Heart className="h-5 w-5 mr-2" />
                Get Your Recommendations
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <Card className="bg-gradient-to-br from-primary/10 via-secondary/5 to-background border-2">
          <CardContent className="py-16 text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              Ready to discover your perfect meal?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Join thousands of users who are eating better, saving money, and helping the planet
            </p>
            <Button size="lg" asChild>
              <Link href="/recommendations">Get Started</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
