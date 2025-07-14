import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/config"
import { SettingsClientPage } from "./components/settings-client-page"

export default async function SettingsPage({ params }: { params: { lng: Locale } }) {
  const dict = await getDictionary(params.lng)
  return <SettingsClientPage dict={dict} lng={params.lng} />
}
