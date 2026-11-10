'use client';

import React from 'react';
import { CalendarEvent } from '@/types';
import { Calendar as CalendarIcon, Clock, MapPin, ExternalLink, Sparkles } from 'lucide-react';

interface AgendaScheduleProps {
  events: CalendarEvent[];
  onTriggerSync?: () => void;
  isSyncing?: boolean;
}

export function AgendaSchedule({ events, onTriggerSync, isSyncing }: AgendaScheduleProps) {
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });

  const now = new Date();

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Today's Agenda</h2>
            <p className="text-xs text-gray-500">
              {now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 border border-sky-100">
          {events.length} {events.length === 1 ? 'Event' : 'Events'}
        </span>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
          <CalendarIcon className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm font-medium text-gray-700">No events scheduled for today</p>
          <p className="text-xs text-gray-400 mt-1">
            Sync your Canvas or Google Calendar ICS feed to import your class schedule.
          </p>
          {onTriggerSync && (
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Sync Feeds Now
            </button>
          )}
        </div>
      ) : (
        <div className="relative pl-4 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
          {sortedEvents.map((event) => {
            const activeNow = isEventNow(event.start_time, event.end_time);
            const isPast = isEventPast(event.end_time);

            return (
              <div key={event.id} className="relative group">
                {/* Timeline node */}
                <div
                  className={`absolute -left-4 top-1.5 h-3 w-3 rounded-full border-2 bg-white transition-all ${
                    activeNow
                      ? 'border-emerald-500 ring-4 ring-emerald-100 bg-emerald-500'
                      : isPast
                      ? 'border-gray-300 bg-gray-200'
                      : 'border-sky-500 bg-white'
                  }`}
                />

                <div
                  className={`rounded-xl border p-3.5 transition-all ${
                    activeNow
                      ? 'border-emerald-200 bg-emerald-50/50 shadow-sm'
                      : isPast
                      ? 'border-gray-100 bg-gray-50/50 opacity-75'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`text-sm font-medium leading-snug ${
                        isPast ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}
                    >
                      {event.title}
                    </h3>
                    {activeNow && (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 animate-pulse">
                        Happening Now
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      {formatTime(event.start_time)} – {formatTime(event.end_time)}
                    </span>

                    {event.external_id && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                        <ExternalLink className="h-3 w-3" />
                        {event.external_id.startsWith('canvas')
                          ? 'Canvas'
                          : event.external_id.startsWith('gcal')
                          ? 'GCal'
                          : 'ICS Sync'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
