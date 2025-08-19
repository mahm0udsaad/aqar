"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, MoreHorizontal, Eye, EyeOff } from "lucide-react"
import { AreaDialog } from "./area-dialog"
import { DeleteAreaButton } from "./delete-area-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { updateArea } from "@/lib/actions/areas"

interface Area {
  id: string
  name: string
  slug: string
  description: string | null
  order_index: number | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  image_url?: string | null
}

interface AreasGridProps {
  areas: Area[]
  lng: string
  dict: any
}

export function AreasGrid({ areas, lng, dict }: AreasGridProps) {
  const [selectedArea, setSelectedArea] = useState<Area | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCreateNew = () => {
    setSelectedArea(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (area: Area) => {
    setSelectedArea(area)
    setIsDialogOpen(true)
  }

  const handleToggleActive = async (area: Area) => {
    try {
      const formData = new FormData()
      formData.append("name", area.name)
      formData.append("description", area.description || "")
      formData.append("orderIndex", area.order_index?.toString() || "0")
      formData.append("isActive", (!area.is_active).toString())

      const result = await updateArea(area.id, { errors: {}, message: "", success: false }, formData)
      
      if (result.success) {
        toast.success(`Area ${area.is_active ? 'deactivated' : 'activated'} successfully`)
        window.location.reload()
      } else {
        toast.error(result.message || "Failed to update area")
      }
    } catch (error) {
      toast.error("Failed to update area")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Areas</h2>
          <p className="text-muted-foreground">
            Manage areas and locations for property listings
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Area
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {areas.map((area) => (
          <Card key={area.id} className="relative">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-lg">{area.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={area.is_active ? "default" : "secondary"}>
                    {area.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    #{area.order_index}
                  </span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(area)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleActive(area)}>
                    {area.is_active ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DeleteAreaButton area={area} />
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {area.image_url && (
                  <img src={area.image_url} alt={`${area.name} image`} className="w-full h-32 object-cover rounded-md" />
                )}
                <p className="text-sm text-muted-foreground">
                  Slug: <code className="text-xs">{area.slug}</code>
                </p>
                {area.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {area.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Created: {area.created_at ? new Date(area.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {areas.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium">No areas found</p>
              <p className="text-sm">Create your first area to get started</p>
            </div>
            <Button onClick={handleCreateNew} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Create First Area
            </Button>
          </div>
        )}
      </div>

      <AreaDialog
        area={selectedArea}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        lng={lng}
        dict={dict}
      />
    </div>
  )
} 