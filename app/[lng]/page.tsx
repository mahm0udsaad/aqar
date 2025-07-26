export const revalidate = 0; // Ensure dynamic rendering

import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { PropertyCard } from "@/components/property-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getProperties, getFeaturedProperties, getCategories, getPopularAreasWithCounts } from "@/lib/supabase/queries"
import type { Locale } from "@/lib/i18n/config"
import Link from "next/link"
import { TrendingUp, MapPin, Building, Home, Warehouse, Users, Shield, Award } from "lucide-react"

interface HomePageProps {
  params: Promise<{ lng: Locale }>
}

export default async function HomePage({ params }: HomePageProps) {
  const { lng } = await params
  const dict = await getDictionary(lng)

  // Fetch data from Supabase with fallback
  const [featuredProperties, saleProperties, rentProperties, categories, popularAreas] = await Promise.all([
    getFeaturedProperties().catch(() => []),
    getProperties({ propertyType: "sale" })
      .then((data) => data.slice(0, 3))
      .catch(() => []),
    getProperties({ propertyType: "rent" })
      .then((data) => data.slice(0, 3))
      .catch(() => []),
    getCategories().catch(() => []),
    getPopularAreasWithCounts().catch(() => []),
  ])

  const stats = [
    {
      label: dict.home.propertiesForSaleLabel,
      value: "250,000+",
      icon: Home,
      color: "text-blue-600",
    },
    {
      label: dict.home.propertiesForRentLabel,
      value: "109,000+",
      icon: Building,
      color: "text-green-600",
    },
    {
      label: dict.home.newProjectsLabel,
      value: "15,000+",
      icon: Warehouse,
      color: "text-orange-600",
    },
    {
      label: dict.home.happyCustomersLabel,
      value: "500,000+",
      icon: Users,
      color: "text-purple-600",
    },
  ]

  

  return (
    <div className={`min-h-screen bg-background ${lng === "ar" ? "rtl" : "ltr"}`}>
      <Navbar lng={lng} dict={dict} />
      <HeroSection lng={lng} dict={dict} />

      {/* Stats Section */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center ${stat.color}`}
                >
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between mb-8 ${lng === "ar" ? "flex-row-reverse" : ""}`}>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">{dict.home.featuredProperties}</h2>
              <p className="text-muted-foreground">
                {dict.home.featuredPropertiesSubtitle}
              </p>
            </div>
            <Link href={`/${lng}/search?featured=true`}>
              <Button variant="outline">{dict.home.viewAllFeatured}</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.slice(0, 6).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>

      {/* Properties by Type */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* For Sale */}
            <div>
              <div className={`flex items-center justify-between mb-6 ${lng === "ar" ? "flex-row-reverse" : ""}`}>
                <h3 className="text-2xl font-bold text-foreground">{dict.home.propertiesForSale}</h3>
                <Link href={`/${lng}/search?type=sale`}>
                  <Button variant="outline" size="sm">
                    {dict.home.viewAll}
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {saleProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex gap-4 p-4 bg-muted rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={property.property_images?.[0]?.url || "/placeholder.svg"}
                        alt={property.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/${lng}/properties/${property.id}`}>
                        <h4 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                          {property.title}
                        </h4>
                      </Link>
                      <p className="text-sm text-muted-foreground mb-1">
                        {`${property.location}, ${property.area}`}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">
                          {(property.price / 1000000).toFixed(1)}M {dict.property.currency}
                        </span>
                        <span className="text-sm text-gray-500">
                          {property.size} {dict.property.squareMeter}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Rent */}
            <div>
              <div className={`flex items-center justify-between mb-6 ${lng === "ar" ? "flex-row-reverse" : ""}`}>
                <h3 className="text-2xl font-bold text-foreground">{dict.home.propertiesForRent}</h3>
                <Link href={`/${lng}/search?type=rent`}>
                  <Button variant="outline" size="sm">
                    {dict.home.viewAll}
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {rentProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex gap-4 p-4 bg-muted rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={property.property_images?.[0]?.url || "/placeholder.svg"}
                        alt={property.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/${lng}/properties/${property.id}`}>
                        <h4 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                          {property.title}
                        </h4>
                      </Link>
                      <p className="text-sm text-muted-foreground mb-1">
                        {`${property.location}, ${property.area}`}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">
                          {(property.price / 1000).toFixed(0)}K {dict.property.currencyPerMonth}
                        </span>
                        <span className="text-sm text-gray-500">
                          {property.size} {dict.property.squareMeter}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Areas */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">{dict.home.popularAreas}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {dict.home.popularAreasSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularAreas.map((area, index) => (
              <Link key={index} href={`/${lng}/search?area=${encodeURIComponent(area.name)}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className={`flex items-center justify-between mb-4 ${lng === "ar" ? "flex-row-reverse" : ""}`}>
                      <h3 className="font-semibold text-lg">{area.name}</h3>
                      <Badge variant="secondary" className="text-green-600">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {area.trend}
                      </Badge>
                    </div>
                    <div
                      className={`flex items-center text-muted-foreground ${lng === "ar" ? "flex-row-reverse" : ""}`}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">{area.count} {dict.home.propertiesLabel}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">{dict.home.whyChooseUs}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {dict.home.whyChooseUsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-3">{dict.home.verifiedListings}</h3>
              <p className="text-muted-foreground">{dict.home.verifiedListingsDesc}</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-xl mb-3">{dict.home.expertSupport}</h3>
              <p className="text-muted-foreground">{dict.home.expertSupportDesc}</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-xl mb-3">{dict.home.trustedPlatform}</h3>
              <p className="text-muted-foreground">{dict.home.trustedPlatformDesc}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
