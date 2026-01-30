// Telegram Bot Integration
// This module handles sending notifications via Telegram

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

interface TelegramMessageOptions {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
}

// Send a message via Telegram
export async function sendTelegramMessage(options: TelegramMessageOptions): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: options.chatId,
        text: options.text,
        parse_mode: options.parseMode || 'HTML',
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API error:', data);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

// Format booking notification message
export function formatBookingNotification(booking: {
  clientName: string;
  clientPhone: string;
  serviceName: string;
  masterName?: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  salonName: string;
}): string {
  const dateFormatted = new Date(booking.date).toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return `
🔔 <b>Нове бронювання!</b>

📍 <b>${booking.salonName}</b>

👤 <b>Клієнт:</b> ${booking.clientName}
📞 <b>Телефон:</b> ${booking.clientPhone}

💇 <b>Послуга:</b> ${booking.serviceName}
${booking.masterName ? `👨‍💼 <b>Майстер:</b> ${booking.masterName}` : ''}

📅 <b>Дата:</b> ${dateFormatted}
⏰ <b>Час:</b> ${booking.time}
⏱ <b>Тривалість:</b> ${booking.duration} хв
💰 <b>Вартість:</b> ${booking.price} ₴

<i>Перегляньте деталі в панелі управління</i>
`.trim();
}

// Format booking confirmation for client
export function formatClientConfirmation(booking: {
  clientName: string;
  serviceName: string;
  masterName?: string;
  date: string;
  time: string;
  salonName: string;
  salonAddress: string;
}): string {
  const dateFormatted = new Date(booking.date).toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return `
✅ <b>Бронювання підтверджено!</b>

📍 <b>${booking.salonName}</b>
📍 ${booking.salonAddress}

💇 <b>Послуга:</b> ${booking.serviceName}
${booking.masterName ? `👨‍💼 <b>Майстер:</b> ${booking.masterName}` : ''}
📅 <b>Дата:</b> ${dateFormatted}
⏰ <b>Час:</b> ${booking.time}

<i>Чекаємо на вас!</i>
`.trim();
}

// Format reminder notification (sent 1 hour before)
export function formatReminderNotification(booking: {
  clientName: string;
  serviceName: string;
  time: string;
  salonName: string;
  salonAddress: string;
}): string {
  return `
⏰ <b>Нагадування про візит</b>

Привіт, ${booking.clientName}!

Через 1 годину у вас запис:
📍 <b>${booking.salonName}</b>
💇 <b>Послуга:</b> ${booking.serviceName}
⏰ <b>Час:</b> ${booking.time}

📍 Адреса: ${booking.salonAddress}

<i>До зустрічі!</i>
`.trim();
}

// Format booking cancellation
export function formatCancellationNotification(booking: {
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  salonName: string;
}): string {
  const dateFormatted = new Date(booking.date).toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return `
❌ <b>Бронювання скасовано</b>

📍 <b>${booking.salonName}</b>

👤 <b>Клієнт:</b> ${booking.clientName}
💇 <b>Послуга:</b> ${booking.serviceName}
📅 <b>Дата:</b> ${dateFormatted}
⏰ <b>Час:</b> ${booking.time}
`.trim();
}

// Notify salon owner about new booking
export async function notifySalonOwner(
  ownerChatId: string,
  booking: {
    clientName: string;
    clientPhone: string;
    serviceName: string;
    masterName?: string;
    date: string;
    time: string;
    duration: number;
    price: number;
    salonName: string;
  }
): Promise<boolean> {
  const message = formatBookingNotification(booking);
  return sendTelegramMessage({
    chatId: ownerChatId,
    text: message,
  });
}
