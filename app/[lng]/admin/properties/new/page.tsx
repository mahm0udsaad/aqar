import { AdminHeader } from "@/components/admin/admin-header"
import { PropertyForm } from "../components/property-form"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"
import { getAreas } from "@/lib/actions/areas"
import { getDictionary } from "@/lib/i18n/get-dictionary"

interface PageProps {
  params: Promise<{ lng: string }>
}

export default async function NewPropertyPage({ params }: PageProps) {
  const { lng } = await params
  const supabase = createServerComponentClient<Database>({ cookies })
  const dict = await getDictionary(lng)
  // Fetch categories and areas for the form
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("order_index", { ascending: true })

  const areas = await getAreas()

  return (
    <div>
      <AdminHeader 
        title={dict.admin.properties.form.createTitle}
        description={dict.admin.properties.description}
        lng={lng}
        dict={dict as any}
      />
      <div className="p-6">
        <PropertyForm 
          dict={dict}
          categories={categories || []} 
          areas={areas || []}
          lng={lng}
          mode="create"
        />
      </div>
    </div>
  )
}
