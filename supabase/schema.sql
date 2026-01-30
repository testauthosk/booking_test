-- =============================================
-- SUPABASE SCHEMA FOR BOOKING PLATFORM
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'salon_owner' CHECK (role IN ('super_admin', 'salon_owner')),
  salon_id UUID,
  telegram_chat_id TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SALONS TABLE
-- =============================================
CREATE TABLE public.salons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Перукарня',
  description TEXT,
  phone TEXT,
  email TEXT,

  -- Address
  address TEXT,
  short_address TEXT,
  coordinates_lat DECIMAL(10, 8),
  coordinates_lng DECIMAL(11, 8),

  -- Photos (array of URLs)
  photos TEXT[] DEFAULT '{}',

  -- Working hours (JSONB)
  working_hours JSONB DEFAULT '[
    {"day": "Понеділок", "hours": "Зачинено"},
    {"day": "Вівторок", "hours": "10:00 - 20:00"},
    {"day": "Середа", "hours": "10:00 - 20:00"},
    {"day": "Четвер", "hours": "10:00 - 20:00"},
    {"day": "П''ятниця", "hours": "10:00 - 20:00"},
    {"day": "Субота", "hours": "09:00 - 18:00"},
    {"day": "Неділя", "hours": "09:00 - 17:00"}
  ]'::jsonb,

  -- Amenities
  amenities TEXT[] DEFAULT '{"Миттєве підтвердження", "Оплата на місці"}',

  -- Stats (calculated)
  rating DECIMAL(2, 1) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,

  -- Owner
  owner_id UUID REFERENCES public.users(id),

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICE CATEGORIES
-- =============================================
CREATE TABLE public.service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICES
-- =============================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration TEXT NOT NULL, -- "35 хв"
  duration_minutes INTEGER NOT NULL,
  price INTEGER NOT NULL,
  price_from BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MASTERS
-- =============================================
CREATE TABLE public.masters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Стиліст',
  avatar TEXT,
  rating DECIMAL(2, 1) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  price INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REVIEWS
-- =============================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  master_id UUID REFERENCES public.masters(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,

  author_name TEXT NOT NULL,
  author_initial TEXT NOT NULL,
  author_color TEXT DEFAULT 'bg-blue-500',

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  service_name TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BOOKINGS
-- =============================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  master_id UUID NOT NULL REFERENCES public.masters(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,

  -- Client info
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,

  -- Booking details
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price INTEGER NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),

  -- Notifications
  notification_sent BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SCHEDULE (blocked time slots)
-- =============================================
CREATE TABLE public.schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  master_id UUID REFERENCES public.masters(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,

  is_blocked BOOLEAN DEFAULT true,
  blocked_reason TEXT, -- 'booked', 'day_off', 'manual'
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_salons_slug ON public.salons(slug);
CREATE INDEX idx_salons_owner ON public.salons(owner_id);
CREATE INDEX idx_services_salon ON public.services(salon_id);
CREATE INDEX idx_masters_salon ON public.masters(salon_id);
CREATE INDEX idx_bookings_salon ON public.bookings(salon_id);
CREATE INDEX idx_bookings_date ON public.bookings(date);
CREATE INDEX idx_schedule_date ON public.schedule(date);
CREATE INDEX idx_schedule_master ON public.schedule(master_id, date);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;

-- Public read access for salons (for the public page)
CREATE POLICY "Salons are viewable by everyone" ON public.salons
  FOR SELECT USING (is_active = true);

-- Salon owners can update their own salon
CREATE POLICY "Owners can update their salon" ON public.salons
  FOR UPDATE USING (owner_id = auth.uid());

-- Public read for services
CREATE POLICY "Services are viewable by everyone" ON public.services
  FOR SELECT USING (is_active = true);

-- Salon owners can manage services
CREATE POLICY "Owners can manage services" ON public.services
  FOR ALL USING (
    salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid())
  );

-- Public read for service categories
CREATE POLICY "Categories are viewable by everyone" ON public.service_categories
  FOR SELECT USING (true);

-- Salon owners can manage categories
CREATE POLICY "Owners can manage categories" ON public.service_categories
  FOR ALL USING (
    salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid())
  );

-- Public read for masters
CREATE POLICY "Masters are viewable by everyone" ON public.masters
  FOR SELECT USING (is_active = true);

-- Salon owners can manage masters
CREATE POLICY "Owners can manage masters" ON public.masters
  FOR ALL USING (
    salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid())
  );

-- Public read for reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);

-- Anyone can create reviews
CREATE POLICY "Anyone can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);

-- Anyone can create bookings
CREATE POLICY "Anyone can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

-- Salon owners can view their bookings
CREATE POLICY "Owners can view bookings" ON public.bookings
  FOR SELECT USING (
    salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid())
  );

-- Salon owners can update bookings
CREATE POLICY "Owners can update bookings" ON public.bookings
  FOR UPDATE USING (
    salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid())
  );

-- Schedule is viewable for available slots
CREATE POLICY "Schedule is viewable by everyone" ON public.schedule
  FOR SELECT USING (true);

-- Salon owners can manage schedule
CREATE POLICY "Owners can manage schedule" ON public.schedule
  FOR ALL USING (
    salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid())
  );

-- =============================================
-- TRIGGERS
-- =============================================

-- Update salon rating when review is added
CREATE OR REPLACE FUNCTION update_salon_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.salons
  SET
    rating = (SELECT COALESCE(AVG(rating), 5.0) FROM public.reviews WHERE salon_id = NEW.salon_id),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE salon_id = NEW.salon_id)
  WHERE id = NEW.salon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_salon_rating();

-- Update master rating when review is added
CREATE OR REPLACE FUNCTION update_master_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.master_id IS NOT NULL THEN
    UPDATE public.masters
    SET
      rating = (SELECT COALESCE(AVG(rating), 5.0) FROM public.reviews WHERE master_id = NEW.master_id),
      review_count = (SELECT COUNT(*) FROM public.reviews WHERE master_id = NEW.master_id)
    WHERE id = NEW.master_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_created_master
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_master_rating();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER salons_updated_at
  BEFORE UPDATE ON public.salons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- STORAGE BUCKETS (run in Supabase Dashboard)
-- =============================================
-- Create bucket 'images' with public access
-- INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);
