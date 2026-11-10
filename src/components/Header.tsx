'use client';

import React from 'react';
import { RefreshCw, Database, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

interface HeaderProps {
  onSync: () => void;
  isSyncing: boolean;
  onResetDemo: () => void;
  lastSyncedText?: string | null;
}

export function Header({ onSync, isSyncing, onResetDemo, lastSyncedText }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-lg shadow-md shadow-indigo-100">
            MC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Mission Control</h1>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 border border-indigo-100">
                MVP
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Unified Schedule, Academic Deadlines &amp; Extracurricular Tracker
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Supabase Status Pill */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
              isSupabaseConfigured
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
            title={
              isSupabaseConfigured
                ? 'Connected to live Supabase database'
                : 'Running in Local Storage / Demo Mode (Set SUPABASE keys in .env.local to link cloud DB)'
            }
          >
            <Database className="h-3.5 w-3.5" />
            <span>{isSupabaseConfigured ? 'Supabase Live' : 'Local Demo Mode'}</span>
          </div>

          {/* Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 active:scale-95 disabled:opacity-50 transition cursor-pointer"
            title="Fetch and parse Canvas LMS and Google Calendar ICS feeds"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : 'text-gray-500'}`} />
            <span>{isSyncing ? 'Syncing Feeds...' : 'Sync ICS Feeds'}</span>
          </button>

          {/* Reset Demo Data button */}
          <button
            onClick={onResetDemo}
            className="rounded-xl border border-gray-200 p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition"
            title="Reset to default college student demo data"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
