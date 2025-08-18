import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"
import Link from "next/link"
import { MapPin } from "lucide-react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"

interface AreasPageProps {
  params: Promise<{ lng: Locale }>
}

export async function generateMetadata({ params }: { params: Promise<{ lng: Locale }> }) {
  const { lng } = await params
  return {
    title: lng === "ar" ? "المناطق" : "Areas",
    description: lng === "ar" ? "استكشف جميع المناطق وعدد العقارات بكل منطقة" : "Explore all areas and the number of properties in each",
  }
}

export default async function AreasPage({ params }: AreasPageProps) {
  const { lng } = await params
  const dict = await getDictionary(lng)
  const supabase = createServerComponentClient<Database>({ cookies })

  // Fetch active areas
  const { data: areas } = await supabase
    .from("areas")
    .select("id, name, slug, is_active, order_index")
    .eq("is_active", true)
    .order("order_index", { ascending: true })

  // Fetch property areas to count by name
  const { data: propsData } = await supabase
    .from("properties")
    .select("area")
    .eq("status", "active")
    .not("area", "is", null)
    .not("area", "eq", "")

  const areaCounts: Record<string, number> = {}
  propsData?.forEach((p: any) => {
    if (p.area) {
      areaCounts[p.area] = (areaCounts[p.area] || 0) + 1
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar lng={lng} dict={dict} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{lng === "ar" ? "المناطق" : "Areas"}</h1>
          <p className="text-muted-foreground">
            {lng === "ar" ? "تصفح المناطق واكتشف عدد العقارات المتاحة بكل منطقة" : "Browse areas and see how many properties are available in each area"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(areas || []).map((area) => {
            const count = areaCounts[area.name] || 0
            return (
              <Link key={area.id} href={`/${lng}/search?area=${encodeURIComponent(area.name)}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {area.name}
                      </span>
                      <Badge variant={count > 0 ? "default" : "secondary"}>
                        {count} {count === 1 ? (lng === "ar" ? "عقار" : "Property") : (lng === "ar" ? "عقارات" : "Properties")}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {lng === "ar" ? "انقر لعرض العقارات في هذه المنطقة" : "Click to view properties in this area"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </main>
      <Footer dict={dict} lng={lng} />
    </div>
  )
}


