# Mission Control: College Student Dashboard MVP

A web-based personal productivity dashboard designed for college students to unify their daily schedule, academic deadlines, and extracurricular progress, featuring a **100% free, local AI morning briefing** running via WebGPU.

---

## 🚀 Features Built

1. **ICS Ingestion (`/api/sync`)**:
   - Parses Canvas LMS and Google Calendar `.ics` feeds using `node-ical`.
   - Maps Canvas assignments into the `tasks` table and calendar events into `calendar_events`.
   - Supports idempotency upserting via `external_id`.
   - Includes sample fallback feed generation for immediate local testing.

2. **Unified Agenda & Task Board**:
   - **Today's Agenda**: Chronological timeline of classes, discussion sections, and team standups with active event indicators.
   - **Urgent Academic Deadlines**: Automatically filters and highlights course assignments due within 48 hours.
   - **Active Club Projects**: Tracks complex club milestones with granular subtasks.
   - **Segmented Subtask Progress**: Checking off subtasks automatically recalculates `(completed / total) * 100` and updates the parent task's `progress_percent`.
   - **Quick Actions**: Add custom tasks, context tags, due dates, and initial subtasks via modal dialog.

3. **Zero-Cost WebLLM Morning Briefing**:
   - Client-side AI executive summary generator using `@mlc-ai/web-llm` running `SmolLM2-360M-Instruct-q4f16_1-MLC`.
   - Runs directly on your device's WebGPU—zero API keys, zero cloud costs.
   - Summarizes impending deadlines, blocked club tasks, and priorities in 4 concise action bullets.
   - Live loading progress bar during initial model download and compilation.
   - Graceful offline fallback summary if WebGPU is unavailable.

4. **Hybrid Database Architecture**:
   - Works immediately out of the box with persistent local storage and sample data.
   - Seamlessly connects to **Supabase** once environment variables are set in `.env.local`.

---

## 🛠️ Quick Start

### 1. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Setting Up Supabase (Optional)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** -> **New Query**.
3. Copy and run the script in [`schema.sql`](./schema.sql). This creates:
   - `tasks`, `subtasks`, and `calendar_events` tables.
   - `task_category` and `task_status` enums.
   - Row-Level Security (RLS) policies (`auth.uid() = user_id`).
   - Automated trigger to recalculate parent task progress when subtasks are toggled.
4. Copy your project credentials into `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```
5. Restart your development server (`npm run dev`). The dashboard will switch from `Local Demo Mode` to `Supabase Live`.

---

## 📅 Adding Your Calendar & Canvas Feeds

In `.env.local`:
```bash
CANVAS_ICS_URL=https://canvas.yourinstitution.edu/feeds/calendars/user_XXXXX.ics
CALENDAR_ICS_URL=https://calendar.google.com/calendar/ical/your_calendar/basic.ics
```

Click **Sync ICS Feeds** in the dashboard header or trigger `POST /api/sync` (e.g. via Vercel Cron).

---

## 📂 Project Structure

```text
├── schema.sql                 # Supabase PostgreSQL schema, RLS & triggers
├── src/
│   ├── app/
│   │   ├── api/sync/route.ts  # ICS parsing & Supabase upsert route
│   │   ├── globals.css        # Tailwind styling & clean font stack
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Dashboard page
│   ├── components/
│   │   ├── AgendaSchedule.tsx # Chronological today's timeline
│   │   ├── CreateTaskModal.tsx# Task & subtask creation modal
│   │   ├── Header.tsx         # Sync, DB status, and reset controls
│   │   ├── TaskBoard.tsx      # Categorized board with segmented progress
│   │   └── TaskSummarizer.tsx # @mlc-ai/web-llm WebGPU morning briefing
│   ├── lib/
│   │   ├── mockData.ts        # Sample college student data & ICS generators
│   │   ├── storage.ts         # Hybrid Supabase / LocalStorage data layer
│   │   └── supabase.ts        # Supabase client setup & configuration guard
│   └── types/
│       └── index.ts           # TypeScript interfaces matching PRD schema
└── prd.md                     # Original technical PRD specification
```
