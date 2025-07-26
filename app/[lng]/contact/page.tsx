import type { Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ContactForm } from "@/components/contact-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, MapPin, Clock, Users, Award, Shield, Star } from "lucide-react"

interface ContactPageProps {
  params: Promise<{ lng: Locale }>
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { lng } = await params
  const dict = await getDictionary(lng)

  return (
    <div className="min-h-screen bg-background">
      <Navbar dict={dict} lng={lng} />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{dict.contact.title}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{dict.contact.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{dict.contact.getInTouch}</CardTitle>
              </CardHeader>
              <CardContent>
                <ContactForm dict={dict} lng={lng} />
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle>{dict.contact.contactInfo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{dict.contact.phone}</p>
                    <p className="text-muted-foreground">+20 100 123 4567</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{dict.contact.email}</p>
                    <p className="text-muted-foreground">info@aqarmap.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{dict.contact.address}</p>
                    <p className="text-muted-foreground">
                      {lng === "ar" ? "شارع التحرير، وسط البلد، القاهرة، مصر" : "Tahrir Street, Downtown, Cairo, Egypt"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{dict.contact.businessHours}</p>
                    <p className="text-muted-foreground">
                      {lng === "ar" ? "الأحد - الخميس: 9:00 ص - 6:00 م" : "Sunday - Thursday: 9:00 AM - 6:00 PM"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Why Choose Us */}
            <Card>
              <CardHeader>
                <CardTitle>{dict.contact.whyChooseUs}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{dict.contact.expertTeam}</p>
                    <p className="text-sm text-muted-foreground">{dict.contact.expertTeamDesc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Award className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{dict.contact.awardWinning}</p>
                    <p className="text-sm text-muted-foreground">{dict.contact.awardWinningDesc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">{dict.contact.trustedService}</p>
                    <p className="text-sm text-muted-foreground">{dict.contact.trustedServiceDesc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Star className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">{dict.contact.customerSatisfaction}</p>
                    <p className="text-sm text-muted-foreground">{dict.contact.customerSatisfactionDesc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary mb-1">10K+</div>
                    <p className="text-sm text-muted-foreground">{dict.contact.happyClients}</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary mb-1">5K+</div>
                    <p className="text-sm text-muted-foreground">{dict.contact.propertiesSold}</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary mb-1">15+</div>
                    <p className="text-sm text-muted-foreground">{dict.contact.yearsExperience}</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary mb-1">98%</div>
                    <p className="text-sm text-muted-foreground">{dict.contact.satisfactionRate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
