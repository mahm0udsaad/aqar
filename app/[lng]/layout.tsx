import type React from "react"
import { Inter, Cairo } from "next/font/google"
import { i18n, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Footer } from "@/components/footer"
import "../globals.css"

const inter = Inter({ subsets: ["latin"] })
const cairo = Cairo({ subsets: ["arabic"] })

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lng: locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: Locale }>
}) {
  const { lng } = await params
  const dict = await getDictionary(lng)

  return {
    title: lng === "ar" ? "عقار - منصة العقارات الرائدة في مصر" : "Aqar - Egypt's Leading Real Estate Platform",
    description:
      lng === "ar"
        ? "اكتشف أفضل العقارات للبيع والإيجار في مصر. شقق، فيلل، أراضي ومشاريع جديدة في أفضل المواقع"
        : "Discover the best properties for sale and rent in Egypt. Apartments, villas, land and new projects in prime locations",
    keywords:
      lng === "ar"
        ? "عقارات مصر، شقق للبيع، فيلل للإيجار، أراضي، مشاريع جديدة، القاهرة الجديدة، الشيخ زايد"
        : "Egypt real estate, apartments for sale, villas for rent, land, new projects, New Cairo, Sheikh Zayed",
    openGraph: {
      title: lng === "ar" ? "عقار - منصة العقارات الرائدة في مصر" : "Aqar - Egypt's Leading Real Estate Platform",
      description:
        lng === "ar"
          ? "اكتشف أفضل العقارات للبيع والإيجار في مصر"
          : "Discover the best properties for sale and rent in Egypt",
      locale: lng === "ar" ? "ar_EG" : "en_US",
      type: "website",
    },
    alternates: {
      languages: {
        en: "/en",
        ar: "/ar",
      },
    },
  }
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lng: Locale }
}) {
  const { lng } = params
  const dict = await getDictionary(lng)

  return (
    <html lang={lng} dir={lng === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body className={lng === "ar" ? cairo.className : inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
          <Footer lng={lng} dict={dict} />
        </ThemeProvider>
      </body>
    </html>
  )
}