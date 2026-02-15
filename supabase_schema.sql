-- Supabase Database Schema for Todo App
-- PostgreSQL DDL for all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== USERS TABLE =====
-- Using Supabase Auth's built-in users table (auth.users)
-- We'll create a public.users table for additional user data if needed
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== GOALS TABLE =====
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  color TEXT,
  category VARCHAR(50),
  priority VARCHAR(20),
  motivation TEXT,
  reward TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_goals (user_id)
);

-- ===== PROJECTS TABLE =====
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  start_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'planning', -- planning, active, on-hold, completed, archived
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  color TEXT,
  notes TEXT,
  
  -- Trading Data
  trading_strategy TEXT,
  trading_risk_level VARCHAR(20),
  trading_target_return DECIMAL(10, 2),
  trading_current_return DECIMAL(10, 2),
  
  -- Fitness Data
  fitness_workout_days TEXT[], -- JSON array
  fitness_exercise_type TEXT,
  fitness_target_weight DECIMAL(5, 2),
  fitness_current_weight DECIMAL(5, 2),
  
  -- Finance Data
  finance_budget DECIMAL(10, 2),
  finance_spent DECIMAL(10, 2),
  finance_savings_target DECIMAL(10, 2),
  finance_current_savings DECIMAL(10, 2),
  
  -- Programming Data
  programming_tech_stack TEXT[], -- JSON array
  programming_repository TEXT,
  programming_deployment_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_projects (user_id),
  INDEX idx_goal_projects (goal_id)
);

-- ===== MILESTONES TABLE =====
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_project_milestones (project_id)
);

-- ===== METRICS TABLE =====
CREATE TABLE IF NOT EXISTS public.metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value DECIMAL(10, 2),
  target DECIMAL(10, 2),
  unit TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_project_metrics (project_id)
);

-- ===== TASKS TABLE =====
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'todo', -- todo, in-progress, completed, archived
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  impact VARCHAR(50),
  energy_level VARCHAR(20),
  completed_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  focus_session_ids UUID[],
  
  -- Recurring
  recurring_frequency VARCHAR(20),
  recurring_days_of_week INTEGER[],
  recurring_interval INTEGER,
  recurring_end_date TIMESTAMP WITH TIME ZONE,
  recurring_next_occurrence TIMESTAMP WITH TIME ZONE,
  recurring_is_active BOOLEAN,
  
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_tasks (user_id),
  INDEX idx_project_tasks (project_id),
  INDEX idx_goal_tasks (goal_id),
  INDEX idx_status_tasks (status)
);

-- ===== SUBTASKS TABLE =====
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_task_subtasks (task_id)
);

-- ===== CALENDAR EVENTS TABLE =====
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  color TEXT,
  event_type VARCHAR(50),
  is_time_block BOOLEAN DEFAULT FALSE,
  linked_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  google_event_id TEXT,
  is_from_google_calendar BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_events (user_id),
  INDEX idx_date_events (start_time)
);

-- ===== JOURNAL ENTRIES TABLE =====
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  content TEXT NOT NULL,
  mood VARCHAR(20),
  tags TEXT[],
  completed_tasks INTEGER,
  focus_minutes INTEGER,
  is_weekly_reflection BOOLEAN DEFAULT FALSE,
  
  -- Daily Reflection
  reflection_productivity INTEGER,
  reflection_energy INTEGER,
  reflection_focus INTEGER,
  reflection_went_well TEXT,
  reflection_could_improve TEXT,
  reflection_gratitude TEXT,
  reflection_tomorrow_priority TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_journal (user_id),
  INDEX idx_date_journal (entry_date)
);

-- ===== WEEKLY REFLECTIONS TABLE =====
CREATE TABLE IF NOT EXISTS public.weekly_reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  went_well TEXT,
  could_improve TEXT,
  lessons_learned TEXT,
  proud_of TEXT,
  completed_tasks INTEGER,
  focus_minutes INTEGER,
  habits_completed INTEGER,
  goals_progress JSONB,
  next_week_priorities TEXT[],
  next_week_goals TEXT[],
  next_week_plan TEXT,
  productivity_rating INTEGER,
  energy_rating INTEGER,
  satisfaction_rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_weekly (user_id),
  INDEX idx_week_weekly (week_start)
);

-- ===== FOCUS SESSIONS TABLE =====
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  planned_minutes INTEGER NOT NULL,
  actual_minutes INTEGER,
  status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_focus (user_id),
  INDEX idx_task_focus (task_id)
);

-- ===== HABITS TABLE =====
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  category_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  frequency VARCHAR(50) NOT NULL, -- daily, weekly, specific-days
  target_per_week INTEGER,
  specific_days INTEGER[],
  target_value DECIMAL(10, 2),
  target_unit TEXT,
  reminder_time TIME,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  energy_level VARCHAR(20),
  best_time_of_day VARCHAR(20),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  is_paused BOOLEAN DEFAULT FALSE,
  paused_until TIMESTAMP WITH TIME ZONE,
  motivation TEXT,
  cue TEXT,
  reward TEXT,
  stack_before TEXT,
  stack_after TEXT,
  INDEX idx_user_habits (user_id),
  INDEX idx_active_habits (user_id, is_active)
);

-- ===== HABIT CATEGORIES TABLE =====
CREATE TABLE IF NOT EXISTS public.habit_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_categories (user_id)
);

-- ===== HABIT COMPLETIONS TABLE =====
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  value DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_habit_completions (habit_id),
  INDEX idx_date_completions (completion_date),
  UNIQUE(habit_id, completion_date)
);

-- ===== TAGS TABLE =====
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_tags (user_id)
);

-- ===== NOTES TABLE =====
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'note', -- note, brainstorm, idea, meeting-notes, quick-capture
  color TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  linked_task_ids UUID[],
  linked_goal_ids UUID[],
  linked_project_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_notes (user_id)
);

-- ===== BRAINSTORM SESSIONS TABLE =====
CREATE TABLE IF NOT EXISTS public.brainstorm_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  linked_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  linked_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_brainstorm (user_id)
);

-- ===== BRAINSTORM IDEAS TABLE =====
CREATE TABLE IF NOT EXISTS public.brainstorm_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.brainstorm_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  color TEXT,
  position_x DECIMAL(5, 2),
  position_y DECIMAL(5, 2),
  parent_id UUID REFERENCES public.brainstorm_ideas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_ideas (session_id)
);

-- ===== TIME ENTRIES TABLE =====
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  is_running BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_time_entries (user_id),
  INDEX idx_task_time_entries (task_id)
);

-- ===== DAILY STATS TABLE =====
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stats_date DATE NOT NULL,
  completed_tasks INTEGER DEFAULT 0,
  focus_minutes INTEGER DEFAULT 0,
  habits_completed INTEGER DEFAULT 0,
  habits_total INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,
  productivity_score DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_stats (user_id),
  INDEX idx_date_stats (stats_date),
  UNIQUE(user_id, stats_date)
);

-- ===== RLS (ROW LEVEL SECURITY) POLICIES =====
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brainstorm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brainstorm_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own events" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own journals" ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journals" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journals" ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journals" ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own focus" ON public.focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own focus" ON public.focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own focus" ON public.focus_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own focus" ON public.focus_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tags" ON public.tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tags" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON public.tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON public.tags FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own time entries" ON public.time_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own time entries" ON public.time_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own time entries" ON public.time_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own time entries" ON public.time_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats" ON public.daily_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON public.daily_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Composite table policies (for related data)
CREATE POLICY "Users can view own milestones via projects" ON public.milestones FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = milestones.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can view own metrics via projects" ON public.metrics FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = metrics.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can view own subtasks via tasks" ON public.subtasks FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Users can view own habit completions" ON public.habit_completions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.habits WHERE habits.id = habit_completions.habit_id AND habits.user_id = auth.uid()));

CREATE POLICY "Users can view own habit categories" ON public.habit_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit categories" ON public.habit_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit categories" ON public.habit_categories FOR UPDATE USING (auth.uid() = user_id);

-- Brainstorm policies
CREATE POLICY "Users can view own brainstorm" ON public.brainstorm_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own brainstorm" ON public.brainstorm_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own brainstorm" ON public.brainstorm_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own brainstorm" ON public.brainstorm_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own brainstorm ideas" ON public.brainstorm_ideas FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.brainstorm_sessions WHERE brainstorm_sessions.id = brainstorm_ideas.session_id AND brainstorm_sessions.user_id = auth.uid()));

-- Weekly reflections
CREATE POLICY "Users can view own weekly reflections" ON public.weekly_reflections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weekly reflections" ON public.weekly_reflections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weekly reflections" ON public.weekly_reflections FOR UPDATE USING (auth.uid() = user_id);

-- ===== FUNCTIONS & TRIGGERS =====

-- Function to update milestones and related data
CREATE OR REPLACE FUNCTION update_habits_category_id()
RETURNS TRIGGER AS $$
BEGIN
  -- When a habit is created without a category_id, keep it null (default behavior)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journals_updated_at BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brainstorm_updated_at BEFORE UPDATE ON public.brainstorm_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_focus_updated_at BEFORE UPDATE ON public.focus_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_reflections_updated_at BEFORE UPDATE ON public.weekly_reflections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
