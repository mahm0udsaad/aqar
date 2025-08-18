-- Multilingual property translations (idempotent)
CREATE TABLE IF NOT EXISTS public.property_translations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('en','ar')),
  title text NOT NULL,
  description text,
  location text,
  area text,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, locale)
);

ALTER TABLE public.property_translations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='property_translations' AND policyname='ptr_read_anon_auth'
  ) THEN
    CREATE POLICY ptr_read_anon_auth
      ON public.property_translations
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_ptr_property ON public.property_translations(property_id);
CREATE INDEX IF NOT EXISTS idx_ptr_locale ON public.property_translations(locale);
