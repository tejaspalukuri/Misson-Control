'use client';

import React, { useState } from 'react';
import { Task, CalendarEvent } from '@/types';
import { Sparkles, Bot, AlertCircle, CheckCircle2, Loader2, RefreshCw, Cpu } from 'lucide-react';

interface TaskSummarizerProps {
  tasks: Task[];
  events: CalendarEvent[];
}

export function TaskSummarizer({ tasks, events }: TaskSummarizerProps) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [webGpuSupported, setWebGpuSupported] = useState<boolean | null>(null);

  const checkWebGpu = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    if (!(navigator as any).gpu) {
      setWebGpuSupported(false);
      return false;
    }
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      const supported = Boolean(adapter);
      setWebGpuSupported(supported);
      return supported;
    } catch {
      setWebGpuSupported(false);
      return false;
    }
  };

  const handleGenerateBriefing = async () => {
    setIsLoading(true);
    setError(null);
    setProgress(null);
    setLoadingText('Checking WebGPU device support...');

    const hasGpu = await checkWebGpu();

    // Prepare context from state
    const urgentAcademic = tasks.filter((t) => {
      if (t.status === 'completed') return false;
      if (t.category !== 'course') return false;
      if (!t.due_date) return true;
      const diffHours = (new Date(t.due_date).getTime() - Date.now()) / (1000 * 60 * 60);
      return diffHours < 48;
    });

    const blockedTasks = tasks.filter((t) => t.status === 'blocked');
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
    const todayEvents = events.slice(0, 5);

    const contextPayload = `
Tasks & Schedule Data:
- Urgent Academic Deadlines: ${urgentAcademic.map((t) => `${t.title} (due: ${t.due_date ? new Date(t.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'soon'}, progress: ${t.progress_percent}%)`).join('; ') || 'None'}
- Blocked Tasks: ${blockedTasks.map((t) => `${t.title} [Tag: ${t.context_tag}]`).join('; ') || 'None'}
- Active Tasks in Progress: ${inProgressTasks.map((t) => `${t.title} (${t.progress_percent}% completed)`).join('; ') || 'None'}
- Today's Calendar Schedule: ${todayEvents.map((e) => `${e.title} at ${new Date(e.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`).join('; ') || 'No upcoming calendar events'}
`.trim();

    const systemPrompt = `You are an elite, concise executive assistant for a top college student.
Your task is to summarize impending deadlines, blocked club tasks, and key schedule priorities in exactly 4 clear, action-oriented bullet points. Be sharp, direct, and encouraging.`;

    const userPrompt = `Act as an executive assistant. Summarize these impending deadlines and blocked club tasks in 4 short bullet points.\n\n${contextPayload}`;

    if (!hasGpu) {
      // Fallback generator when browser does not have WebGPU enabled
      setLoadingText('WebGPU not detected on this browser/machine. Generating smart offline briefing...');
      await new Promise((r) => setTimeout(r, 800));

      const fallbackPoints = [
        urgentAcademic.length > 0
          ? `⚠️ Critical Academic: Focus on "${urgentAcademic[0].title}" (${urgentAcademic[0].progress_percent}% done) before the 48-hour cutoff.`
          : `✅ Academics on track: No immediate <48h course deadlines. Maintain your study pace.`,
        blockedTasks.length > 0
          ? `🚫 Immediate Blocker: "${blockedTasks[0].title}" is marked BLOCKED. Follow up with collaborators or teammates today to unstick progress.`
          : `🚀 Smooth Club Ops: No club milestones are currently blocked.`,
        todayEvents.length > 0
          ? `📅 Schedule Focus: Your next key commitment is "${todayEvents[0].title}" at ${new Date(todayEvents[0].start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
          : `📅 Open Calendar: You have open time blocks today—great window for deep work on subtasks.`,
        `🎯 High-leverage goal: Check off remaining subtasks in active projects to drive completion above 80%.`,
      ];

      setBriefing(fallbackPoints.map((p) => `• ${p}`).join('\n\n'));
      setIsLoading(false);
      return;
    }

    try {
      setLoadingText('Loading @mlc-ai/web-llm (SmolLM2-360M-Instruct-q4f16_1-MLC)...');
      const webllm = await import('@mlc-ai/web-llm');

      const initProgressCallback = (report: { text: string; progress?: number }) => {
        setLoadingText(report.text);
        if (typeof report.progress === 'number') {
          setProgress(Math.round(report.progress * 100));
        }
      };

      const selectedModel = 'SmolLM2-360M-Instruct-q4f16_1-MLC';
      const engine = await webllm.CreateMLCEngine(selectedModel, {
        initProgressCallback,
      });

      setLoadingText('Generating client-side AI briefing...');
      const reply = await engine.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 350,
      });

      const responseText = reply.choices[0]?.message?.content || 'Unable to generate summary.';
      setBriefing(responseText.trim());
    } catch (err: any) {
      console.error('WebLLM generation error:', err);
      setError(`WebLLM note: ${err?.message || 'WebGPU model load failed'}. You can still use the instant summary.`);
      
      // Provide immediate fallback summary on error
      const fallbackPoints = [
        urgentAcademic.length > 0
          ? `⚠️ Academic Alert: Prioritize "${urgentAcademic[0].title}" (${urgentAcademic[0].progress_percent}% done) due within 48h.`
          : `✅ Academic Status: No critical course deadlines due in the next 48 hours.`,
        blockedTasks.length > 0
          ? `🚫 Club Project Action: "${blockedTasks[0].title}" is blocked. Reconnect with team members to resolve dependencies.`
          : `🚀 Extracurricular Status: All club milestones progressing without blockers.`,
        todayEvents.length > 0
          ? `📅 Agenda Highlight: "${todayEvents[0].title}" begins at ${new Date(todayEvents[0].start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
          : `📅 Agenda Highlight: Clean schedule today. Ideal for uninterrupted project focus.`,
        `🎯 Action Item: Clear at least 2 subtasks from in-progress assignments today.`,
      ];
      setBriefing(fallbackPoints.map((p) => `• ${p}`).join('\n\n'));
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-base">Zero-Cost AI Morning Briefing</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                <Cpu className="h-3 w-3" /> WebGPU Local LLM
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Powered by <code className="text-indigo-600 font-mono text-[11px]">SmolLM2-360M</code> running 100% locally in your browser. No API keys required.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateBriefing}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating Briefing...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>{briefing ? 'Regenerate Briefing' : 'Generate Briefing'}</span>
            </>
          )}
        </button>
      </div>

      {isLoading && (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-white/90 p-4">
          <div className="flex items-center justify-between text-xs font-medium text-indigo-900 mb-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
              <span>{loadingText || 'Preparing model weights...'}</span>
            </div>
            {progress !== null && <span className="font-mono text-indigo-600">{progress}%</span>}
          </div>
          {progress !== null && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-100">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {briefing && !isLoading && (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Today's Action Items
            </span>
            <span className="text-[11px] text-gray-400">
              Generated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-line font-normal space-y-1">
            {briefing}
          </div>
        </div>
      )}
    </div>
  );
}
