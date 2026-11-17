'use client';

import React from 'react';

interface HeaderProps {
  onSync: () => void;
  isSyncing: boolean;
  onResetDemo: () => void;
  lastSyncedText?: string | null;
}

export function Header({ onSync, isSyncing, onResetDemo }: HeaderProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="border-b border-[#d8d5cc] bg-[#f4f3ee]/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
        <div className="flex items-baseline gap-4">
          <h1 className="text-sm font-semibold tracking-[0.18em] uppercase text-[#121c16]">
            Mission Control
          </h1>
          <span className="hidden sm:inline font-mono text-xs text-[#737065] uppercase">
            {today}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="font-mono text-xs uppercase tracking-wider text-[#244c36] hover:text-[#121c16] disabled:opacity-40 transition cursor-pointer"
          >
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>

          <button
            onClick={onResetDemo}
            className="font-mono text-xs uppercase tracking-wider text-[#737065] hover:text-[#121c16] transition cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
