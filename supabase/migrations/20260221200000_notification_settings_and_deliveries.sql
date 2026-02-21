-- Notification settings + delivery logs for server-side reminder cron jobs

create table if not exists public.notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  whatsapp_reminders_enabled boolean not null default false,
  whatsapp_phone_number text,
  whatsapp_task_created_enabled boolean not null default true,
  whatsapp_task_start_reminder_enabled boolean not null default true,
  whatsapp_weekly_review_enabled boolean not null default true,
  whatsapp_weekly_review_time text not null default '22:00',
  week_starts_on_monday boolean not null default true,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null,
  event_key text not null,
  status text not null default 'sent',
  meta jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique(channel, event_key)
);

create index if not exists idx_notification_deliveries_user_id on public.notification_deliveries(user_id);
create index if not exists idx_notification_settings_whatsapp_enabled
  on public.notification_settings(whatsapp_reminders_enabled, whatsapp_task_start_reminder_enabled);
create index if not exists idx_tasks_user_status_due_date on public.tasks(user_id, status, due_date);

drop trigger if exists trg_notification_settings_updated_at on public.notification_settings;
create trigger trg_notification_settings_updated_at before update on public.notification_settings
for each row execute function public.set_updated_at();

drop trigger if exists trg_notification_deliveries_updated_at on public.notification_deliveries;
create trigger trg_notification_deliveries_updated_at before update on public.notification_deliveries
for each row execute function public.set_updated_at();

alter table public.notification_settings enable row level security;
alter table public.notification_deliveries enable row level security;

drop policy if exists "users own notification settings" on public.notification_settings;
create policy "users own notification settings" on public.notification_settings
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users own notification deliveries read" on public.notification_deliveries;
create policy "users own notification deliveries read" on public.notification_deliveries
for select using (auth.uid() = user_id);
