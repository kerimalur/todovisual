alter table if exists public.notification_settings
  add column if not exists profile_name text not null default '',
  add column if not exists profile_email text not null default '',
  add column if not exists sms_reminders_enabled boolean not null default false,
  add column if not exists sms_phone_number text,
  add column if not exists sms_lead_minutes integer not null default 30,
  add column if not exists settings_snapshot jsonb not null default '{}'::jsonb;

do $$
begin
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

create index if not exists idx_notification_settings_sms_enabled
  on public.notification_settings(sms_reminders_enabled);
