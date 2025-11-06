"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, Package } from "lucide-react"
import { getOwnerMeals, createMeal, updateMeal, deleteMeal } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Meal {
  id: string
  restaurant_id: string
  name: string
  tags?: string[]
  base_price: number
  quantity: number
  surplus_price?: number
  allergens?: string[]
  calories?: number
  image_link?: string
}

interface MealFormData {
  name: string
  tags: string
  base_price: string
  quantity: string
  surplus_price: string
  allergens: string
  calories: string
  image_link: string
}

const initialFormData: MealFormData = {
  name: "",
  tags: "",
  base_price: "",
  quantity: "",
  surplus_price: "",
  allergens: "",
  calories: "",
  image_link: "",
}

interface MealFormProps {
  formData: MealFormData
  setFormData: React.Dispatch<React.SetStateAction<MealFormData>>
}

function MealForm({ formData, setFormData }: MealFormProps) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Meal Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="e.g., Vegan Buddha Bowl"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="base_price">
            Base Price ($) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="base_price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.base_price}
            onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="surplus_price">Surplus Price ($)</Label>
          <Input
            id="surplus_price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.surplus_price}
            onChange={(e) => setFormData({ ...formData, surplus_price: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">
            Quantity <span className="text-destructive">*</span>
          </Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            placeholder="0"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="calories">Calories</Label>
          <Input
            id="calories"
            type="number"
            min="0"
            placeholder="0"
            value={formData.calories}
            onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          placeholder="e.g., vegan, healthy, gluten-free (comma-separated)"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Separate multiple tags with commas</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="allergens">Allergens</Label>
        <Input
          id="allergens"
          placeholder="e.g., nuts, dairy, soy (comma-separated)"
          value={formData.allergens}
          onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Separate multiple allergens with commas</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_link">Image URL</Label>
        <Input
          id="image_link"
          type="url"
          placeholder="https://example.com/image.jpg"
          value={formData.image_link}
          onChange={(e) => setFormData({ ...formData, image_link: e.target.value })}
        />
      </div>
    </div>
  )
}

export default function OwnerDashboard() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
  const [formData, setFormData] = useState<MealFormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadMeals()
  }, [])

  const loadMeals = async () => {
    try {
      setLoading(true)
      const data = await getOwnerMeals()
      setMeals(data)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load meals",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddMeal = async () => {
    try {
      setSubmitting(true)
      
      // Validate required fields
      if (!formData.name || !formData.base_price || !formData.quantity) {
        toast({
          title: "Validation Error",
          description: "Name, base price, and quantity are required",
          variant: "destructive",
        })
        return
      }

      const mealData = {
        name: formData.name,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(t => t) : undefined,
        base_price: parseFloat(formData.base_price),
        quantity: parseInt(formData.quantity),
        surplus_price: formData.surplus_price ? parseFloat(formData.surplus_price) : undefined,
        allergens: formData.allergens ? formData.allergens.split(",").map(a => a.trim()).filter(a => a) : undefined,
        calories: formData.calories ? parseInt(formData.calories) : undefined,
        image_link: formData.image_link || undefined,
      }

      await createMeal(mealData)
      toast({
        title: "Success",
        description: "Meal added successfully",
      })
      setIsAddDialogOpen(false)
      setFormData(initialFormData)
      loadMeals()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add meal",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditMeal = async () => {
    if (!selectedMeal) return

    try {
      setSubmitting(true)

      const updateData: any = {}
      
      if (formData.name && formData.name !== selectedMeal.name) {
        updateData.name = formData.name
      }
      if (formData.tags !== undefined) {
        updateData.tags = formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(t => t) : []
      }
      if (formData.base_price && parseFloat(formData.base_price) !== selectedMeal.base_price) {
        updateData.base_price = parseFloat(formData.base_price)
      }
      if (formData.quantity && parseInt(formData.quantity) !== selectedMeal.quantity) {
        updateData.quantity = parseInt(formData.quantity)
      }
      if (formData.surplus_price !== undefined) {
        updateData.surplus_price = formData.surplus_price ? parseFloat(formData.surplus_price) : null
      }
      if (formData.allergens !== undefined) {
        updateData.allergens = formData.allergens ? formData.allergens.split(",").map(a => a.trim()).filter(a => a) : []
      }
      if (formData.calories !== undefined) {
        updateData.calories = formData.calories ? parseInt(formData.calories) : null
      }
      if (formData.image_link !== undefined) {
        updateData.image_link = formData.image_link || null
      }

      if (Object.keys(updateData).length === 0) {
        toast({
          title: "No Changes",
          description: "No fields were modified",
        })
        return
      }

      await updateMeal(selectedMeal.id, updateData)
      toast({
        title: "Success",
        description: "Meal updated successfully",
      })
      setIsEditDialogOpen(false)
      setSelectedMeal(null)
      setFormData(initialFormData)
      loadMeals()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update meal",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMeal = async () => {
    if (!selectedMeal) return

    try {
      setSubmitting(true)
      await deleteMeal(selectedMeal.id)
      toast({
        title: "Success",
        description: "Meal deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      setSelectedMeal(null)
      loadMeals()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete meal",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (meal: Meal) => {
    setSelectedMeal(meal)
    setFormData({
      name: meal.name,
      tags: meal.tags?.join(", ") || "",
      base_price: meal.base_price.toString(),
      quantity: meal.quantity.toString(),
      surplus_price: meal.surplus_price?.toString() || "",
      allergens: meal.allergens?.join(", ") || "",
      calories: meal.calories?.toString() || "",
      image_link: meal.image_link || "",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (meal: Meal) => {
    setSelectedMeal(meal)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Restaurant Dashboard</h1>
          <p className="text-muted-foreground">Manage your surplus inventory</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setFormData(initialFormData)}>
              <Plus className="h-4 w-4" />
              Add Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Meal</DialogTitle>
              <DialogDescription>Add a new meal to your restaurant's menu</DialogDescription>
            </DialogHeader>
            <MealForm formData={formData} setFormData={setFormData} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMeal} disabled={submitting}>
                {submitting ? "Adding..." : "Add Meal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{meals.length}</div>
          <p className="text-xs text-muted-foreground">
            {meals.reduce((sum, meal) => sum + meal.quantity, 0)} items in stock
          </p>
        </CardContent>
      </Card>

      {/* Meals List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Meals</CardTitle>
          <CardDescription>Manage your restaurant's surplus meals</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading meals...</div>
          ) : meals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No meals added yet. Click "Add Meal" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {meals.map((meal) => (
                <div key={meal.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-lg">{meal.name}</p>
                      {meal.quantity === 0 && (
                        <Badge variant="destructive">Out of Stock</Badge>
                      )}
                      {meal.quantity > 0 && meal.quantity < 5 && (
                        <Badge variant="secondary">Low Stock</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Base Price:</span>
                        <span className="ml-1 font-medium">${meal.base_price.toFixed(2)}</span>
                      </div>
                      {meal.surplus_price && (
                        <div>
                          <span className="text-muted-foreground">Surplus Price:</span>
                          <span className="ml-1 font-medium">${meal.surplus_price.toFixed(2)}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="ml-1 font-medium">{meal.quantity}</span>
                      </div>
                      {meal.calories && (
                        <div>
                          <span className="text-muted-foreground">Calories:</span>
                          <span className="ml-1 font-medium">{meal.calories}</span>
                        </div>
                      )}
                    </div>

                    {meal.tags && meal.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {meal.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {meal.allergens && meal.allergens.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Allergens:</span> {meal.allergens.join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(meal)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(meal)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meal</DialogTitle>
            <DialogDescription>Update meal information</DialogDescription>
          </DialogHeader>
          <MealForm formData={formData} setFormData={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditMeal} disabled={submitting}>
              {submitting ? "Updating..." : "Update Meal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedMeal?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMeal} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
