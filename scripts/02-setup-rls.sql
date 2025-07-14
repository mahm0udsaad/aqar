-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_sections ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Categories are editable by admins" ON categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Properties policies
CREATE POLICY "Active properties are viewable by everyone" ON properties FOR SELECT USING (status = 'active');
CREATE POLICY "Properties are editable by admins" ON properties FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Property images policies (follow property access)
CREATE POLICY "Property images are viewable with properties" ON property_images FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM properties p 
    WHERE p.id = property_id AND (
      p.status = 'active' OR 
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
    )
  )
);
CREATE POLICY "Property images are insertable by admins" ON property_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Property images are updatable by admins" ON property_images FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Property images are deletable by admins" ON property_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Property ratings policies (follow property access)
CREATE POLICY "Property ratings are viewable with properties" ON property_ratings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM properties p 
    WHERE p.id = property_id AND (
      p.status = 'active' OR 
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
    )
  )
);
CREATE POLICY "Property ratings are insertable by admins" ON property_ratings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Property ratings are updatable by admins" ON property_ratings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Property ratings are deletable by admins" ON property_ratings FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
);

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Loved properties policies
CREATE POLICY "Users can view their own loved properties" ON loved_properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own loved properties" ON loved_properties FOR ALL USING (auth.uid() = user_id);

-- Home sections policies
CREATE POLICY "Home sections are viewable by everyone" ON home_sections FOR SELECT USING (is_active = true);
CREATE POLICY "Home sections are editable by admins" ON home_sections FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);
