-- Valkyrie Supabase schema + seed
-- Run in Supabase Dashboard → SQL Editor → paste → Run
-- Idempotent: safe to re-run.

-- =============================================
-- SCHEMA
-- =============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farm_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  farm_name TEXT DEFAULT 'My Farm',
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  vet_phone TEXT,
  alert_notifications BOOLEAN DEFAULT TRUE,
  alert_sound BOOLEAN DEFAULT TRUE,
  paranoia_level INTEGER DEFAULT 3 CHECK (paranoia_level BETWEEN 1 AND 5),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stalls (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  camera_status TEXT DEFAULT 'online' CHECK (camera_status IN ('online', 'offline'))
);

CREATE TABLE IF NOT EXISTS horses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  stall_id TEXT REFERENCES stalls(id),
  image_url TEXT,
  video_url TEXT
);

CREATE TABLE IF NOT EXISTS health_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stall_id TEXT REFERENCES stalls(id) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  overall INTEGER CHECK (overall BETWEEN 0 AND 100),
  movement INTEGER CHECK (movement BETWEEN 0 AND 100),
  posture INTEGER CHECK (posture BETWEEN 0 AND 100),
  feeding INTEGER CHECK (feeding BETWEEN 0 AND 100),
  activity INTEGER CHECK (activity BETWEEN 0 AND 100),
  status TEXT CHECK (status IN ('healthy', 'watch', 'at-risk', 'critical'))
);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stall_id TEXT REFERENCES stalls(id) NOT NULL,
  horse_id TEXT REFERENCES horses(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  severity TEXT CHECK (severity IN ('warning', 'critical')),
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved')),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  note TEXT
);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE stalls         ENABLE ROW LEVEL SECURITY;
ALTER TABLE horses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts         ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own profile"       ON profiles;
DROP POLICY IF EXISTS "own settings"      ON farm_settings;
DROP POLICY IF EXISTS "auth read stalls"  ON stalls;
DROP POLICY IF EXISTS "auth read horses"  ON horses;
DROP POLICY IF EXISTS "auth read scores"  ON health_scores;
DROP POLICY IF EXISTS "auth write scores" ON health_scores;
DROP POLICY IF EXISTS "auth all alerts"   ON alerts;

CREATE POLICY "own profile"       ON profiles       FOR ALL    USING (auth.uid() = id);
CREATE POLICY "own settings"      ON farm_settings  FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "auth read stalls"  ON stalls         FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth read horses"  ON horses         FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth read scores"  ON health_scores  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth write scores" ON health_scores  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth all alerts"   ON alerts         FOR ALL    USING (auth.role() = 'authenticated');

-- =============================================
-- SEED DATA
-- =============================================

-- Drop obsolete horses, stalls, and their dependents so re-running converges.
DELETE FROM horses        WHERE id IN ('h6','h7','h8');
DELETE FROM alerts        WHERE stall_id IN ('s6','s7','s8');
DELETE FROM health_scores WHERE stall_id IN ('s6','s7','s8');
DELETE FROM stalls        WHERE id IN ('s6','s7','s8');

INSERT INTO stalls (id, name, camera_status) VALUES
  ('s1','A1','online'),('s2','A2','online'),('s3','A3','online'),
  ('s4','B1','online'),('s5','B2','online')
ON CONFLICT (id) DO NOTHING;

INSERT INTO horses (id, name, breed, age, stall_id, image_url, video_url) VALUES
  ('h1','Rocky','Thoroughbred',7,'s1',NULL,NULL),
  ('h2','Bella','Quarter Horse',4,'s2',NULL,NULL),
  ('h3','Shadow','Arabian',6,'s3',NULL,NULL),
  ('h4','Maple','Paint',5,'s4',NULL,NULL),
  ('h5','Duke','Warmblood',9,'s5',NULL,NULL)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      breed = EXCLUDED.breed,
      age = EXCLUDED.age,
      stall_id = EXCLUDED.stall_id;

-- =============================================
-- STORAGE: horse-videos bucket
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('horse-videos', 'horse-videos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "auth upload horse videos" ON storage.objects;
DROP POLICY IF EXISTS "auth delete horse videos" ON storage.objects;

CREATE POLICY "auth upload horse videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'horse-videos');

CREATE POLICY "auth delete horse videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'horse-videos' AND owner = auth.uid());

-- =============================================
-- PROFILE AUTO-CREATE TRIGGER
-- When a user signs up, create an empty profile row + default farm_settings.
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  INSERT INTO public.farm_settings (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
