import { NextResponse } from 'next/server';
import ical from 'node-ical';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DEMO_USER_ID, getRelativeDate, getTodayTime } from '@/lib/mockData';
import { Task, CalendarEvent } from '@/types';

// Sample fallback ICS feed in RFC 5545 format for Canvas assignments & Google Calendar
function generateSampleIcsData(): { sampleCanvasIcs: string; sampleCalendarIcs: string } {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const todayStart = new Date();
  todayStart.setHours(13, 0, 0, 0);
  const todayStartStr = todayStart.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const todayEnd = new Date();
  todayEnd.setHours(14, 15, 0, 0);
  const todayEndStr = todayEnd.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const sampleCanvasIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Canvas LMS//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:canvas-assignment-ee3302-quiz
DTSTAMP:${tomorrowStr}
DTSTART:${tomorrowStr}
DTEND:${tomorrowStr}
SUMMARY:EE 3302: Signals & Systems Weekly Quiz 4
DESCRIPTION:Submit via Canvas before the deadline. Topics include Fourier transforms and convolution.
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:canvas-assignment-cs2340-milestone
DTSTAMP:${dayAfterStr}
DTSTART:${dayAfterStr}
DTEND:${dayAfterStr}
SUMMARY:CS 2340: Computer Architecture Assembly Project 2
DESCRIPTION:Submit RISC-V simulator pipeline hazards analysis.
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  const sampleCalendarIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:gcal-event-study-group-today
DTSTAMP:${todayStartStr}
DTSTART:${todayStartStr}
DTEND:${todayEndStr}
SUMMARY:Algorithm Study Group (Library Room 3.204)
DESCRIPTION:Review Dynamic Programming & Dijkstra's Algorithm
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  return { sampleCanvasIcs, sampleCalendarIcs };
}

export async function GET(request: Request) {
  return handleSync(request);
}

export async function POST(request: Request) {
  return handleSync(request);
}

async function handleSync(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceDemo = searchParams.get('demo') === 'true';

    const canvasIcsUrl = process.env.CANVAS_ICS_URL;
    const calendarIcsUrl = process.env.CALENDAR_ICS_URL;

    const tasksToUpsert: Partial<Task>[] = [];
    const eventsToUpsert: Partial<CalendarEvent>[] = [];

    // 1. Process Canvas ICS Feed
    let canvasData: Record<string, ical.CalendarComponent> | null = null;
    if (canvasIcsUrl && !forceDemo) {
      try {
        canvasData = await ical.async.fromURL(canvasIcsUrl);
      } catch (err) {
        console.warn('Failed to fetch Canvas ICS from URL, falling back to sample:', err);
      }
    }

    if (!canvasData) {
      const { sampleCanvasIcs } = generateSampleIcsData();
      canvasData = ical.sync.parseICS(sampleCanvasIcs);
    }

    // Parse Canvas items -> tasks
    for (const key in canvasData) {
      const item = canvasData[key];
      if (item.type === 'VEVENT') {
        const uid = item.uid || `canvas-${key}`;
        const summary = item.summary || 'Untitled Canvas Assignment';
        
        // Extract context_tag if in summary (e.g. "CS 1337: ...")
        const match = summary.match(/^([A-Za-z]+\s*\d+)/);
        const contextTag = match ? match[1].trim() : 'Academic';

        const dueDate = item.end ? new Date(item.end).toISOString() : (item.start ? new Date(item.start).toISOString() : null);

        tasksToUpsert.push({
          user_id: DEMO_USER_ID,
          title: summary,
          category: 'course',
          context_tag: contextTag,
          status: 'not_started',
          progress_percent: 0,
          due_date: dueDate,
          external_id: uid,
        });
      }
    }

    // 2. Process Calendar ICS Feed
    let calData: Record<string, ical.CalendarComponent> | null = null;
    if (calendarIcsUrl && !forceDemo) {
      try {
        calData = await ical.async.fromURL(calendarIcsUrl);
      } catch (err) {
        console.warn('Failed to fetch Calendar ICS from URL, falling back to sample:', err);
      }
    }

    if (!calData) {
      const { sampleCalendarIcs } = generateSampleIcsData();
      calData = ical.sync.parseICS(sampleCalendarIcs);
    }

    // Parse Calendar items -> calendar_events
    for (const key in calData) {
      const item = calData[key];
      if (item.type === 'VEVENT') {
        const uid = item.uid || `gcal-${key}`;
        const summary = item.summary || 'Untitled Calendar Event';
        const start = item.start ? new Date(item.start).toISOString() : new Date().toISOString();
        const end = item.end ? new Date(item.end).toISOString() : new Date(Date.now() + 3600000).toISOString();

        eventsToUpsert.push({
          user_id: DEMO_USER_ID,
          title: summary,
          start_time: start,
          end_time: end,
          external_id: uid,
        });
      }
    }

    // 3. Upsert to Supabase if configured
    let dbSynced = false;
    if (isSupabaseConfigured && supabase) {
      try {
        if (tasksToUpsert.length > 0) {
          const { error: taskErr } = await supabase
            .from('tasks')
            .upsert(tasksToUpsert, { onConflict: 'external_id' });
          if (taskErr) console.warn('Supabase tasks upsert warning:', taskErr);
        }

        if (eventsToUpsert.length > 0) {
          const { error: eventErr } = await supabase
            .from('calendar_events')
            .upsert(eventsToUpsert, { onConflict: 'external_id' });
          if (eventErr) console.warn('Supabase events upsert warning:', eventErr);
        }
        dbSynced = true;
      } catch (err) {
        console.warn('Supabase sync execution error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: dbSynced
        ? 'Successfully synced and upserted ICS feeds into Supabase'
        : 'Parsed ICS feeds successfully (Mock/Local mode active)',
      dbSynced,
      tasksImported: tasksToUpsert.length,
      eventsImported: eventsToUpsert.length,
      tasks: tasksToUpsert,
      events: eventsToUpsert,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('ICS sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error',
      },
      { status: 500 }
    );
  }
}
