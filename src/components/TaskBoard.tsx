'use client';

import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types';

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
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [newSubtaskInput, setNewSubtaskInput] = useState<Record<string, string>>({});

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
    if (task.category !== 'course' || task.status === 'completed' || !task.due_date) return false;
    const diffHours = (new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60);
    return diffHours < 48;
  };

  const urgentAcademicTasks = tasks.filter((t) => isUrgentAcademic(t));
  const clubTasks = tasks.filter((t) => t.category === 'club');
  const otherTasks = tasks.filter((t) => !isUrgentAcademic(t) && t.category !== 'club');

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const diffHours = (date.getTime() - Date.now()) / (1000 * 60 * 60);

    if (diffHours < 0) return 'OVERDUE';
    if (diffHours < 24) return `DUE IN ${Math.round(diffHours)}H`;
    if (diffHours < 48) return 'DUE TOMORROW';
    return `DUE ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}`;
  };

  const renderTaskRow = (task: Task) => {
    const isExpanded = expandedTasks[task.id] ?? false;
    const subtasks = task.subtasks || [];
    const completedCount = subtasks.filter((s) => s.is_completed).length;
    const totalCount = subtasks.length;
    const percent = task.progress_percent ?? 0;
    const dueLabel = formatDueDate(task.due_date);

    return (
      <div key={task.id} className="py-4 border-b border-[#d8d5cc] group">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-[#737065] uppercase tracking-wider mb-1">
              {task.context_tag && <span className="text-[#244c36] font-semibold">{task.context_tag}</span>}
              {dueLabel && <span>{dueLabel}</span>}
              {task.status === 'blocked' && <span className="text-[#9e3f24] font-semibold">BLOCKED</span>}
              {totalCount > 0 && (
                <span>
                  {completedCount}/{totalCount} STEPS
                </span>
              )}
            </div>

            <h3
              onClick={() => toggleExpand(task.id)}
              className={`text-sm font-medium cursor-pointer hover:text-[#244c36] transition ${
                task.status === 'completed' ? 'line-through text-[#737065]' : 'text-[#121c16]'
              }`}
            >
              {task.title}
            </h3>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-xs text-[#737065]">{percent}%</span>
            <select
              value={task.status}
              onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
              className="font-mono text-[11px] uppercase bg-transparent border border-[#d8d5cc] px-2 py-1 text-[#121c16] focus:outline-none focus:border-[#121c16] cursor-pointer"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
            </select>
            <button
              onClick={() => onDeleteTask(task.id)}
              className="font-mono text-[11px] uppercase text-[#737065] hover:text-[#9e3f24] opacity-0 group-hover:opacity-100 transition cursor-pointer"
              title="Delete task"
            >
              DEL
            </button>
          </div>
        </div>

        {/* Minimal 2px Progress Line */}
        <div className="mt-2.5 h-[2px] w-full bg-[#e2dfd7]">
          <div
            className={`h-full transition-all duration-300 ${
              task.status === 'blocked' ? 'bg-[#9e3f24]' : 'bg-[#244c36]'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Subtasks */}
        {isExpanded && (
          <div className="mt-3 pl-4 border-l border-[#d8d5cc] space-y-2">
            {subtasks.map((st) => (
              <label
                key={st.id}
                className="flex items-center gap-2.5 text-xs cursor-pointer select-none text-[#2c352f]"
              >
                <input
                  type="checkbox"
                  checked={st.is_completed}
                  onChange={() => onToggleSubtask(task.id, st.id)}
                  className="accent-[#244c36] h-3.5 w-3.5 cursor-pointer"
                />
                <span className={st.is_completed ? 'line-through text-[#737065]' : ''}>
                  {st.title}
                </span>
              </label>
            ))}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add step (Enter)..."
                value={newSubtaskInput[task.id] || ''}
                onChange={(e) =>
                  setNewSubtaskInput((prev) => ({ ...prev, [task.id]: e.target.value }))
                }
                onKeyDown={(e) => handleSubtaskKeyDown(task.id, e)}
                className="flex-1 bg-transparent border-b border-[#d8d5cc] py-1 text-xs placeholder:text-[#9a968c] focus:border-[#121c16] focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-10">
      <div className="flex items-baseline justify-between border-b border-[#121c16] pb-3">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#737065]">
            02 / Tasks
          </span>
          <h2 className="mt-1 text-2xl font-medium tracking-tight text-[#121c16]">
            Deliverables
          </h2>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="font-mono text-xs uppercase tracking-wider text-[#121c16] border border-[#121c16] px-4 py-1.5 hover:bg-[#121c16] hover:text-[#f4f3ee] transition cursor-pointer"
        >
          + New Task
        </button>
      </div>

      {/* Urgent Academic */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono text-xs uppercase tracking-widest text-[#737065]">
            Urgent Academic (&lt; 48h)
          </h3>
          <span className="font-mono text-xs text-[#737065]">{urgentAcademicTasks.length}</span>
        </div>
        {urgentAcademicTasks.length === 0 ? (
          <p className="py-4 text-xs text-[#737065] border-b border-[#d8d5cc]">
            No academic deadlines within 48 hours.
          </p>
        ) : (
          <div>{urgentAcademicTasks.map(renderTaskRow)}</div>
        )}
      </div>

      {/* Active Club Projects */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono text-xs uppercase tracking-widest text-[#737065]">
            Club Projects
          </h3>
          <span className="font-mono text-xs text-[#737065]">{clubTasks.length}</span>
        </div>
        {clubTasks.length === 0 ? (
          <p className="py-4 text-xs text-[#737065] border-b border-[#d8d5cc]">
            No active club projects.
          </p>
        ) : (
          <div>{clubTasks.map(renderTaskRow)}</div>
        )}
      </div>

      {/* Other Courses & Personal */}
      {otherTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#737065]">
              Courses &amp; Personal
            </h3>
            <span className="font-mono text-xs text-[#737065]">{otherTasks.length}</span>
          </div>
          <div>{otherTasks.map(renderTaskRow)}</div>
        </div>
      )}
    </section>
  );
}
