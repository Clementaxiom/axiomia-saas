-- AxiomIA Restaurant SaaS - Database Schema
-- Execute this in Supabase SQL Editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM Types
CREATE TYPE user_role AS ENUM ('super_admin', 'restaurant_admin', 'staff');
CREATE TYPE reservation_status AS ENUM ('confirmed', 'seated', 'completed', 'cancelled', 'no_show');
CREATE TYPE reservation_source AS ENUM ('voice', 'manual', 'online', 'walk_in');
CREATE TYPE service_type AS ENUM ('lunch', 'dinner');

-- Table: restaurants
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: restaurant_settings
CREATE TABLE restaurant_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE,
  
  -- Theming
  primary_color VARCHAR(7) DEFAULT '#1a1a1a',
  primary_hover_color VARCHAR(7) DEFAULT '#333333',
  accent_color VARCHAR(7) DEFAULT '#3b82f6',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  surface_color VARCHAR(7) DEFAULT '#f8fafc',
  text_color VARCHAR(7) DEFAULT '#0f172a',
  text_muted_color VARCHAR(7) DEFAULT '#64748b',
  border_color VARCHAR(7) DEFAULT '#e2e8f0',
  font_display VARCHAR(100) DEFAULT 'system-ui',
  font_body VARCHAR(100) DEFAULT 'system-ui',
  
  -- Modules ON/OFF
  module_dashboard BOOLEAN DEFAULT TRUE,
  module_floor_plan BOOLEAN DEFAULT TRUE,
  module_planning BOOLEAN DEFAULT TRUE,
  module_reservations BOOLEAN DEFAULT TRUE,
  
  -- Features
  enable_table_merge BOOLEAN DEFAULT FALSE,
  default_reservation_duration INTEGER DEFAULT 90,
  max_party_size INTEGER DEFAULT 12,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role user_role NOT NULL DEFAULT 'staff',
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: rooms (salles du restaurant)
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: tables
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  table_number VARCHAR(20) NOT NULL,
  min_capacity INTEGER NOT NULL DEFAULT 1,
  max_capacity INTEGER NOT NULL DEFAULT 4,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  width FLOAT DEFAULT 80,
  height FLOAT DEFAULT 80,
  shape VARCHAR(20) DEFAULT 'rectangle',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(restaurant_id, table_number)
);

-- Table: table_merge_rules (configuration fusion possible)
CREATE TABLE table_merge_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  table_a_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  table_b_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(table_a_id, table_b_id)
);

-- Table: services (midi/soir)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  type service_type NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: shifts (créneaux par service)
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_covers INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: table_links (fusions actives contextualisées)
CREATE TABLE table_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  primary_table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  secondary_table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  link_date DATE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  combined_capacity INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  UNIQUE(primary_table_id, secondary_table_id, link_date, service_id, shift_id)
);

-- Table: reservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  
  -- Contexte temporel
  reservation_date DATE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  reservation_time TIME NOT NULL,
  
  -- Client
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  party_size INTEGER NOT NULL,
  
  -- Attribution
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  table_link_id UUID REFERENCES table_links(id) ON DELETE SET NULL,
  
  -- Métadonnées
  status reservation_status DEFAULT 'confirmed',
  source reservation_source DEFAULT 'manual',
  notes TEXT,
  internal_notes TEXT,
  duration_minutes INTEGER DEFAULT 90,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_reservations_date ON reservations(restaurant_id, reservation_date);
CREATE INDEX idx_reservations_service ON reservations(service_id, shift_id);
CREATE INDEX idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX idx_table_links_context ON table_links(restaurant_id, link_date, service_id, shift_id);

-- Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_merge_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Super admin: full access to all tables
CREATE POLICY "Super admin full access restaurants" ON restaurants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_super_admin = TRUE)
  );

CREATE POLICY "Super admin full access settings" ON restaurant_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_super_admin = TRUE)
  );

CREATE POLICY "Super admin full access users" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_super_admin = TRUE)
  );

CREATE POLICY "Super admin full access rooms" ON rooms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_super_admin = TRUE)
  );

CREATE POLICY "Super admin full access tables" ON tables
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_super_admin = TRUE)
  );

CREATE POLICY "Super admin full access merge_rules" ON table_merge_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_super_admin = TRUE)
  );

CREATE POLICY "Super admin full access services" ON services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_super_admin = TRUE)
  );

CREATE POLICY "Super admin full access shifts" ON shifts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_super_admin = TRUE)
  );

CREATE POLICY "Super admin full access links" ON table_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_super_admin = TRUE)
  );

CREATE POLICY "Super admin full access reservations" ON reservations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_super_admin = TRUE)
  );

-- Restaurant users: access to their restaurant's data
CREATE POLICY "Restaurant users access restaurants" ON restaurants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.restaurant_id = restaurants.id)
  );

CREATE POLICY "Restaurant users access settings" ON restaurant_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.restaurant_id = restaurant_settings.restaurant_id)
  );

CREATE POLICY "Restaurant users access users" ON users
  FOR SELECT USING (
    id = auth.uid() OR
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.restaurant_id = users.restaurant_id)
  );

CREATE POLICY "Restaurant users access rooms" ON rooms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.restaurant_id = rooms.restaurant_id)
  );

CREATE POLICY "Restaurant users access tables" ON tables
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.restaurant_id = tables.restaurant_id)
  );

CREATE POLICY "Restaurant users access merge_rules" ON table_merge_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.restaurant_id = table_merge_rules.restaurant_id)
  );

CREATE POLICY "Restaurant users access services" ON services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.restaurant_id = services.restaurant_id)
  );

CREATE POLICY "Restaurant users access shifts" ON shifts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN users u ON u.restaurant_id = s.restaurant_id
      WHERE s.id = shifts.service_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "Restaurant users access links" ON table_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.restaurant_id = table_links.restaurant_id)
  );

CREATE POLICY "Restaurant users access reservations" ON reservations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.restaurant_id = reservations.restaurant_id)
  );

-- Function to automatically create restaurant_settings when a restaurant is created
CREATE OR REPLACE FUNCTION create_restaurant_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO restaurant_settings (restaurant_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_restaurant_created
  AFTER INSERT ON restaurants
  FOR EACH ROW EXECUTE FUNCTION create_restaurant_settings();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_restaurant_settings_updated_at
  BEFORE UPDATE ON restaurant_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
