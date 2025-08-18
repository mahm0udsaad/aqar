-- Media, SEO, featured properties and settings

-- Add caption to property images
ALTER TABLE IF EXISTS public.property_images
ADD COLUMN IF NOT EXISTS caption text;

-- Property videos table
CREATE TABLE IF NOT EXISTS public.property_videos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- SEO & metadata fields on properties
ALTER TABLE IF EXISTS public.properties
ADD COLUMN IF NOT EXISTS seo_keywords text[],
ADD COLUMN IF NOT EXISTS meta_description text,
ADD COLUMN IF NOT EXISTS featured_order int DEFAULT 0,
ADD COLUMN IF NOT EXISTS hero_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS map_enabled boolean DEFAULT false;

-- Remove manual map iframe field
ALTER TABLE IF EXISTS public.properties
DROP COLUMN IF EXISTS location_iframe_url;

-- Category visibility
ALTER TABLE IF EXISTS public.categories
ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;

-- Site settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_videos ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='site_settings' AND policyname='site_settings_read'
  ) THEN
    CREATE POLICY site_settings_read
      ON public.site_settings
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='property_videos' AND policyname='property_videos_read'
  ) THEN
    CREATE POLICY property_videos_read
      ON public.property_videos
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_property_videos_property
  ON public.property_videos(property_id);
