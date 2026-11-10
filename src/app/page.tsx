'use client';

import React, { useState, useEffect } from 'react';
import { Task, CalendarEvent, TaskStatus } from '@/types';
import {
  getTasks,
  getCalendarEvents,
  toggleSubtask,
  addSubtask,
  createTask,
  updateTaskStatus,
  deleteTask,
  resetToDemoData,
} from '@/lib/storage';
import { Header } from '@/components/Header';
import { TaskSummarizer } from '@/components/TaskSummarizer';
import { AgendaSchedule } from '@/components/AgendaSchedule';
import { TaskBoard } from '@/components/TaskBoard';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Load initial data
  const loadData = async () => {
    try {
      const [loadedTasks, loadedEvents] = await Promise.all([
        getTasks(),
        getCalendarEvents(),
      ]);
      setTasks(loadedTasks);
      setEvents(loadedEvents);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Task actions
  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const updated = await toggleSubtask(taskId, subtaskId);
    setTasks(updated);
  };

  const handleAddSubtask = async (taskId: string, title: string) => {
    const updated = await addSubtask(taskId, title);
    setTasks(updated);
  };

  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    const updated = await updateTaskStatus(taskId, status);
    setTasks(updated);
  };

  const handleDeleteTask = async (taskId: string) => {
    const updated = await deleteTask(taskId);
    setTasks(updated);
  };

  const handleCreateTask = async (
    taskData: {
      title: string;
      category: any;
      context_tag: string;
      status: TaskStatus;
      due_date: string | null;
    },
    subtasks: string[]
  ) => {
    const updated = await createTask(taskData, subtasks);
    setTasks(updated);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const res = await fetch('/api/sync?demo=true', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncNotice(
          `Sync Complete: ${data.tasksImported} assignments and ${data.eventsImported} calendar events processed.`
        );
        // Refresh data
        await loadData();
      } else {
        setSyncNotice(`Sync issue: ${data.error || 'Check server logs'}`);
      }
    } catch (err: any) {
      setSyncNotice(`Sync failed: ${err?.message || 'Network error'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncNotice(null), 6000);
    }
  };

  const handleResetDemo = () => {
    if (confirm('Reset dashboard to default college student demo data?')) {
      resetToDemoData();
      loadData();
    }
  };

  // Metrics
  const urgentAcademicCount = tasks.filter((t) => {
    if (t.status === 'completed' || t.category !== 'course' || !t.due_date) return false;
    const diffHours = (new Date(t.due_date).getTime() - Date.now()) / (1000 * 60 * 60);
    return diffHours < 48;
  }).length;

  const clubCount = tasks.filter((t) => t.category === 'club').length;
  const blockedCount = tasks.filter((t) => t.status === 'blocked').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col">
      <Header
        onSync={handleSync}
        isSyncing={isSyncing}
        onResetDemo={handleResetDemo}
      />

      {syncNotice && (
        <div className="bg-indigo-600 text-white text-xs py-2 px-4 text-center font-medium shadow-inner flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{syncNotice}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Urgent (&lt;48h)</span>
              <Flame className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{urgentAcademicCount}</div>
            <p className="text-[11px] text-rose-600 font-medium mt-0.5">Academic deadlines</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Club Milestones</span>
              <Clock className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{clubCount}</div>
            <p className="text-[11px] text-purple-600 font-medium mt-0.5">Active projects</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Blocked Tasks</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{blockedCount}</div>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">Needing unblocking</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Schedule Today</span>
              <CalendarIcon className="h-4 w-4 text-sky-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{events.length}</div>
            <p className="text-[11px] text-sky-600 font-medium mt-0.5">Classes &amp; meetings</p>
          </div>
        </div>

        {/* Feature 3: WebLLM Morning Briefing Component */}
        <TaskSummarizer tasks={tasks} events={events} />

        {/* Main 2-Column Dashboard Layout (Left: Schedule / Right: Task Board) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Chronological Today's Agenda (4 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            <AgendaSchedule
              events={events}
              onTriggerSync={handleSync}
              isSyncing={isSyncing}
            />
          </div>

          {/* Right Column: Unified Task Board (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            <TaskBoard
              tasks={tasks}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onUpdateStatus={handleUpdateStatus}
              onDeleteTask={handleDeleteTask}
              onOpenCreateModal={() => setIsModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Modal Dialog for New Tasks */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateTask={handleCreateTask}
      />

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
        Mission Control &bull; College Student Dashboard MVP &bull; Powered by Next.js, Supabase &amp; WebLLM
      </footer>
    </div>
  );
}
