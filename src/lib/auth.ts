import { supabase } from './supabase';

export type UserRole = 'super_admin' | 'salon_owner';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  salon_id: string | null;
  telegram_chat_id: string | null;
  notifications_enabled: boolean;
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return { user: profile as AuthUser | null, error: null };
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return !error;
}

// Get current user with profile
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile as AuthUser | null;
}

// Check if user is super admin
export async function isSuperAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'super_admin';
}

// Check if user owns a specific salon
export async function ownsSalon(salonId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return user.salon_id === salonId;
}

// Create new salon owner account (super admin only)
export async function createSalonOwner(
  email: string,
  password: string,
  salonId: string
): Promise<{ success: boolean; error?: string }> {
  // This should be called from a server action/API route with service role key
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email,
        role: 'salon_owner',
        salon_id: salonId,
      });

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // Link salon to owner
    await supabase
      .from('salons')
      .update({ owner_id: data.user.id })
      .eq('id', salonId);
  }

  return { success: true };
}

// Check salon is active (for public pages)
export async function isSalonActive(salonId: string): Promise<boolean> {
  const { data } = await supabase
    .from('salons')
    .select('is_active')
    .eq('id', salonId)
    .single();

  return data?.is_active ?? false;
}

// Check salon is active by slug (for public pages)
export async function isSalonActiveBySlug(slug: string): Promise<boolean> {
  const { data } = await supabase
    .from('salons')
    .select('is_active')
    .eq('slug', slug)
    .single();

  return data?.is_active ?? false;
}

// Toggle salon active status (super admin only)
export async function toggleSalonActive(salonId: string, isActive: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('salons')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', salonId);

  return !error;
}

// Get all salons (super admin only)
export async function getAllSalons() {
  const { data } = await supabase
    .from('salons')
    .select(`
      *,
      users!salons_owner_id_fkey (email)
    `)
    .order('created_at', { ascending: false });

  return data || [];
}
