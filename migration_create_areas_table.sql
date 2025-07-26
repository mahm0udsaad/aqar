-- Areas Table Migration Script
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- 1. Create areas table
CREATE TABLE IF NOT EXISTS public.areas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_areas_slug ON public.areas(slug);
CREATE INDEX IF NOT EXISTS idx_areas_active ON public.areas(is_active);
CREATE INDEX IF NOT EXISTS idx_areas_order ON public.areas(order_index);

-- 3. Insert existing areas from the static list
INSERT INTO public.areas (name, slug, order_index) VALUES
  ('New Cairo', 'new-cairo', 1),
  ('Maadi', 'maadi', 2), 
  ('Zamalek', 'zamalek', 3),
  ('Heliopolis', 'heliopolis', 4),
  ('6th of October', '6th-of-october', 5),
  ('Sheikh Zayed', 'sheikh-zayed', 6),
  ('New Capital', 'new-capital', 7),
  ('Alexandria', 'alexandria', 8),
  ('Giza', 'giza', 9),
  ('Nasr City', 'nasr-city', 10)
ON CONFLICT (name) DO NOTHING;

-- 4. Add area_id column to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.areas(id);

-- 5. Create index on area_id for fast joins
CREATE INDEX IF NOT EXISTS idx_properties_area_id ON public.properties(area_id);

-- 6. Migrate existing area data to area_id references
-- This will link existing properties to the new areas table
UPDATE public.properties 
SET area_id = public.areas.id 
FROM public.areas 
WHERE public.properties.area = public.areas.name 
  AND public.properties.area_id IS NULL;

-- 7. Enable Row Level Security (RLS) on areas table
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for areas
-- Allow public read access to active areas
CREATE POLICY "Public can read active areas" ON public.areas
  FOR SELECT USING (is_active = true);

-- Allow all authenticated users to manage areas (you can restrict this to admins later)
CREATE POLICY "Authenticated users can manage areas" ON public.areas
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 9. Create trigger for updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_areas_updated_at ON public.areas;

-- Create the updated_at trigger
CREATE TRIGGER update_areas_updated_at 
  BEFORE UPDATE ON public.areas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Test the setup with a sample insert
DO $$
BEGIN
  -- Try to insert a test area
  INSERT INTO public.areas (name, slug, description) 
  VALUES ('Test Area', 'test-area', 'This is a test area') 
  ON CONFLICT (name) DO NOTHING;
  
  -- Clean up the test
  DELETE FROM public.areas WHERE name = 'Test Area';
  
  RAISE NOTICE 'Areas table setup completed successfully!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error setting up areas table: %', SQLERRM;
END $$;

-- 11. Verify the migration
SELECT 'Areas table created successfully!' as status;
SELECT COUNT(*) as total_areas FROM public.areas;
SELECT COUNT(*) as properties_with_areas FROM public.properties WHERE area_id IS NOT NULL;

-- Show sample areas
SELECT id, name, slug, is_active, order_index, created_at FROM public.areas ORDER BY order_index LIMIT 5;

-- Migration complete! 
-- Your areas table is now ready to use with the dynamic area system. 