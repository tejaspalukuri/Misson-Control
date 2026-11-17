'use client';

import React from 'react';
import { CalendarEvent } from '@/types';

interface AgendaScheduleProps {
  events: CalendarEvent[];
  onTriggerSync?: () => void;
  isSyncing?: boolean;
}

export function AgendaSchedule({ events, onTriggerSync, isSyncing }: AgendaScheduleProps) {
  const sortedEvents = [...events]
    .filter((e) => {
      if (e.external_id?.startsWith('event-assignment-')) return false;
      const s = new Date(e.start_time);
      const end = new Date(e.end_time);
      const isMidnightZero =
        s.getTime() === end.getTime() && s.getHours() === 0 && s.getMinutes() === 0;
      return !isMidnightZero;
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const now = new Date();

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return isoString;
    }
  };

  const isEventNow = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const current = now.getTime();
    return current >= s && current <= e;
  };

  const isEventPast = (end: string) => {
    return new Date(end).getTime() < now.getTime();
  };

  return (
    <section>
      <div className="flex items-baseline justify-between border-b border-[#121c16] pb-3 mb-6">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#737065]">
            01 / Agenda
          </span>
          <h2 className="mt-1 text-2xl font-medium tracking-tight text-[#121c16]">
            Schedule
          </h2>
        </div>
        <span className="font-mono text-xs text-[#737065]">
          {sortedEvents.length} {sortedEvents.length === 1 ? 'ITEM' : 'ITEMS'}
        </span>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="py-10 border-b border-[#d8d5cc] text-sm text-[#737065]">
          <p>No timed events scheduled for today.</p>
          {onTriggerSync && (
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="mt-4 font-mono text-xs uppercase tracking-wider text-[#244c36] underline underline-offset-4 hover:text-[#121c16] cursor-pointer"
            >
              Sync Calendar
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-[#d8d5cc]">
          {sortedEvents.map((event) => {
            const activeNow = isEventNow(event.start_time, event.end_time);
            const isPast = isEventPast(event.end_time);

            return (
              <div
                key={event.id}
                className={`py-4 flex items-baseline justify-between gap-4 transition-opacity ${
                  isPast ? 'opacity-45' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#737065] shrink-0">
                      {formatTime(event.start_time)} — {formatTime(event.end_time)}
                    </span>
                    {activeNow && (
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[#244c36] font-semibold">
                        Live
                      </span>
                    )}
                  </div>
                  <h3
                    className={`mt-1 text-sm font-medium text-[#121c16] ${
                      isPast ? 'line-through' : ''
                    }`}
                  >
                    {event.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
