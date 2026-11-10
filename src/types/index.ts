export type TaskCategory = 'course' | 'club' | 'personal';

export type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed';

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  created_at?: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  category: TaskCategory;
  context_tag: string;
  status: TaskStatus;
  progress_percent: number;
  due_date: string | null;
  external_id?: string | null;
  created_at?: string;
  updated_at?: string;
  subtasks?: Subtask[];
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  external_id?: string | null;
  created_at?: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  tasksImported: number;
  eventsImported: number;
  timestamp: string;
}
