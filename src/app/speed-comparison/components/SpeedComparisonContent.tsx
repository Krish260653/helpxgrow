'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import PDFExportButton from '@/components/PDFExportButton';

interface Task {
  id: string;
  labelEn: string;
  labelHi: string;
  manualSeconds: number;
  aiSeconds: number;
  icon: string;
}

const TASKS: Task[] = [
  { id: 'task-1', labelEn: 'Employee Onboarding', labelHi: 'एम्प्लॉई ऑनबोर्डिंग', manualSeconds: 18, aiSeconds: 2, icon: '👤' },
  { id: 'task-2', labelEn: 'Meeting → Action Items', labelHi: 'मीटिंग → एक्शन आइटम', manualSeconds: 22, aiSeconds: 2, icon: '📋' },
  { id: 'task-3', labelEn: 'SLA Breach Detection', labelHi: 'SLA ब्रीच डिटेक्शन', manualSeconds: 20, aiSeconds: 2, icon: '🛡️' },
  { id: 'task-4', labelEn: 'Compliance Check', labelHi: 'कम्प्लायंस चेक', manualSeconds: 25, aiSeconds: 2, icon: '✅' },
  { id: 'task-5', labelEn: 'Audit Trail Creation', labelHi: 'ऑडिट ट्रेल बनाना', manualSeconds: 15, aiSeconds: 2, icon: '📝' },
];

const TOTAL_MANUAL = TASKS.reduce((s, t) => s + t.manualSeconds, 0);
const TOTAL_AI = TASKS.reduce((s, t) => s + t.aiSeconds, 0);

export default function SpeedComparisonContent() {
  const { lang } = useApp();
  const [running, setRunning] = useState(false);
  const [manualElapsed, setManualElapsed] = useState(0);
  const [aiElapsed, setAiElapsed] = useState(0);
  const [manualDone, setManualDone] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [raceComplete, setRaceComplete] = useState(false);
  const manualRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearIntervals = () => {
    if (manualRef.current) clearInterval(manualRef.current);
    if (aiRef.current) clearInterval(aiRef.current);
  };

  const reset = useCallback(() => {
    clearIntervals();
    setRunning(false);
    setManualElapsed(0);
    setAiElapsed(0);
    setManualDone(false);
    setAiDone(false);
    setRaceComplete(false);
  }, []);

  const startRace = () => {
    reset();
    setTimeout(() => {
      setRunning(true);
      startTimeRef.current = Date.now();

      aiRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const scaled = (elapsed / TOTAL_AI) * TOTAL_AI;
        setAiElapsed(Math.min(scaled, TOTAL_AI));
        if (scaled >= TOTAL_AI) {
          clearInterval(aiRef.current!);
          setAiDone(true);
        }
      }, 50);

      manualRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const scaled = (elapsed / TOTAL_AI) * TOTAL_MANUAL;
        setManualElapsed(Math.min(scaled, TOTAL_MANUAL));
        if (scaled >= TOTAL_MANUAL) {
          clearInterval(manualRef.current!);
          setManualDone(true);
          setRaceComplete(true);
          setRunning(false);
        }
      }, 50);
    }, 50);
  };

  useEffect(() => () => clearIntervals(), []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
    return `${String(s).padStart(2, '0')}.${ms}s`;
  };

  const getTaskProgress = (task: Task, elapsed: number, total: number) => {
    const taskStart = TASKS.slice(0, TASKS.indexOf(task)).reduce((s, t) => {
      const dur = total === TOTAL_MANUAL ? t.manualSeconds : t.aiSeconds;
      return s + dur;
    }, 0);
    const taskDur = total === TOTAL_MANUAL ? task.manualSeconds : task.aiSeconds;
    const pct = Math.min(Math.max((elapsed - taskStart) / taskDur, 0), 1);
    return pct;
  };

  return (
    <div id="speed-comparison-pdf-target" className="min-h-screen bg-zinc-950 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0 sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">⚡</span>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {lang === 'en' ? 'Speed Comparison' : 'स्पीड तुलना'}
            </h1>
          </div>
          <p className="text-sm text-zinc-500 ml-9">
            {lang === 'en' ?'Manual process vs HELPxGROW AI — live race' :'मैनुअल प्रक्रिया बनाम HELPxGROW AI — लाइव रेस'}
          </p>
        </div>
        <PDFExportButton
          targetId="speed-comparison-pdf-target"
          filename="speed-comparison"
          title="Speed Comparison"
          lang={lang}
        />
      </div>

      {/* Race completion banner */}
      {raceComplete && (
        <div className="mb-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl px-5 py-4 flex flex-col md:flex-row items-center gap-4">
          <div className="text-4xl">🏆</div>
          <div className="flex-1 text-center md:text-left">
            <div className="text-lg font-bold text-white">
              {lang === 'en' ? 'HELPxGROW Wins!' : 'HELPxGROW जीता!'}
            </div>
            <div className="text-sm text-zinc-400">
              {lang === 'en'
                ? `Completed all 5 tasks in ${formatTime(TOTAL_AI)} vs manual ${formatTime(TOTAL_MANUAL)}`
                : `5 टास्क ${formatTime(TOTAL_AI)} में पूरे — मैनुअल ${formatTime(TOTAL_MANUAL)}`}
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-cyan-400">207×</div>
            <div className="text-xs text-zinc-500">
              {lang === 'en' ? 'faster in production' : 'प्रोडक्शन में तेज़'}
            </div>
          </div>
        </div>
      )}

      {/* Dual timer display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Manual timer */}
        <div className={`bg-zinc-900 border rounded-2xl p-4 md:p-6 text-center transition-all duration-300 ${manualDone ? 'border-red-500/40' : 'border-zinc-800'}`}>
          <div className="text-2xl mb-2">🐌</div>
          <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">
            {lang === 'en' ? 'Manual Process' : 'मैनुअल प्रक्रिया'}
          </div>
          <div className={`text-2xl sm:text-3xl md:text-4xl font-black font-mono transition-colors ${manualDone ? 'text-red-400' : 'text-zinc-300'}`}>
            {formatTime(manualElapsed)}
          </div>
          {manualDone && (
            <div className="mt-2 text-xs text-red-400 font-medium">
              {lang === 'en' ? '✓ Finished' : '✓ समाप्त'}
            </div>
          )}
          {running && !manualDone && (
            <div className="mt-2 flex justify-center">
              <div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" />
            </div>
          )}
        </div>

        {/* AI timer */}
        <div className={`bg-zinc-900 border rounded-2xl p-4 md:p-6 text-center transition-all duration-300 ${aiDone ? 'border-cyan-500/40' : 'border-zinc-800'}`}>
          <div className="text-2xl mb-2">🚀</div>
          <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">
            {lang === 'en' ? 'HELPxGROW AI' : 'HELPxGROW AI'}
          </div>
          <div className={`text-2xl sm:text-3xl md:text-4xl font-black font-mono transition-colors ${aiDone ? 'text-cyan-400' : 'text-cyan-300'}`}>
            {formatTime(aiElapsed)}
          </div>
          {aiDone && (
            <div className="mt-2 text-xs text-cyan-400 font-medium">
              {lang === 'en' ? '✓ Finished' : '✓ समाप्त'}
            </div>
          )}
          {running && !aiDone && (
            <div className="mt-2 flex justify-center">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* 5 Progress bars */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 mb-6">
        <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
          {lang === 'en' ? 'Task Progress' : 'टास्क प्रगति'}
        </h2>
        <div className="space-y-4">
          {TASKS.map(task => {
            const manualPct = getTaskProgress(task, manualElapsed, TOTAL_MANUAL) * 100;
            const aiPct = getTaskProgress(task, aiElapsed, TOTAL_AI) * 100;
            return (
              <div key={task.id}>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-sm">{task.icon}</span>
                  <span className="text-xs font-medium text-zinc-300">
                    {lang === 'en' ? task.labelEn : task.labelHi}
                  </span>
                  <span className="ml-auto text-[10px] font-mono text-zinc-600">
                    {lang === 'en'
                      ? `Manual: ${task.manualSeconds}s | AI: ${task.aiSeconds}s`
                      : `मैनुअल: ${task.manualSeconds}s | AI: ${task.aiSeconds}s`}
                  </span>
                </div>
                {/* Manual bar */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] text-zinc-600 w-12 text-right">
                    {lang === 'en' ? 'Manual' : 'मैनुअल'}
                  </span>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-100"
                      style={{ width: `${manualPct}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600 w-8">{Math.round(manualPct)}%</span>
                </div>
                {/* AI bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-600 w-12 text-right">AI</span>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-100"
                      style={{ width: `${aiPct}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-cyan-500 w-8">{Math.round(aiPct)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls + stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex gap-3">
          <button
            onClick={startRace}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-900 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-95 min-h-[44px] touch-manipulation"
          >
            {running ? (
              <>
                <span className="w-3 h-3 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                {lang === 'en' ? 'Racing…' : 'रेस चल रही है…'}
              </>
            ) : (
              <>
                <span>🏁</span>
                {lang === 'en' ? 'Start Race' : 'रेस शुरू करें'}
              </>
            )}
          </button>
          <button
            onClick={reset}
            className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm transition-all duration-150 min-h-[44px] touch-manipulation"
          >
            {lang === 'en' ? 'Reset' : 'रीसेट'}
          </button>
        </div>

        {/* Speedup stat */}
        <div className="flex items-center gap-4 sm:ml-auto flex-wrap">
          <div className="text-center">
            <div className="text-2xl font-black text-cyan-400">207×</div>
            <div className="text-[10px] text-zinc-600">
              {lang === 'en' ? 'Production speedup' : 'प्रोडक्शन स्पीडअप'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-green-400">99%</div>
            <div className="text-[10px] text-zinc-600">
              {lang === 'en' ? 'SLA compliance' : 'SLA कम्प्लायंस'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-purple-400">94%</div>
            <div className="text-[10px] text-zinc-600">
              {lang === 'en' ? 'Autonomy score' : 'ऑटोनॉमी स्कोर'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
