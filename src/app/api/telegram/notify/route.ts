import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramMessage, formatBookingNotification } from '@/lib/telegram';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Get booking details with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        salons (name, owner_id),
        services (name),
        masters (name)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get salon owner's telegram chat ID
    const { data: owner } = await supabase
      .from('users')
      .select('telegram_chat_id, notifications_enabled')
      .eq('id', booking.salons.owner_id)
      .single();

    if (!owner?.telegram_chat_id || !owner.notifications_enabled) {
      return NextResponse.json({
        ok: true,
        message: 'Owner has not enabled notifications'
      });
    }

    // Send notification
    const message = formatBookingNotification({
      clientName: booking.client_name,
      clientPhone: booking.client_phone,
      serviceName: booking.services.name,
      masterName: booking.masters?.name,
      date: booking.date,
      time: booking.time,
      duration: booking.duration_minutes,
      price: booking.price,
      salonName: booking.salons.name,
    });

    const sent = await sendTelegramMessage({
      chatId: owner.telegram_chat_id,
      text: message,
    });

    if (sent) {
      // Mark notification as sent
      await supabase
        .from('bookings')
        .update({ notification_sent: true })
        .eq('id', bookingId);
    }

    return NextResponse.json({ ok: true, sent });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
