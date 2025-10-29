-- ============================================
-- SUPABASE DATABASE CLEANUP AND SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Drop all existing policies (clean slate)
-- ============================================

-- Drop policies on schedule table
DROP POLICY IF EXISTS "public read schedule" ON schedule;
DROP POLICY IF EXISTS "admins write schedule" ON schedule;
DROP POLICY IF EXISTS "Admins can insert schedule" ON schedule;
DROP POLICY IF EXISTS "Admins can update schedule" ON schedule;
DROP POLICY IF EXISTS "Admins can delete schedule" ON schedule;
DROP POLICY IF EXISTS "public_read_schedule" ON schedule;
DROP POLICY IF EXISTS "admin_all_schedule" ON schedule;

-- Drop policies on tournaments table
DROP POLICY IF EXISTS "public read tournaments" ON tournaments;
DROP POLICY IF EXISTS "admins write tournaments" ON tournaments;
DROP POLICY IF EXISTS "Admins can insert tournaments" ON tournaments;
DROP POLICY IF EXISTS "Admins can update tournaments" ON tournaments;
DROP POLICY IF EXISTS "Admins can delete tournaments" ON tournaments;
DROP POLICY IF EXISTS "public_read_tournaments" ON tournaments;
DROP POLICY IF EXISTS "admin_all_tournaments" ON tournaments;

-- Drop policies on slides table
DROP POLICY IF EXISTS "public read slides" ON slides;
DROP POLICY IF EXISTS "admins write slides" ON slides;
DROP POLICY IF EXISTS "Admins can insert slides" ON slides;
DROP POLICY IF EXISTS "Admins can update slides" ON slides;
DROP POLICY IF EXISTS "Admins can delete slides" ON slides;
DROP POLICY IF EXISTS "public_read_slides" ON slides;
DROP POLICY IF EXISTS "admin_all_slides" ON slides;

-- Drop policies on site_settings table
DROP POLICY IF EXISTS "public read settings" ON site_settings;
DROP POLICY IF EXISTS "admins write settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can insert site_settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can update site_settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can delete site_settings" ON site_settings;
DROP POLICY IF EXISTS "public_read_site_settings" ON site_settings;
DROP POLICY IF EXISTS "admin_all_site_settings" ON site_settings;

-- Drop policies on winter_signups_2025 table
DROP POLICY IF EXISTS "public insert winter signups" ON winter_signups_2025;
DROP POLICY IF EXISTS "admins read winter signups" ON winter_signups_2025;
DROP POLICY IF EXISTS "admins delete winter signups" ON winter_signups_2025;
DROP POLICY IF EXISTS "Public can insert winter_signups" ON winter_signups_2025;
DROP POLICY IF EXISTS "Admins can read winter_signups" ON winter_signups_2025;
DROP POLICY IF EXISTS "Admins can delete winter_signups" ON winter_signups_2025;

-- Drop policies on admins table
DROP POLICY IF EXISTS "admins_read_admins" ON admins;
DROP POLICY IF EXISTS "Admins can read admins" ON admins;

-- Drop storage policies
DROP POLICY IF EXISTS "public read media" ON storage.objects;
DROP POLICY IF EXISTS "admins upload media" ON storage.objects;
DROP POLICY IF EXISTS "admins delete media" ON storage.objects;
DROP POLICY IF EXISTS "Public can read media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;


-- STEP 2: Ensure tables exist with correct structure
-- ============================================

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  email text PRIMARY KEY
);

-- Schedule table
CREATE TABLE IF NOT EXISTS schedule (
  id bigserial PRIMARY KEY,
  day text NOT NULL,
  time text NOT NULL,
  grp text NOT NULL,
  sort int DEFAULT 0
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id bigserial PRIMARY KEY,
  date date NOT NULL,
  event text NOT NULL,
  location text NOT NULL,
  weighin_time text,
  registration_url text
);

-- Slides table
CREATE TABLE IF NOT EXISTS slides (
  id bigserial PRIMARY KEY,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  caption text,
  storage_path text,
  sort int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);

-- Winter signups table
CREATE TABLE IF NOT EXISTS winter_signups_2025 (
  id bigserial PRIMARY KEY,
  parent_name text NOT NULL,
  wrestler_name text NOT NULL,
  wrestler_dob date NOT NULL,
  wrestler_grade text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  submitted_at timestamptz DEFAULT now()
);


-- STEP 3: Enable RLS on all tables
-- ============================================

ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE winter_signups_2025 ENABLE ROW LEVEL SECURITY;


-- STEP 4: Create clean, simple policies
-- ============================================

-- SCHEDULE POLICIES
CREATE POLICY "public_read_schedule" 
  ON schedule FOR SELECT 
  USING (true);

CREATE POLICY "admin_all_schedule" 
  ON schedule FOR ALL 
  USING (
    EXISTS(SELECT 1 FROM admins WHERE admins.email = auth.email())
  );

-- TOURNAMENTS POLICIES
CREATE POLICY "public_read_tournaments" 
  ON tournaments FOR SELECT 
  USING (true);

CREATE POLICY "admin_all_tournaments" 
  ON tournaments FOR ALL 
  USING (
    EXISTS(SELECT 1 FROM admins WHERE admins.email = auth.email())
  );

-- SLIDES POLICIES
CREATE POLICY "public_read_slides" 
  ON slides FOR SELECT 
  USING (true);

CREATE POLICY "admin_all_slides" 
  ON slides FOR ALL 
  USING (
    EXISTS(SELECT 1 FROM admins WHERE admins.email = auth.email())
  );

-- SITE_SETTINGS POLICIES
CREATE POLICY "public_read_site_settings" 
  ON site_settings FOR SELECT 
  USING (true);

CREATE POLICY "admin_all_site_settings" 
  ON site_settings FOR ALL 
  USING (
    EXISTS(SELECT 1 FROM admins WHERE admins.email = auth.email())
  );

-- WINTER_SIGNUPS_2025 POLICIES
CREATE POLICY "public_insert_winter_signups" 
  ON winter_signups_2025 FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "admin_read_winter_signups" 
  ON winter_signups_2025 FOR SELECT 
  USING (
    EXISTS(SELECT 1 FROM admins WHERE admins.email = auth.email())
  );

CREATE POLICY "admin_delete_winter_signups" 
  ON winter_signups_2025 FOR DELETE 
  USING (
    EXISTS(SELECT 1 FROM admins WHERE admins.email = auth.email())
  );

-- ADMINS TABLE POLICY (admins can read the admins table)
CREATE POLICY "admin_read_admins" 
  ON admins FOR SELECT 
  USING (
    EXISTS(SELECT 1 FROM admins WHERE admins.email = auth.email())
  );


-- STEP 5: Storage bucket and policies
-- ============================================

-- Create media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "public_read_media" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'media');

CREATE POLICY "admin_upload_media" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'media' AND 
    EXISTS(SELECT 1 FROM admins WHERE admins.email = auth.email())
  );

CREATE POLICY "admin_delete_media" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'media' AND 
    EXISTS(SELECT 1 FROM admins WHERE admins.email = auth.email())
  );


-- STEP 6: Insert your admin email (REPLACE WITH YOUR EMAIL!)
-- ============================================

-- IMPORTANT: Replace 'your-email@example.com' with your actual admin email
INSERT INTO admins (email) 
VALUES ('your-email@example.com')
ON CONFLICT (email) DO NOTHING;

-- You can add more admin emails here:
-- INSERT INTO admins (email) VALUES ('another-admin@example.com') ON CONFLICT DO NOTHING;


-- ============================================
-- DONE! Your database is now clean and ready
-- ============================================

