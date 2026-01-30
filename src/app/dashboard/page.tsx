"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  Loader2,
  LogOut,
  Store,
  Calendar,
  Settings,
  Users,
  Star,
  ExternalLink,
  Save,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Phone,
  Mail,
  MapPin,
  X,
  Upload,
  AlertTriangle,
} from 'lucide-react';

interface SalonData {
  id: string;
  slug: string;
  name: string;
  type: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  short_address: string;
  photos: string[];
  working_hours: { day: string; hours: string }[];
  amenities: string[];
  rating: number;
  review_count: number;
  is_active: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  const [salon, setSalon] = useState<SalonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Load salon data
  useEffect(() => {
    if (user?.salon_id) {
      loadSalon();
    } else if (user && !user.salon_id) {
      setLoading(false);
    }
  }, [user]);

  const loadSalon = async () => {
    if (!user?.salon_id) return;

    const { data } = await supabase
      .from('salons')
      .select('*')
      .eq('id', user.salon_id)
      .single();

    if (data) {
      setSalon(data);
    }
    setLoading(false);
  };

  const saveSalon = async (updates: Partial<SalonData>) => {
    if (!salon) return;

    setSaving(true);
    const { error } = await supabase
      .from('salons')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', salon.id);

    if (!error) {
      setSalon({ ...salon, ...updates });
      setSuccessMessage('Зміни збережено!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Salon is deactivated by admin
  if (salon && !salon.is_active) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Акаунт деактивовано</h1>
          <p className="text-gray-500 mb-6">
            Ваш салон тимчасово вимкнено адміністратором. Зверніться до підтримки для відновлення доступу.
          </p>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Вийти
          </Button>
        </div>
      </div>
    );
  }

  // No salon assigned
  if (!salon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <Store className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Салон не призначено</h1>
          <p className="text-gray-500 mb-6">
            Ваш акаунт ще не прив'язаний до салону. Зверніться до адміністратора.
          </p>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Вийти
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">booking</h1>
          <p className="text-gray-400 text-sm mt-1">Панель управління</p>
        </div>

        <nav className="mt-4">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${
              activeTab === 'general' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Store className="w-5 h-5" />
            <span>Загальне</span>
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${
              activeTab === 'services' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Послуги</span>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${
              activeTab === 'team' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Команда</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${
              activeTab === 'schedule' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>Графік роботи</span>
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${
              activeTab === 'bookings' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>Бронювання</span>
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <a
            href={`/salon/${salon.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 mb-3 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Переглянути сайт
          </a>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
              <p className="text-xs text-gray-400">Власник салону</p>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Вийти
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fadeIn">
            {successMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{salon.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{salon.rating}</span>
              <span className="text-gray-400">({salon.review_count} відгуків)</span>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <GeneralTab salon={salon} onSave={saveSalon} saving={saving} />
        )}

        {activeTab === 'services' && (
          <ServicesTab salonId={salon.id} />
        )}

        {activeTab === 'team' && (
          <TeamTab salonId={salon.id} />
        )}

        {activeTab === 'schedule' && (
          <ScheduleTab salon={salon} onSave={saveSalon} saving={saving} />
        )}

        {activeTab === 'bookings' && (
          <BookingsTab salonId={salon.id} />
        )}
      </main>
    </div>
  );
}

// General Tab Component
function GeneralTab({
  salon,
  onSave,
  saving,
}: {
  salon: SalonData;
  onSave: (data: Partial<SalonData>) => Promise<void>;
  saving: boolean;
}) {
  const [name, setName] = useState(salon.name);
  const [type, setType] = useState(salon.type || '');
  const [description, setDescription] = useState(salon.description || '');
  const [phone, setPhone] = useState(salon.phone || '');
  const [email, setEmail] = useState(salon.email || '');
  const [address, setAddress] = useState(salon.address || '');
  const [shortAddress, setShortAddress] = useState(salon.short_address || '');

  const handleSave = () => {
    onSave({
      name,
      type,
      description,
      phone,
      email,
      address,
      short_address: shortAddress,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Основна інформація</h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Назва салону</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Тип закладу</label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Наприклад: Перукарня, Салон краси"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Опис</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Розкажіть про ваш салон..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Контакти та адреса</h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Phone className="w-4 h-4 inline mr-1" />
              Телефон
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+380 XX XXX XXXX"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="salon@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <MapPin className="w-4 h-4 inline mr-1" />
              Повна адреса
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="вул. Хрещатик 22, офіс 15, Київ, 01001"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Коротка адреса (для відображення)
            </label>
            <input
              type="text"
              value={shortAddress}
              onChange={(e) => setShortAddress(e.target.value)}
              placeholder="вул. Хрещатик 22"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-gray-900 hover:bg-gray-800">
          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          Зберегти зміни
        </Button>
      </div>
    </div>
  );
}

// Schedule Tab Component
function ScheduleTab({
  salon,
  onSave,
  saving,
}: {
  salon: SalonData;
  onSave: (data: Partial<SalonData>) => Promise<void>;
  saving: boolean;
}) {
  const [workingHours, setWorkingHours] = useState(
    salon.working_hours || [
      { day: 'Понеділок', hours: 'Зачинено' },
      { day: 'Вівторок', hours: '10:00 - 20:00' },
      { day: 'Середа', hours: '10:00 - 20:00' },
      { day: 'Четвер', hours: '10:00 - 20:00' },
      { day: "П'ятниця", hours: '10:00 - 20:00' },
      { day: 'Субота', hours: '09:00 - 18:00' },
      { day: 'Неділя', hours: '09:00 - 17:00' },
    ]
  );

  const updateHours = (index: number, hours: string) => {
    const updated = [...workingHours];
    updated[index] = { ...updated[index], hours };
    setWorkingHours(updated);
  };

  const handleSave = () => {
    onSave({ working_hours: workingHours });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Графік роботи</h3>

        <div className="space-y-4">
          {workingHours.map((item, index) => (
            <div key={item.day} className="flex items-center gap-4">
              <span className="w-32 text-gray-700 font-medium">{item.day}</span>
              <input
                type="text"
                value={item.hours}
                onChange={(e) => updateHours(index, e.target.value)}
                placeholder="10:00 - 20:00 або Зачинено"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
              />
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-400 mt-4">
          Формат: "10:00 - 20:00" або "Зачинено"
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-gray-900 hover:bg-gray-800">
          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          Зберегти графік
        </Button>
      </div>
    </div>
  );
}

// Placeholder components for other tabs
function ServicesTab({ salonId }: { salonId: string }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const { data: cats } = await supabase
      .from('service_categories')
      .select('*')
      .eq('salon_id', salonId)
      .order('sort_order');

    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('salon_id', salonId)
      .order('sort_order');

    if (cats) {
      setCategories(cats.map(cat => ({
        ...cat,
        items: (services || []).filter(s => s.category_id === cat.id)
      })));
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category.id} className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{category.name}</h3>
          <div className="space-y-3">
            {category.items.map((service: any) => (
              <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-500">{service.duration}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900">
                    {service.price_from && 'від '}{service.price} ₴
                  </span>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button className="bg-gray-900 hover:bg-gray-800">
        <Plus className="w-4 h-4 mr-2" />
        Додати послугу
      </Button>
    </div>
  );
}

function TeamTab({ salonId }: { salonId: string }) {
  const [masters, setMasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMasters();
  }, []);

  const loadMasters = async () => {
    const { data } = await supabase
      .from('masters')
      .select('*')
      .eq('salon_id', salonId)
      .order('sort_order');

    if (data) setMasters(data);
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {masters.map((master) => (
          <div key={master.id} className="bg-white rounded-xl border border-gray-100 p-6 flex gap-4">
            <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden">
              {master.avatar && (
                <Image src={master.avatar} alt={master.name} width={80} height={80} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{master.name}</h4>
              <p className="text-sm text-gray-500">{master.role}</p>
              <div className="flex items-center gap-2 mt-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{master.rating}</span>
                <span className="text-gray-400">({master.review_count})</span>
              </div>
            </div>
            <button className="self-start p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Button className="bg-gray-900 hover:bg-gray-800">
        <Plus className="w-4 h-4 mr-2" />
        Додати майстра
      </Button>
    </div>
  );
}

function BookingsTab({ salonId }: { salonId: string }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        masters (name),
        services (name)
      `)
      .eq('salon_id', salonId)
      .order('date', { ascending: false })
      .order('time', { ascending: false })
      .limit(50);

    if (data) setBookings(data);
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Бронювання</h3>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Поки немає бронювань</p>
        </div>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Клієнт</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Послуга</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Майстер</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Дата/час</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{booking.client_name}</p>
                  <p className="text-sm text-gray-500">{booking.client_phone}</p>
                </td>
                <td className="px-6 py-4 text-gray-900">{booking.services?.name}</td>
                <td className="px-6 py-4 text-gray-900">{booking.masters?.name}</td>
                <td className="px-6 py-4">
                  <p className="text-gray-900">{new Date(booking.date).toLocaleDateString('uk-UA')}</p>
                  <p className="text-sm text-gray-500">{booking.time}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                    booking.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                    booking.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                    'bg-gray-50 text-gray-700'
                  }`}>
                    {booking.status === 'confirmed' ? 'Підтверджено' :
                     booking.status === 'pending' ? 'Очікує' :
                     booking.status === 'cancelled' ? 'Скасовано' :
                     booking.status === 'completed' ? 'Завершено' : booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
