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
            <div className="mt-4">
              <Link href="/support" className="text-sm text-muted-foreground hover:text-primary">
                Need help? Visit our support center
              </Link>
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

          <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
            <Link href="/support">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>24/7 Support</CardTitle>
                <CardDescription className="leading-relaxed">
                  Get help anytime with our comprehensive support center and community
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
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
