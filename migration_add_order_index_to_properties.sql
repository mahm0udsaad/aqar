-- Properties Order Index Migration Script
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- 1. Add order_index column to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_properties_order ON public.properties(order_index);

-- 3. Initialize order_index values based on current creation order
-- This will preserve the current ordering while adding the order_index
UPDATE public.properties 
SET order_index = sub.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_number
  FROM public.properties
) sub
WHERE public.properties.id = sub.id
  AND public.properties.order_index = 0;

-- 4. Verify the migration
SELECT 'Order index column added successfully!' as status;
SELECT COUNT(*) as total_properties FROM public.properties;
SELECT COUNT(*) as properties_with_order FROM public.properties WHERE order_index IS NOT NULL;

-- Show sample properties with their order
SELECT id, title, order_index, created_at FROM public.properties ORDER BY order_index LIMIT 10;

-- Migration complete! 
-- Your properties table now has order_index column and can be reordered from the admin panel. 