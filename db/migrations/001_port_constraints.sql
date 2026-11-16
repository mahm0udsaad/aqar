-- Aqar: constraints and indexes lost in the Aug 2026 Supabase -> cPanel PostgreSQL copy.
-- Idempotent and PostgreSQL 10 compatible. Apply with:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/001_port_constraints.sql
BEGIN;

-- Upserts on home_stats use ON CONFLICT (key)
CREATE UNIQUE INDEX IF NOT EXISTS home_stats_key_key ON home_stats (key);

-- One profile per email (Google sign-in links accounts by email)
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_email_lower_key ON user_profiles (lower(email));

-- Foreign-key lookups used on every listing page
CREATE INDEX IF NOT EXISTS properties_status_idx ON properties (status);
CREATE INDEX IF NOT EXISTS properties_category_id_idx ON properties (category_id);
CREATE INDEX IF NOT EXISTS properties_area_id_idx ON properties (area_id);
CREATE INDEX IF NOT EXISTS property_images_property_id_idx ON property_images (property_id);
CREATE INDEX IF NOT EXISTS property_videos_property_id_idx ON property_videos (property_id);
CREATE INDEX IF NOT EXISTS property_ratings_property_id_idx ON property_ratings (property_id);
CREATE INDEX IF NOT EXISTS loved_properties_user_id_idx ON loved_properties (user_id);
CREATE INDEX IF NOT EXISTS area_ratings_area_id_idx ON area_ratings (area_id);

-- area_ratings_summary was a live view in Supabase; the copy turned it into a frozen table.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'area_ratings_summary' AND table_type = 'BASE TABLE') THEN
    DROP TABLE area_ratings_summary;
  END IF;
END $$;

CREATE OR REPLACE VIEW area_ratings_summary AS
SELECT
  area_id,
  COUNT(*) AS total_ratings,
  ROUND(AVG(overall_rating), 2) AS avg_overall_rating,
  ROUND(AVG(schools_rating), 2) AS avg_schools_rating,
  ROUND(AVG(transportation_rating), 2) AS avg_transportation_rating,
  ROUND(AVG(shopping_rating), 2) AS avg_shopping_rating,
  ROUND(AVG(restaurants_rating), 2) AS avg_restaurants_rating,
  ROUND(AVG(safety_rating), 2) AS avg_safety_rating,
  ROUND(AVG(quietness_rating), 2) AS avg_quietness_rating,
  ROUND(AVG(walkability_rating), 2) AS avg_walkability_rating,
  ROUND(AVG(nightlife_rating), 2) AS avg_nightlife_rating,
  ROUND(AVG(healthcare_rating), 2) AS avg_healthcare_rating,
  ROUND(AVG(parks_rating), 2) AS avg_parks_rating
FROM area_ratings
GROUP BY area_id;

-- Asset paths stored without the /aqar base path are fixed at render time by assetUrl(),
-- so no data rewrite is needed here.

COMMIT;
