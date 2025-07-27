-- Area Ratings Table Migration Script
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- 1. Create area_ratings table
CREATE TABLE IF NOT EXISTS public.area_ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  user_id UUID, -- Optional: can be null for anonymous ratings
  overall_rating DECIMAL(3,2) NOT NULL CHECK (overall_rating >= 1.0 AND overall_rating <= 5.0),
  schools_rating DECIMAL(3,2) CHECK (schools_rating >= 1.0 AND schools_rating <= 5.0),
  transportation_rating DECIMAL(3,2) CHECK (transportation_rating >= 1.0 AND transportation_rating <= 5.0),
  shopping_rating DECIMAL(3,2) CHECK (shopping_rating >= 1.0 AND shopping_rating <= 5.0),
  restaurants_rating DECIMAL(3,2) CHECK (restaurants_rating >= 1.0 AND restaurants_rating <= 5.0),
  safety_rating DECIMAL(3,2) CHECK (safety_rating >= 1.0 AND safety_rating <= 5.0),
  quietness_rating DECIMAL(3,2) CHECK (quietness_rating >= 1.0 AND quietness_rating <= 5.0),
  walkability_rating DECIMAL(3,2) CHECK (walkability_rating >= 1.0 AND walkability_rating <= 5.0),
  nightlife_rating DECIMAL(3,2) CHECK (nightlife_rating >= 1.0 AND nightlife_rating <= 5.0),
  healthcare_rating DECIMAL(3,2) CHECK (healthcare_rating >= 1.0 AND healthcare_rating <= 5.0),
  parks_rating DECIMAL(3,2) CHECK (parks_rating >= 1.0 AND parks_rating <= 5.0),
  comment TEXT,
  ip_address INET, -- For anonymous rating tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_area_ratings_area_id ON public.area_ratings(area_id);
CREATE INDEX IF NOT EXISTS idx_area_ratings_user_id ON public.area_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_area_ratings_created_at ON public.area_ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_area_ratings_overall ON public.area_ratings(overall_rating);

-- 3. Create unique constraint to prevent duplicate ratings from same user/IP for same area
-- This allows one rating per user per area, or one rating per IP per area for anonymous users
CREATE UNIQUE INDEX IF NOT EXISTS idx_area_ratings_unique_user 
ON public.area_ratings(area_id, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_area_ratings_unique_ip 
ON public.area_ratings(area_id, ip_address) 
WHERE user_id IS NULL AND ip_address IS NOT NULL;

-- 4. Create a view for aggregated area ratings
CREATE OR REPLACE VIEW public.area_ratings_summary AS
SELECT 
  area_id,
  COUNT(*) as total_ratings,
  ROUND(AVG(overall_rating), 2) as avg_overall_rating,
  ROUND(AVG(schools_rating), 2) as avg_schools_rating,
  ROUND(AVG(transportation_rating), 2) as avg_transportation_rating,
  ROUND(AVG(shopping_rating), 2) as avg_shopping_rating,
  ROUND(AVG(restaurants_rating), 2) as avg_restaurants_rating,
  ROUND(AVG(safety_rating), 2) as avg_safety_rating,
  ROUND(AVG(quietness_rating), 2) as avg_quietness_rating,
  ROUND(AVG(walkability_rating), 2) as avg_walkability_rating,
  ROUND(AVG(nightlife_rating), 2) as avg_nightlife_rating,
  ROUND(AVG(healthcare_rating), 2) as avg_healthcare_rating,
  ROUND(AVG(parks_rating), 2) as avg_parks_rating
FROM public.area_ratings
GROUP BY area_id;

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create trigger for updated_at
CREATE TRIGGER update_area_ratings_updated_at
    BEFORE UPDATE ON public.area_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Enable Row Level Security (RLS) on area_ratings table
ALTER TABLE public.area_ratings ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for area_ratings
-- Allow public read access to all ratings
CREATE POLICY "Allow public read access to area ratings"
ON public.area_ratings FOR SELECT
USING (true);

-- Allow anyone to insert ratings (both authenticated and anonymous)
CREATE POLICY "Allow public insert access to area ratings"
ON public.area_ratings FOR INSERT
WITH CHECK (true);

-- Allow users to update their own ratings
CREATE POLICY "Allow users to update own ratings"
ON public.area_ratings FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own ratings
CREATE POLICY "Allow users to delete own ratings"
ON public.area_ratings FOR DELETE
USING (auth.uid() = user_id);

-- 9. Grant necessary permissions
GRANT SELECT ON public.area_ratings TO anon, authenticated;
GRANT INSERT ON public.area_ratings TO anon, authenticated;
GRANT UPDATE ON public.area_ratings TO authenticated;
GRANT DELETE ON public.area_ratings TO authenticated;
GRANT SELECT ON public.area_ratings_summary TO anon, authenticated;

-- 10. Add helpful comments
COMMENT ON TABLE public.area_ratings IS 'Stores user ratings for different areas/neighborhoods';
COMMENT ON COLUMN public.area_ratings.user_id IS 'User ID for authenticated users, null for anonymous ratings';
COMMENT ON COLUMN public.area_ratings.ip_address IS 'IP address for anonymous rating tracking';
COMMENT ON COLUMN public.area_ratings.overall_rating IS 'Overall rating for the area (1-5)';
COMMENT ON VIEW public.area_ratings_summary IS 'Aggregated ratings summary for each area'; 