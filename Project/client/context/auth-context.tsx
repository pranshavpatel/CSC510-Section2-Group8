"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface User {
  email: string
  role: "customer" | "owner"
  name: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role: "customer" | "owner") => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = async (email: string, password: string, role: "customer" | "owner") => {
    // Mock login - in production, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 500))
    setUser({
      email,
      role,
      name: email.split("@")[0],
    })
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
