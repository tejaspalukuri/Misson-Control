'use client';

import React, { useState } from 'react';
import { Task, CalendarEvent } from '@/types';

interface TaskSummarizerProps {
  tasks: Task[];
  events: CalendarEvent[];
}

export function TaskSummarizer({ tasks, events }: TaskSummarizerProps) {
  const [briefing, setBriefing] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateBriefing = () => {
    setIsLoading(true);

    setTimeout(() => {
      const now = Date.now();

      const urgentAcademic = tasks
        .filter((t) => {
          if (t.status === 'completed' || t.category !== 'course' || !t.due_date) return false;
          const diffHours = (new Date(t.due_date).getTime() - now) / (1000 * 60 * 60);
          return diffHours >= -12 && diffHours < 48;
        })
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

      const blockedTasks = tasks.filter((t) => t.status === 'blocked');
      const inProgress = tasks.filter((t) => t.status === 'in_progress');
      const upcomingEvents = events
        .filter((e) => new Date(e.end_time).getTime() > now)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      const bullets: string[] = [];

      if (urgentAcademic.length > 0) {
        const top = urgentAcademic[0];
        const dueStr = new Date(top.due_date!).toLocaleString([], {
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
        bullets.push(
          `Urgent (${urgentAcademic.length} due <48h) — Prioritize "${top.title}" [${top.context_tag}] due ${dueStr}.`
        );
      } else {
        bullets.push(`Academic — No coursework due in the next 48 hours.`);
      }

      if (blockedTasks.length > 0) {
        bullets.push(
          `Blocked — "${blockedTasks[0].title}" [${blockedTasks[0].context_tag}] requires follow-up.`
        );
      } else {
        bullets.push(`Projects — Zero blocked tasks.`);
      }

      if (upcomingEvents.length > 0) {
        const nextEv = upcomingEvents[0];
        const startStr = new Date(nextEv.start_time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        bullets.push(
          `Next Event — "${nextEv.title}" at ${startStr} (${upcomingEvents.length} remaining today).`
        );
      } else {
        bullets.push(`Schedule — No remaining events today.`);
      }

      if (inProgress.length > 0) {
        bullets.push(
          `Momentum — ${inProgress.length} task(s) in progress; focus on "${inProgress[0].title}".`
        );
      } else {
        const pendingCount = tasks.filter((t) => t.status !== 'completed').length;
        bullets.push(`Focus — ${pendingCount} open task(s) on your board.`);
      }

      setBriefing(bullets);
      setIsLoading(false);
    }, 120);
  };

  return (
    <section className="border-b border-[#d8d5cc] pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#737065]">
            00 / Briefing
          </span>
          <h2 className="mt-1 text-xl font-medium tracking-tight text-[#121c16]">
            Daily Executive Summary
          </h2>
        </div>

        <button
          onClick={handleGenerateBriefing}
          disabled={isLoading}
          className="self-start sm:self-auto border border-[#121c16] bg-[#121c16] text-[#f4f3ee] px-5 py-2 font-mono text-xs uppercase tracking-wider hover:bg-[#244c36] hover:border-[#244c36] transition cursor-pointer disabled:opacity-50"
        >
          {isLoading ? 'Analyzing...' : briefing ? 'Refresh Briefing' : 'Generate Briefing'}
        </button>
      </div>

      {briefing && !isLoading && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 border-t border-[#d8d5cc]/60 pt-5">
          {briefing.map((item, idx) => (
            <div key={idx} className="flex items-baseline gap-3 text-sm text-[#2c352f] leading-relaxed">
              <span className="font-mono text-[11px] text-[#737065]">0{idx + 1}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
