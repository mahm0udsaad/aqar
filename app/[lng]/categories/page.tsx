import type { Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCategories, getProperties } from "@/lib/supabase/queries"
import Link from "next/link"
import { Home, Building, TreePine, Store, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"


interface CategoriesPageProps {
  params: Promise<{ lng: Locale }>
}

const categoryIcons = {
  apartments: Home,
  villas: Building,
  land: TreePine,
  commercial: Store,
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { lng } = await params
  const dict = await getDictionary(lng)
  const categories = await getCategories()

  // Get property counts for each category
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const properties = await getProperties({ category: category.id })
      return { ...category, propertyCount: properties.length }
    }),
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar dict={dict} lng={lng} />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{dict.categories.title}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{dict.categories.subtitle}</p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {categoriesWithCounts.map((category) => {
            const IconComponent = categoryIcons[category.slug as keyof typeof categoryIcons] || Home

            return (
              <Link key={category.id} href={`/${lng}/categories/${category.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{lng === "ar" ? category.name_ar : category.name_en}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground mb-4 min-h-[3rem]">
                      {lng === "ar" ? category.description_ar : category.description_en}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {category.propertyCount} {dict.categories.properties}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Popular Areas */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">{dict.categories.popularAreas}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              "New Cairo",
              "Sheikh Zayed",
              "Maadi",
              "Zamalek",
              "Heliopolis",
              "Nasr City",
              "Dokki",
              "Mohandessin",
              "October City",
              "Rehab",
              "Madinaty",
              "Compound",
            ].map((area) => (
              <Link key={area} href={`/${lng}/search?location=${encodeURIComponent(area)}`}>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  {area}
                </Button>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Stats */}
        <section className="bg-muted/50 rounded-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">
                {categoriesWithCounts.reduce((sum, cat) => sum + cat.propertyCount, 0)}+
              </div>
              <p className="text-muted-foreground">{dict.categories.totalProperties}</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">{categoriesWithCounts.length}</div>
              <p className="text-muted-foreground">{dict.categories.categories}</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <p className="text-muted-foreground">{dict.categories.locations}</p>
            </div>
          </div>
        </section>
      </main>
      <Footer dict={dict} lng={lng} />
    </div>
  )
}
