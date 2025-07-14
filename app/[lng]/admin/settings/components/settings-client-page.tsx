"use client"

import { useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Save, Settings, Globe, Shield, Bell, Palette } from "lucide-react"
import { Dictionary } from "@/lib/i18n/types"
import { Locale } from "@/lib/i18n/config"

interface SettingsClientPageProps {
  lng: Locale
  dict: Dictionary
}

export function SettingsClientPage({ lng, dict }: SettingsClientPageProps) {
  const [settings, setSettings] = useState({
    // General Settings
    siteName: "Elite Properties",
    siteDescription: "Your trusted partner in finding the perfect property",
    contactEmail: "info@eliteproperties.com",
    contactPhone: "+1 (555) 123-4567",
    address: "123 Business Ave, City, State 12345",

    // SEO Settings
    metaTitle: "Elite Properties - Premium Real Estate",
    metaDescription: "Find your dream property with Elite Properties. Premium real estate services.",
    metaKeywords: "real estate, properties, homes, apartments, villas",

    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,

    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: "30",
    passwordExpiry: "90",

    // Display Settings
    itemsPerPage: "12",
    defaultCurrency: "EGP",
    dateFormat: "DD/MM/YYYY",
    timezone: "Africa/Cairo",

    // Feature Toggles
    enableChat: true,
    enableReviews: true,
    enableWishlist: true,
    enableComparison: false,
    maintenanceMode: false,
  })

  const handleSave = () => {
    console.log("Saving settings:", settings)
    // Here you would typically save to your backend
  }

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div>
      <AdminHeader title={dict.admin.settings.title} description={dict.admin.settings.description} lng={lng} dict={dict} />

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {dict.admin.settings.tabs.general}
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {dict.admin.settings.tabs.seo}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                {dict.admin.settings.tabs.notifications}
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {dict.admin.settings.tabs.security}
              </TabsTrigger>
              <TabsTrigger value="display" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                {dict.admin.settings.tabs.display}
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{dict.admin.settings.general.siteInfo.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="siteName">{dict.admin.settings.general.siteInfo.siteName}</Label>
                      <Input
                        id="siteName"
                        value={settings.siteName}
                        onChange={(e) => updateSetting("siteName", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactEmail">{dict.admin.settings.general.siteInfo.contactEmail}</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => updateSetting("contactEmail", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="siteDescription">{dict.admin.settings.general.siteInfo.siteDescription}</Label>
                    <Textarea
                      id="siteDescription"
                      value={settings.siteDescription}
                      onChange={(e) => updateSetting("siteDescription", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactPhone">{dict.admin.settings.general.siteInfo.contactPhone}</Label>
                      <Input
                        id="contactPhone"
                        value={settings.contactPhone}
                        onChange={(e) => updateSetting("contactPhone", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">{dict.admin.settings.general.siteInfo.address}</Label>
                      <Input
                        id="address"
                        value={settings.address}
                        onChange={(e) => updateSetting("address", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{dict.admin.settings.general.featureToggles.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableChat">{dict.admin.settings.general.featureToggles.liveChat}</Label>
                        <p className="text-sm text-muted-foreground">
                          {dict.admin.settings.general.featureToggles.liveChatDesc}
                        </p>
                      </div>
                      <Switch
                        id="enableChat"
                        checked={settings.enableChat}
                        onCheckedChange={(checked) => updateSetting("enableChat", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableReviews">{dict.admin.settings.general.featureToggles.propertyReviews}</Label>
                        <p className="text-sm text-muted-foreground">
                          {dict.admin.settings.general.featureToggles.propertyReviewsDesc}
                        </p>
                      </div>
                      <Switch
                        id="enableReviews"
                        checked={settings.enableReviews}
                        onCheckedChange={(checked) => updateSetting("enableReviews", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableWishlist">{dict.admin.settings.general.featureToggles.wishlist}</Label>
                        <p className="text-sm text-muted-foreground">
                          {dict.admin.settings.general.featureToggles.wishlistDesc}
                        </p>
                      </div>
                      <Switch
                        id="enableWishlist"
                        checked={settings.enableWishlist}
                        onCheckedChange={(checked) => updateSetting("enableWishlist", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableComparison">
                          {dict.admin.settings.general.featureToggles.propertyComparison}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {dict.admin.settings.general.featureToggles.propertyComparisonDesc}
                        </p>
                      </div>
                      <Switch
                        id="enableComparison"
                        checked={settings.enableComparison}
                        onCheckedChange={(checked) => updateSetting("enableComparison", checked)}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="maintenanceMode">{dict.admin.settings.general.featureToggles.maintenanceMode}</Label>
                        <p className="text-sm text-muted-foreground">
                          {dict.admin.settings.general.featureToggles.maintenanceModeDesc}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {settings.maintenanceMode && (
                          <Badge variant="destructive">{dict.admin.settings.general.featureToggles.active}</Badge>
                        )}
                        <Switch
                          id="maintenanceMode"
                          checked={settings.maintenanceMode}
                          onCheckedChange={(checked) => updateSetting("maintenanceMode", checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO Settings */}
            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{dict.admin.settings.seo.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="metaTitle">{dict.admin.settings.seo.metaTitle}</Label>
                    <Input
                      id="metaTitle"
                      value={settings.metaTitle}
                      onChange={(e) => updateSetting("metaTitle", e.target.value)}
                      placeholder={dict.admin.settings.seo.metaTitlePlaceholder}
                    />
                  </div>

                  <div>
                    <Label htmlFor="metaDescription">{dict.admin.settings.seo.metaDescription}</Label>
                    <Textarea
                      id="metaDescription"
                      value={settings.metaDescription}
                      onChange={(e) => updateSetting("metaDescription", e.target.value)}
                      placeholder={dict.admin.settings.seo.metaDescriptionPlaceholder}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="metaKeywords">{dict.admin.settings.seo.metaKeywords}</Label>
                    <Input
                      id="metaKeywords"
                      value={settings.metaKeywords}
                      onChange={(e) => updateSetting("metaKeywords", e.target.value)}
                      placeholder={dict.admin.settings.seo.metaKeywordsPlaceholder}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{dict.admin.settings.notifications.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications">{dict.admin.settings.notifications.email}</Label>
                      <p className="text-sm text-muted-foreground">{dict.admin.settings.notifications.emailDesc}</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="smsNotifications">{dict.admin.settings.notifications.sms}</Label>
                      <p className="text-sm text-muted-foreground">{dict.admin.settings.notifications.smsDesc}</p>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => updateSetting("smsNotifications", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pushNotifications">{dict.admin.settings.notifications.push}</Label>
                      <p className="text-sm text-muted-foreground">{dict.admin.settings.notifications.pushDesc}</p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => updateSetting("pushNotifications", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketingEmails">{dict.admin.settings.notifications.marketing}</Label>
                      <p className="text-sm text-muted-foreground">{dict.admin.settings.notifications.marketingDesc}</p>
                    </div>
                    <Switch
                      id="marketingEmails"
                      checked={settings.marketingEmails}
                      onCheckedChange={(checked) => updateSetting("marketingEmails", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{dict.admin.settings.security.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="twoFactorAuth">{dict.admin.settings.security.twoFactorAuth}</Label>
                      <p className="text-sm text-muted-foreground">{dict.admin.settings.security.twoFactorAuthDesc}</p>.
                    </div>
                    <Switch
                      id="twoFactorAuth"
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) => updateSetting("twoFactorAuth", checked)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sessionTimeout">{dict.admin.settings.security.sessionTimeout}</Label>
                      <Select
                        value={settings.sessionTimeout}
                        onValueChange={(value) => updateSetting("sessionTimeout", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">{dict.admin.settings.security.minutes15}</SelectItem>
                          <SelectItem value="30">{dict.admin.settings.security.minutes30}</SelectItem>
                          <SelectItem value="60">{dict.admin.settings.security.hour1}</SelectItem>
                          <SelectItem value="120">{dict.admin.settings.security.hours2}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="passwordExpiry">{dict.admin.settings.security.passwordExpiry}</Label>
                      <Select
                        value={settings.passwordExpiry}
                        onValueChange={(value) => updateSetting("passwordExpiry", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">{dict.admin.settings.security.days30}</SelectItem>
                          <SelectItem value="60">{dict.admin.settings.security.days60}</SelectItem>
                          <SelectItem value="90">{dict.admin.settings.security.days90}</SelectItem>
                          <SelectItem value="never">{dict.admin.settings.security.never}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Display Settings */}
            <TabsContent value="display" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{dict.admin.settings.display.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="itemsPerPage">{dict.admin.settings.display.itemsPerPage}</Label>
                      <Select
                        value={settings.itemsPerPage}
                        onValueChange={(value) => updateSetting("itemsPerPage", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">{dict.admin.settings.display.items6}</SelectItem>
                          <SelectItem value="12">{dict.admin.settings.display.items12}</SelectItem>
                          <SelectItem value="24">{dict.admin.settings.display.items24}</SelectItem>
                          <SelectItem value="48">{dict.admin.settings.display.items48}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="defaultCurrency">{dict.admin.settings.display.defaultCurrency}</Label>
                      <Select
                        value={settings.defaultCurrency}
                        onValueChange={(value) => updateSetting("defaultCurrency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EGP">{dict.admin.settings.display.egp}</SelectItem>
                          <SelectItem value="USD">{dict.admin.settings.display.usd}</SelectItem>
                          <SelectItem value="EUR">{dict.admin.settings.display.eur}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateFormat">{dict.admin.settings.display.dateFormat}</Label>
                      <Select value={settings.dateFormat} onValueChange={(value) => updateSetting("dateFormat", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="timezone">{dict.admin.settings.display.timezone}</Label>
                      <Select value={settings.timezone} onValueChange={(value) => updateSetting("timezone", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Cairo">Africa/Cairo</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                          <SelectItem value="Europe/London">Europe/London</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end pt-6">
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="w-4 h-4 mr-2" />
              {dict.admin.settings.save}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 