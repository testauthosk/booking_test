# Налаштування Telegram Bot для сповіщень

## 1. Створення бота

1. Відкрийте Telegram і знайдіть @BotFather
2. Надішліть команду `/newbot`
3. Введіть назву бота (наприклад: `Booking Notifications`)
4. Введіть username бота (наприклад: `booking_salon_bot`)
5. Скопіюйте токен бота (формат: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## 2. Додавання токену в .env.local

Додайте в файл `.env.local`:

```env
TELEGRAM_BOT_TOKEN=ваш_токен_бота
```

## 3. Налаштування вебхука (для продакшену)

Після деплою на Vercel, налаштуйте вебхук:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-domain.vercel.app/api/telegram/webhook"
```

## 4. Підключення власника салону

### Для власника салону:

1. Відкрийте бота в Telegram
2. Натисніть `/start`
3. Натисніть `/id` щоб отримати ваш Chat ID
4. Скопіюйте Chat ID
5. Вставте в налаштуваннях салону (Dashboard -> Налаштування)

### Для адміністратора (в Supabase):

```sql
UPDATE users
SET telegram_chat_id = 'CHAT_ID_HERE', notifications_enabled = true
WHERE id = 'USER_UUID_HERE';
```

## 5. Тестування

1. Зайдіть на сторінку салону
2. Зробіть тестове бронювання
3. Власник салону повинен отримати сповіщення в Telegram

## Команди бота

- `/start` - Показати привітання та інструкції
- `/id` - Отримати Chat ID для налаштування
- `/status` - Перевірити статус підключення

## Типи сповіщень

1. **Нове бронювання** - надсилається власнику при створенні бронювання
2. **Підтвердження** - надсилається клієнту (якщо підключено)
3. **Нагадування** - за 1 годину до візиту
4. **Скасування** - при скасуванні бронювання

## Налаштування cron для нагадувань

Для автоматичних нагадувань за 1 годину до візиту, створіть cron job:

### Vercel Cron (vercel.json):

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

### API Route для нагадувань (src/app/api/cron/reminders/route.ts):

```typescript
// Буде надсилати нагадування за годину до візиту
```

## Troubleshooting

### Бот не відповідає
- Перевірте чи правильний токен в .env.local
- Перевірте чи налаштований вебхук

### Сповіщення не приходять
- Перевірте чи є telegram_chat_id в таблиці users
- Перевірте чи notifications_enabled = true
- Перевірте логи в Vercel
