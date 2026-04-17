-- =============================================
-- NAILS FINANCE APP - Supabase Schema
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- SERVICES TABLE
-- Serviços e preços configuráveis
-- =============================================
create table if not exists services (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  price decimal(10,2) not null default 0,
  color text not null default '#ec4899',
  active boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Default services (os 4 serviços da manicure)
insert into services (name, price, color) values
  ('Fibra aplicação', 55.00, '#ec4899'),
  ('Fibra manutenção', 40.00, '#a855f7'),
  ('Manutenção gel', 30.00, '#06b6d4'),
  ('Verniz gel', 25.00, '#10b981')
on conflict (name) do nothing;

-- =============================================
-- INCOME TABLE
-- Receitas sincronizadas do Google Calendar
-- =============================================
create table if not exists income (
  id uuid default uuid_generate_v4() primary key,
  calendar_event_id text unique,
  service_name text not null,
  service_id uuid references services(id) on delete set null,
  amount decimal(10,2) not null,
  date date not null,
  client_name text,
  notes text,
  created_at timestamp with time zone default now()
);

create index if not exists income_date_idx on income(date);
create index if not exists income_calendar_event_id_idx on income(calendar_event_id);

-- =============================================
-- EXPENSES TABLE
-- Despesas manuais ou via foto de fatura
-- =============================================
create table if not exists expenses (
  id uuid default uuid_generate_v4() primary key,
  date date not null,
  amount decimal(10,2) not null,
  category text not null,
  description text,
  receipt_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists expenses_date_idx on expenses(date);

-- =============================================
-- CALENDAR SYNC TABLE
-- Guarda tokens OAuth do Google Calendar
-- =============================================
create table if not exists calendar_config (
  id uuid default uuid_generate_v4() primary key,
  calendar_id text,
  access_token text,
  refresh_token text,
  token_expiry timestamp with time zone,
  last_sync timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger services_updated_at
  before update on services
  for each row execute function update_updated_at();

create trigger expenses_updated_at
  before update on expenses
  for each row execute function update_updated_at();

create trigger calendar_config_updated_at
  before update on calendar_config
  for each row execute function update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- A app usa service_role key no servidor,
-- então RLS pode ser permissivo no protótipo
-- =============================================
alter table services enable row level security;
alter table income enable row level security;
alter table expenses enable row level security;
alter table calendar_config enable row level security;

-- Policies: permitir tudo via service_role (server-side)
create policy "Allow all for service role" on services for all using (true);
create policy "Allow all for service role" on income for all using (true);
create policy "Allow all for service role" on expenses for all using (true);
create policy "Allow all for service role" on calendar_config for all using (true);
