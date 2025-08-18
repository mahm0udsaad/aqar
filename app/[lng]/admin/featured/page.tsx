import { AdminHeader } from "@/components/admin/admin-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPrice } from "@/lib/utils"
import { Star, Eye, Edit } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"
import { ToggleFeaturedButton } from "../properties/components/toggle-featured-button"
import { FeaturedReorderTable } from "./components/featured-reorder-table"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/config"

interface PageProps {
  params: Promise<{ lng: Locale }>
}

export default async function AdminFeaturedPage({ params }: PageProps) {
  const { lng } = await params
  const supabase = createServerComponentClient<Database>({ cookies })
  const dict = await getDictionary(lng)

  // Fetch featured properties
  const { data: featuredProperties, error } = await supabase
    .from("properties")
    .select(`
      *,
      categories (id, name),
      property_images (id, url, alt_text, is_main, order_index)
    `)
    .eq("is_featured", true)
    .order("is_main_featured", { ascending: false })
    .order("order_index", { ascending: true })

  if (error) {
    console.error("Error fetching featured properties:", error)
  }

  // Fetch all active properties for potential featuring
  const { data: allProperties } = await supabase
    .from("properties")
    .select(`
      *,
      categories (id, name),
      property_images (id, url, alt_text, is_main, order_index)
    `)
    .eq("status", "active")
    .eq("is_featured", false)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div>
      <AdminHeader
        title={dict.admin.featured.title}
        description={dict.admin.featured.description}
        lng={lng}
        dict={dict}
      />

      <div className="p-6 space-y-8">
        {/* Current Featured Properties */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold">{dict.admin.featured.currentlyFeatured}</h2>
              <p className="text-muted-foreground">
                {dict.admin.featured.currentlyFeaturedSubtitle} ({featuredProperties?.length || 0} {dict.admin.featured.total})
              </p>
            </div>
          </div>

          {/* Client-side DnD table for reordering */}
          <FeaturedReorderTable initialItems={featuredProperties} lng={lng} dict={dict} />
        </div>

        {/* Available Properties to Feature */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold">{dict.admin.featured.availableToFeature}</h2>
              <p className="text-muted-foreground">
                {dict.admin.featured.availableToFeatureSubtitle}
              </p>
            </div>
            <Link href={`/${lng}/admin/properties`}>
              <Button variant="outline">
                {dict.admin.featured.viewAllProperties}
              </Button>
            </Link>
          </div>

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
                    {allProperties && allProperties.length > 0 ? (
                      allProperties.map((property) => {
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
                            <TableCell className="font-medium">{formatPrice(property.price)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant="outline"
                                  className="text-green-600 border-green-600"
                                >
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
        </div>

        {/* Tips */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">{dict.admin.featured.tips.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p>{dict.admin.featured.tips.tip1}</p>
                <p>{dict.admin.featured.tips.tip2}</p>
                <p>{dict.admin.featured.tips.tip3}</p>
              </div>
              <div className="space-y-2">
                <p>{dict.admin.featured.tips.tip4}</p>
                <p>{dict.admin.featured.tips.tip5}</p>
                <p>{dict.admin.featured.tips.tip6}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

