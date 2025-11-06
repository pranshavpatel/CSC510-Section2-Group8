"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Leaf } from "lucide-react"
import Link from "next/link"
import { hashPasswordWithSalt } from "@/lib/crypto-utils"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SALT = process.env.HASH_SALT!

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const validateEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email)
  }

  const handleLogin = async () => {
    // Validation
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (!validateEmail(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Hash the password before sending to backend
      const hashedPassword = await hashPasswordWithSalt(password, SALT)
      await login(email, hashedPassword)
      toast({
        title: "Success",
        description: "Logged in successfully",
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Login failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Leaf className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to VibeDish</h1>
          <p className="text-sm text-muted-foreground text-center">Sign in to start saving food and money</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Login</CardTitle>
            <CardDescription>Access your account to browse deals and get recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Owner Portal Link */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Restaurant Owner?</p>
              <p className="text-xs text-muted-foreground">
                List your surplus food and reduce waste
              </p>
              <Link href="/owner/signup">
                <Button variant="outline" className="w-full">
                  Create Restaurant Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
