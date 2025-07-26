"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, GripVertical } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core"
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy 
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { updateCategoriesOrder, deleteCategory } from "@/lib/actions/categories"
import { toast } from "sonner"
import { CategoryDialog } from "./category-dialog"
import Image from "next/image"
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
import { Dictionary } from "@/lib/i18n/types"

interface Category {
  id: string
  name: string
  description: string | null
  order_index: number | null
  propertyCount: number
  image_url?: string | null
}

interface SortableCategoryProps {
  category: Category
  lng: string
  dict: Dictionary
  isDragOverlay?: boolean
}

function SortableCategory({ category, lng, dict, isDragOverlay = false }: SortableCategoryProps) {
  const [isPending, startTransition] = useTransition()
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ 
    id: category.id,
    disabled: isDragOverlay
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragOverlay ? undefined : transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteCategory(category.id)
        
        if (result.success) {
          toast.success(result.message)
        } else {
          toast.error(result.message)
        }
      } catch (error) {
        toast.error(dict.admin.categories.deleteError)
      }
    })
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all duration-200 ${
        isDragging ? "shadow-lg ring-2 ring-primary" : ""
      } ${isDragOverlay ? "shadow-2xl rotate-3 scale-105" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-md touch-none"
              style={{ touchAction: 'none' }}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">{category.name}</CardTitle>
          </div>
          {!isDragOverlay && (
            <div className="flex items-center space-x-1">
              <CategoryDialog lng={lng} mode="edit" category={category} dict={dict}>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </CategoryDialog>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    disabled={isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{dict.admin.categories.deleteTitleDialog}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {dict.admin.categories.deleteConfirmation}
                      {category.propertyCount > 0 && (
                        <span className="block mt-2 text-red-600 font-medium">
                          {dict.admin.categories.deleteWarning} {category.propertyCount} {dict.admin.categories.properties}.
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{dict.admin.categories.cancel}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {dict.admin.categories.delete}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Category Image */}
        {category.image_url && (
          <div className="relative w-full h-32 rounded-md overflow-hidden mb-4">
            <Image 
              src={category.image_url} 
              alt={category.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        <p className="text-muted-foreground mb-4">{category.description}</p>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{category.propertyCount} {dict.admin.categories.properties}</Badge>
          <span className="text-sm text-muted-foreground">{dict.admin.categories.order}: {category.order_index}</span>
        </div>
      </CardContent>
    </Card>
  )
}

interface CategoryGridProps {
  categories: Category[]
  lng: string
  dict: Dictionary
}

export function CategoryGrid({ categories: initialCategories, lng, dict }: CategoryGridProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const activeIndex = categories.findIndex((item) => item.id === active.id)
      const overIndex = categories.findIndex((item) => item.id === over.id)

      if (activeIndex === -1 || overIndex === -1) {
        console.error("Invalid drag operation: item not found", { active: active.id, over: over.id })
        return
      }

      // Optimistically update the UI
      const newOrder = arrayMove(categories, activeIndex, overIndex)
      const updatedOrder = newOrder.map((item, index) => ({
        ...item,
        order_index: index,
      }))

      setCategories(updatedOrder)

      // Save the new order to database
      startTransition(async () => {
        try {
          const orderUpdates = updatedOrder.map((item, index) => ({
            id: item.id,
            order_index: index,
          }))

          console.log("Updating category order:", orderUpdates)
          const result = await updateCategoriesOrder(orderUpdates)
          
          if (result.success) {
            toast.success(result.message)
          } else {
            console.error("Order update failed:", result.message)
            toast.error(result.message)
            // Revert changes on error
            setCategories(initialCategories.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)))
          }
        } catch (error) {
          console.error("Error updating category order:", error)
          toast.error(dict.admin.categories.updateOrderError || "Failed to update category order")
          // Revert changes on error
          setCategories(initialCategories.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)))
        }
      })
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const activeCategory = categories.find(category => category.id === activeId)

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext 
        items={categories.map((c) => c.id)} 
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <SortableCategory 
              key={category.id} 
              category={category} 
              lng={lng} 
              dict={dict} 
            />
          ))}
        </div>
      </SortableContext>
      
      <DragOverlay dropAnimation={null}>
        {activeCategory ? (
          <SortableCategory 
            category={activeCategory} 
            lng={lng} 
            dict={dict} 
            isDragOverlay 
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}