-- Workflow and linkage upgrade:
-- - Goals: SMART + weekly plan support
-- - Projects: timeline-first workflow support
-- - Tasks/Projects: multi-link support for goals/projects

alter table if exists public.goals
  add column if not exists smart_criteria jsonb not null default '{}'::jsonb,
  add column if not exists weekly_plan jsonb not null default '[]'::jsonb,
  add column if not exists workflow_mode text not null default 'smart-hybri';

alter table if exists public.projects
  add column if not exists goal_ids uuid[] not null default '{}',
  add column if not exists timeline_phases jsonb not null default '[]'::jsonb,
  add column if not exists workflow_mode text not null default 'timeline',
  add column if not exists review_cadence text not null default 'weekly',
  add column if not exists risk_level text not null default 'medium';

alter table if exists public.tasks
  add column if not exists goal_ids uuid[] not null default '{}',
  add column if not exists project_ids uuid[] not null default '{}';

-- Backfill arrays from existing single-link columns
update public.tasks
set goal_ids = array[goal_id]::uuid[]
where goal_id is not null
  and coalesce(array_length(goal_ids, 1), 0) = 0;

update public.tasks
set project_ids = array[project_id]::uuid[]
where project_id is not null
  and coalesce(array_length(project_ids, 1), 0) = 0;

update public.projects
set goal_ids = array[goal_id]::uuid[]
where goal_id is not null
  and coalesce(array_length(goal_ids, 1), 0) = 0;

create index if not exists idx_tasks_goal_ids on public.tasks using gin(goal_ids);
create index if not exists idx_tasks_project_ids on public.tasks using gin(project_ids);
create index if not exists idx_projects_goal_ids on public.projects using gin(goal_ids);
