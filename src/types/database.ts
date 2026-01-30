// Database types for Supabase
// These match the structure of the salon page data

export interface Salon {
  id: string;
  slug: string;
  name: string;
  type: string; // "Перукарня", "Барбершоп", etc.
  description: string;
  phone: string;
  email?: string;

  // Address
  address: string;
  short_address: string;
  coordinates_lat: number;
  coordinates_lng: number;

  // Photos (stored as URLs in Supabase Storage)
  photos: string[];

  // Working hours as JSON
  working_hours: WorkingHour[];

  // Amenities/features
  amenities: string[];

  // Calculated fields (updated by triggers)
  rating: number;
  review_count: number;

  // Owner reference
  owner_id: string;

  // Status
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkingHour {
  day: string;
  hours: string; // "10:00 - 20:00" or "Зачинено"
  is_today?: boolean;
}

export interface ServiceCategory {
  id: string;
  salon_id: string;
  name: string; // "СТРИЖКА", "БОРОДА"
  sort_order: number;
  created_at: string;
}

export interface Service {
  id: string;
  salon_id: string;
  category_id: string;
  name: string;
  duration: string; // "35 хв", "1г 15 хв"
  duration_minutes: number;
  price: number;
  price_from: boolean; // показывать "від"
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Master {
  id: string;
  salon_id: string;
  name: string;
  role: string; // "Стиліст", "Креативний директор"
  avatar: string; // URL to image
  rating: number;
  review_count: number;
  price: number; // базовая цена
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Review {
  id: string;
  salon_id: string;
  master_id?: string;
  service_id?: string;

  author_name: string;
  author_initial: string;
  author_color: string; // "bg-blue-500"

  rating: number;
  text: string;
  service_name?: string;

  created_at: string;
}

export interface Booking {
  id: string;
  salon_id: string;
  master_id: string;
  service_id: string;

  // Client info
  client_name: string;
  client_phone: string;
  client_email?: string;

  // Booking details
  date: string; // "2024-01-15"
  time: string; // "14:00"
  duration_minutes: number;
  price: number;
  notes?: string; // Additional notes

  // Status
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';

  // Notification sent
  notification_sent: boolean;

  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  salon_id: string;
  master_id?: string; // null = общий для салона

  // Schedule slot
  date: string;
  time_start: string;
  time_end: string;

  // Is this slot blocked?
  is_blocked: boolean;
  blocked_reason?: string; // "booked", "day_off", "manual"
  booking_id?: string; // if blocked by booking

  created_at: string;
}

// User/Auth types
export interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'salon_owner';
  salon_id?: string; // for salon owners

  // Telegram notifications
  telegram_chat_id?: string;
  notifications_enabled: boolean;

  created_at: string;
}

// API response types
export interface SalonWithRelations extends Salon {
  services: (ServiceCategory & { items: Service[] })[];
  masters: Master[];
  reviews: Review[];
}
