-- Multi-user migration
-- Run this in Supabase SQL Editor

-- 1. Add user_id to all tables
ALTER TABLE income ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE calendar_config ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Fix unique constraints to be per-user
ALTER TABLE income DROP CONSTRAINT IF EXISTS income_calendar_event_id_key;
DROP INDEX IF EXISTS income_calendar_event_id_idx;
CREATE UNIQUE INDEX IF NOT EXISTS income_user_event_unique ON income(user_id, calendar_event_id);

ALTER TABLE services DROP CONSTRAINT IF EXISTS services_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS services_user_name_unique ON services(user_id, name);

-- 3. Drop old permissive policies
DROP POLICY IF EXISTS "Allow all for service role" ON income;
DROP POLICY IF EXISTS "Allow all for service role" ON expenses;
DROP POLICY IF EXISTS "Allow all for service role" ON calendar_config;
DROP POLICY IF EXISTS "Allow all for service role" ON services;

-- 4. New RLS policies — each user sees only their own data
CREATE POLICY "Users see own income" ON income FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users see own expenses" ON expenses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users see own calendar_config" ON calendar_config FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users see own services" ON services FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Trigger: insert default services when a new user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.services (name, price, color, user_id) VALUES
    ('Fibra aplicação', 55.00, '#ec4899', NEW.id),
    ('Fibra manutenção', 40.00, '#a855f7', NEW.id),
    ('Manutenção gel', 30.00, '#06b6d4', NEW.id),
    ('Verniz gel', 25.00, '#10b981', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Clean up old test data (records with no user_id are invisible anyway)
-- Optionally run these to free space:
-- DELETE FROM income WHERE user_id IS NULL;
-- DELETE FROM expenses WHERE user_id IS NULL;
-- DELETE FROM calendar_config WHERE user_id IS NULL;
-- DELETE FROM services WHERE user_id IS NULL;
