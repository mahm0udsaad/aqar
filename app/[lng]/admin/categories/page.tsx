import { AdminHeader } from "@/components/admin/admin-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, GripVertical } from "lucide-react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"
import { CategoryGrid } from "./components/category-grid"
import { CategoryDialog } from "./components/category-dialog"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/config"

interface PageProps {
  params: Promise<{ lng: Locale }>
}

export default async function AdminCategoriesPage({ params }: PageProps) {
  const { lng } = await params
  const supabase = createServerComponentClient<Database>({ cookies })
  const dict = await getDictionary(lng)

  // Fetch categories with property counts
  const { data: categories } = await supabase
    .from("categories")
    .select(`
      *,
      properties (id)
    `)
    .order("order_index", { ascending: true })

  // Transform data to include property counts
  const categoriesWithCounts = categories?.map(category => ({
    ...category,
    propertyCount: category.properties?.length || 0,
  })) || []

  return (
    <div>
      <AdminHeader
        title={dict.admin.categories.title}
        description="Manage property categories"
        lng={lng}
        dict={dict}
      />

      <div className="p-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold">Property Categories</h2>
            <p className="text-muted-foreground">Drag and drop to reorder categories</p>
          </div>
          <CategoryDialog lng={lng} mode="create" dict={dict}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {dict.admin.categories.addButton}
            </Button>
          </CategoryDialog>
        </div>

        {/* Categories Grid with Drag & Drop */}
        <CategoryGrid categories={categoriesWithCounts} lng={lng} dict={dict} />

        {/* Instructions */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">How to Manage Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p>
                  • <strong>Drag and Drop:</strong> Reorder categories by dragging them
                </p>
                <p>
                  • <strong>Edit:</strong> Click the edit button to modify category details
                </p>
              </div>
              <div className="space-y-2">
                <p>
                  • <strong>Delete:</strong> Remove categories that are no longer needed
                </p>
                <p>
                  • <strong>Display Order:</strong> Categories are displayed in the order shown here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
