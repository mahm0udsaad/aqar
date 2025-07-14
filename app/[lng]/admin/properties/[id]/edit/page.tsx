import { AdminHeader } from "@/components/admin/admin-header"
import { PropertyForm } from "../../components/property-form"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import type { Database } from "@/lib/supabase/types"

interface PageProps {
  params: { lng: string; id: string }
}

export default async function EditPropertyPage({ params }: PageProps) {
  const supabase = createServerComponentClient<Database>({ cookies })

  // Fetch the property with all related data
  const { data: property, error } = await supabase
    .from("properties")
    .select(`
      *,
      categories (id, name),
      property_images (id, url, alt_text, is_main, order_index)
    `)
    .eq("id", params.id)
    .single()

  if (error || !property) {
    notFound()
  }

  // Fetch categories for the form
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("order_index", { ascending: true })

  return (
    <div>
      <AdminHeader 
        title={`Edit Property: ${property.title}`} 
        description="Update property information and settings" 
      />
      <div className="p-6">
        <PropertyForm 
          categories={categories || []} 
          lng={params.lng}
          mode="edit"
          property={property}
        />
      </div>
    </div>
  )
}
