import { supabase } from './supabase';
import type {
  Salon,
  Service,
  ServiceCategory,
  Master,
  Review,
  Booking,
  SalonWithRelations
} from '@/types/database';

// ==================== SALON ====================

export async function getSalonBySlug(slug: string): Promise<SalonWithRelations | null> {
  // Get salon
  const { data: salon, error } = await supabase
    .from('salons')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !salon) return null;

  // Get service categories with services
  const { data: categories } = await supabase
    .from('service_categories')
    .select('*')
    .eq('salon_id', salon.id)
    .order('sort_order');

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('salon_id', salon.id)
    .eq('is_active', true)
    .order('sort_order');

  // Group services by category
  const servicesWithCategories = (categories || []).map(cat => ({
    ...cat,
    items: (services || []).filter(s => s.category_id === cat.id)
  }));

  // Get masters
  const { data: masters } = await supabase
    .from('masters')
    .select('*')
    .eq('salon_id', salon.id)
    .eq('is_active', true)
    .order('sort_order');

  // Get reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('salon_id', salon.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    ...salon,
    services: servicesWithCategories,
    masters: masters || [],
    reviews: reviews || []
  };
}

export async function getSalonById(id: string): Promise<Salon | null> {
  const { data, error } = await supabase
    .from('salons')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

// ==================== SERVICES ====================

export async function getServicesBySalon(salonId: string) {
  const { data: categories } = await supabase
    .from('service_categories')
    .select('*')
    .eq('salon_id', salonId)
    .order('sort_order');

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('salon_id', salonId)
    .order('sort_order');

  return (categories || []).map(cat => ({
    ...cat,
    items: (services || []).filter(s => s.category_id === cat.id)
  }));
}

export async function updateService(serviceId: string, data: Partial<Service>) {
  const { error } = await supabase
    .from('services')
    .update(data)
    .eq('id', serviceId);

  return !error;
}

export async function createService(data: Omit<Service, 'id' | 'created_at'>) {
  const { data: newService, error } = await supabase
    .from('services')
    .insert(data)
    .select()
    .single();

  if (error) return null;
  return newService;
}

export async function deleteService(serviceId: string) {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId);

  return !error;
}

// ==================== MASTERS ====================

export async function getMastersBySalon(salonId: string) {
  const { data } = await supabase
    .from('masters')
    .select('*')
    .eq('salon_id', salonId)
    .order('sort_order');

  return data || [];
}

export async function updateMaster(masterId: string, data: Partial<Master>) {
  const { error } = await supabase
    .from('masters')
    .update(data)
    .eq('id', masterId);

  return !error;
}

export async function createMaster(data: Omit<Master, 'id' | 'created_at' | 'rating' | 'review_count'>) {
  const { data: newMaster, error } = await supabase
    .from('masters')
    .insert({ ...data, rating: 5.0, review_count: 0 })
    .select()
    .single();

  if (error) return null;
  return newMaster;
}

export async function deleteMaster(masterId: string) {
  const { error } = await supabase
    .from('masters')
    .delete()
    .eq('id', masterId);

  return !error;
}

// ==================== BOOKINGS ====================

export async function createBooking(data: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'notification_sent'>) {
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({ ...data, notification_sent: false })
    .select()
    .single();

  if (error) return null;

  // Block the time slot in schedule
  await supabase
    .from('schedule')
    .insert({
      salon_id: data.salon_id,
      master_id: data.master_id,
      date: data.date,
      time_start: data.time,
      time_end: calculateEndTime(data.time, data.duration_minutes),
      is_blocked: true,
      blocked_reason: 'booked',
      booking_id: booking.id
    });

  // Send notification to salon owner (async, don't wait)
  try {
    fetch('/api/telegram/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking.id }),
    }).catch(console.error);
  } catch (e) {
    console.error('Failed to send notification:', e);
  }

  return booking;
}

export async function getBookingsBySalon(salonId: string, date?: string) {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      masters (name),
      services (name)
    `)
    .eq('salon_id', salonId)
    .order('date')
    .order('time');

  if (date) {
    query = query.eq('date', date);
  }

  const { data } = await query;
  return data || [];
}

export async function updateBookingStatus(bookingId: string, status: Booking['status']) {
  const { error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId);

  if (status === 'cancelled') {
    // Unblock the time slot
    await supabase
      .from('schedule')
      .delete()
      .eq('booking_id', bookingId);
  }

  return !error;
}

// ==================== SCHEDULE ====================

export async function getAvailableSlots(salonId: string, masterId: string, date: string) {
  // Get blocked slots for this date
  const { data: blocked } = await supabase
    .from('schedule')
    .select('time_start, time_end')
    .eq('salon_id', salonId)
    .eq('master_id', masterId)
    .eq('date', date)
    .eq('is_blocked', true);

  // Get salon working hours
  const { data: salon } = await supabase
    .from('salons')
    .select('working_hours')
    .eq('id', salonId)
    .single();

  // Generate available slots based on working hours minus blocked
  const dayOfWeek = new Date(date).getDay();
  const dayNames = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота'];
  const todayHours = salon?.working_hours?.find((h: any) => h.day === dayNames[dayOfWeek]);

  if (!todayHours || todayHours.hours === 'Зачинено') {
    return [];
  }

  const [start, end] = todayHours.hours.split(' - ');
  const slots = generateTimeSlots(start, end, 30); // 30-minute slots

  // Filter out blocked slots
  return slots.filter(slot => {
    return !blocked?.some(b =>
      slot >= b.time_start && slot < b.time_end
    );
  });
}

// ==================== HELPERS ====================

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

function generateTimeSlots(start: string, end: string, intervalMinutes: number): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  let current = startHour * 60 + startMin;
  const endTotal = endHour * 60 + endMin;

  while (current < endTotal) {
    const hours = Math.floor(current / 60);
    const mins = current % 60;
    slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
    current += intervalMinutes;
  }

  return slots;
}

// ==================== SALON UPDATE ====================

export async function updateSalon(salonId: string, data: Partial<Salon>) {
  const { error } = await supabase
    .from('salons')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', salonId);

  return !error;
}

// ==================== IMAGE UPLOAD ====================

export async function uploadImage(file: File, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) return null;

  const { data: urlData } = supabase.storage
    .from('images')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function deleteImage(path: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from('images')
    .remove([path]);

  return !error;
}
