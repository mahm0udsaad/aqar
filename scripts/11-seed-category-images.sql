-- Update image URLs for existing categories based on correct slugs

UPDATE categories SET image_url = '/categories/appartments.png' WHERE slug = 'apartments';
UPDATE categories SET image_url = '/categories/villas.png' WHERE slug = 'villas';
UPDATE categories SET image_url = '/categories/penthouses.png' WHERE slug = 'penthouses';

-- Assign a placeholder for categories without a specific image
UPDATE categories SET image_url = '/placeholder.jpg' WHERE slug = 'townhouses';