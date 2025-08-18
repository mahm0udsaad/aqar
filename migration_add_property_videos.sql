
CREATE TABLE property_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    order_index INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE property_images ADD COLUMN caption TEXT;
