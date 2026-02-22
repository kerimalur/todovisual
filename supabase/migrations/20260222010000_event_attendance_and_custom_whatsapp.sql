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
end $$;

alter table if exists public.notification_settings
  add column if not exists whatsapp_task_completed_enabled boolean not null default true,
  add column if not exists whatsapp_event_attended_enabled boolean not null default true,
  add column if not exists whatsapp_task_completed_template text not null
    default 'Aufgabe erledigt: "{taskTitle}"\nErledigt am: {completedAt}\nProjekt: {project}\nWichtigkeit: {priority}',
  add column if not exists whatsapp_event_attended_template text not null
    default 'Anwesenheit bestaetigt: "{eventTitle}"\nZeit: {eventStart} - {eventEnd}\nDatum: {eventDate}',
  add column if not exists whatsapp_custom_rules jsonb not null default '[]'::jsonb;
