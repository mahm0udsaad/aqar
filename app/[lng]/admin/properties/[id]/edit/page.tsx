import { AdminHeader } from "@/components/admin/admin-header"
import { PropertyForm } from "../../components/property-form"
import type { Database } from "@/lib/supabase/types"
import { getAreas } from "@/lib/actions/areas"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { createClient } from "@/lib/supabase/server"

interface PageProps {
  params: Promise<{ lng: string; id: string }>
}

export default async function EditPropertyPage({ params }: PageProps) {
  const { lng, id } = await params
  const supabase = await createClient()
  const dict = await getDictionary(lng as any)

  // Fetch the property with all related data
  const primarySelect = `
      *,
      categories (id, name),
      property_images (id, url, alt_text, is_main, order_index),
      property_videos (id, url, caption, order_index)
    `
  let property: any = null
  try {
    const { data, error } = await supabase
      .from("properties")
      .select(primarySelect)
      .eq("id", id)
      .single()
    if (error) {
      console.error("EditPropertyPage: primary fetch error", error)
    }
    property = data
  } catch (err) {
    console.error("EditPropertyPage: unexpected error", err)
  }

  // Fallback without videos in case the relation is unavailable
  if (!property) {
    try {
      const { data } = await supabase
        .from("properties")
        .select(`
          *,
          categories (id, name),
          property_images (id, url, alt_text, is_main, order_index)
        `)
        .eq("id", id)
        .single()
      property = data
    } catch (err) {
      console.error("EditPropertyPage: fallback fetch error", err)
    }
  }

  // Fetch categories and areas for the form
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("order_index", { ascending: true })

  const areas = await getAreas()

  if (!property) {
    return (
      <div>
        <AdminHeader 
          title={"Property not found"} 
          description={"We couldn't load this property. It may have been removed."}
          lng={lng}
          dict={dict as any}
        />
        <div className="p-6 text-sm text-muted-foreground">
          Try returning to the properties list and selecting a different property.
        </div>
      </div>
    )
  }

  return (
    <div>
      <AdminHeader 
        title={`Edit Property: ${property.title}`} 
        description="Update property information and settings"
        lng={lng}
        dict={dict as any}
      />
      <div className="p-6">
        <PropertyForm 
          categories={categories || []} 
          areas={areas || []}
          lng={lng}
          mode="edit"
          property={property}
          dict={dict as any}
        />
      </div>
    </div>
  )
}
