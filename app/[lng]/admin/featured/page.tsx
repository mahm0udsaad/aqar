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
import { AvailableToFeatureTable } from "./components/available-to-feature-table"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Dictionary } from "@/lib/i18n/types"
import { Locale } from "@/lib/i18n/config"

interface PageProps {
  params: Promise<{ lng: Locale }>
}

export default async function AdminFeaturedPage({ params }: PageProps) {
  const { lng } = await params
  const supabase = createServerComponentClient<Database>({ cookies })
  const dict = (await getDictionary(lng)) as unknown as Dictionary

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
          <FeaturedReorderTable initialItems={featuredProperties || []} lng={lng} dict={dict} />
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

          <AvailableToFeatureTable initialItems={allProperties || []} lng={lng} dict={dict} />
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

