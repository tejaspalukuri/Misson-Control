-- Quick Fix for Personal / Single-User Dashboard
-- Run this in your Supabase SQL Editor to allow tasks & calendar sync without requiring user login:

-- 1. Make user_id optional
ALTER TABLE public.tasks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.calendar_events ALTER COLUMN user_id DROP NOT NULL;

-- 2. Open RLS policies for personal dashboard access
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow access to tasks" ON public.tasks;

CREATE POLICY "Allow access to tasks"
    ON public.tasks FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can insert their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Allow access to calendar_events" ON public.calendar_events;

CREATE POLICY "Allow access to calendar_events"
    ON public.calendar_events FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view subtasks of their tasks" ON public.subtasks;
DROP POLICY IF EXISTS "Users can insert subtasks to their tasks" ON public.subtasks;
DROP POLICY IF EXISTS "Users can update subtasks of their tasks" ON public.subtasks;
DROP POLICY IF EXISTS "Users can delete subtasks of their tasks" ON public.subtasks;
DROP POLICY IF EXISTS "Allow access to subtasks" ON public.subtasks;

CREATE POLICY "Allow access to subtasks"
    ON public.subtasks FOR ALL
    USING (true)
    WITH CHECK (true);
