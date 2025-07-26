import { AdminHeader } from "@/components/admin/admin-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/lib/supabase/types"
import { PropertySearchFilters } from "./components/property-search-filters"
import { Locale } from "@/lib/i18n/config"
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { PropertiesTable } from "./components/properties-table"
import { getAllPropertiesForAdmin, getCategories } from "@/lib/supabase/queries"

type PropertyWithDetails = Database["public"]["Tables"]["properties"]["Row"] & {
  categories: { id: string; name: string } | null;
  property_images: { id: string; url: string; alt_text: string | null; is_main: boolean; order_index: number | null }[];
};

interface PageProps {
  params: Promise<{ lng: Locale }>;
  searchParams: { search?: string; category?: string; status?: string };
}

export default async function AdminPropertiesPage({ params, searchParams }: PageProps) {
  const { lng } = await params;
  const dict = await getDictionary(lng) as any;

  // Fetch data
  let properties: PropertyWithDetails[] = [];
  let categories: { id: string; name: string }[] = [];

  try {
    [properties, categories] = await Promise.all([
      getAllPropertiesForAdmin(),
      getCategories()
    ]);
  } catch (error) {
    console.error("Error fetching data:", error);
    // Continue with empty arrays if there's an error
  }

  return (
    <div>
      <AdminHeader
        title={dict.admin.properties.title}
        description={dict.admin.properties.description}
        lng={lng}
        dict={dict}
      />

      <div className="p-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <PropertySearchFilters categories={categories} dict={dict} />
          
          <Link href={`/${lng}/admin/properties/new`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {dict.admin.properties.addProperty}
            </Button>
          </Link>
        </div>

        {/* Properties Table */}
        <PropertiesTable 
          properties={properties}
          lng={lng}
          dict={dict}
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}
