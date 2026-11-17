import { Task, Subtask, CalendarEvent } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';
import { INITIAL_TASKS, INITIAL_CALENDAR_EVENTS, DEMO_USER_ID } from './mockData';

const TASKS_STORAGE_KEY = 'mission_control_tasks_v1';
const EVENTS_STORAGE_KEY = 'mission_control_events_v1';

// In-browser LocalStorage helpers for Demo / Offline mode
export function getLocalTasks(): Task[] {
  if (typeof window === 'undefined') return INITIAL_TASKS;
  const raw = localStorage.getItem(TASKS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
    return INITIAL_TASKS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_TASKS;
  }
}

export function saveLocalTasks(tasks: Task[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }
}

export function getLocalEvents(): CalendarEvent[] {
  if (typeof window === 'undefined') return INITIAL_CALENDAR_EVENTS;
  const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(INITIAL_CALENDAR_EVENTS));
    return INITIAL_CALENDAR_EVENTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_CALENDAR_EVENTS;
  }
}

export function saveLocalEvents(events: CalendarEvent[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  }
}

export function mergeImportedData(
  importedTasks: Task[],
  importedEvents: CalendarEvent[]
): { tasks: Task[]; events: CalendarEvent[] } {
  const demoTaskIds = new Set(INITIAL_TASKS.map((t) => t.id));
  const demoEventIds = new Set(INITIAL_CALENDAR_EVENTS.map((e) => e.id));

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Filter out initial demo tasks/events AND any old past-due synced tasks
  const currentTasks = getLocalTasks().filter(
    (t) =>
      !demoTaskIds.has(t.id) &&
      !(t.external_id && t.due_date && new Date(t.due_date) < startOfToday)
  );
  const currentEvents = getLocalEvents().filter((e) => {
    if (demoEventIds.has(e.id)) return false;
    if (e.external_id?.startsWith('event-assignment-')) return false;
    const s = new Date(e.start_time);
    const end = new Date(e.end_time);
    const isMidnightZero =
      s.getTime() === end.getTime() && s.getHours() === 0 && s.getMinutes() === 0;
    return !isMidnightZero;
  });

  // Map existing tasks by external_id
  const taskMap = new Map<string, Task>();
  currentTasks.forEach((t) => {
    if (t.external_id) taskMap.set(t.external_id, t);
    else taskMap.set(t.id, t);
  });

  importedTasks.forEach((newTask) => {
    const key = newTask.external_id || newTask.id;
    if (taskMap.has(key)) {
      // Update due date and title, preserve user progress
      const existing = taskMap.get(key)!;
      existing.due_date = newTask.due_date;
      existing.title = newTask.title;
      existing.context_tag = newTask.context_tag;
    } else {
      taskMap.set(key, newTask);
    }
  });

  const mergedTasks = Array.from(taskMap.values());
  saveLocalTasks(mergedTasks);

  // Map events by external_id
  const eventMap = new Map<string, CalendarEvent>();
  currentEvents.forEach((e) => {
    if (e.external_id) eventMap.set(e.external_id, e);
    else eventMap.set(e.id, e);
  });

  importedEvents.forEach((newEvent) => {
    const key = newEvent.external_id || newEvent.id;
    eventMap.set(key, newEvent);
  });

  const mergedEvents = Array.from(eventMap.values());
  saveLocalEvents(mergedEvents);

  return { tasks: mergedTasks, events: mergedEvents };
}

export async function getTasks(): Promise<Task[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*, subtasks(*)')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (tasksError) throw tasksError;
      if (tasksData && tasksData.length > 0) {
        return tasksData as Task[];
      }
    } catch (err) {
      console.warn('Supabase fetch failed or restricted by RLS, using local storage:', err);
    }
  }
  return getLocalTasks();
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;
      if (eventsData && eventsData.length > 0) {
        return eventsData as CalendarEvent[];
      }
    } catch (err) {
      console.warn('Supabase fetch failed or restricted by RLS, using local storage:', err);
    }
  }
  return getLocalEvents();
}

export async function toggleSubtask(taskId: string, subtaskId: string): Promise<Task[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: st } = await supabase
        .from('subtasks')
        .select('is_completed')
        .eq('id', subtaskId)
        .single();

      if (st) {
        const nextState = !st.is_completed;
        await supabase
          .from('subtasks')
          .update({ is_completed: nextState })
          .eq('id', subtaskId);

        const { data: allSts } = await supabase
          .from('subtasks')
          .select('is_completed')
          .eq('task_id', taskId);

        if (allSts && allSts.length > 0) {
          const completedCount = allSts.filter((s) => s.is_completed).length;
          const progressPercent = Math.round((completedCount / allSts.length) * 100);
          await supabase
            .from('tasks')
            .update({ progress_percent: progressPercent })
            .eq('id', taskId);
        }
        return getTasks();
      }
    } catch (err) {
      console.warn('Supabase subtask toggle failed, applying locally:', err);
    }
  }

  // Local demo fallback
  const tasks = getLocalTasks();
  const targetTask = tasks.find((t) => t.id === taskId);
  if (targetTask && targetTask.subtasks) {
    const targetSubtask = targetTask.subtasks.find((s) => s.id === subtaskId);
    if (targetSubtask) {
      targetSubtask.is_completed = !targetSubtask.is_completed;
      const completedCount = targetTask.subtasks.filter((s) => s.is_completed).length;
      targetTask.progress_percent = Math.round((completedCount / targetTask.subtasks.length) * 100);
      if (targetTask.progress_percent === 100 && targetTask.status !== 'completed') {
        targetTask.status = 'completed';
      } else if (targetTask.progress_percent < 100 && targetTask.status === 'completed') {
        targetTask.status = 'in_progress';
      }
      saveLocalTasks(tasks);
    }
  }
  return [...tasks];
}

export async function addSubtask(taskId: string, title: string): Promise<Task[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('subtasks').insert({
        task_id: taskId,
        title,
        is_completed: false,
      });
      return getTasks();
    } catch (err) {
      console.warn('Supabase add subtask failed, applying locally:', err);
    }
  }

  const tasks = getLocalTasks();
  const targetTask = tasks.find((t) => t.id === taskId);
  if (targetTask) {
    if (!targetTask.subtasks) targetTask.subtasks = [];
    targetTask.subtasks.push({
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      task_id: taskId,
      title,
      is_completed: false,
    });
    const completedCount = targetTask.subtasks.filter((s) => s.is_completed).length;
    targetTask.progress_percent = Math.round((completedCount / targetTask.subtasks.length) * 100);
    saveLocalTasks(tasks);
  }
  return [...tasks];
}

export async function createTask(
  taskData: Omit<Task, 'id' | 'user_id' | 'progress_percent' | 'created_at' | 'updated_at'>,
  initialSubtaskTitles: string[] = []
): Promise<Task[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id || DEMO_USER_ID;

      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: taskData.title,
          category: taskData.category,
          context_tag: taskData.context_tag,
          status: taskData.status,
          progress_percent: 0,
          due_date: taskData.due_date,
        })
        .select()
        .single();

      if (error) throw error;

      if (newTask && initialSubtaskTitles.length > 0) {
        await supabase.from('subtasks').insert(
          initialSubtaskTitles.map((st) => ({
            task_id: newTask.id,
            title: st,
            is_completed: false,
          }))
        );
      }
      return getTasks();
    } catch (err) {
      console.warn('Supabase createTask failed, falling back to local storage:', err);
    }
  }

  const tasks = getLocalTasks();
  const newTaskId = `task-${Date.now()}`;
  const subtasks: Subtask[] = initialSubtaskTitles.map((t, idx) => ({
    id: `st-${newTaskId}-${idx}`,
    task_id: newTaskId,
    title: t,
    is_completed: false,
  }));

  const newTask: Task = {
    id: newTaskId,
    user_id: DEMO_USER_ID,
    title: taskData.title,
    category: taskData.category,
    context_tag: taskData.context_tag,
    status: taskData.status,
    progress_percent: 0,
    due_date: taskData.due_date,
    subtasks,
    created_at: new Date().toISOString(),
  };

  tasks.unshift(newTask);
  saveLocalTasks(tasks);
  return [...tasks];
}

export async function updateTaskStatus(taskId: string, status: Task['status']): Promise<Task[]> {
  const tasks = getLocalTasks();
  const target = tasks.find((t) => t.id === taskId);
  if (target) {
    target.status = status;
    if (status === 'completed') {
      target.progress_percent = 100;
      target.subtasks?.forEach((s) => (s.is_completed = true));
    } else if (status === 'in_progress' && target.progress_percent === 0) {
      target.progress_percent = 50;
    } else if (status === 'not_started') {
      target.progress_percent = 0;
      target.subtasks?.forEach((s) => (s.is_completed = false));
    }
    saveLocalTasks(tasks);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('tasks')
        .update({ status, progress_percent: target?.progress_percent ?? 0 })
        .eq('id', taskId);
    } catch (err) {
      console.warn('Supabase updateTaskStatus failed:', err);
    }
  }

  return [...tasks];
}

export async function deleteTask(taskId: string): Promise<Task[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('tasks').delete().eq('id', taskId);
      return getTasks();
    } catch (err) {
      console.warn('Supabase deleteTask failed:', err);
    }
  }

  const tasks = getLocalTasks().filter((t) => t.id !== taskId);
  saveLocalTasks(tasks);
  return [...tasks];
}

export function resetToDemoData() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(INITIAL_CALENDAR_EVENTS));
  }
}
