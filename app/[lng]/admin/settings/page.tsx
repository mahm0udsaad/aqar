import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/config"
import { SettingsClientPage } from "./components/settings-client-page"

export default async function SettingsPage({ params }: { params: Promise<{ lng: Locale }> }) {
  const { lng } = await params
  const dict = await getDictionary(lng)
  return <SettingsClientPage dict={dict} lng={lng} />
}
