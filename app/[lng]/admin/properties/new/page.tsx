import { AdminHeader } from "@/components/admin/admin-header"
import { PropertyForm } from "../components/property-form"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"
import { getAreas } from "@/lib/actions/areas"

interface PageProps {
  params: Promise<{ lng: string }>
}

export default async function NewPropertyPage({ params }: PageProps) {
  const { lng } = await params
  const supabase = createServerComponentClient<Database>({ cookies })

  // Fetch categories and areas for the form
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("order_index", { ascending: true })

  const areas = await getAreas()

  return (
    <div>
      <AdminHeader 
        title="Add New Property" 
        description="Create a new property listing"
        lng={lng}
        dict={{} as any}
      />
      <div className="p-6">
        <PropertyForm 
          categories={categories || []} 
          areas={areas || []}
          lng={lng}
          mode="create"
        />
      </div>
    </div>
  )
}
