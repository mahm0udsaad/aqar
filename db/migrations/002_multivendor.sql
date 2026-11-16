-- Aqar Phase 1: owners and brokers post their own listings.
-- Idempotent and PostgreSQL 10 compatible.
BEGIN;

-- Free listing limits per account type. Paid plans later are just new rows.
CREATE TABLE IF NOT EXISTS plans (
  id text PRIMARY KEY,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  listing_limit integer NOT NULL,
  default_for text CHECK (default_for IN ('owner', 'broker')),
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO plans (id, name_ar, name_en, listing_limit, default_for) VALUES
  ('free_owner', 'مجاني للمالك', 'Free (owner)', 5, 'owner'),
  ('free_broker', 'مجاني للوسيط', 'Free (broker)', 30, 'broker')
ON CONFLICT (id) DO NOTHING;

-- Arabic/English category names (cards and the wizard read name_ar / name_en)
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS name_ar varchar,
  ADD COLUMN IF NOT EXISTS name_en varchar;
UPDATE categories SET name_en = name WHERE name_en IS NULL;
UPDATE categories SET name_ar = CASE slug
    WHEN 'apartments' THEN 'شقق'
    WHEN 'villas' THEN 'فيلات'
    WHEN 'townhouses' THEN 'تاون هاوس'
    WHEN 'penthouses' THEN 'بنتهاوس'
    WHEN 'land' THEN 'أراضي'
    WHEN 'commercial' THEN 'تجاري'
    ELSE name END
  WHERE name_ar IS NULL;

-- Account details collected at first sign-in
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS account_type text CHECK (account_type IN ('owner', 'broker')),
  ADD COLUMN IF NOT EXISTS whatsapp varchar,
  ADD COLUMN IF NOT EXISTS office_name varchar,
  ADD COLUMN IF NOT EXISTS license_number varchar,
  ADD COLUMN IF NOT EXISTS is_verified_broker boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_id text REFERENCES plans (id),
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

-- Governorate -> city -> district -> compound
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES locations (id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('governorate', 'city', 'district', 'compound')),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  slug text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS locations_root_slug_key ON locations (slug) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS locations_child_slug_key ON locations (parent_id, slug) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS locations_parent_idx ON locations (parent_id);

-- Listing ownership, review and the fields the plan makes mandatory
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES user_profiles (id) ON DELETE SET NULL,
  -- existing (admin-created) listings stay visible; user submissions are inserted as 'pending'
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS finishing text
    CHECK (finishing IN ('none', 'semi', 'full', 'super_lux', 'ultra_lux', 'furnished')),
  ADD COLUMN IF NOT EXISTS payment_type text CHECK (payment_type IN ('cash', 'installments', 'both')),
  ADD COLUMN IF NOT EXISTS down_payment numeric,
  ADD COLUMN IF NOT EXISTS installment_years integer,
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS sold_at timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_clicks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS call_clicks integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS properties_owner_id_idx ON properties (owner_id);
CREATE INDEX IF NOT EXISTS properties_moderation_status_idx ON properties (moderation_status);
CREATE INDEX IF NOT EXISTS properties_location_id_idx ON properties (location_id);

-- Contact events for owner/broker stats (daily numbers come from here later)
CREATE TABLE IF NOT EXISTS listing_events (
  id bigserial PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('view', 'whatsapp', 'call', 'phone_reveal', 'share')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS listing_events_property_idx ON listing_events (property_id, created_at);

-- Visitor reports on listings
CREATE TABLE IF NOT EXISTS listing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES user_profiles (id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (reason IN ('sold', 'wrong_price', 'wrong_info', 'fake', 'duplicate', 'scam', 'other')),
  details text,
  ip_address inet,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);
CREATE INDEX IF NOT EXISTS listing_reports_status_idx ON listing_reports (status, created_at);

COMMIT;
