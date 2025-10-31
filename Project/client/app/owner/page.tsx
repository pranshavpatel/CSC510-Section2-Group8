"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Package, DollarSign, Users, Plus } from "lucide-react"

// Mock analytics data
const salesData = [
  { day: "Mon", sales: 12, revenue: 4800 },
  { day: "Tue", sales: 19, revenue: 7600 },
  { day: "Wed", sales: 15, revenue: 6000 },
  { day: "Thu", sales: 22, revenue: 8800 },
  { day: "Fri", sales: 28, revenue: 11200 },
  { day: "Sat", sales: 35, revenue: 14000 },
  { day: "Sun", sales: 31, revenue: 12400 },
]

const wasteReduction = [
  { month: "Jan", kg: 45 },
  { month: "Feb", kg: 52 },
  { month: "Mar", kg: 61 },
  { month: "Apr", kg: 58 },
  { month: "May", kg: 67 },
  { month: "Jun", kg: 73 },
]

const activeSurplus = [
  { id: 1, name: "Vegan Buddha Bowl", stock: 8, price: 400, status: "active" },
  { id: 2, name: "Margherita Pizza", stock: 5, price: 360, status: "active" },
  { id: 3, name: "Butter Chicken", stock: 3, price: 450, status: "low" },
  { id: 4, name: "Acai Bowl", stock: 12, price: 320, status: "active" },
]

export default function OwnerDashboard() {
  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Restaurant Dashboard</h1>
          <p className="text-muted-foreground">Manage your surplus inventory and track performance</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Surplus Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$64,800</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+12.5%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">162</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+8.2%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waste Reduced</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">73 kg</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+18.3%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Sales</CardTitle>
                <CardDescription>Number of items sold per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Waste Reduction Trend</CardTitle>
                <CardDescription>Food waste prevented over time (kg)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={wasteReduction}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="kg"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Impact Stats */}
          <Card className="bg-gradient-to-br from-primary/10 via-secondary/5 to-background border-2">
            <CardHeader>
              <CardTitle>Environmental Impact</CardTitle>
              <CardDescription>Your contribution to sustainability</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">CO2 Emissions Saved</p>
                <p className="text-3xl font-bold text-primary">146 kg</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Water Saved</p>
                <p className="text-3xl font-bold text-primary">2,190 L</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Meals Rescued</p>
                <p className="text-3xl font-bold text-primary">162</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Surplus Items</CardTitle>
              <CardDescription>Manage your current surplus inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSurplus.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.status === "low" ? "destructive" : "secondary"}>
                          {item.stock} in stock
                        </Badge>
                        <span className="text-sm text-muted-foreground">${item.price}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
