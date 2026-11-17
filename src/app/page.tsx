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
  mergeImportedData,
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
    setSyncNotice('Connecting to Canvas & Calendar feeds...');
    try {
      // Call live sync route
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (data.tasks && data.tasks.length > 0) {
          const { tasks: mergedTasks, events: mergedEvents } = mergeImportedData(
            data.tasks,
            data.events || []
          );
          setTasks(mergedTasks);
          setEvents(mergedEvents);
          setSyncNotice(
            `Sync Complete: Successfully imported ${data.tasksImported} Canvas assignments & ${data.eventsImported} events!`
          );
        } else {
          setSyncNotice('Sync Complete: Feeds checked, no new items.');
        }
      } else {
        setSyncNotice(`Sync issue: ${data.error || 'Check server logs'}`);
      }
    } catch (err: any) {
      setSyncNotice(`Sync failed: ${err?.message || 'Network error'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncNotice(null), 8000);
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
    return diffHours < 48 && diffHours > -24;
  }).length;

  const clubCount = tasks.filter((t) => t.category === 'club').length;
  const blockedCount = tasks.filter((t) => t.status === 'blocked').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="min-h-screen bg-[#f4f3ee] text-[#121c16] flex flex-col">
      <Header
        onSync={handleSync}
        isSyncing={isSyncing}
        onResetDemo={handleResetDemo}
      />

      {syncNotice && (
        <div className="border-b border-[#d8d5cc] bg-[#244c36] text-[#f4f3ee] font-mono text-xs py-2 px-6 text-center tracking-wide">
          {syncNotice}
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-10 py-10 space-y-12">
        {/* 00 / Briefing */}
        <TaskSummarizer tasks={tasks} events={events} />

        {/* 01 / Agenda & 02 / Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <AgendaSchedule
              events={events}
              onTriggerSync={handleSync}
              isSyncing={isSyncing}
            />
          </div>

          <div className="lg:col-span-7">
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

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateTask={handleCreateTask}
      />

      <footer className="border-t border-[#d8d5cc] py-6 px-6 sm:px-10 max-w-7xl w-full mx-auto flex justify-between font-mono text-[11px] uppercase tracking-wider text-[#737065]">
        <span>Mission Control</span>
        <span>UT Dallas</span>
      </footer>
    </div>
  );
}
