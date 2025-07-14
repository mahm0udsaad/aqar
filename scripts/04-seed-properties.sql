-- Insert sample properties with Arabic translations
INSERT INTO properties (
  title, title_ar, description, description_ar, price, size, bedrooms, bathrooms,
  location, location_ar, area, area_ar, category_id, property_type, owner_type,
  features, features_ar, images, is_featured, is_new, is_verified, views, floor, year_built,
  contact_info, status
) VALUES
(
  'Luxury 3BR Apartment in New Cairo',
  'شقة فاخرة 3 غرف نوم في القاهرة الجديدة',
  'Beautiful modern apartment with stunning city views, fully furnished with high-end finishes.',
  'شقة حديثة جميلة مع إطلالات رائعة على المدينة، مفروشة بالكامل مع تشطيبات عالية الجودة.',
  2500000, 180, 3, 2,
  'Fifth Settlement', 'التجمع الخامس', 'New Cairo', 'القاهرة الجديدة',
  (SELECT id FROM categories WHERE slug = 'apartment'),
  'sale', 'owner',
  ARRAY['Parking', 'Elevator', 'Balcony', 'Security'],
  ARRAY['موقف سيارات', 'مصعد', 'شرفة', 'أمن'],
  '[{"url": "/images/property-1.jpg", "alt": "Living Room"}, {"url": "/images/property-2.jpg", "alt": "Bedroom"}]'::jsonb,
  true, true, true, 245, 5, 2022,
  '{"name": "Ahmed Hassan", "phone": "+20 100 123 4567", "email": "ahmed@example.com", "isVerified": true, "responseTime": "1 hour"}'::jsonb,
  'active'
),
(
  'Modern Villa with Pool in Sheikh Zayed',
  'فيلا حديثة مع مسبح في الشيخ زايد',
  'Spacious villa with private pool, garden, and modern amenities in a gated community.',
  'فيلا واسعة مع مسبح خاص وحديقة ووسائل راحة حديثة في مجتمع مسور.',
  8500000, 350, 4, 3,
  'Sheikh Zayed City', 'مدينة الشيخ زايد', 'Giza', 'الجيزة',
  (SELECT id FROM categories WHERE slug = 'villa'),
  'sale', 'broker',
  ARRAY['Pool', 'Garden', 'Parking', 'Security', 'Gym'],
  ARRAY['مسبح', 'حديقة', 'موقف سيارات', 'أمن', 'صالة رياضية'],
  '[{"url": "/images/villa-1.jpg", "alt": "Villa Exterior"}, {"url": "/images/villa-2.jpg", "alt": "Pool Area"}]'::jsonb,
  true, false, true, 189, 1, 2021,
  '{"name": "Sara Mohamed", "phone": "+20 101 234 5678", "email": "sara@realestate.com", "isVerified": true, "responseTime": "30 minutes"}'::jsonb,
  'active'
),
(
  'Cozy Studio for Rent in Zamalek',
  'استوديو مريح للإيجار في الزمالك',
  'Charming studio apartment in the heart of Zamalek, perfect for young professionals.',
  'شقة استوديو ساحرة في قلب الزمالك، مثالية للمهنيين الشباب.',
  8000, 45, 0
