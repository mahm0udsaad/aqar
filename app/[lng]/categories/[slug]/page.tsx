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
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export async function generateMetadata({ params }: { params: { lng: Locale; slug: string } }) {
  const { lng, slug } = params;
  const dict = await getDictionary(lng);
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found",
      description: "The requested category could not be found.",
    };
  }

  const properties = await getProperties({ category: category.id });
  // Use i18n fields with fallback to single fields for backward compatibility
  const categoryName = lng === "ar" 
    ? (category.name_ar || category.name || "Unknown Category")
    : (category.name_en || category.name || "Unknown Category");
  const categoryDescription = lng === "ar" 
    ? (category.description_ar || category.description || "")
    : (category.description_en || category.description || "");
  
  const title = `${categoryName} Properties for Sale & Rent in Egypt`;
  const description = `Browse ${properties.length} ${categoryName.toLowerCase()} properties in Egypt. ${categoryDescription}`;
  const imageUrl = category.image_url || '/categories/default.png';

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: categoryName,
      }],
      type: 'website',
      locale: lng,
      url: `/${lng}/categories/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
    },
    keywords: `${categoryName}, Egypt real estate, properties for sale, properties for rent, ${categoryName.toLowerCase()} Egypt`,
  };
}

interface CategoryPageProps {
  params: { lng: Locale; slug: string }
}

const categoryImages = {
  default: "/public/placeholder.png",
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

  const imagePath = category.image_url || categoryImages.default

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
              <BreadcrumbPage>
                {lng === "ar" 
                  ? (category.name_ar || category.name || "Unknown Category")
                  : (category.name_en || category.name || "Unknown Category")
                }
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Category Header with Image Background */}
        <div className="relative mb-12 rounded-lg overflow-hidden">
          <div className="relative h-64 md:h-80">
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('${imagePath}')`,
              }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            
            {/* Category content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {lng === "ar" 
                    ? (category.name_ar || category.name || "Unknown Category")
                    : (category.name_en || category.name || "Unknown Category")
                  }
                </h1>
                <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-6">
                  {lng === "ar" 
                    ? (category.description_ar || category.description || "")
                    : (category.description_en || category.description || "")
                  }
                </p>
                <Badge variant="secondary" className="text-lg px-6 py-3 bg-white/20 text-white border-white/30">
                  {properties.length} {dict.categories.properties}
                </Badge>
              </div>
            </div>
          </div>
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
                <div 
                  className="w-12 h-12 bg-cover bg-center rounded-full"
                  style={{
                    backgroundImage: `url('${imagePath}')`,
                  }}
                />
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
                const relatedImagePath = relatedCategory.image_url || categoryImages.default

                return (
                  <Link key={relatedCategory.id} href={`/${lng}/categories/${relatedCategory.slug}`}>
                    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden">
                      {/* Image Background */}
                      <div className="relative h-32 overflow-hidden">
                        <div 
                          className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-300 group-hover:scale-110"
                          style={{
                            backgroundImage: `url('${relatedImagePath}')`,
                          }}
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">
                          {lng === "ar" 
                            ? (relatedCategory.name_ar || relatedCategory.name || "Unknown Category")
                            : (relatedCategory.name_en || relatedCategory.name || "Unknown Category")
                          }
                        </h3>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <span>{dict.categories.explore}</span>
                          <ArrowRight className="h-3 w-3 group-hover:text-primary transition-colors group-hover:translate-x-1" />
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
