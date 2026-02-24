-- Consolidated notification-related schema updates.
-- Safe to run multiple times due IF NOT EXISTS / guard checks.

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

alter table if exists public.notification_settings
  add column if not exists whatsapp_task_created_template text not null
    default 'Neue Aufgabe gespeichert: "{taskTitle}"\nStart: {startAt}\nProjekt: {project}\nWichtigkeit: {priority}',
  add column if not exists whatsapp_task_start_template text not null
    default 'Start in 1 Stunde: "{taskTitle}"\nBeginn: {startAt}\nProjekt: {project}\nWichtigkeit: {priority}',
  add column if not exists whatsapp_weekly_review_template text not null
    default 'Wochenrueckblick ({weekRange})\n\n{review}',
  add column if not exists whatsapp_task_completed_enabled boolean not null default true,
  add column if not exists whatsapp_event_attended_enabled boolean not null default true,
  add column if not exists whatsapp_task_completed_template text not null
    default 'Aufgabe erledigt: "{taskTitle}"\nErledigt am: {completedAt}\nProjekt: {project}\nWichtigkeit: {priority}',
  add column if not exists whatsapp_event_attended_template text not null
    default 'Anwesenheit bestaetigt: "{eventTitle}"\nZeit: {eventStart} - {eventEnd}\nDatum: {eventDate}',
  add column if not exists whatsapp_custom_rules jsonb not null default '[]'::jsonb,
  add column if not exists profile_name text not null default '',
  add column if not exists profile_email text not null default '',
  add column if not exists sms_reminders_enabled boolean not null default false,
  add column if not exists sms_phone_number text,
  add column if not exists sms_lead_minutes integer not null default 30,
  add column if not exists settings_snapshot jsonb not null default '{}'::jsonb;

alter table if exists public.calendar_events
  add column if not exists attendance_status text not null default 'planned',
  add column if not exists attended_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'calendar_events_attendance_status_check'
  ) then
    alter table public.calendar_events
      add constraint calendar_events_attendance_status_check
      check (attendance_status in ('planned', 'attended'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'notification_settings_sms_lead_minutes_check'
  ) then
    alter table public.notification_settings
      add constraint notification_settings_sms_lead_minutes_check
      check (sms_lead_minutes >= 0 and sms_lead_minutes <= 720);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'notification_settings_settings_snapshot_object_check'
  ) then
    alter table public.notification_settings
      add constraint notification_settings_settings_snapshot_object_check
      check (jsonb_typeof(settings_snapshot) = 'object');
  end if;
end $$;

create index if not exists idx_notification_deliveries_user_id
  on public.notification_deliveries(user_id);
create index if not exists idx_notification_settings_whatsapp_enabled
  on public.notification_settings(whatsapp_reminders_enabled, whatsapp_task_start_reminder_enabled);
create index if not exists idx_notification_settings_sms_enabled
  on public.notification_settings(sms_reminders_enabled);
create index if not exists idx_tasks_user_status_due_date
  on public.tasks(user_id, status, due_date);

drop trigger if exists trg_notification_settings_updated_at on public.notification_settings;
create trigger trg_notification_settings_updated_at
before update on public.notification_settings
for each row execute function public.set_updated_at();

drop trigger if exists trg_notification_deliveries_updated_at on public.notification_deliveries;
create trigger trg_notification_deliveries_updated_at
before update on public.notification_deliveries
for each row execute function public.set_updated_at();

alter table public.notification_settings enable row level security;
alter table public.notification_deliveries enable row level security;

drop policy if exists "users own notification settings" on public.notification_settings;
create policy "users own notification settings" on public.notification_settings
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users own notification deliveries read" on public.notification_deliveries;
create policy "users own notification deliveries read" on public.notification_deliveries
for select using (auth.uid() = user_id);
