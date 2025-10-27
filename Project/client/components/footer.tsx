import Link from "next/link"
import { Leaf } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Leaf className="h-4 w-4 text-primary-foreground" />
              </div>
              <span>Mood2Food</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sustainable food delivery with mood-based recommendations
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h3 className="font-semibold">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/browse" className="text-muted-foreground hover:text-foreground transition-colors">
                  Browse Deals
                </Link>
              </li>
              <li>
                <Link href="/map" className="text-muted-foreground hover:text-foreground transition-colors">
                  Map View
                </Link>
              </li>
              <li>
                <Link href="/recommendations" className="text-muted-foreground hover:text-foreground transition-colors">
                  Recommendations
                </Link>
              </li>
            </ul>
          </div>

          {/* For Restaurants */}
          <div className="space-y-3">
            <h3 className="font-semibold">For Restaurants</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/owner" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-muted-foreground hover:text-foreground transition-colors">
                  Partner With Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Mood2Food. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
