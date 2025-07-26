-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE property_type AS ENUM ('sale', 'rent');
CREATE TYPE owner_type AS ENUM ('owner', 'broker');
CREATE TYPE property_status AS ENUM ('active', 'draft', 'sold', 'rented', 'inactive');

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  description_ar TEXT,
  icon VARCHAR(255),
  image_url VARCHAR(1000), -- New column for category image
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  title_ar VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  size INTEGER NOT NULL,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  location VARCHAR(255) NOT NULL,
  location_ar VARCHAR(255) NOT NULL,
  area VARCHAR(255) NOT NULL,
  area_ar VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  property_type VARCHAR(10) CHECK (property_type IN ('sale', 'rent')) NOT NULL,
  owner_type VARCHAR(10) CHECK (owner_type IN ('owner', 'broker')) DEFAULT 'owner',
  features TEXT[] DEFAULT '{}',
  features_ar TEXT[] DEFAULT '{}',
  images JSONB DEFAULT '[]',
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  floor INTEGER,
  year_built INTEGER,
  contact_info JSONB DEFAULT '{}',
  status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'sold', 'rented')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property images table
CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  url VARCHAR(1000) NOT NULL,
  alt_text VARCHAR(500),
  order_index INTEGER DEFAULT 0,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property ratings table
CREATE TABLE property_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  schools DECIMAL(3,1) CHECK (schools >= 0 AND schools <= 10),
  transportation DECIMAL(3,1) CHECK (transportation >= 0 AND transportation <= 10),
  shopping DECIMAL(3,1) CHECK (shopping >= 0 AND shopping <= 10),
  restaurants DECIMAL(3,1) CHECK (restaurants >= 0 AND restaurants <= 10),
  safety DECIMAL(3,1) CHECK (safety >= 0 AND safety <= 10),
  quietness DECIMAL(3,1) CHECK (quietness >= 0 AND quietness <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (extends auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  role VARCHAR(10) CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loved properties table (user favorites)
CREATE TABLE loved_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Home sections table for dynamic home page content
CREATE TABLE home_sections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section_type VARCHAR(50) CHECK (section_type IN ('hero', 'stats', 'featured', 'categories', 'testimonials', 'cta')) NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  content_ar JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_properties_category_id ON properties(category_id);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_is_featured ON properties(is_featured);
CREATE INDEX idx_properties_is_new ON properties(is_new);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_size ON properties(size);
CREATE INDEX idx_properties_location ON properties(location);
CREATE INDEX idx_properties_area ON properties(area);
CREATE INDEX idx_properties_created_at ON properties(created_at);
CREATE INDEX idx_loved_properties_user_id ON loved_properties(user_id);
CREATE INDEX idx_loved_properties_property_id ON loved_properties(property_id);
CREATE INDEX idx_home_sections_order ON home_sections(order_index);
CREATE INDEX idx_home_sections_active ON home_sections(is_active);

-- Create full-text search indexes
CREATE INDEX idx_properties_search ON properties USING gin(to_tsvector('english', title || ' ' || description || ' ' || location || ' ' || area));
CREATE INDEX idx_properties_search_ar ON properties USING gin(to_tsvector('arabic', title_ar || ' ' || description_ar || ' ' || location_ar || ' ' || area_ar));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_ratings_updated_at BEFORE UPDATE ON property_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_home_sections_updated_at BEFORE UPDATE ON home_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
