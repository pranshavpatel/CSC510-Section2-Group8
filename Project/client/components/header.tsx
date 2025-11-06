"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { Leaf, LogOut, ShoppingCart, Package, User } from "lucide-react"

export function Header() {
  const pathname = usePathname()
  const { user, logout, isAuthenticated } = useAuth()

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/browse", label: "Deals" },
    { href: "/map", label: "Map" },
    { href: "/recommendations", label: "Recommendations" },
    ...(user?.role === "owner" ? [{ href: "/owner", label: "Dashboard" }] : []),
  ]

  const userLinks = [
    { href: "/cart", label: "Cart", icon: ShoppingCart },
    { href: "/orders", label: "Orders", icon: Package },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-foreground">VibeDish</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {userLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Button
                    key={link.href}
                    variant="ghost"
                    size="sm"
                    asChild
                    className={pathname === link.href ? "bg-accent" : ""}
                  >
                    <Link href={link.href}>
                      <Icon className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">{link.label}</span>
                    </Link>
                  </Button>
                )
              })}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={pathname === "/profile" ? "bg-accent" : ""}
              >
                <Link href="/profile">
                  <User className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">{user?.name || "Profile"}</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
