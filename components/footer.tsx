"use client"
import Link from "next/link"
import { Building, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import { usePathname } from "next/navigation"

export function Footer({ lng, dict }: { lng: string, dict: any }) {
  const pathname = usePathname()

  const isAdmin = pathname.includes("/admin")
  if (isAdmin) return null

  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl text-background">{dict.footer.eliteProperties}</span>
            </div>
            <p className="text-background/80">
              {dict.footer.companyDesc}
            </p>
            <div className="flex gap-4">
              <Facebook className="h-5 w-5 text-background/60 hover:text-background cursor-pointer transition-colors" />
              <Twitter className="h-5 w-5 text-background/60 hover:text-background cursor-pointer transition-colors" />
              <Instagram className="h-5 w-5 text-background/60 hover:text-background cursor-pointer transition-colors" />
              <Linkedin className="h-5 w-5 text-background/60 hover:text-background cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-background">{dict.footer.quickLinks}</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${lng}`} className="text-background/80 hover:text-background transition-colors">
                  {dict.footer.home}
                </Link>
              </li>
              <li>
                <Link href={`/${lng}/search`} className="text-background/80 hover:text-background transition-colors">
                  {dict.footer.searchProperties}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lng}/categories/apartments`}
                  className="text-background/80 hover:text-background transition-colors"
                >
                  {dict.footer.apartments}
                </Link>
              </li>
              <li>
                <Link href={`/${lng}/categories/villas`} className="text-background/80 hover:text-background transition-colors">
                  {dict.footer.villas}
                </Link>
              </li>
              <li>
                <Link href={`/${lng}/contact`} className="text-background/80 hover:text-background transition-colors">
                  {dict.footer.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-background">{dict.footer.services}</h3>
            <ul className="space-y-2">
              <li className="text-background/80">{dict.footer.propertySales}</li>
              <li className="text-background/80">{dict.footer.propertyManagement}</li>
              <li className="text-background/80">{dict.footer.investmentConsulting}</li>
              <li className="text-background/80">{dict.footer.marketAnalysis}</li>
              <li className="text-background/80">{dict.footer.legalSupport}</li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-background">{dict.footer.legal}</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${lng}/legal/terms`} className="text-background/80 hover:text-background transition-colors">
                  {dict.footer.termsAndConditions}
                </Link>
              </li>
              <li>
                <Link href={`/${lng}/legal/policies`} className="text-background/80 hover:text-background transition-colors">
                  {dict.footer.privacyPolicy}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-background">{dict.footer.contactInfo}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-background/80">{dict.footer.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-background/80">{dict.footer.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <span className="text-background/80">{dict.footer.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-8 pt-8 text-center">
          <p className="text-background/60">
            {dict.footer.allRightsReserved}{" "}
            <Link href={`/${lng}/legal/policies`} className="hover:underline">{dict.footer.privacyPolicy}</Link> |{" "}
            <Link href={`/${lng}/legal/terms`} className="hover:underline">{dict.footer.termsOfService}</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}