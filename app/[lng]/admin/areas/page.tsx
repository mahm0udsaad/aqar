import { AdminHeader } from "@/components/admin/admin-header"
import { AreasGrid } from "./components/areas-grid"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"

interface PageProps {
  params: Promise<{ lng: Locale }>
}

export default async function AreasPage({ params }: PageProps) {
  const { lng } = await params
  const supabase = createServerComponentClient<Database>({ cookies })
  const dict = await getDictionary(lng)

  // Fetch all areas (including inactive ones for admin management)
  const { data: areas } = await supabase
    .from("areas")
    .select("*")
    .order("order_index", { ascending: true })

  return (
    <div>
      <AdminHeader 
        title={dict.admin.areas?.title || dict.admin.categories.title}
        description={dict.admin.areas?.description || ""}
        lng={lng}
        dict={dict}
      />
      <div className="p-6">
        <AreasGrid areas={areas || []} lng={lng} dict={dict} />
      </div>
    </div>
  )
} 