-- Aqar: account favorites, buyer <-> advertiser chat, richer listing events.
-- Idempotent and PostgreSQL 10 compatible.
BEGIN;

-- Favorites belong to accounts now (one row per user and listing)
DELETE FROM loved_properties a USING loved_properties b
 WHERE a.user_id = b.user_id AND a.property_id = b.property_id AND a.ctid > b.ctid;
CREATE UNIQUE INDEX IF NOT EXISTS loved_properties_user_property_key ON loved_properties (user_id, property_id);
CREATE INDEX IF NOT EXISTS loved_properties_property_idx ON loved_properties (property_id);

-- Events: add favorites and first messages so owners see them in their stats
ALTER TABLE listing_events DROP CONSTRAINT IF EXISTS listing_events_kind_check;
ALTER TABLE listing_events ADD CONSTRAINT listing_events_kind_check
  CHECK (kind IN ('view', 'whatsapp', 'call', 'phone_reveal', 'share', 'favorite', 'message'));
CREATE INDEX IF NOT EXISTS listing_events_kind_idx ON listing_events (property_id, kind, created_at);

-- One conversation per buyer per listing
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  buyer_last_read_at timestamptz NOT NULL DEFAULT now(),
  owner_last_read_at timestamptz NOT NULL DEFAULT 'epoch',
  CHECK (buyer_id <> owner_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS conversations_property_buyer_key ON conversations (property_id, buyer_id);
CREATE INDEX IF NOT EXISTS conversations_buyer_idx ON conversations (buyer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS conversations_owner_idx ON conversations (owner_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id bigserial PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages (conversation_id, id);
CREATE INDEX IF NOT EXISTS messages_sender_recent_idx ON messages (sender_id, created_at);

COMMIT;
