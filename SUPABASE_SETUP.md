# Supabase Migration Guide

## 🚀 Setup Steps

### 1. Create Supabase Project
- Go to https://supabase.com
- Create a new project
- Get your `Project URL` and `Anon Key` from Settings > API

### 2. Setup Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or your production URL
```

### 3. Create Database Schema
In Supabase Dashboard:
1. Go to SQL Editor
2. Click "New Query"
3. Paste the entire content from `supabase_schema.sql`
4. Execute it

Or use Supabase CLI:
```bash
npm install -g supabase
supabase login
supabase db push < supabase_schema.sql
```

### 4. Setup OAuth (Google)
In Supabase Dashboard:
1. Go to Authentication > Providers
2. Enable Google OAuth
3. Add your Google OAuth credentials (get from Google Cloud Console)
4. Add redirect URLs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

### 5. Create Auth Callback Route
Create `src/app/auth/callback/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/', request.url));
}
```

### 6. Update Dependencies
```bash
npm install @supabase/supabase-js
npm remove firebase
```

### 7. Data Migration (Firebase → Supabase)

#### Option A: Using Firebase Export
1. In Firebase Console > Firestore > Export Collections
2. Export all collections as JSON
3. Use the migration script to import to Supabase

#### Option B: Manual Migration
If you have Firebase data, use this migration script:

Create `scripts/migrate.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Load Firebase exports (as JSON)
const tasksData = JSON.parse(fs.readFileSync('./firestore_export/tasks.json', 'utf-8'));

async function migrate() {
  console.log('Starting migration...');

  // Migrate Tasks
  for (const task of tasksData) {
    const { error } = await supabase
      .from('tasks')
      .insert({
        id: task.id,
        user_id: task.userId,
        title: task.title,
        description: task.description,
        due_date: task.dueDate ? new Date(task.dueDate).toISOString() : null,
        status: task.status,
        priority: task.priority,
        estimated_minutes: task.estimatedMinutes,
        actual_minutes: task.actualMinutes,
        tags: task.tags,
        impact: task.impact,
        energy_level: task.energyLevel,
        completed_at: task.completedAt ? new Date(task.completedAt).toISOString() : null,
        archived_at: task.archivedAt ? new Date(task.archivedAt).toISOString() : null,
        created_at: new Date(task.createdAt).toISOString(),
      });

    if (error) {
      console.error('Error migrating task:', error);
    }
  }

  console.log('Migration complete!');
}

migrate();
```

Run migration:
```bash
npx ts-node scripts/migrate.ts
```

#### Option C: Start Fresh
If you don't need old data and want to migrate users:
1. Create users in Supabase Auth (invite via dashboard or signup)
2. Start using the app with new data

### 8. Test Locally
```bash
npm install
npm run dev
```

### 9. Deploy to Vercel
1. Add environment variables to Vercel Dashboard
2. Deploy:
```bash
git push
```

## 📊 Database Schema Overview

### Main Tables
- **users** - Auth users
- **tasks** - Todo items
- **goals** - Life goals
- **projects** - Projects with categories
- **calendar_events** - Events and time blocks
- **journal_entries** - Daily/weekly reflections
- **habits** - Habit tracking
- **habit_completions** - Habit completion records
- **notes** - Notes and brainstorm
- **brainstorm_sessions** - Brainstorm sessions with ideas
- **time_entries** - Time tracking
- **focus_sessions** - Focus sessions
- **tags** - Custom tags
- **daily_stats** - Daily statistics
- **weekly_reflections** - Weekly reflection data

## 🔐 Row Level Security (RLS)

All tables have RLS enabled. Users can only access their own data.

Policies are automatically applied and user_id filtering happens at the database level.

## 🛠️ Troubleshooting

### Issue: "Database connection error"
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Verify Supabase project is active

### Issue: "Auth redirect failed"
- Check redirect URLs are correctly set in Supabase > Authentication > URL Configuration
- Ensure `.env.local` has correct `NEXT_PUBLIC_SITE_URL`

### Issue: "Permission denied" on specific table
- Check RLS policies are enabled
- Verify user_id matches authenticated user

### Issue: "Data not loading"
- Check Supabase Real-time is enabled for tables (optional, but needed for live updates)
- Verify user is authenticated (check `useAuth()` hook)

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/frameworks/nextjs)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🎯 Next Steps

1. ✅ Setup Supabase project
2. ✅ Create database schema
3. ✅ Setup OAuth
4. ✅ Create auth callback route
5. ✅ Update dependencies
6. ✅ Migrate data (optional)
7. ✅ Test locally
8. ✅ Deploy to production

Good luck! 🚀
