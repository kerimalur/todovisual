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
```

> In Vercel dieselben Variablen im Project Settings Bereich hinterlegen.

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
