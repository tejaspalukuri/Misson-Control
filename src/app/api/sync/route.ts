import { NextResponse } from 'next/server';
import ical from 'node-ical';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DEMO_USER_ID } from '@/lib/mockData';
import { Task, CalendarEvent } from '@/types';

export async function GET(request: Request) {
  return handleSync(request);
}

export async function POST(request: Request) {
  return handleSync(request);
}

async function syncFromCanvasApi(baseUrl: string, token: string): Promise<Task[]> {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  // 1. Fetch active courses
  const coursesRes = await fetch(
    `${cleanBase}/api/v1/courses?enrollment_state=active&per_page=50`,
    { headers }
  );
  if (!coursesRes.ok) {
    throw new Error(`Canvas API courses error: ${coursesRes.status} ${coursesRes.statusText}`);
  }
  const courses: Array<{ id: number; name: string; course_code: string }> = await coursesRes.json();

  const importedTasks: Task[] = [];

  // 2. For each active course, fetch upcoming/unsubmitted assignments with submission status
  await Promise.all(
    courses.map(async (course) => {
      try {
        const assignRes = await fetch(
          `${cleanBase}/api/v1/courses/${course.id}/assignments?bucket=upcoming&include[]=submission&per_page=50`,
          { headers }
        );
        if (!assignRes.ok) return;
        const assignments: Array<{
          id: number;
          name: string;
          due_at: string | null;
          html_url: string;
          submission?: {
            workflow_state: string; // 'unsubmitted' | 'submitted' | 'graded' | 'pending_review'
            submitted_at: string | null;
          };
        }> = await assignRes.json();

        for (const a of assignments) {
          const isSubmitted =
            a.submission?.workflow_state === 'submitted' ||
            a.submission?.workflow_state === 'graded' ||
            a.submission?.workflow_state === 'pending_review' ||
            Boolean(a.submission?.submitted_at);

          // Skip assignments that are already submitted!
          if (isSubmitted) continue;

          importedTasks.push({
            id: `canvas-api-${a.id}`,
            user_id: DEMO_USER_ID,
            title: a.name,
            category: 'course',
            context_tag: course.course_code || course.name || 'Course',
            status: 'not_started',
            progress_percent: 0,
            due_date: a.due_at,
            external_id: `canvas-api-${a.id}`,
            subtasks: [
              {
                id: `st-${a.id}-1`,
                task_id: `canvas-api-${a.id}`,
                title: 'Review assignment prompt on Canvas',
                is_completed: false,
              },
              {
                id: `st-${a.id}-2`,
                task_id: `canvas-api-${a.id}`,
                title: 'Complete and submit',
                is_completed: false,
              },
            ],
            created_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch assignments for course ${course.id}:`, err);
      }
    })
  );

  return importedTasks;
}

async function handleSync(request: Request) {
  try {
    const canvasBaseUrl = process.env.CANVAS_BASE_URL || 'https://elearning.utdallas.edu';
    const canvasApiToken = process.env.CANVAS_API_TOKEN;
    const canvasIcsUrl = process.env.CANVAS_ICS_URL;
    const calendarIcsUrl = process.env.CALENDAR_ICS_URL;

    let tasksToUpsert: Task[] = [];
    const eventsToUpsert: CalendarEvent[] = [];
    let sourceUsed = 'none';

    // Prefer Canvas REST API if token is provided (knows submission status!)
    if (canvasApiToken) {
      tasksToUpsert = await syncFromCanvasApi(canvasBaseUrl, canvasApiToken);
      sourceUsed = 'canvas_api';
    } else if (canvasIcsUrl) {
      // Fallback to ICS if no API token
      const canvasData = await ical.async.fromURL(canvasIcsUrl);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      for (const key in canvasData) {
        const item = canvasData[key];
        if (item.type === 'VEVENT') {
          const uid = item.uid || `canvas-${key}`;
          const summary = item.summary || 'Untitled Canvas Assignment';
          const dueDate = item.end
            ? new Date(item.end).toISOString()
            : item.start
            ? new Date(item.start).toISOString()
            : null;

          if (dueDate && new Date(dueDate) < startOfToday) continue;

          const bracketMatch = summary.match(/\[([A-Za-z0-9\s.-]+)\]/);
          let contextTag = 'Academic';
          if (bracketMatch) {
            contextTag = bracketMatch[1].replace(/\s*-\s*[A-Z0-9]+$/i, '').trim();
          } else {
            const match = summary.match(/^([A-Za-z]+\s*\d+)/);
            if (match) contextTag = match[1].trim();
          }

          const cleanTitle = summary.replace(/\s*\[[A-Za-z0-9\s.-]+\]\s*$/, '').trim();

          tasksToUpsert.push({
            id: `task-${uid}`,
            user_id: DEMO_USER_ID,
            title: cleanTitle || summary,
            category: 'course',
            context_tag: contextTag,
            status: 'not_started',
            progress_percent: 0,
            due_date: dueDate,
            external_id: uid,
            subtasks: [],
            created_at: new Date().toISOString(),
          });
        }
      }
      sourceUsed = 'canvas_ics';
    }

    // Process Calendar ICS Feeds (supports comma-separated URLs in CALENDAR_ICS_URL + dedicated category URLs)
    const calendarFeeds: string[] = [];
    if (calendarIcsUrl) {
      calendarIcsUrl
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean)
        .forEach((u) => calendarFeeds.push(u));
    }
    if (process.env.CALENDAR_SCHOOL_ICS_URL) calendarFeeds.push(process.env.CALENDAR_SCHOOL_ICS_URL.trim());
    if (process.env.CALENDAR_CLUBS_ICS_URL) calendarFeeds.push(process.env.CALENDAR_CLUBS_ICS_URL.trim());
    if (process.env.CALENDAR_PERSONAL_ICS_URL) calendarFeeds.push(process.env.CALENDAR_PERSONAL_ICS_URL.trim());

    if (calendarFeeds.length > 0) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const twoWeeksOut = new Date();
      twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

      await Promise.all(
        calendarFeeds.map(async (feedUrl) => {
          try {
            const calData = await ical.async.fromURL(feedUrl);
            for (const key in calData) {
              const item = calData[key];
              if (item.type === 'VEVENT') {
                const start = item.start ? new Date(item.start) : new Date();
                const end = item.end ? new Date(item.end) : new Date(start.getTime() + 3600000);

                // Only keep events from today through the next 14 days
                if (end < startOfToday || start > twoWeeksOut) continue;

                // Skip all-day / midnight-only deadline items so only real timed events appear in Agenda
                const isDateOnly = (item.start as any)?.dateOnly === true || item.datetype === 'date';
                const isZeroDurationMidnight =
                  start.getTime() === end.getTime() &&
                  start.getHours() === 0 &&
                  start.getMinutes() === 0;
                if (isDateOnly || isZeroDurationMidnight) continue;

                const uid = item.uid || `gcal-${key}`;
                eventsToUpsert.push({
                  id: `ev-${uid}`,
                  user_id: DEMO_USER_ID,
                  title: item.summary || 'Untitled Calendar Event',
                  start_time: start.toISOString(),
                  end_time: end.toISOString(),
                  external_id: uid,
                  created_at: new Date().toISOString(),
                });
              }
            }
          } catch (err) {
            console.warn(`Calendar ICS fetch failed for ${feedUrl}:`, err);
          }
        })
      );
    }

    // Upsert to Supabase if configured
    let dbSynced = false;
    if (isSupabaseConfigured && supabase && tasksToUpsert.length > 0) {
      try {
        const dbTasks = tasksToUpsert.map((t) => ({
          title: t.title,
          category: t.category,
          context_tag: t.context_tag,
          status: t.status,
          progress_percent: t.progress_percent,
          due_date: t.due_date,
          external_id: t.external_id,
        }));
        const { error } = await supabase
          .from('tasks')
          .upsert(dbTasks, { onConflict: 'external_id' });
        if (!error) dbSynced = true;
      } catch (err) {
        console.warn('Supabase sync error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      sourceUsed,
      message:
        sourceUsed === 'canvas_api'
          ? `Synced ${tasksToUpsert.length} unsubmitted upcoming assignments via Canvas API.`
          : `Synced ${tasksToUpsert.length} upcoming assignments via ICS.`,
      dbSynced,
      tasksImported: tasksToUpsert.length,
      eventsImported: eventsToUpsert.length,
      tasks: tasksToUpsert,
      events: eventsToUpsert,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error',
      },
      { status: 500 }
    );
  }
}
