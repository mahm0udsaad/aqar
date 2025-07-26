"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
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
import { Trash2, Loader2 } from "lucide-react"
import { deleteProperty } from "@/lib/actions/properties"
import { toast } from "sonner"
import { Dictionary } from "@/lib/i18n/types"

interface DeletePropertyButtonProps {
  propertyId: string
  dict: Dictionary
}

export function DeletePropertyButton({ propertyId, dict }: DeletePropertyButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    console.log('Delete confirmed for property:', propertyId)
    startTransition(async () => {
      try {
        const result = await deleteProperty(propertyId)
        
        if (result.success) {
          toast.success(result.message)
          setOpen(false)
        } else {
          toast.error(result.message)
        }
              } catch (error) {
          console.error('Error deleting property:', error)
          toast.error(dict.admin.properties.delete.error)
        }
    })
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    // Prevent the drag event from interfering
    e.preventDefault()
    e.stopPropagation()
    console.log('Delete button clicked, opening dialog')
    setOpen(true)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          type="button"
          onClick={handleButtonClick}
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag from starting
          onMouseDown={(e) => e.stopPropagation()} // Prevent drag from starting
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent 
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {dict.admin.properties.delete.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {dict.admin.properties.delete.confirmation}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {dict.admin.properties.delete.cancel}
          </AlertDialogCancel>
                      <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {dict.admin.properties.delete.deleting}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                {dict.admin.properties.delete.delete}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}