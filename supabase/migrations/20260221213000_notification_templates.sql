alter table if exists public.notification_settings
  add column if not exists whatsapp_task_created_template text not null
    default 'Neue Aufgabe gespeichert: "{taskTitle}"\nStart: {startAt}\nProjekt: {project}\nWichtigkeit: {priority}',
  add column if not exists whatsapp_task_start_template text not null
    default 'Start in 1 Stunde: "{taskTitle}"\nBeginn: {startAt}\nProjekt: {project}\nWichtigkeit: {priority}',
  add column if not exists whatsapp_weekly_review_template text not null
    default 'Wochenrueckblick ({weekRange})\n\n{review}';
