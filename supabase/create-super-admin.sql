-- =====================================================
-- Створення Super Admin аккаунту
-- =====================================================

-- ІНСТРУКЦІЯ:
-- 1. Відкрийте Supabase Dashboard -> Authentication -> Users
-- 2. Натисніть "Add user" -> "Create new user"
-- 3. Email: admin@booking.com (або ваш)
-- 4. Password: admin123456 (або ваш)
-- 5. Скопіюйте ID створеного користувача
-- 6. Замініть 'YOUR_USER_ID_HERE' на цей ID
-- 7. Виконайте SQL в SQL Editor

INSERT INTO users (id, email, role, salon_id, notifications_enabled)
VALUES (
  'YOUR_USER_ID_HERE',  -- <-- ЗАМІНІТЬ на UUID з Authentication
  'admin@booking.com',  -- <-- ЗАМІНІТЬ на ваш email
  'super_admin',
  NULL,
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  salon_id = NULL;

-- =====================================================
-- Також прив'яжіть власника до тестового салону:
-- =====================================================

-- 1. Спочатку створіть акаунт для salon owner:
--    Authentication -> Add user
--    Email: owner@mia-beauty.com
--    Password: owner123456

-- 2. Замініть ID та виконайте:
/*
INSERT INTO users (id, email, role, salon_id, notifications_enabled)
VALUES (
  'OWNER_USER_ID_HERE',
  'owner@mia-beauty.com',
  'salon_owner',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- ID тестового салону з seed.sql
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = 'salon_owner',
  salon_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Оновіть салон з owner_id:
UPDATE salons
SET owner_id = 'OWNER_USER_ID_HERE'
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
*/
