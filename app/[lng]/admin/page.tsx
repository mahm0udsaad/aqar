import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, FolderOpen, Star, TrendingUp } from "lucide-react"
import { createDb } from "@/lib/db"
import type { Database } from "@/lib/supabase/types"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/config"
import Link from "next/link"
import { getPendingCounts } from "@/lib/actions/moderation"

export default async function AdminDashboard({ params: { lng } }: { params: { lng: Locale } }) {
  const supabase = createDb()
  const dict = await getDictionary(lng)

  // Fetch real data from database
  const [
    { data: properties },
    { data: categories },
    { data: featuredProperties },
  ] = await Promise.all([
    supabase.from("properties").select("id, price, is_featured, category_id").eq("status", "active"),
    supabase.from("categories").select("id, name"),
    supabase.from("properties").select("id, title_en, title_ar, price, location_en, location_ar, location, is_featured").eq("is_featured", true).eq("status", "active").limit(5),
  ])

  const totalProperties = properties?.length || 0
  const totalCategories = categories?.length || 0
  const featuredCount = properties?.filter(p => p.is_featured)?.length || 0
  const totalValue = properties?.reduce((sum, property) => sum + (property.price || 0), 0) || 0

  const stats = [
    {
      title: dict.admin.dashboard.totalProperties,
      value: totalProperties,
      icon: Building,
      color: "text-primary",
      bgColor: "bg-accent",
    },
    {
      title: dict.admin.categories.title,
      value: totalCategories,
      icon: FolderOpen,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: dict.admin.dashboard.featuredProperties,
      value: featuredCount,
      icon: Star,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: dict.admin.dashboard.totalPortfolioValue,
      value: `$${(totalValue / 1000000).toFixed(1)}M`,
      icon: TrendingUp,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ]

  const queue = await getPendingCounts()

  return (
    <div>
      <AdminHeader
        title={dict.admin.dashboard.title}
        description={dict.admin.dashboard.description}
        lng={lng}
        dict={dict}
      />
      {(queue.pending > 0 || queue.reports > 0) && (
        <div className="px-6 pt-6 grid gap-3 sm:grid-cols-2">
          {queue.pending > 0 && (
            <Link href={`/${lng}/admin/moderation`} className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 hover:bg-amber-100">
              <div className="text-2xl font-bold">{queue.pending}</div>
              <div className="text-sm">{lng === "ar" ? "إعلانات بانتظار المراجعة" : "listings waiting for review"}</div>
            </Link>
          )}
          {queue.reports > 0 && (
            <Link href={`/${lng}/admin/reports`} className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 hover:bg-red-100">
              <div className="text-2xl font-bold">{queue.reports}</div>
              <div className="text-sm">{lng === "ar" ? "بلاغات مفتوحة من الزوار" : "open visitor reports"}</div>
            </Link>
          )}
        </div>
      )}

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={`stat-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Properties */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{dict.admin.dashboard.recentFeaturedProperties}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featuredProperties && featuredProperties.length > 0 ? (
                  featuredProperties.map((property, index) => (
                    <div key={`featured-${property.id}-${index}`} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{(property as any).title_en || (property as any).title_ar}</p>
                        <p className="text-sm text-muted-foreground">{(property as any).location_en || (property as any).location_ar || (property as any).location}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${property.price?.toLocaleString()}</p>
                        {property.is_featured && <Star className="h-4 w-4 text-warning inline" />}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">{dict.admin.dashboard.noFeaturedProperties}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.admin.dashboard.categoriesOverview}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories && categories.length > 0 ? (
                  categories.map((category, index) => {
                    const categoryCount = properties?.filter((p) => p.category_id === category.id).length || 0
                    return (
                      <div key={`category-${category.id}-${index}`} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{category.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{categoryCount} {dict.admin.dashboard.properties}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-muted-foreground text-center py-4">{dict.admin.dashboard.noCategories}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
