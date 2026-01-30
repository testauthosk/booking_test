"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Plus,
  Power,
  PowerOff,
  ExternalLink,
  Users,
  Calendar,
  Store,
  LogOut,
  Settings,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  Edit,
  Copy,
} from 'lucide-react';

interface SalonData {
  id: string;
  slug: string;
  name: string;
  type: string;
  is_active: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  owner_email?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut, isSuperAdmin } = useAuth();

  const [salons, setSalons] = useState<SalonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewSalonModal, setShowNewSalonModal] = useState(false);

  // Redirect if not super admin
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isSuperAdmin) {
      router.push('/dashboard');
    }
  }, [authLoading, user, isSuperAdmin, router]);

  // Load salons
  useEffect(() => {
    if (isSuperAdmin) {
      loadSalons();
    }
  }, [isSuperAdmin]);

  const loadSalons = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('salons')
      .select(`
        id, slug, name, type, is_active, rating, review_count, created_at, owner_id,
        users!salons_owner_id_fkey (email)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setSalons(data.map((s: any) => ({
        ...s,
        owner_email: s.users?.email || null,
      })));
    }
    setLoading(false);
  };

  const toggleSalonStatus = async (salonId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('salons')
      .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
      .eq('id', salonId);

    if (!error) {
      setSalons(salons.map(s =>
        s.id === salonId ? { ...s, is_active: !currentStatus } : s
      ));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const filteredSalons = salons.filter(salon =>
    salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    salon.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    salon.owner_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h1 className="text-xl font-bold">booking</h1>
          <p className="text-gray-400 text-sm mt-1">Super Admin</p>
        </div>

        <nav className="mt-4">
          <a href="/admin" className="flex items-center gap-3 px-6 py-3 bg-gray-800 text-white">
            <Store className="w-5 h-5" />
            <span>Салони</span>
          </a>
          <a href="/admin/users" className="flex items-center gap-3 px-6 py-3 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
            <Users className="w-5 h-5" />
            <span>Користувачі</span>
          </a>
          <a href="/admin/bookings" className="flex items-center gap-3 px-6 py-3 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
            <Calendar className="w-5 h-5" />
            <span>Бронювання</span>
          </a>
          <a href="/admin/settings" className="flex items-center gap-3 px-6 py-3 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
            <span>Налаштування</span>
          </a>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-gray-400">Super Admin</p>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Вийти
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Салони</h2>
            <p className="text-gray-500 mt-1">Управління всіма салонами платформи</p>
          </div>
          <Button
            onClick={() => setShowNewSalonModal(true)}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Додати салон
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{salons.length}</p>
                <p className="text-gray-500 text-sm">Всього салонів</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Power className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {salons.filter(s => s.is_active).length}
                </p>
                <p className="text-gray-500 text-sm">Активних</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <PowerOff className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {salons.filter(s => !s.is_active).length}
                </p>
                <p className="text-gray-500 text-sm">Вимкнених</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {salons.filter(s => s.owner_email).length}
                </p>
                <p className="text-gray-500 text-sm">З власниками</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-100 mb-6">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Пошук за назвою, slug або email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Салон</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Власник</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Рейтинг</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Статус</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Дата</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSalons.map((salon) => (
                  <tr key={salon.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{salon.name}</p>
                        <p className="text-sm text-gray-500">{salon.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {salon.owner_email ? (
                        <span className="text-gray-900">{salon.owner_email}</span>
                      ) : (
                        <span className="text-gray-400 italic">Не призначено</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-900">{salon.rating}</span>
                        <span className="text-gray-400">({salon.review_count})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSalonStatus(salon.id, salon.is_active)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          salon.is_active
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {salon.is_active ? (
                          <>
                            <Power className="w-3.5 h-3.5" />
                            Активний
                          </>
                        ) : (
                          <>
                            <PowerOff className="w-3.5 h-3.5" />
                            Вимкнено
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(salon.created_at).toLocaleDateString('uk-UA')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/salon/${salon.slug}`}
                          target="_blank"
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          title="Переглянути"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/salon/${salon.slug}`)}
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          title="Копіювати посилання"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a
                          href={`/admin/salons/${salon.id}`}
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          title="Редагувати"
                        >
                          <Edit className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSalons.length === 0 && (
              <div className="text-center py-12">
                <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery ? 'Салонів не знайдено' : 'Ще немає салонів'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Salon Modal */}
      {showNewSalonModal && (
        <NewSalonModal
          onClose={() => setShowNewSalonModal(false)}
          onCreated={() => {
            setShowNewSalonModal(false);
            loadSalons();
          }}
        />
      )}
    </div>
  );
}

// New Salon Modal Component
function NewSalonModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create salon
      const { data: salon, error: salonError } = await supabase
        .from('salons')
        .insert({
          name,
          slug,
          type: 'Салон краси',
          is_active: true,
        })
        .select()
        .single();

      if (salonError) throw new Error(salonError.message);

      // 2. If owner email provided, create user account
      if (ownerEmail && ownerPassword) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: ownerEmail,
          password: ownerPassword,
        });

        if (authError) throw new Error(authError.message);

        if (authData.user) {
          // Create user profile
          await supabase.from('users').insert({
            id: authData.user.id,
            email: ownerEmail,
            role: 'salon_owner',
            salon_id: salon.id,
          });

          // Link salon to owner
          await supabase
            .from('salons')
            .update({ owner_id: authData.user.id })
            .eq('id', salon.id);
        }
      }

      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Новий салон</h3>
          <p className="text-gray-500 text-sm mt-1">Створіть новий салон та призначте власника</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Назва салону *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Наприклад: Beauty Studio"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              URL (slug) *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">/salon/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="beauty-studio"
                required
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Власник (опціонально)
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Email власника</label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="owner@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Пароль власника</label>
                <input
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Мінімум 6 символів"
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-900 hover:bg-gray-800"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Створити'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
