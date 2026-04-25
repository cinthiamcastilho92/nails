-- Tabela para rate limiting do login
create table if not exists login_attempts (
  id uuid default uuid_generate_v4() primary key,
  ip text not null,
  attempted_at timestamp with time zone default now()
);

create index if not exists login_attempts_ip_idx on login_attempts(ip);
create index if not exists login_attempts_time_idx on login_attempts(attempted_at);

-- Limpa tentativas antigas automaticamente (mais de 1 hora)
create or replace function cleanup_old_login_attempts()
returns void as $$
begin
  delete from login_attempts where attempted_at < now() - interval '1 hour';
end;
$$ language plpgsql;

-- Permite tudo via service_role
alter table login_attempts enable row level security;
create policy "Allow all for service role" on login_attempts for all using (true);
