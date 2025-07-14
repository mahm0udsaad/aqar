import { notFound } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PropertyCard } from "@/components/property-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getCategoryBySlug, getProperties, getCategories } from "@/lib/supabase/queries"
import { Home, Building, TreePine, Store, ArrowRight } from "lucide-react"
import Link from "next/link"

interface CategoryPageProps {
  params: { lng: Locale; slug: string }
}

const categoryIcons = {
  apartments: Home,
  villas: Building,
  land: TreePine,
  commercial: Store,
}

export default async function CategoryPage({ params: { lng, slug } }: CategoryPageProps) {
  const dict = await getDictionary(lng)
  const category = await getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const properties = await getProperties({ category: category.id })
  const allCategories = await getCategories()
  const relatedCategories = allCategories.filter((cat) => cat.slug !== slug).slice(0, 3)

  const IconComponent = categoryIcons[category.slug as keyof typeof categoryIcons] || Home

  return (
    <div className="min-h-screen bg-background">
      <Navbar dict={dict} lng={lng} />
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${lng}`}>{dict.nav.home}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${lng}/categories`}>{dict.nav.categories}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{lng === "ar" ? category.name_ar : category.name_en}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Category Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <IconComponent className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">{lng === "ar" ? category.name_ar : category.name_en}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            {lng === "ar" ? category.description_ar : category.description_en}
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {properties.length} {dict.categories.properties}
          </Badge>
        </div>

        {/* Properties Grid */}
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center mb-12">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <IconComponent className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{dict.categories.noProperties}</h3>
                <p className="text-muted-foreground mb-4">{dict.categories.noPropertiesDescription}</p>
                <Link href={`/${lng}/search`}>
                  <Button>{dict.categories.browseAll}</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Related Categories */}
        {relatedCategories.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">{dict.categories.relatedCategories}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedCategories.map((relatedCategory) => {
                const RelatedIcon = categoryIcons[relatedCategory.slug as keyof typeof categoryIcons] || Home

                return (
                  <Link key={relatedCategory.id} href={`/${lng}/categories/${relatedCategory.slug}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardContent className="p-6 text-center">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                          <RelatedIcon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-2">
                          {lng === "ar" ? relatedCategory.name_ar : relatedCategory.name_en}
                        </h3>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <span>{dict.categories.explore}</span>
                          <ArrowRight className="h-3 w-3 group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </main>
      <Footer dict={dict} lng={lng} />
    </div>
  )
}
