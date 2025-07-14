-- Function to increment property views
CREATE OR REPLACE FUNCTION increment_property_views(property_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE properties 
  SET views = COALESCE(views, 0) + 1 
  WHERE id = property_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get property statistics
CREATE OR REPLACE FUNCTION get_property_stats()
RETURNS TABLE(
  total_properties BIGINT,
  total_for_sale BIGINT,
  total_for_rent BIGINT,
  total_featured BIGINT,
  avg_price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_properties,
    COUNT(*) FILTER (WHERE property_type = 'sale') as total_for_sale,
    COUNT(*) FILTER (WHERE property_type = 'rent') as total_for_rent,
    COUNT(*) FILTER (WHERE is_featured = true) as total_featured,
    AVG(price) as avg_price
  FROM properties 
  WHERE status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search properties with full text search
CREATE OR REPLACE FUNCTION search_properties(search_query TEXT)
RETURNS TABLE(
  id UUID,
  title VARCHAR,
  description TEXT,
  price NUMERIC,
  location VARCHAR,
  area VARCHAR,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.location,
    p.area,
    ts_rank(
      to_tsvector('english', p.title || ' ' || p.description || ' ' || p.location || ' ' || p.area),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM properties p
  WHERE 
    p.status = 'active' AND
    to_tsvector('english', p.title || ' ' || p.description || ' ' || p.location || ' ' || p.area) 
    @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
