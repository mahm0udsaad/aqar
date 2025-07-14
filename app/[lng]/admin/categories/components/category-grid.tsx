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
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { updateCategoriesOrder, deleteCategory } from "@/lib/actions/categories"
import { toast } from "sonner"
import { CategoryDialog } from "./category-dialog"
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
}

interface SortableCategoryProps {
  category: Category
  lng: string
  dict: Dictionary
}

function SortableCategory({ category, lng, dict }: SortableCategoryProps) {
  const [isPending, startTransition] = useTransition()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
      className={`transition-all duration-200 ${isDragging ? "shadow-lg ring-2 ring-primary" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">{category.name}</CardTitle>
          </div>
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
        </div>
      </CardHeader>
      <CardContent>
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
  const [isPending, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const newOrder = arrayMove(items, oldIndex, newIndex)

        // Update order values
        const updatedOrder = newOrder.map((item, index) => ({
          ...item,
          order_index: index,
        }))

        // Save the new order to database
        startTransition(async () => {
          try {
            const orderUpdates = updatedOrder.map((item, index) => ({
              id: item.id,
              order_index: index,
            }))

            const result = await updateCategoriesOrder(orderUpdates)
            
            if (result.success) {
              toast.success(result.message)
            } else {
              toast.error(result.message)
              // Revert changes on error
              setCategories(initialCategories)
            }
          } catch (error) {
            toast.error(dict.admin.categories.updateOrderError)
            setCategories(initialCategories)
          }
        })

        return updatedOrder
      })
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <SortableCategory key={category.id} category={category} lng={lng} dict={dict} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
} 