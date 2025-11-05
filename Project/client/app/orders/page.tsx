"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, Loader2, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, ChefHat, PackageCheck } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { getMyOrders, getOrder, getOrderStatus, cancelOrder } from "@/lib/api"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Order {
  id: string
  restaurant_id: string
  status: string
  total: number
  created_at: string
}

interface OrderItem {
  id: string
  meal_id: string
  meal_name: string
  qty: number
  price: number
}

interface OrderDetails {
  order: {
    id: string
    user_id: string
    restaurant_id: string
    restaurant_name: string
    status: string
    total: number
    created_at: string
  }
  items: OrderItem[]
}

interface StatusEvent {
  status: string
  created_at: string
}

interface OrderTimeline {
  order_id: string
  timeline: StatusEvent[]
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "bg-yellow-500",
    variant: "secondary" as const,
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    color: "bg-blue-500",
    variant: "default" as const,
  },
  preparing: {
    label: "Preparing",
    icon: ChefHat,
    color: "bg-purple-500",
    variant: "default" as const,
  },
  ready: {
    label: "Ready",
    icon: PackageCheck,
    color: "bg-green-500",
    variant: "default" as const,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "bg-green-600",
    variant: "default" as const,
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "bg-red-500",
    variant: "destructive" as const,
  },
}

export default function OrdersPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [orderDetails, setOrderDetails] = useState<Record<string, OrderDetails>>({})
  const [orderTimelines, setOrderTimelines] = useState<Record<string, OrderTimeline>>({})
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set())
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    } else if (isAuthenticated) {
      loadOrders()
    }
  }, [isAuthenticated, authLoading, router])

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyOrders()
      setOrders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const toggleOrderExpand = async (orderId: string) => {
    const isExpanded = expandedOrders.has(orderId)
    
    if (isExpanded) {
      setExpandedOrders(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    } else {
      setExpandedOrders(prev => new Set(prev).add(orderId))
      
      // Load order details if not already loaded
      if (!orderDetails[orderId]) {
        setLoadingDetails(prev => new Set(prev).add(orderId))
        try {
          const [details, timeline] = await Promise.all([
            getOrder(orderId),
            getOrderStatus(orderId),
          ])
          setOrderDetails(prev => ({ ...prev, [orderId]: details }))
          setOrderTimelines(prev => ({ ...prev, [orderId]: timeline }))
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load order details")
        } finally {
          setLoadingDetails(prev => {
            const next = new Set(prev)
            next.delete(orderId)
            return next
          })
        }
      }
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy 'at' hh:mm a")
    } catch {
      return dateString
    }
  }

  const formatShortDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch {
      return dateString
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrders(prev => new Set(prev).add(orderId))
    try {
      await cancelOrder(orderId)
      
      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled successfully",
      })
      
      // Reload orders to get updated status
      await loadOrders()
      
      // If order details are loaded, refresh them too
      if (orderDetails[orderId]) {
        const [details, timeline] = await Promise.all([
          getOrder(orderId),
          getOrderStatus(orderId),
        ])
        setOrderDetails(prev => ({ ...prev, [orderId]: details }))
        setOrderTimelines(prev => ({ ...prev, [orderId]: timeline }))
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to cancel order",
        variant: "destructive",
      })
    } finally {
      setCancellingOrders(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isEmpty = orders.length === 0

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">My Orders</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          View your order history and track current orders
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrders}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {isEmpty ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center space-y-4">
            <Package className="h-16 w-16 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">No orders yet</h2>
              <p className="text-muted-foreground">
                Start exploring our deals and place your first order!
              </p>
            </div>
            <Button onClick={() => router.push('/browse')} size="lg">
              Browse Meals
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} found
          </p>

          {orders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
            const StatusIcon = statusConfig.icon
            const isExpanded = expandedOrders.has(order.id)
            const details = orderDetails[order.id]
            const timeline = orderTimelines[order.id]
            const isLoadingDetails = loadingDetails.has(order.id)
            const isCancelling = cancellingOrders.has(order.id)
            const canCancel = order.status === "pending"

            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">
                          Order #{order.id.slice(0, 8)}
                        </CardTitle>
                        <Badge variant={statusConfig.variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <CardDescription>
                        Placed on {formatShortDate(order.created_at)}
                      </CardDescription>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-2xl font-bold">${order.total.toFixed(2)}</p>
                      <div className="flex gap-2">
                        {canCancel && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isCancelling}
                                className="text-destructive hover:text-destructive"
                              >
                                {isCancelling ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Cancelling...
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancel
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will cancel order #{order.id.slice(0, 8)} and restore the meal items back to the restaurant's inventory. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Order</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Cancel Order
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleOrderExpand(order.id)}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Details
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-6">
                    {isLoadingDetails ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : details ? (
                      <>
                        {/* Restaurant Info */}
                        <div>
                          <h3 className="font-semibold mb-2">Restaurant</h3>
                          <p className="text-muted-foreground">{details.order.restaurant_name}</p>
                        </div>

                        <Separator />

                        {/* Order Items */}
                        <div>
                          <h3 className="font-semibold mb-3">Items</h3>
                          <div className="space-y-3">
                            {details.items.map((item) => (
                              <div key={item.id} className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium">{item.meal_name}</p>
                                  <p className="text-sm text-muted-foreground">Qty: {item.qty}</p>
                                </div>
                                <p className="font-medium">${item.price.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Order Timeline */}
                        {timeline && timeline.timeline.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-3">Order Status Timeline</h3>
                            <div className="space-y-3">
                              {timeline.timeline.map((event, idx) => {
                                const eventConfig = STATUS_CONFIG[event.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
                                const EventIcon = eventConfig.icon
                                const isLast = idx === timeline.timeline.length - 1

                                return (
                                  <div key={idx} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                      <div className={`rounded-full p-2 ${eventConfig.color}`}>
                                        <EventIcon className="h-4 w-4 text-white" />
                                      </div>
                                      {!isLast && (
                                        <div className="w-0.5 h-full bg-border mt-1" />
                                      )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                      <p className="font-medium">{eventConfig.label}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {formatDate(event.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        <Separator />

                        {/* Total */}
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total</span>
                          <span>${details.order.total.toFixed(2)}</span>
                        </div>
                      </>
                    ) : null}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

