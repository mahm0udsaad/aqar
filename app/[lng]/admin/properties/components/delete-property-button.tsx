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
        toast.error(dict.admin.properties.delete.error)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dict.admin.properties.delete.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {dict.admin.properties.delete.confirmation}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{dict.admin.properties.delete.cancel}</AlertDialogCancel>
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