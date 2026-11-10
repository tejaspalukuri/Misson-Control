Here is a Product Requirements Document (PRD) perfectly structured to feed into **Google Antigravity**. Because Antigravity is an agentic development platform that reads and writes actual code in your local folders [cite: 1.2.2], this PRD is written specifically as a technical specification and constraint guide for the Antigravity agent to ingest and build from.

Save this text as a markdown file (e.g., `dashboard_prd.md`), drop it into your Google Antigravity project folder, and prompt the agent with: *"Read `dashboard_prd.md` and use the `/plan` command to generate an Implementation Plan for this MVP."* [cite: 1.2.3]

---

# PRD: College Student Dashboard MVP

## 1. Product Overview

A web-based personal productivity dashboard designed for college students to unify their schedule, academic deadlines, and extracurricular progress. The dashboard will automatically sync read-only calendar and LMS data, track granular progress for complex club milestones, and provide a 100% free, locally run AI morning briefing.

## 2. Technical Stack Constraints

* **Framework:** Next.js (App Router, TypeScript).
* **Styling:** Tailwind CSS, `shadcn/ui` (for components like progress bars, checkboxes, and modals), and Lucide React (for icons).
* **Database & Auth:** Supabase JS Client (PostgreSQL, Realtime subscriptions).
* **Background Sync:** Vercel Cron Jobs calling Next.js Route Handlers (`/api/sync`).
* **AI Engine:** `@mlc-ai/web-llm` running `SmolLM2-360M-Instruct-q4f16_1-MLC` completely client-side via WebGPU.
* **Package Manager:** `npm`.

## 3. Database Schema (Supabase)

The agent must configure the following schema with Row-Level Security (RLS) policies allowing users to only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` where `auth.uid() = user_id`.

**Table: `tasks**`

* `id` (uuid, primary key)
* `user_id` (uuid, fk to auth.users)
* `title` (text)
* `category` (enum: `'course'`, `'club'`, `'personal'`)
* `context_tag` (text) - *e.g., "CS 1337" or "Formula SAE"*
* `status` (enum: `'not_started'`, `'in_progress'`, `'blocked'`, `'completed'`)
* `progress_percent` (integer, 0-100)
* `due_date` (timestamptz, nullable)
* `external_id` (text, unique, nullable) - *Used for idempotency during ICS imports*

**Table: `subtasks**`

* `id` (uuid, primary key)
* `task_id` (uuid, fk to public.tasks, cascade delete)
* `title` (text)
* `is_completed` (boolean, default false)

**Table: `calendar_events**`

* `id` (uuid, primary key)
* `user_id` (uuid, fk to auth.users)
* `title` (text)
* `start_time` (timestamptz)
* `end_time` (timestamptz)
* `external_id` (text, unique)

## 4. Core Features & Acceptance Criteria

### Feature 1: Canvas & Calendar ICS Ingestion

* **Requirement:** An API route (`/api/sync`) that parses `.ics` feeds using the `node-ical` library.
* **Acceptance Criteria:**
* Fetches the Canvas ICS URL and a generic Calendar ICS URL from `.env`.
* Extracts `VEVENT` items and maps Canvas assignments to the `tasks` table and calendar items to `calendar_events`.
* Upserts based on `external_id` to prevent duplicate rows on subsequent cron runs.



### Feature 2: Unified Agenda & Task Board

* **Requirement:** The main UI dashboard showing today's timeline and pending work.
* **Acceptance Criteria:**
* **Schedule View:** Fetches and displays today's `calendar_events` ordered chronologically.
* **Task List:** Fetches `tasks`. Categorizes them visually into "Urgent Academic" (due < 48 hours) and "Active Club Projects".
* **Subtask Progress:** Tasks have a segmented progress bar. Checking off a `subtask` automatically calculates `(completed_subtasks / total_subtasks) * 100` and updates the parent task's `progress_percent` in Supabase.



### Feature 3: Zero-Cost WebLLM Morning Briefing

* **Requirement:** A client-side AI summary generator using `@mlc-ai/web-llm`.
* **Acceptance Criteria:**
* UI includes a "Generate Briefing" button.
* Fetches pending tasks and blocks from the UI state.
* Passes a structured prompt to the local WebGPU model: *"Act as an executive assistant. Summarize these impending deadlines and blocked club tasks in 4 short bullet points."*
* Displays progress loading states (downloading model, compiling) to the user during the first load.



## 5. Agent Implementation Steps (Instructions for Antigravity)

1. **Initialize Project:** Create the Next.js app with Tailwind and install required dependencies (`@supabase/supabase-js`, `@mlc-ai/web-llm`, `node-ical`, `shadcn/ui` components).
2. **Supabase Setup:** Generate the `schema.sql` file containing the table definitions, enums, and RLS policies for the user to manually execute in their Supabase SQL editor.
3. **Backend Routes:** Write the `/api/sync/route.ts` file handling the `node-ical` parsing and Supabase upsert logic.
4. **Frontend State:** Set up the Supabase client and write data-fetching hooks for tasks and events.
5. **UI Construction:** Build the Dashboard layout (Left column: Calendar / Right column: Task Board with progress bars).
6. **AI Integration:** Build the `TaskSummarizer.tsx` client component that manages the WebLLM engine initialization and prompt execution.