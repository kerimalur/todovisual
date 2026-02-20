-- Initial schema for Productive app (Supabase)
-- Run in Supabase SQL editor or via `supabase db push`

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Core entities
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  color text default '#6366f1',
  category text,
  priority text,
  milestones jsonb not null default '[]'::jsonb,
  motivation text,
  reward text
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  title text not null,
  description text default '',
  deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  start_date timestamptz,
  status text not null default 'planning',
  category text not null default 'other',
  priority text not null default 'medium',
  color text,
  milestones jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  notes text,
  trading_data jsonb,
  fitness_data jsonb,
  finance_data jsonb,
  programming_data jsonb
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  goal_id uuid references public.goals(id) on delete set null,
  parent_task_id uuid references public.tasks(id) on delete set null,
  title text not null,
  description text,
  due_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  priority text not null default 'medium',
  status text not null default 'todo',
  estimated_minutes integer,
  actual_minutes integer,
  tags text[] not null default '{}',
  impact text,
  energy_level text,
  recurring jsonb,
  subtasks jsonb not null default '[]'::jsonb,
  focus_session_ids text[] not null default '{}'
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  all_day boolean not null default false,
  color text,
  task_id uuid references public.tasks(id) on delete set null,
  event_type text,
  is_time_block boolean not null default false,
  linked_task_id uuid references public.tasks(id) on delete set null,
  google_event_id text,
  is_from_google_calendar boolean not null default false,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  content text not null default '',
  mood text,
  tags text[] not null default '{}',
  reflection jsonb,
  completed_tasks integer,
  focus_minutes integer,
  is_weekly_reflection boolean not null default false,
  weekly_reflection jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique(user_id, date)
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz,
  planned_minutes integer not null,
  actual_minutes integer,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.habit_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text not null default '✨',
  color text not null default '#6366f1',
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  icon text,
  color text,
  goal_id uuid references public.goals(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  frequency text not null default 'daily',
  target_per_week integer,
  specific_days integer[] not null default '{}',
  target_value numeric,
  target_unit text,
  reminder_time text,
  reminder_enabled boolean not null default false,
  energy_level text,
  best_time_of_day text,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  total_completions integer not null default 0,
  completions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  is_active boolean not null default true,
  is_paused boolean not null default false,
  paused_until timestamptz,
  motivation text,
  cue text,
  reward text,
  stack_before text,
  stack_after text
);

create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  completion_date date not null,
  value numeric,
  notes text,
  created_at timestamptz not null default now(),
  unique(habit_id, completion_date)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  icon text,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  type text not null default 'note',
  tags text[] not null default '{}',
  color text,
  is_pinned boolean not null default false,
  is_favorite boolean not null default false,
  linked_task_ids text[] not null default '{}',
  linked_goal_ids text[] not null default '{}',
  linked_project_ids text[] not null default '{}',
  is_archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brainstorm_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  ideas jsonb not null default '[]'::jsonb,
  linked_goal_id uuid references public.goals(id) on delete set null,
  linked_project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brainstorm_ideas (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.brainstorm_sessions(id) on delete cascade,
  content text not null,
  color text,
  position jsonb,
  parent_id uuid references public.brainstorm_ideas(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  duration integer,
  is_running boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.weekly_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  went_well text not null,
  could_improve text not null,
  lessons_learned text,
  proud_of text,
  completed_tasks integer not null default 0,
  focus_minutes integer not null default 0,
  habits_completed integer,
  goals_progress jsonb,
  next_week_priorities text[] not null default '{}',
  next_week_goals text[] not null default '{}',
  next_week_plan text not null,
  productivity_rating integer,
  energy_rating integer,
  satisfaction_rating integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique(user_id, week_start)
);

create table if not exists public.daily_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  completed_tasks integer not null default 0,
  focus_minutes integer not null default 0,
  habits_completed integer not null default 0,
  habits_total integer not null default 0,
  tasks_created integer not null default 0,
  productivity_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique(user_id, date)
);

-- Generic index for realtime + filtering
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_goals_user_id on public.goals(user_id);
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_events_user_id on public.calendar_events(user_id);
create index if not exists idx_journal_entries_user_id on public.journal_entries(user_id);
create index if not exists idx_focus_sessions_user_id on public.focus_sessions(user_id);
create index if not exists idx_habits_user_id on public.habits(user_id);
create index if not exists idx_habit_categories_user_id on public.habit_categories(user_id);
create index if not exists idx_tags_user_id on public.tags(user_id);
create index if not exists idx_notes_user_id on public.notes(user_id);
create index if not exists idx_time_entries_user_id on public.time_entries(user_id);
create index if not exists idx_brainstorm_sessions_user_id on public.brainstorm_sessions(user_id);
create index if not exists idx_daily_stats_user_id on public.daily_stats(user_id);
create index if not exists idx_weekly_reflections_user_id on public.weekly_reflections(user_id);
create index if not exists idx_habit_completions_habit_id on public.habit_completions(habit_id);

-- Auto updated_at
create trigger trg_goals_updated_at before update on public.goals
for each row execute function public.set_updated_at();

create trigger trg_projects_updated_at before update on public.projects
for each row execute function public.set_updated_at();

create trigger trg_tasks_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

create trigger trg_calendar_events_updated_at before update on public.calendar_events
for each row execute function public.set_updated_at();

create trigger trg_journal_entries_updated_at before update on public.journal_entries
for each row execute function public.set_updated_at();

create trigger trg_focus_sessions_updated_at before update on public.focus_sessions
for each row execute function public.set_updated_at();

create trigger trg_habits_updated_at before update on public.habits
for each row execute function public.set_updated_at();

create trigger trg_notes_updated_at before update on public.notes
for each row execute function public.set_updated_at();

create trigger trg_brainstorm_sessions_updated_at before update on public.brainstorm_sessions
for each row execute function public.set_updated_at();

create trigger trg_time_entries_updated_at before update on public.time_entries
for each row execute function public.set_updated_at();

create trigger trg_weekly_reflections_updated_at before update on public.weekly_reflections
for each row execute function public.set_updated_at();

create trigger trg_daily_stats_updated_at before update on public.daily_stats
for each row execute function public.set_updated_at();

-- RLS
alter table public.goals enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.calendar_events enable row level security;
alter table public.journal_entries enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.habit_categories enable row level security;
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.tags enable row level security;
alter table public.notes enable row level security;
alter table public.brainstorm_sessions enable row level security;
alter table public.brainstorm_ideas enable row level security;
alter table public.time_entries enable row level security;
alter table public.weekly_reflections enable row level security;
alter table public.daily_stats enable row level security;

create policy "users own goals" on public.goals
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own projects" on public.projects
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own tasks" on public.tasks
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own events" on public.calendar_events
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own journal entries" on public.journal_entries
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own focus sessions" on public.focus_sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own habit categories" on public.habit_categories
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own habits" on public.habits
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own tags" on public.tags
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own notes" on public.notes
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own brainstorm sessions" on public.brainstorm_sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own time entries" on public.time_entries
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own weekly reflections" on public.weekly_reflections
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own daily stats" on public.daily_stats
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own habit completions through habits" on public.habit_completions
for all using (
  exists (
    select 1 from public.habits h
    where h.id = habit_completions.habit_id and h.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.habits h
    where h.id = habit_completions.habit_id and h.user_id = auth.uid()
  )
);

create policy "users own brainstorm ideas through sessions" on public.brainstorm_ideas
for all using (
  exists (
    select 1 from public.brainstorm_sessions s
    where s.id = brainstorm_ideas.session_id and s.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.brainstorm_sessions s
    where s.id = brainstorm_ideas.session_id and s.user_id = auth.uid()
  )
);
