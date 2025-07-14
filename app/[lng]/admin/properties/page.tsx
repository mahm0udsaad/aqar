import { AdminHeader } from "@/components/admin/admin-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPrice } from "@/lib/utils"
import { Plus, Edit, Trash2, Star, Eye, Building } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"
import { PropertySearchFilters } from "./components/property-search-filters"
import { DeletePropertyButton } from "./components/delete-property-button"
import { ToggleFeaturedButton } from "./components/toggle-featured-button"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/config"

interface PageProps {
  params: { lng: Locale }
  searchParams: { search?: string; category?: string; status?: string }
}

export default async function AdminPropertiesPage({ params, searchParams }: PageProps) {
  const { lng } = params
  const supabase = createServerComponentClient<Database>({ cookies })
  const dict = await getDictionary(lng)

  // Build query with filters
  let query = supabase
    .from("properties")
    .select(`
      *,
      categories (id, name),
      property_images (id, url, alt_text, is_main, order_index)
    `)
    .order("created_at", { ascending: false })

  // Apply search filter
  if (searchParams.search) {
    query = query.or(`title.ilike.%${searchParams.search}%,location.ilike.%${searchParams.search}%,area.ilike.%${searchParams.search}%`)
  }

  // Apply category filter
  if (searchParams.category) {
    query = query.eq("category_id", searchParams.category)
  }

  // Apply status filter
  if (searchParams.status) {
    query = query.eq("status", searchParams.status)
  }

  const { data: properties, error } = await query

  if (error) {
    console.error("Error fetching properties:", error)
  }

  // Fetch categories for filters
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("order_index", { ascending: true })

  return (
    <div>
      <AdminHeader
        title={dict.admin.properties.title}
        description={dict.admin.properties.description}
        lng={lng}
        dict={dict}
      />

      <div className="p-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <PropertySearchFilters categories={categories || []} dict={dict} />
          
          <Link href={`/${lng}/admin/properties/new`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {dict.admin.properties.addProperty}
            </Button>
          </Link>
        </div>

        {/* Properties Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dict.admin.properties.table.property}</TableHead>
                    <TableHead>{dict.admin.properties.table.category}</TableHead>
                    <TableHead>{dict.admin.properties.table.price}</TableHead>
                    <TableHead>{dict.admin.properties.table.status}</TableHead>
                    <TableHead>{dict.admin.properties.table.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties && properties.length > 0 ? (
                    properties.map((property) => {
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
                            <Badge variant="secondary">{property.categories?.name || dict.admin.properties.noCategory}</Badge>
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
                                  {dict.admin.properties.featured}
                                </Badge>
                              )}
                              {property.is_new && (
                                <Badge variant="outline" className="text-blue-600 border-blue-600">
                                  {dict.admin.properties.new}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Link href={`/${params.lng}/properties/${property.id}`} target="_blank">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Link href={`/${params.lng}/admin/properties/${property.id}/edit`}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </Link>
                              <ToggleFeaturedButton 
                                propertyId={property.id} 
                                isFeatured={property.is_featured || false}
                                dict={dict}
                              />
                              <DeletePropertyButton propertyId={property.id} dict={dict} />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">{dict.admin.properties.noPropertiesFound}</h3>
                        <p className="text-muted-foreground mb-4">
                          {searchParams.search || searchParams.category || searchParams.status
                            ? dict.admin.properties.noPropertiesMatchFilters
                            : dict.admin.properties.getStarted}
                        </p>
                        <Link href={`/${params.lng}/admin/properties/new`}>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            {dict.admin.properties.addProperty}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
