-- =========================
-- Habits Huntrix: Schema & Policies
-- =========================

create extension if not exists pgcrypto;

create type habit_status as enum ('yes','no','exception');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  nickname text,
  created_at timestamptz default now()
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  sort_order int default 0,
  created_at timestamptz default now()
);
create index if not exists habits_user_idx on habits(user_id);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  log_date date not null,
  status habit_status not null,
  points int not null default 0,
  note text,
  created_at timestamptz default now(),
  unique(user_id, habit_id, log_date)
);
create index if not exists habit_logs_user_date_idx on habit_logs(user_id, log_date);

create table if not exists points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  source text not null check (source in ('habit','streak7','manual')),
  related_habit uuid references habits(id) on delete set null,
  amount int not null,
  meta jsonb,
  awarded_for_date date,
  created_at timestamptz default now()
);
create index if not exists points_ledger_user_idx on points_ledger(user_id, created_at);

create table if not exists streak_awards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  streak_end_date date not null,
  created_at timestamptz default now(),
  unique(user_id, habit_id, streak_end_date)
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  habit_id uuid references habits(id) on delete cascade,
  channel text not null check (channel in ('email','push')),
  time_local time not null,
  days smallint[] not null default '{1,2,3,4,5,6,0}',
  enabled boolean not null default true,
  created_at timestamptz default now()
);
create index if not exists reminders_user_idx on reminders(user_id);

create table if not exists app_settings (
  user_id uuid primary key references profiles(id) on delete cascade,
  weekly_email_enabled boolean not null default true,
  timezone text not null default 'Asia/Kolkata'
);

alter table profiles enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table points_ledger enable row level security;
alter table streak_awards enable row level security;
alter table reminders enable row level security;
alter table app_settings enable row level security;

create policy select_own_profile on profiles for select using (id = auth.uid());
create policy update_own_profile on profiles for update using (id = auth.uid());

create policy crud_own_habits on habits for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy crud_own_logs on habit_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy crud_own_points on points_ledger for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy crud_own_streak_awards on streak_awards for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy crud_own_reminders on reminders for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy crud_own_settings on app_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function set_log_points()
returns trigger as $$
begin
  new.points := case new.status
    when 'yes' then 20
    when 'exception' then 10
    else 0
  end;
  return new;
end; $$ language plpgsql;

drop trigger if exists habit_logs_points_trg on habit_logs;
create trigger habit_logs_points_trg
before insert or update of status on habit_logs
for each row execute function set_log_points();

-- Optional seed block (uncomment to run once)
-- insert into app_settings (user_id) select id from profiles on conflict (user_id) do nothing;
-- insert into habits (user_id, name, sort_order) select id, 'Getting ready for school on time', 1 from profiles;
-- insert into habits (user_id, name, sort_order) select id, 'Sleep on time', 2 from profiles;
-- insert into habits (user_id, name, sort_order) select id, 'High-quality brushing', 3 from profiles;
-- insert into habits (user_id, name, sort_order) select id, 'High-quality bath', 4 from profiles;
-- insert into habits (user_id, name, sort_order) select id, 'Do one good thing', 5 from profiles;
-- insert into habits (user_id, name, sort_order) select id, 'Show respect to elders', 6 from profiles;
