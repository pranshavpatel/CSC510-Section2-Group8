"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Leaf } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (role: "customer" | "owner") => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await login(email, password, role)
      toast({
        title: "Success",
        description: "Logged in successfully",
      })
      router.push(role === "owner" ? "/owner" : "/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
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
          <h1 className="text-2xl font-bold">Welcome to Mood2Food</h1>
          <p className="text-sm text-muted-foreground text-center">Sign in to start saving food and money</p>
        </div>

        {/* Login Form */}
        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="owner">Restaurant Owner</TabsTrigger>
          </TabsList>

          <TabsContent value="customer">
            <Card>
              <CardHeader>
                <CardTitle>Customer Login</CardTitle>
                <CardDescription>Access your account to browse deals and get recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-email">Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-password">Password</Label>
                  <Input
                    id="customer-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={() => handleLogin("customer")} disabled={isLoading}>
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
          </TabsContent>

          <TabsContent value="owner">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Owner Login</CardTitle>
                <CardDescription>Manage your surplus inventory and track analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="owner-email">Email</Label>
                  <Input
                    id="owner-email"
                    type="email"
                    placeholder="restaurant@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner-password">Password</Label>
                  <Input
                    id="owner-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={() => handleLogin("owner")} disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Want to join as a partner?{" "}
                  <Link href="/signup" className="text-primary hover:underline">
                    Register your restaurant
                  </Link>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Demo Credentials */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Demo:</strong> Use any email/password to test the app
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
