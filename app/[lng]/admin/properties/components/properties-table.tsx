"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPrice } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, Edit, Trash2, Star, Eye, Building } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Database } from "@/lib/supabase/types"
import { DeletePropertyButton } from "./delete-property-button"
import { ToggleFeaturedButton } from "./toggle-featured-button"
import { Locale } from "@/lib/i18n/config"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useTransition } from 'react'
import { updatePropertyOrder } from '@/lib/actions/properties'
import { toast } from 'sonner'
import { GripVertical } from 'lucide-react'

type PropertyWithDetails = Database["public"]["Tables"]["properties"]["Row"] & {
  categories: { id: string; name: string } | null;
  property_images: { id: string; url: string; alt_text: string | null; is_main: boolean; order_index: number | null }[];
};

interface SortableRowProps {
  property: PropertyWithDetails;
  children: React.ReactNode;
}

function SortableRow({ property, children }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: property.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      className={isDragging ? "shadow-lg bg-background border-2 border-primary" : ""}
    >
      <TableCell className="w-12">
        <div className="flex items-center gap-2">
          {/* Order number indicator */}
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
            {(property.order_index || 0) + 1}
          </div>
          {/* Drag handle */}
          <div 
            {...attributes} 
            {...listeners}
            className="p-1 cursor-grab active:cursor-grabbing hover:bg-muted rounded"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </TableCell>
      {children}
    </TableRow>
  );
}

interface PropertiesTableProps {
  properties?: PropertyWithDetails[];
  lng: Locale;
  dict: any;
  searchParams: { search?: string; category?: string; status?: string };
}

export function PropertiesTable({ properties: initialProperties = [], lng, dict, searchParams }: PropertiesTableProps) {
  const [properties, setProperties] = useState<PropertyWithDetails[]>(initialProperties.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id && properties) {
      setProperties((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Update order_index for all affected properties
        const updatedProperties = newOrder.map((prop, index) => ({
          ...prop,
          order_index: index, // Assign new order_index starting from 0
        }));

        // Use startTransition to avoid the setState during render error
        startTransition(() => {
          updatePropertyOrder(updatedProperties.map(p => ({ id: p.id, order_index: p.order_index })))
            .then(res => {
              if (res.success) {
                toast.success(res.message);
              } else {
                toast.error(res.message);
                // Revert the optimistic update on error
                setProperties(initialProperties.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
              }
            })
            .catch(err => {
              console.error("Failed to update property order:", err);
              toast.error("Failed to update property order.");
              // Revert the optimistic update on error
              setProperties(initialProperties.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
            });
        });

        return updatedProperties;
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {isPending && (
            <div className="absolute top-4 right-4 z-50">
              <div className="bg-background border rounded-lg px-3 py-2 shadow-lg">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Updating order...
                </div>
              </div>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Order</TableHead>
                <TableHead>{dict.admin.properties.table.property}</TableHead>
                <TableHead>{dict.admin.properties.table.category}</TableHead>
                <TableHead>{dict.admin.properties.table.price}</TableHead>
                <TableHead>{dict.admin.properties.table.status}</TableHead>
                <TableHead>{dict.admin.properties.table.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={(properties || []).map(p => p.id)} strategy={verticalListSortingStrategy}>
                <TableBody>
                  {properties && properties.length > 0 ? (
                    (properties || []).map((property) => {
                      const mainImage = property.property_images?.find((img: any) => img.is_main) || property.property_images?.[0]

                      return (
                        <SortableRow key={property.id} property={property}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="relative w-12 h-12 rounded-md overflow-hidden">
                                <Image
                                  src={property.thumbnail_url || mainImage?.url || "/placeholder.svg?height=48&width=48"}
                                  alt={property.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-medium">{property.title}</p>
                                <p className="text-sm text-muted-foreground">{property.location}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{property.categories?.name || dict.admin.featured.noCategory}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{formatPrice(property.price)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="outline"
                                className={
                                  property.status === "active"
                                    ? "text-green-600 border-green-600"
                                    : property.status === "draft"
                                    ? "text-yellow-600 border-yellow-600"
                                    : property.status === "sold"
                                    ? "text-red-600 border-red-600"
                                    : "text-gray-600 border-gray-600"
                                }
                              >
                                {property.status?.charAt(0).toUpperCase() + (property.status?.slice(1) || "")}
                              </Badge>
                              {property.is_featured && (
                                <Badge className="bg-primary text-primary-foreground">
                                  <Star className="w-3 h-3 mr-1" />
                                  {dict.admin.featured.featured}
                                </Badge>
                              )}
                              {property.is_new && (
                                <Badge variant="outline" className="text-blue-600 border-blue-600">
                                  {dict.admin.featured.new}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Link href={`/${lng}/properties/${property.id}`} target="_blank">
                                      <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </Link>
                                  </TooltipTrigger>
                                  <TooltipContent>View Property</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Link href={`/${lng}/admin/properties/${property.id}/edit`}>
                                      <Button variant="ghost" size="sm">
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </Link>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Property</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <ToggleFeaturedButton 
                                propertyId={property.id} 
                                isFeatured={property.is_featured || false}
                                dict={dict}
                                onToggled={(newIsFeatured) => {
                                  setProperties(prev => prev.map(p => p.id === property.id ? { ...p, is_featured: newIsFeatured } : p))
                                }}
                              />
                              <DeletePropertyButton propertyId={property.id} dict={dict} />
                            </div>
                          </TableCell>
                        </SortableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">{dict.admin.properties.noPropertiesFound}</h3>
                        <p className="text-muted-foreground mb-4">
                          {searchParams.search || searchParams.category || searchParams.status
                            ? dict.admin.properties.noPropertiesMatchFilters
                            : dict.admin.properties.getStarted}
                        </p>
                        <Link href={`/${lng}/admin/properties/new`}>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            {dict.admin.properties.addProperty}
                          </Button>
                        </Link>
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
  );
} 