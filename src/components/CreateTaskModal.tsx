'use client';

import React, { useState } from 'react';
import { TaskCategory, TaskStatus } from '@/types';
import { X, Plus, Trash2, Tag, Calendar as CalendarIcon, BookOpen, Users, User } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (
    taskData: {
      title: string;
      category: TaskCategory;
      context_tag: string;
      status: TaskStatus;
      due_date: string | null;
    },
    subtaskTitles: string[]
  ) => void;
}

export function CreateTaskModal({ isOpen, onClose, onCreateTask }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('course');
  const [contextTag, setContextTag] = useState('');
  const [status, setStatus] = useState<TaskStatus>('not_started');
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>(['']);

  if (!isOpen) return null;

  const handleAddSubtaskField = () => {
    setSubtasks((prev) => [...prev, '']);
  };

  const handleUpdateSubtaskField = (index: number, val: string) => {
    setSubtasks((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemoveSubtaskField = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const filteredSubtasks = subtasks.map((s) => s.trim()).filter(Boolean);

    onCreateTask(
      {
        title: title.trim(),
        category,
        context_tag: contextTag.trim() || (category === 'course' ? 'Academic' : category === 'club' ? 'Club' : 'Personal'),
        status,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      },
      filteredSubtasks
    );

    // Reset form
    setTitle('');
    setCategory('course');
    setContextTag('');
    setStatus('not_started');
    setDueDate('');
    setSubtasks(['']);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-bold text-gray-900">Add New Task or Milestone</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Track course assignments, team milestones, or personal tasks
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. CS 1337 Homework 5 or Formula SAE Chassis Tabs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCategory('course');
                  if (!contextTag) setContextTag('CS Course');
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-medium transition cursor-pointer ${
                  category === 'course'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="h-4 w-4" /> Academic Course
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('club');
                  if (!contextTag) setContextTag('Club Project');
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-medium transition cursor-pointer ${
                  category === 'club'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 font-semibold'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users className="h-4 w-4" /> Club Milestone
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('personal');
                  if (!contextTag) setContextTag('Personal');
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-medium transition cursor-pointer ${
                  category === 'personal'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User className="h-4 w-4" /> Personal
              </button>
            </div>
          </div>

          {/* Context Tag and Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Context Tag
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. CS 1337 or FSAE"
                  value={contextTag}
                  onChange={(e) => setContextTag(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Due Date & Time
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Granular Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Granular Subtasks (Progress Checkpoints)
              </label>
              <button
                type="button"
                onClick={handleAddSubtaskField}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="h-3.5 w-3.5" /> Add Subtask
              </button>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
              {subtasks.map((st, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Subtask #${i + 1} milestone...`}
                    value={st}
                    onChange={(e) => handleUpdateSubtaskField(i, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                  {subtasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtaskField(i)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
