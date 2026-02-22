# Productive

Persönlicher Productivity-Workspace für **Disziplin, Durchhaltevermögen und klare Struktur im Alltag**.

## Tech Stack

- **Frontend/App**: Next.js 16, React 19, TypeScript
- **Hosting/Deployment**: Vercel
- **Backend & Auth & DB**: Supabase
- **State**: Zustand
- **UI/Charts**: TailwindCSS, Lucide, Recharts

## Zusammenarbeit: Vercel + Supabase

Damit die Zusammenarbeit schnell und konsistent bleibt, gehen wir von diesem Setup aus:

- Deployments laufen über **Vercel**.
- Daten, Realtime und Auth laufen über **Supabase**.
- Neue Features sollten möglichst so gebaut werden, dass sie lokal und in Vercel mit denselben Env-Variablen funktionieren.

### Empfohlene Env-Variablen

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_URL=
CRON_SECRET=
```

> In Vercel dieselben Variablen im Project Settings Bereich hinterlegen.

## WhatsApp/SMS Reminder

- Test-Endpoints:
  - `POST /api/reminders/sms/test`
  - `POST /api/reminders/whatsapp/test`
  - `POST /api/testwhatsapp` (Alias)
- Automatisch:
  - Bei neuer Aufgabe optional sofortige WhatsApp-Nachricht
  - 1 Stunde vor geplantem Aufgaben-Start (serverseitig via Vercel Cron, auch ohne offenen Browser)
  - Wochenrueckblick am Sonntag (konfigurierbare Uhrzeit, Standard `22:00`) via WhatsApp
- Konfiguration in der App unter `Einstellungen -> Benachrichtigungen`.

## Supabase Datenbank einrichten (wichtig)

Wenn du frisch von Firebase auf Supabase gewechselt bist, musst du zuerst das SQL-Schema einspielen, sonst können Tasks/Goals/Projekte etc. nicht gespeichert werden.

1. In Supabase das Projekt öffnen.
2. **SQL Editor** öffnen.
3. Inhalt aus `supabase/migrations/20260220120000_init_productive_schema.sql` ausführen.
4. Danach `supabase/migrations/20260221103000_goal_project_workflows.sql` ausführen.
5. Danach `supabase/migrations/20260221200000_notification_settings_and_deliveries.sql` ausführen.
6. Danach `supabase/migrations/20260221213000_notification_templates.sql` ausführen.
7. Danach `supabase/migrations/20260222010000_event_attendance_and_custom_whatsapp.sql` ausführen.
8. Danach App neu starten (`npm run dev`).

Dieses Schema legt alle benötigten Tabellen, Indizes und RLS-Policies für die App an (inkl. `tasks`, `goals`, `projects`, `calendar_events`, `habits`, `notes`, `time_entries`, usw.).

## Serverseitige Reminder ohne offenen Browser

1. In Vercel zusätzlich setzen:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
2. `vercel.json` enthält den Cron-Job für `GET /api/cron/reminders/task-start` alle 5 Minuten.
3. Nach dem Setzen der Variablen redeployen.

## Lokale Entwicklung

```bash
npm install
npm run dev
```

App öffnen: [http://localhost:3000](http://localhost:3000)

## Quality Checks

```bash
npm run lint
npm run build
```

## Produktvision (kurz)

- Fokus auf **Execution** statt Over-Planning
- Daily-System: **1 MIT + 2 Next Actions + 1 Habit-Pflicht**
- Schnelles Erfassen per **Quick Capture** unten rechts
