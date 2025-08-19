"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Edit } from "lucide-react"
import { ToggleFeaturedButton } from "../../properties/components/toggle-featured-button"
import type { Locale } from "@/lib/i18n/config"

interface AvailableToFeatureTableProps {
  initialItems: any[]
  lng: Locale
  dict: any
}

export function AvailableToFeatureTable({ initialItems, lng, dict }: AvailableToFeatureTableProps) {
  const [items, setItems] = useState<any[]>([...(initialItems || [])])

  useEffect(() => {
    function handleExternalToggle(e: any) {
      const detail = e?.detail
      if (!detail) return
      const { property, isFeatured } = detail
      if (!property) return
      // If a property was un-featured elsewhere, add it to this list if not already present
      if (!isFeatured) {
        setItems(prev => {
          if (prev.some(p => p.id === property.id)) return prev
          return [property, ...prev]
        })
      }
    }
    if (typeof window !== "undefined") {
      window.addEventListener("admin-featured:toggle", handleExternalToggle)
      return () => window.removeEventListener("admin-featured:toggle", handleExternalToggle)
    }
  }, [])

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dict.admin.featured.table.property}</TableHead>
                <TableHead>{dict.admin.featured.table.category}</TableHead>
                <TableHead>{dict.admin.featured.table.price}</TableHead>
                <TableHead>{dict.admin.featured.table.status}</TableHead>
                <TableHead>{dict.admin.featured.table.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items && items.length > 0 ? (
                items.map((property) => {
                  const mainImage = property.property_images?.find((img: any) => img.is_main) || property.property_images?.[0]
                  return (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="relative w-12 h-12 rounded-md overflow-hidden">
                            <Image
                              src={mainImage?.url || "/placeholder.svg?height=48&width=48"}
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
                      <TableCell className="font-medium">{new Intl.NumberFormat().format(property.price)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {property.status?.charAt(0).toUpperCase() + (property.status?.slice(1) || "")}
                          </Badge>
                          {property.is_new && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              {dict.admin.featured.new}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/${lng}/properties/${property.id}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/${lng}/admin/properties/${property.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <ToggleFeaturedButton
                            propertyId={property.id}
                            isFeatured={false}
                            dict={dict}
                            onToggled={(newIsFeatured) => {
                              if (newIsFeatured) {
                                // Remove from available list immediately
                                setItems(prev => prev.filter(p => p.id !== property.id))
                                // Notify other client components on the page (e.g., featured list) to update
                                if (typeof window !== "undefined") {
                                  window.dispatchEvent(new CustomEvent("admin-featured:toggle", { detail: { property, isFeatured: true } }))
                                }
                              }
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">{dict.admin.featured.noAvailableToFeature}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}


