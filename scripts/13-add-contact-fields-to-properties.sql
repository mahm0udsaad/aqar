-- Add individual contact fields to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_whatsapp VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_avatar VARCHAR(500);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS response_time VARCHAR(100) DEFAULT '1 hour';

-- Add other missing fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_per_meter DECIMAL(15,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_floors INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10,8);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11,8);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';

-- Update existing records to have default values for required fields
UPDATE properties SET 
  contact_name = 'Contact Name',
  contact_phone = 'Contact Phone'
WHERE contact_name IS NULL OR contact_phone IS NULL; 