import { AdminHeader } from "@/components/admin/admin-header"
import { PropertyForm } from "../../components/property-form"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import type { Database } from "@/lib/supabase/types"
import { getAreas } from "@/lib/actions/areas"

interface PageProps {
  params: Promise<{ lng: string; id: string }>
}

export default async function EditPropertyPage({ params }: PageProps) {
  const { lng, id } = await params
  const supabase = createServerComponentClient<Database>({ cookies })

  // Fetch the property with all related data
  const { data: property, error } = await supabase
    .from("properties")
    .select(`
      *,
      categories (id, name),
      property_images (id, url, alt_text, is_main, order_index),
      property_translations (*)
    `)
    .eq("id", id)
    .single()

  if (error || !property) {
    notFound()
  }

  // Fetch categories and areas for the form
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("order_index", { ascending: true })

  const areas = await getAreas()

  return (
    <div>
      <AdminHeader 
        title={`Edit Property: ${property.title}`} 
        description="Update property information and settings"
        lng={lng}
        dict={{} as any}
      />
      <div className="p-6">
        <PropertyForm 
          categories={categories || []} 
          areas={areas || []}
          lng={lng}
          mode="edit"
          property={property}
        />
      </div>
    </div>
  )
}
