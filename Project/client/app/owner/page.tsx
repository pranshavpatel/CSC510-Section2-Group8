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
import { Plus, Pencil, Trash2, Package, Upload, X } from "lucide-react"
import { getOwnerMeals, createMeal, updateMeal, deleteMeal, getPresignedUploadUrl, uploadFileToS3, deleteImageFromS3 } from "@/lib/api"
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

interface ImageUploadState {
  file: File | null
  uploading: boolean
  uploadedUrl: string | null
  previewUrl: string | null
}

interface MealFormProps {
  formData: MealFormData
  setFormData: React.Dispatch<React.SetStateAction<MealFormData>>
  imageUploadState: ImageUploadState
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImageRemove: () => void
}

function MealForm({ formData, setFormData, imageUploadState, onImageSelect, onImageRemove }: MealFormProps) {
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
        <Label htmlFor="image_file">Meal Image</Label>
        <div className="flex flex-col gap-2">
          {imageUploadState.previewUrl || formData.image_link ? (
            <div className="relative w-full h-48 border rounded-lg overflow-hidden">
              <img
                src={imageUploadState.previewUrl || formData.image_link}
                alt="Meal preview"
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={onImageRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Label
              htmlFor="image_file"
              className="block cursor-pointer"
            >
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground hover:text-foreground">
                  Click to upload meal image
                </span>
              </div>
              <Input
                id="image_file"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onImageSelect}
                disabled={imageUploadState.uploading}
              />
            </Label>
          )}
          {imageUploadState.uploading && (
            <p className="text-sm text-muted-foreground">Uploading image...</p>
          )}
        </div>
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
  const [imageUploadState, setImageUploadState] = useState<ImageUploadState>({
    file: null,
    uploading: false,
    uploadedUrl: null,
    previewUrl: null,
  })
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadMeals()
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, WebP, or GIF image",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    // Create local preview URL only
    const previewUrl = URL.createObjectURL(file)
    
    setImageUploadState({
      file,
      uploading: false,
      uploadedUrl: null,
      previewUrl,
    })
  }

  const handleImageRemove = () => {
    // Clean up preview URL
    if (imageUploadState.previewUrl) {
      URL.revokeObjectURL(imageUploadState.previewUrl)
    }
    
    setImageUploadState({
      file: null,
      uploading: false,
      uploadedUrl: null,
      previewUrl: null,
    })
    
    // Clear image_link in form
    setFormData({ ...formData, image_link: "" })
  }

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

  const cleanupDialog = () => {
    // Clean up local preview URL
    if (imageUploadState.previewUrl) {
      URL.revokeObjectURL(imageUploadState.previewUrl)
    }

    setFormData(initialFormData)
    setImageUploadState({
      file: null,
      uploading: false,
      uploadedUrl: null,
      previewUrl: null,
    })
    setOriginalImageUrl(null)
    setSelectedMeal(null)
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
        setSubmitting(false)
        return
      }

      let imageUrl: string | undefined = undefined

      // Upload image to CDN if file is selected
      if (imageUploadState.file) {
        try {
          setImageUploadState(prev => ({ ...prev, uploading: true }))
          
          const { upload_url, public_url } = await getPresignedUploadUrl(
            imageUploadState.file.name,
            imageUploadState.file.type
          )
          
          await uploadFileToS3(upload_url, imageUploadState.file)
          imageUrl = public_url
          
          setImageUploadState(prev => ({ ...prev, uploading: false }))
        } catch (error) {
          setImageUploadState(prev => ({ ...prev, uploading: false }))
          toast({
            title: "Upload failed",
            description: error instanceof Error ? error.message : "Failed to upload image",
            variant: "destructive",
          })
          setSubmitting(false)
          return
        }
      }

      const mealData = {
        name: formData.name,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(t => t) : undefined,
        base_price: parseFloat(formData.base_price),
        quantity: parseInt(formData.quantity),
        surplus_price: formData.surplus_price ? parseFloat(formData.surplus_price) : undefined,
        allergens: formData.allergens ? formData.allergens.split(",").map(a => a.trim()).filter(a => a) : undefined,
        calories: formData.calories ? parseInt(formData.calories) : undefined,
        image_link: imageUrl,
      }

      await createMeal(mealData)
      
      // Clean up preview URL
      if (imageUploadState.previewUrl) {
        URL.revokeObjectURL(imageUploadState.previewUrl)
      }
      
      toast({
        title: "Success",
        description: "Meal added successfully",
      })
      
      setIsAddDialogOpen(false)
      setFormData(initialFormData)
      setImageUploadState({
        file: null,
        uploading: false,
        uploadedUrl: null,
        previewUrl: null,
      })
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
      
      // Handle image changes
      let newImageUrl: string | null = null
      const fileToUpload = imageUploadState.file
      const imageRemoved = !formData.image_link && !fileToUpload
      
      if (fileToUpload) {
        // Upload new image to CDN
        try {
          setImageUploadState(prev => ({ ...prev, uploading: true }))
          
          const { upload_url, public_url } = await getPresignedUploadUrl(
            fileToUpload.name,
            fileToUpload.type
          )
          
          await uploadFileToS3(upload_url, fileToUpload)
          newImageUrl = public_url
          
          setImageUploadState(prev => ({ ...prev, uploading: false }))
        } catch (error) {
          setImageUploadState(prev => ({ ...prev, uploading: false }))
          toast({
            title: "Upload failed",
            description: error instanceof Error ? error.message : "Failed to upload image",
            variant: "destructive",
          })
          setSubmitting(false)
          return
        }
        
        updateData.image_link = newImageUrl
        
        // Delete old image from CDN if it exists
        if (originalImageUrl) {
          try {
            await deleteImageFromS3(originalImageUrl)
          } catch (error) {
            console.error("Failed to delete old image:", error)
          }
        }
      } else if (imageRemoved && originalImageUrl) {
        // User removed the image
        updateData.image_link = null
        
        // Delete old image from CDN
        try {
          await deleteImageFromS3(originalImageUrl)
        } catch (error) {
          console.error("Failed to delete old image:", error)
        }
      }

      if (Object.keys(updateData).length === 0) {
        toast({
          title: "No Changes",
          description: "No fields were modified",
        })
        setSubmitting(false)
        return
      }

      await updateMeal(selectedMeal.id, updateData)
      
      // Clean up preview URL
      if (imageUploadState.previewUrl) {
        URL.revokeObjectURL(imageUploadState.previewUrl)
      }
      
      toast({
        title: "Success",
        description: "Meal updated successfully",
      })
      
      setIsEditDialogOpen(false)
      setSelectedMeal(null)
      setFormData(initialFormData)
      setImageUploadState({
        file: null,
        uploading: false,
        uploadedUrl: null,
        previewUrl: null,
      })
      setOriginalImageUrl(null)
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
      
      // Delete the image from S3 if it exists
      if (selectedMeal.image_link) {
        try {
          await deleteImageFromS3(selectedMeal.image_link)
        } catch (error) {
          console.error("Failed to delete image:", error)
          // Continue with meal deletion even if image deletion fails
        }
      }
      
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
    setOriginalImageUrl(meal.image_link || null)
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
    setImageUploadState({
      file: null,
      uploading: false,
      uploadedUrl: null,
      previewUrl: null,
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
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          if (!open) {
            cleanupDialog()
          }
          setIsAddDialogOpen(open)
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => {
              setFormData(initialFormData)
              setImageUploadState({
                file: null,
                uploading: false,
                uploadedUrl: null,
                previewUrl: null,
              })
            }}>
              <Plus className="h-4 w-4" />
              Add Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Meal</DialogTitle>
              <DialogDescription>Add a new meal to your restaurant's menu</DialogDescription>
            </DialogHeader>
            <MealForm 
              formData={formData} 
              setFormData={setFormData} 
              imageUploadState={imageUploadState}
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                cleanupDialog()
                setIsAddDialogOpen(false)
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddMeal} 
                disabled={submitting || imageUploadState.uploading}
              >
                {submitting ? "Adding..." : imageUploadState.uploading ? "Uploading..." : "Add Meal"}
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
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          cleanupDialog()
        }
        setIsEditDialogOpen(open)
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meal</DialogTitle>
            <DialogDescription>Update meal information</DialogDescription>
          </DialogHeader>
          <MealForm 
            formData={formData} 
            setFormData={setFormData}
            imageUploadState={imageUploadState}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              cleanupDialog()
              setIsEditDialogOpen(false)
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditMeal} 
              disabled={submitting || imageUploadState.uploading}
            >
              {submitting ? "Updating..." : imageUploadState.uploading ? "Uploading..." : "Update Meal"}
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
