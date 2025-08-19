"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Edit, Star, Crown, GripVertical } from "lucide-react"
import { ToggleFeaturedButton } from "../../properties/components/toggle-featured-button"
import { updatePropertyOrder, setMainFeatured } from "@/lib/actions/properties"
import { toast } from "sonner"
import type { Locale } from "@/lib/i18n/config"

export function FeaturedReorderTable({ initialItems, lng, dict }: { initialItems: any[]; lng: Locale; dict: any }) {
  const [items, setItems] = useState<any[]>([...initialItems])
  const [isPending, startTransition] = useTransition()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function Row({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.9 : 1,
      zIndex: isDragging ? 1000 : 1,
    }
    return (
      <TableRow ref={setNodeRef} style={style} className={isDragging ? "shadow bg-background" : ""}>
        <TableCell className="w-12">
          <div className="p-1 cursor-grab active:cursor-grabbing hover:bg-muted rounded" {...attributes} {...listeners}>
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        </TableCell>
        {children}
      </TableRow>
    )
  }

  useEffect(() => {
    function handleExternalToggle(e: any) {
      const detail = e?.detail
      if (!detail) return
      const { property, isFeatured } = detail
      if (!property) return
      setItems(prev => {
        const exists = prev.some(p => p.id === property.id)
        if (isFeatured) {
          if (exists) return prev
          // Place at top; server will reconcile order_index
          return [{ ...property, is_featured: true }, ...prev]
        } else {
          if (!exists) return prev
          return prev.filter(p => p.id !== property.id)
        }
      })
    }
    if (typeof window !== "undefined") {
      window.addEventListener("admin-featured:toggle", handleExternalToggle)
      return () => window.removeEventListener("admin-featured:toggle", handleExternalToggle)
    }
  }, [])

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    const newOrder = arrayMove(items, oldIndex, newIndex)
    const updated = newOrder.map((p, idx) => ({ ...p, order_index: idx }))
    setItems(updated)

    startTransition(async () => {
      const res = await updatePropertyOrder(updated.map(p => ({ id: p.id, order_index: p.order_index })))
      if (res.success) toast.success(res.message)
      else toast.error(res.message)
    })
  }

  const toggleMain = async (id: string, makeMain: boolean) => {
    startTransition(async () => {
      const res = await setMainFeatured(id, makeMain)
      if (res.success) {
        toast.success(res.message)
        setItems(items.map(it => ({ ...it, is_main_featured: it.id === id ? makeMain : false })))
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>{dict.admin.featured.table.property}</TableHead>
                <TableHead>{dict.admin.featured.table.category}</TableHead>
                <TableHead>{dict.admin.featured.table.price}</TableHead>
                <TableHead>{dict.admin.featured.table.status}</TableHead>
                <TableHead>{dict.admin.featured.table.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <TableBody>
                  {items.length > 0 ? (
                    items.map((property) => {
                      const mainImage = property.property_images?.find((img: any) => img.is_main) || property.property_images?.[0]
                      return (
                        <Row key={property.id} id={property.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-md overflow-hidden">
                                <Image src={mainImage?.url || "/placeholder.svg?height=48&width=48"} alt={property.title} fill className="object-cover" />
                              </div>
                              <div>
                                <p className="font-medium flex items-center gap-2">
                                  {property.title}
                                  {property.is_main_featured && (
                                    <Badge className="bg-amber-500 text-white flex items-center gap-1"><Crown className="w-3 h-3" /> Main</Badge>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">{property.location}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{property.categories?.name || dict.admin.featured.noCategory}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{new Intl.NumberFormat().format(property.price)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                {property.status?.charAt(0).toUpperCase() + (property.status?.slice(1) || "")}
                              </Badge>
                              <Badge className="bg-primary text-primary-foreground">
                                <Star className="w-3 h-3 mr-1" /> {dict.admin.featured.featured}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Link href={`/${lng}/properties/${property.id}`} target="_blank">
                                <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                              </Link>
                              <Link href={`/${lng}/admin/properties/${property.id}/edit`}>
                                <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                              </Link>
                              <Button variant={property.is_main_featured ? "default" : "outline"} size="sm" onClick={() => toggleMain(property.id, !property.is_main_featured)}>
                                <Crown className="w-4 h-4 mr-1" /> {property.is_main_featured ? "Unset Main" : "Set Main"}
                              </Button>
                              <ToggleFeaturedButton 
                                propertyId={property.id} 
                                isFeatured={true} 
                                dict={dict}
                                onToggled={(newIsFeatured) => {
                                  // Keep local list responsive
                                  if (!newIsFeatured) {
                                    setItems(prev => prev.filter(p => p.id !== property.id))
                                  }
                                  // Notify other list
                                  if (typeof window !== "undefined") {
                                    window.dispatchEvent(new CustomEvent("admin-featured:toggle", { detail: { property, isFeatured: newIsFeatured } }))
                                  }
                                }}
                              />
                            </div>
                          </TableCell>
                        </Row>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">{dict.admin.featured.noFeaturedProperties}</h3>
                        <p className="text-muted-foreground mb-4">{dict.admin.featured.noFeaturedPropertiesSubtitle}</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </SortableContext>
            </DndContext>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}


