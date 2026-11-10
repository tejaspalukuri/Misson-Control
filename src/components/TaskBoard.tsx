'use client';

import React, { useState } from 'react';
import { Task, Subtask, TaskStatus } from '@/types';
import {
  CheckSquare,
  Square,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Tag,
  GraduationCap,
  Users,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenCreateModal: () => void;
}

export function TaskBoard({
  tasks,
  onToggleSubtask,
  onAddSubtask,
  onUpdateStatus,
  onDeleteTask,
  onOpenCreateModal,
}: TaskBoardProps) {
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({
    't-1': true,
    't-4': true,
  });
  const [newSubtaskInput, setNewSubtaskInput] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'urgent' | 'club' | 'personal'>('all');

  const toggleExpand = (id: string) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubtaskKeyDown = (taskId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSubtaskInput[taskId]?.trim()) {
      onAddSubtask(taskId, newSubtaskInput[taskId].trim());
      setNewSubtaskInput((prev) => ({ ...prev, [taskId]: '' }));
    }
  };

  const isUrgentAcademic = (task: Task) => {
    if (task.category !== 'course') return false;
    if (task.status === 'completed') return false;
    if (!task.due_date) return false;
    const diffHours = (new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60);
    return diffHours < 48;
  };

  const urgentAcademicTasks = tasks.filter((t) => isUrgentAcademic(t));
  const clubTasks = tasks.filter((t) => t.category === 'club');
  const otherTasks = tasks.filter((t) => !isUrgentAcademic(t) && t.category !== 'club');

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
            <AlertTriangle className="h-3 w-3 text-red-500" /> BLOCKED
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
            Completed
          </span>
        );
      case 'not_started':
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            Not Started
          </span>
        );
    }
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const diffHours = (date.getTime() - Date.now()) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return <span className="text-red-600 font-semibold">Overdue</span>;
    }
    if (diffHours < 24) {
      return <span className="text-amber-600 font-medium">Due in {Math.round(diffHours)}h</span>;
    }
    if (diffHours < 48) {
      return <span className="text-indigo-600 font-medium">Due Tomorrow</span>;
    }
    return (
      <span className="text-gray-500">
        Due {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </span>
    );
  };

  const renderTaskCard = (task: Task) => {
    const isExpanded = expandedTasks[task.id] ?? false;
    const subtasks = task.subtasks || [];
    const completedCount = subtasks.filter((s) => s.is_completed).length;
    const totalCount = subtasks.length;
    const percent = task.progress_percent ?? 0;

    return (
      <div
        key={task.id}
        className={`rounded-xl border transition-all ${
          task.status === 'blocked'
            ? 'border-red-200 bg-red-50/20'
            : task.status === 'completed'
            ? 'border-gray-200 bg-gray-50/50 opacity-80'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        } p-4`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {task.context_tag && (
                <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  <Tag className="h-3 w-3" /> {task.context_tag}
                </span>
              )}
              {getStatusBadge(task.status)}
              {formatDueDate(task.due_date)}
            </div>

            <h3
              className={`text-sm font-semibold text-gray-900 leading-snug ${
                task.status === 'completed' ? 'line-through text-gray-500' : ''
              }`}
            >
              {task.title}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <select
              value={task.status}
              onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
              className="text-xs rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
            </select>
            <button
              onClick={() => onDeleteTask(task.id)}
              className="rounded p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Subtask Summary */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5 font-medium">
            <div className="flex items-center gap-1.5">
              <span>Progress</span>
              {totalCount > 0 && (
                <span className="text-gray-400">
                  ({completedCount}/{totalCount} subtasks)
                </span>
              )}
            </div>
            <span className="font-semibold text-gray-700 font-mono">{percent}%</span>
          </div>

          {/* Segmented / Smooth Progress Bar */}
          {totalCount > 1 ? (
            <div className="flex gap-1 h-2 w-full">
              {subtasks.map((st, i) => (
                <div
                  key={st.id || i}
                  className={`h-full flex-1 rounded-sm transition-all duration-300 ${
                    st.is_completed
                      ? 'bg-emerald-500'
                      : task.status === 'blocked'
                      ? 'bg-red-200'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          ) : (
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full transition-all duration-300 ${
                  percent === 100
                    ? 'bg-emerald-500'
                    : task.status === 'blocked'
                    ? 'bg-red-400'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          )}
        </div>

        {/* Subtasks Accordion Toggle */}
        <div className="mt-3 pt-2.5 border-t border-gray-100">
          <button
            onClick={() => toggleExpand(task.id)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-indigo-600 transition"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            )}
            <span>
              {isExpanded ? 'Hide Subtasks' : `View Subtasks (${completedCount}/${totalCount})`}
            </span>
          </button>

          {isExpanded && (
            <div className="mt-2.5 space-y-2 pl-2">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => onToggleSubtask(task.id, st.id)}
                  className="group flex items-start gap-2.5 text-xs cursor-pointer select-none py-0.5"
                >
                  <button
                    type="button"
                    className="mt-0.5 text-indigo-600 hover:text-indigo-800 transition"
                  >
                    {st.is_completed ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    )}
                  </button>
                  <span
                    className={`leading-relaxed ${
                      st.is_completed
                        ? 'text-gray-400 line-through'
                        : 'text-gray-700 group-hover:text-gray-900'
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
              ))}

              {/* Quick Add Subtask Input */}
              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="text"
                  placeholder="Add a subtask (press Enter)..."
                  value={newSubtaskInput[task.id] || ''}
                  onChange={(e) =>
                    setNewSubtaskInput((prev) => ({ ...prev, [task.id]: e.target.value }))
                  }
                  onKeyDown={(e) => handleSubtaskKeyDown(task.id, e)}
                  className="flex-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSubtaskInput[task.id]?.trim()) {
                      onAddSubtask(task.id, newSubtaskInput[task.id].trim());
                      setNewSubtaskInput((prev) => ({ ...prev, [task.id]: '' }));
                    }
                  }}
                  className="rounded-md bg-gray-100 p-1 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Task & Project Board</h2>
          <p className="text-xs text-gray-500">
            Organized by urgency and extracurricular commitments
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Task / Project</span>
        </button>
      </div>

      {/* Section 1: Urgent Academic Deadlines (<48h) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-100 text-rose-700">
              <GraduationCap className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              Urgent Academic Deadlines (&lt; 48h)
            </h3>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-100">
              {urgentAcademicTasks.length}
            </span>
          </div>
        </div>

        {urgentAcademicTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 text-center text-xs text-gray-500">
            No academic assignments due in the next 48 hours. Great job staying ahead!
          </div>
        ) : (
          <div className="grid gap-3">{urgentAcademicTasks.map(renderTaskCard)}</div>
        )}
      </div>

      {/* Section 2: Active Club Projects & Extracurriculars */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-100 text-purple-700">
              <Users className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              Active Club Projects & Extracurriculars
            </h3>
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-100">
              {clubTasks.length}
            </span>
          </div>
        </div>

        {clubTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 text-center text-xs text-gray-500">
            No club projects active. Add a club milestone to track subteam progress.
          </div>
        ) : (
          <div className="grid gap-3">{clubTasks.map(renderTaskCard)}</div>
        )}
      </div>

      {/* Section 3: Other Courses & Personal Priorities */}
      {otherTasks.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                <UserCheck className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                Other Courses & Personal Priorities
              </h3>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-100">
                {otherTasks.length}
              </span>
            </div>
          </div>

          <div className="grid gap-3">{otherTasks.map(renderTaskCard)}</div>
        </div>
      )}
    </div>
  );
}
