import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PropertyComparisonView } from "../../../components/property-comparison-view"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"

interface ComparePageProps {
  params: Promise<{ lng: Locale }>
}

export async function generateMetadata({ params }: { params: Promise<{ lng: Locale }> }) {
  const { lng } = await params
  const dict = await getDictionary(lng)
  
  return {
    title: "Compare Properties - Aqar",
    description: "Compare multiple properties side by side to make the best decision for your real estate needs.",
    openGraph: {
      title: "Property Comparison - Aqar",
      description: "Compare properties side by side",
      type: 'website',
      locale: lng,
    },
  }
}

export default async function ComparePage({ params }: ComparePageProps) {
  const { lng } = await params
  const dict = await getDictionary(lng)

  return (
    <div className="min-h-screen bg-background">
      <Navbar dict={dict} lng={lng} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Compare Properties</h1>
          <p className="text-muted-foreground">
            Compare up to 4 properties side by side to help you make the best decision.
          </p>
        </div>
        
        <PropertyComparisonView lng={lng} dict={dict} />
      </main>
      <Footer dict={dict} lng={lng} />
    </div>
  )
} 