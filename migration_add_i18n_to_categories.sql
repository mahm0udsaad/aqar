-- Categories i18n Migration Script
-- This adds Arabic and English fields to support internationalization
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- 1. Add internationalization fields to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS name_en VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255),
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- 2. Migrate existing data from single fields to i18n fields
-- Set the existing name and description as English defaults
UPDATE public.categories 
SET 
  name_en = name,
  description_en = description
WHERE name_en IS NULL OR description_en IS NULL;

-- 3. Add some sample Arabic translations for common categories
-- You should update these with proper translations
UPDATE public.categories SET name_ar = 'شقق' WHERE slug = 'apartments' OR slug = 'appartments';
UPDATE public.categories SET name_ar = 'فيلات' WHERE slug = 'villas';
UPDATE public.categories SET name_ar = 'أراضي' WHERE slug = 'land';
UPDATE public.categories SET name_ar = 'تجاري' WHERE slug = 'commercial';
UPDATE public.categories SET name_ar = 'بنتهاوس' WHERE slug = 'penthouses';

-- 4. Add sample Arabic descriptions (update with proper translations)
UPDATE public.categories SET description_ar = 'شقق سكنية للبيع والإيجار' WHERE slug = 'apartments' OR slug = 'appartments';
UPDATE public.categories SET description_ar = 'فيلات فاخرة للبيع والإيجار' WHERE slug = 'villas';
UPDATE public.categories SET description_ar = 'أراضي للبيع والاستثمار' WHERE slug = 'land';
UPDATE public.categories SET description_ar = 'عقارات تجارية للبيع والإيجار' WHERE slug = 'commercial';
UPDATE public.categories SET description_ar = 'بنتهاوس فاخر للبيع والإيجار' WHERE slug = 'penthouses';

-- 5. Make the i18n fields required for new entries
-- (Keep the old fields for backward compatibility during transition)
-- ALTER TABLE public.categories ALTER COLUMN name_en SET NOT NULL;
-- ALTER TABLE public.categories ALTER COLUMN name_ar SET NOT NULL;

-- 6. Create indexes for performance on i18n fields
CREATE INDEX IF NOT EXISTS idx_categories_name_en ON public.categories(name_en);
CREATE INDEX IF NOT EXISTS idx_categories_name_ar ON public.categories(name_ar);

-- 7. Verify the migration
SELECT 'Categories i18n migration completed successfully!' as status;
SELECT id, name, name_en, name_ar, slug FROM public.categories ORDER BY order_index LIMIT 10;

-- Migration complete! 
-- Your categories table now supports internationalization with separate Arabic and English fields.
-- Remember to update your application code to use the new i18n fields. 