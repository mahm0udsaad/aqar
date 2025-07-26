import type { Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCategories, getProperties } from "@/lib/supabase/queries"
import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CategoriesPageProps {
  params: Promise<{ lng: Locale }>
}



export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { lng } = await params
  const dict = await getDictionary(lng)
  const categories = await getCategories()
  console.log(categories)
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
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {dict.categories.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {dict.categories.subtitle}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
          {categoriesWithCounts.map((category) => {
            const imagePath = category.image_url

            return (
              <Link key={category.id} href={`/${lng}/categories/${category.slug}`}>
                <Card className="h-full hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 cursor-pointer group overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm">
                  {/* Image Background */}
                  <div className="relative h-56 overflow-hidden">
                    <div 
                      className="w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
                      style={{
                        backgroundImage: `url('${imagePath}')`,
                      }}
                    />
                    {/* Enhanced gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Property count badge on image */}
                    <div className="absolute top-4 right-4">
                      {category.propertyCount > 0 ? (
                        <Badge className="bg-primary/90 text-primary-foreground border-0 shadow-lg backdrop-blur-sm">
                          {category.propertyCount} {dict.categories.properties}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-background/80 text-muted-foreground border-0 shadow-lg backdrop-blur-sm">
                          {dict.categories.noProperties}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Category title on image */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary/90 transition-colors duration-300">
                        {lng === "ar" ? category.name_ar : category.name_en}
                      </h3>
                      <p className="text-white/90 text-sm line-clamp-2 leading-relaxed">
                        {lng === "ar" ? category.description_ar : category.description_en}
                      </p>
                    </div>
                  </div>

                  {/* Card Content */}
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>Explore Properties</span>
                      </div>
                      <div className="flex items-center gap-2 text-primary group-hover:text-primary/80 transition-colors">
                        <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          View All
                        </span>
                        <ArrowRight className="h-5 w-5 transform group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Popular Areas */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">{dict.categories.popularAreas}</h2>
            <p className="text-muted-foreground">Discover prime locations across the city</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-transparent hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {area}
                </Button>
              </Link>
            ))}
          </div>
        </section>

        {/* Enhanced Quick Stats */}
        <section className="bg-gradient-to-br from-muted/50 via-muted/30 to-primary/5 rounded-xl p-10 shadow-lg border">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Platform Overview</h2>
            <p className="text-muted-foreground">Comprehensive real estate solutions</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="group">
              <div className="text-4xl font-bold text-primary mb-3 group-hover:scale-110 transition-transform duration-300">
                {categoriesWithCounts.reduce((sum, cat) => sum + cat.propertyCount, 0)}+
              </div>
              <p className="text-muted-foreground font-medium">{dict.categories.totalProperties}</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Active listings available</p>
            </div>
            <div className="group">
              <div className="text-4xl font-bold text-primary mb-3 group-hover:scale-110 transition-transform duration-300">
                {categoriesWithCounts.length}
              </div>
              <p className="text-muted-foreground font-medium">{dict.categories.categories}</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Property types to choose from</p>
            </div>
            <div className="group">
              <div className="text-4xl font-bold text-primary mb-3 group-hover:scale-110 transition-transform duration-300">
                50+
              </div>
              <p className="text-muted-foreground font-medium">{dict.categories.locations}</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Prime areas covered</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}