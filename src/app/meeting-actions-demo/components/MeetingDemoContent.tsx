'use client';
import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import Confetti from '@/components/Confetti';
import PDFExportButton from '@/components/PDFExportButton';
import GuidedTour, { TourStep } from '@/components/GuidedTour';
import { workflowLogService } from '@/lib/services/workflowLogService';

type StepStatus = 'idle' | 'running' | 'success' | 'error' | 'warning';

interface Step {
  id: string;
  icon: string;
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  duration: number;
  status: StepStatus;
  preColor?: StepStatus;
  logEn: string;
  logHi: string;
}

interface ActionItem {
  id: string;
  itemEn: string;
  itemHi: string;
  owner: string;
  confidence: number;
  status: 'assigned' | 'flagged';
  linear: string | null;
  dueEn: string;
  dueHi: string;
}

interface AnimatedLogEntry {
  text: string;
  key: number;
}

const INITIAL_STEPS: Step[] = [
  { id: 'mstep-01', icon: '📥', titleEn: 'Ingest Transcript', titleHi: 'ट्रांस्क्रिप्ट इंजेस्ट', descEn: 'Q3 Planning · 47 min · 8,241 tokens', descHi: 'Q3 प्लानिंग · 47 मिनट · 8,241 टोकन', duration: 1000, status: 'idle', logEn: '[09:20:01] Retrieval → Transcript ID: MTG-2026-0322-Q3. Duration: 47m. Speakers: 8. Tokens: 8,241.', logHi: '[09:20:01] रिट्रीवल → ट्रांस्क्रिप्ट MTG-2026-0322-Q3। 47 मिनट। 8 स्पीकर। 8,241 टोकन।' },
  { id: 'mstep-02', icon: '🧠', titleEn: 'NLP Action Extraction', titleHi: 'NLP एक्शन एक्सट्रैक्शन', descEn: 'Extract 6 action items with confidence', descHi: '6 एक्शन आइटम कॉन्फिडेंस के साथ', duration: 1800, status: 'idle', logEn: '[09:20:02] Orchestrator → NLP pass. Found 6 action items. Avg confidence: 79.8%. 1 ambiguous item flagged.', logHi: '[09:20:02] ऑर्केस्ट्रेटर → NLP पास। 6 एक्शन आइटम। औसत कॉन्फिडेंस: 79.8%। 1 अस्पष्ट।' },
  { id: 'mstep-03', icon: '⚠️', titleEn: 'Flag Ambiguous Item', titleHi: 'अस्पष्ट आइटम फ़्लैग', descEn: '"Coordinate vendor demo" — 34% confidence', descHi: '"वेंडर डेमो कोऑर्डिनेट" — 34% कॉन्फिडेंस', duration: 900, status: 'idle', preColor: 'warning', logEn: '[09:20:04] Decision → Item 4 confidence: 34%. Below threshold (70%). Action: flag + request clarification from Lena Fischer.', logHi: '[09:20:04] डिसीज़न → आइटम 4 कॉन्फिडेंस: 34%। थ्रेशोल्ड (70%) से नीचे। लेना फ़िशर से क्लेरिफ़िकेशन।' },
  { id: 'mstep-04', icon: '👤', titleEn: 'Assign Owners', titleHi: 'ओनर असाइन', descEn: '5 items assigned by confidence score', descHi: '5 आइटम कॉन्फिडेंस से असाइन', duration: 1200, status: 'idle', logEn: '[09:20:05] Decision → Owner assignment: Riya (96%), Marcus (91%), Dev (89%), Priya (87%), Tom (85%). Lena: clarification needed.', logHi: '[09:20:05] डिसीज़न → ओनर: रिया (96%), मार्कस (91%), देव (89%), प्रिया (87%), टॉम (85%)। लेना: क्लेरिफ़िकेशन।' },
  { id: 'mstep-05', icon: '🔗', titleEn: 'Create Linear Tasks', titleHi: 'Linear टास्क बनाएं', descEn: '5 tasks created in Linear project', descHi: 'Linear प्रोजेक्ट में 5 टास्क', duration: 1400, status: 'idle', logEn: '[09:20:07] Execution → Linear API. Created: LIN-441, LIN-442, LIN-443, LIN-444, LIN-445. Labels: Q3-Planning.', logHi: '[09:20:07] एक्सेक्यूशन → Linear API। बनाए: LIN-441 से LIN-445। लेबल: Q3-प्लानिंग।' },
  { id: 'mstep-06', icon: '📧', titleEn: 'Send Personalized Summaries', titleHi: 'पर्सनलाइज़्ड सारांश भेजें', descEn: 'Lena copy marked [ACTION NEEDED]', descHi: 'लेना की कॉपी [ACTION NEEDED] मार्क', duration: 1100, status: 'idle', logEn: '[09:20:09] Execution → SendGrid. 8 personalized summaries sent. Lena: [ACTION NEEDED] — Coordinate vendor demo. T+24h, T+48h reminders set.', logHi: '[09:20:09] एक्सेक्यूशन → SendGrid। 8 पर्सनलाइज़्ड सारांश। लेना: [ACTION NEEDED]। T+24h, T+48h रिमाइंडर।' },
];

const ACTION_ITEMS: ActionItem[] = [
  { id: 'ai-001', itemEn: 'Finalize Q3 roadmap slides', itemHi: 'Q3 रोडमैप स्लाइड्स फ़ाइनल', owner: 'Riya Kapoor', confidence: 96, status: 'assigned', linear: 'LIN-441', dueEn: 'Mar 25', dueHi: '25 मार्च' },
  { id: 'ai-002', itemEn: 'Schedule infra capacity review', itemHi: 'इन्फ्रा कैपेसिटी रिव्यू शेड्यूल', owner: 'Marcus Obi', confidence: 91, status: 'assigned', linear: 'LIN-442', dueEn: 'Mar 24', dueHi: '24 मार्च' },
  { id: 'ai-003', itemEn: 'Draft budget variance report', itemHi: 'बजट वेरिएंस रिपोर्ट ड्राफ्ट', owner: 'Dev Patel', confidence: 89, status: 'assigned', linear: 'LIN-443', dueEn: 'Mar 26', dueHi: '26 मार्च' },
  { id: 'ai-004', itemEn: 'Coordinate vendor demo', itemHi: 'वेंडर डेमो कोऑर्डिनेट', owner: 'Lena Fischer', confidence: 34, status: 'flagged', linear: null, dueEn: 'TBD', dueHi: 'TBD' },
  { id: 'ai-005', itemEn: 'Update API deprecation timeline', itemHi: 'API डेप्रिकेशन टाइमलाइन अपडेट', owner: 'Priya Sharma', confidence: 87, status: 'assigned', linear: 'LIN-444', dueEn: 'Mar 27', dueHi: '27 मार्च' },
  { id: 'ai-006', itemEn: 'Share hiring pipeline with HR', itemHi: 'हायरिंग पाइपलाइन HR को शेयर', owner: 'Tom Nakamura', confidence: 85, status: 'assigned', linear: 'LIN-445', dueEn: 'Mar 23', dueHi: '23 मार्च' },
];

const MEETING_TOUR_STEPS: TourStep[] = [
  {
    target: '#meeting-run-btn',
    titleEn: 'Run the Demo',
    titleHi: 'डेमो चलाएं',
    descEn: 'Click "Run Demo" to process the Q3 Planning meeting transcript. The AI will extract action items, assign owners, and create Linear tasks.',
    descHi: '"डेमो चलाएं" पर क्लिक करें। AI Q3 मीटिंग ट्रांस्क्रिप्ट से एक्शन आइटम निकालेगा।',
    placement: 'bottom',
  },
  {
    target: '#meeting-steps-panel',
    titleEn: 'Processing Pipeline',
    titleHi: 'प्रोसेसिंग पाइपलाइन',
    descEn: '6 steps: ingest transcript → NLP extraction → flag ambiguous items → assign owners → create Linear tasks → send summaries.',
    descHi: '6 स्टेप्स: ट्रांस्क्रिप्ट → NLP → अस्पष्ट फ़्लैग → ओनर असाइन → Linear टास्क → सारांश।',
    placement: 'right',
  },
  {
    target: '#meeting-logs-panel',
    titleEn: 'Live Agent Logs',
    titleHi: 'लाइव एजेंट लॉग्स',
    descEn: 'Watch the Orchestrator, Decision, and Execution agents coordinate in real time with exact API calls and confidence scores.',
    descHi: 'ऑर्केस्ट्रेटर, डिसीज़न और एक्सेक्यूशन एजेंट को रियल-टाइम में काम करते देखें।',
    placement: 'top',
  },
  {
    target: '#meeting-actions-table',
    titleEn: 'Action Items Table',
    titleHi: 'एक्शन आइटम टेबल',
    descEn: 'After the demo completes, see all 6 extracted action items with owners, confidence scores, Linear ticket IDs, and due dates.',
    descHi: 'डेमो पूरा होने के बाद 6 एक्शन आइटम देखें — ओनर, कॉन्फिडेंस, Linear ID और डेडलाइन।',
    placement: 'top',
  },
];

export default function MeetingDemoContent() {
  const { lang, addNotification } = useApp();
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [logs, setLogs] = useState<AnimatedLogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [logsOpen, setLogsOpen] = useState(true);
  const [revealedSteps, setRevealedSteps] = useState<Set<number>>(new Set());
  const [progressPct, setProgressPct] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const runningRef = useRef(false);
  const logKeyRef = useRef(0);

  const addLog = (line: string) => {
    const key = logKeyRef.current++;
    setLogs(prev => [...prev, { text: line, key }]);
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 50);
  };

  const reset = () => {
    setSteps(INITIAL_STEPS);
    setLogs([]);
    setRunning(false);
    setDone(false);
    setShowTable(false);
    setShowConfetti(false);
    setRevealedSteps(new Set());
    setProgressPct(0);
    runningRef.current = false;
  };

  const runDemo = async () => {
    if (running) return;
    if (done) { reset(); return; }
    setRunning(true);
    setLogsOpen(true);
    runningRef.current = true;
    addLog(lang === 'en' ? '▶ Processing meeting transcript — Q3 Planning' : '▶ मीटिंग ट्रांस्क्रिप्ट प्रोसेसिंग — Q3 प्लानिंग');

    // Log workflow start
    await workflowLogService.insert({
      workflowName: 'Meeting Actions',
      status: 'running',
      agentId: 'Orchestrator',
      userEmail: 'riya.kapoor@company.com',
      metadata: { event: 'workflow_started', meeting_id: 'MTG-2026-0322-Q3', duration_min: 47 },
    });

    for (let i = 0; i < INITIAL_STEPS.length; i++) {
      if (!runningRef.current) break;
      const step = INITIAL_STEPS[i];
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s));
      setRevealedSteps(prev => new Set([...prev, i]));
      await new Promise(r => setTimeout(r, step.duration));

      const isWarning = step.id === 'mstep-03';
      const finalStatus: StepStatus = isWarning ? 'warning' : 'success';
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: finalStatus } : s));
      setProgressPct(Math.round(((i + 1) / INITIAL_STEPS.length) * 100));
      addLog(lang === 'en' ? step.logEn : step.logHi);

      // Log each step to Supabase
      await workflowLogService.insert({
        workflowName: 'Meeting Actions',
        status: isWarning ? 'warning' : 'success',
        agentId: isWarning ? 'Decision' : 'Orchestrator',
        userEmail: 'riya.kapoor@company.com',
        metadata: {
          step_id: step.id,
          step_title: step.titleEn,
          step_index: i + 1,
          total_steps: INITIAL_STEPS.length,
          log: step.logEn,
          ...(isWarning ? { flagged_item: 'Coordinate vendor demo', confidence: 34, assignee: 'Lena Fischer' } : {}),
        },
      });

      if (isWarning) {
        addNotification({ type: 'info', agent: 'Decision', message: '"Coordinate vendor demo" flagged — 34% confidence, Lena notified' });
        toast.warning('Ambiguous item flagged — clarification requested from Lena Fischer');
      } else if (i === INITIAL_STEPS.length - 1) {
        addNotification({ type: 'success', agent: 'Orchestrator', message: 'Meeting processed: 5 tasks created, 1 flagged, 8 summaries sent' });
        toast.success('Meeting → Actions complete — 5 Linear tasks created');
        setShowTable(true);
        setShowConfetti(true);
        // Log workflow completion
        await workflowLogService.insert({
          workflowName: 'Meeting Actions',
          status: 'success',
          agentId: 'Audit',
          userEmail: 'riya.kapoor@company.com',
          metadata: {
            event: 'workflow_completed',
            action_items: 6,
            linear_tasks_created: 5,
            flagged_items: 1,
            summaries_sent: 8,
            meeting_id: 'MTG-2026-0322-Q3',
          },
        });
      }
      await new Promise(r => setTimeout(r, 150));
    }

    setRunning(false);
    setDone(true);
  };

  const getDotColor = (step: Step) => {
    switch (step.status) {
      case 'running': return 'bg-white animate-pulse-dot';
      case 'success': return 'bg-white';
      case 'error': return 'bg-zinc-400';
      case 'warning': return 'bg-zinc-400';
      default:
        if (step.preColor === 'warning') return 'bg-zinc-700';
        return 'bg-zinc-700';
    }
  };

  const getStepBorder = (step: Step) => {
    switch (step.status) {
      case 'running': return 'border-white/40 bg-white/5';
      case 'success': return 'border-white/20 bg-white/5';
      case 'error': return 'border-zinc-500/30 bg-zinc-500/5';
      case 'warning': return 'border-zinc-500/30 bg-zinc-500/10';
      default:
        if (step.preColor === 'warning') return 'border-zinc-700/30 bg-zinc-800/10';
        return 'border-zinc-800 bg-zinc-900/50';
    }
  };

  return (
    <div id="meeting-pdf-target" className="p-4 sm:p-6 xl:p-8 2xl:p-10 max-w-screen-2xl mx-auto">
      <Confetti active={showConfetti} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0 sm:justify-between mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📋</span>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {lang === 'en' ? 'Meeting → Actions Demo' : 'मीटिंग → एक्शन डेमो'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500">
            {lang === 'en' ? 'Q3 Planning Meeting · 47 min · 8 attendees · March 22, 2026' : 'Q3 प्लानिंग मीटिंग · 47 मिनट · 8 उपस्थित · 22 मार्च 2026'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <GuidedTour
            steps={MEETING_TOUR_STEPS}
            lang={lang}
            storageKey="tour-meeting-demo"
          />
          <PDFExportButton
            targetId="meeting-pdf-target"
            filename="meeting-actions-demo"
            title="Meeting Actions Demo"
            lang={lang}
          />
          {done && (
            <button onClick={reset} className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 text-sm font-medium transition-all duration-150 active:scale-95 min-h-[40px] touch-manipulation">
              ↺ {lang === 'en' ? 'Reset' : 'रीसेट'}
            </button>
          )}
          <button
            id="meeting-run-btn"
            onClick={runDemo}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-white hover:bg-zinc-200 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-semibold text-sm transition-all duration-150 active:scale-95 shadow-lg shadow-white/10 min-h-[40px] touch-manipulation"
          >
            {running ? (
              <><span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />{lang === 'en' ? 'Running…' : 'चल रहा है…'}</>
            ) : done ? `↺ ${lang === 'en' ? 'Run Again' : 'फिर चलाएं'}` : `▶ ${lang === 'en' ? 'Run Demo' : 'डेमो चलाएं'}`}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {(running || done) && (
        <div className="mb-6 animate-fade-slide">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-zinc-500 font-mono">{lang === 'en' ? 'Workflow Progress' : 'वर्कफ़्लो प्रगति'}</span>
            <span className="text-[11px] font-mono text-zinc-400">{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8">
        {/* Steps */}
        <div id="meeting-steps-panel" className="xl:col-span-3 space-y-3">
          {steps.map((step, i) => (
            <div key={step.id} className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all duration-300 ${getStepBorder(step)}`}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${getDotColor(step)}`} />
                {i < steps.length - 1 && <div className="w-0.5 h-8 bg-zinc-800" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-base">{step.icon}</span>
                  <span className="text-sm font-semibold text-white">{lang === 'en' ? step.titleEn : step.titleHi}</span>
                  {step.status === 'running' && <span className="ml-auto text-xs text-zinc-400 font-mono animate-pulse">processing…</span>}
                  {step.status === 'success' && <span className="ml-auto text-xs text-white font-mono animate-step-reveal">✓ done</span>}
                  {step.status === 'warning' && <span className="ml-auto text-xs text-zinc-400 font-mono animate-step-reveal">⚠ flagged</span>}
                </div>
                <p className="text-xs text-zinc-500">{lang === 'en' ? step.descEn : step.descHi}</p>
                {step.id === 'mstep-03' && step.status === 'warning' && (
                  <div className="mt-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 animate-fade-slide">
                    <span className="text-xs text-zinc-400 font-mono break-words">34% confidence — below 70% threshold → Lena Fischer notified for clarification</span>
                  </div>
                )}
              </div>
              {/* Animated step number */}
              <div
                className={`flex-shrink-0 text-xs font-mono transition-all duration-300 ${
                  revealedSteps.has(i)
                    ? step.status === 'success' ?'text-white animate-step-reveal'
                      : step.status === 'warning' ?'text-zinc-400 animate-step-reveal'
                      : step.status === 'running' ?'text-zinc-300' :'text-zinc-700' :'text-zinc-700'
                }`}
              >
                0{i + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Live log + stats */}
        <div className="xl:col-span-2 space-y-4">
          {/* Collapsible Live log */}
          <div id="meeting-logs-panel" className="bg-black border border-zinc-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setLogsOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 border-b border-zinc-800 touch-manipulation"
            >
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {lang === 'en' ? 'Live Log' : 'लाइव लॉग'}
                {logs.length > 0 && <span className="ml-2 text-zinc-600">({logs.length})</span>}
              </span>
              <div className="flex items-center gap-2">
                {running && <span className="w-2 h-2 rounded-full bg-white animate-pulse-dot" />}
                <span className="text-zinc-600 text-xs">{logsOpen ? '▲' : '▼'}</span>
              </div>
            </button>
            {logsOpen && (
              <div ref={logRef} className="h-44 sm:h-52 overflow-y-auto p-4 space-y-1.5 scrollbar-hide font-mono text-[11px]">
                {logs.length === 0 && <span className="text-zinc-700">{lang === 'en' ? '// Waiting for execution…' : '// एक्सेक्यूशन का इंतज़ार…'}</span>}
                {logs.map((entry) => (
                  <div
                    key={`mlog-${entry.key}`}
                    className={`leading-relaxed break-words animate-log-slide ${entry.text.includes('⚠') || entry.text.includes('flag') ? 'text-zinc-400' : entry.text.includes('✓') || entry.text.includes('complete') ? 'text-white' : 'text-zinc-400'}`}
                  >
                    {entry.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meeting meta */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">{lang === 'en' ? 'Meeting Details' : 'मीटिंग विवरण'}</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-zinc-500">Title</span><span className="text-zinc-300 font-mono">Q3 Planning</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Duration</span><span className="text-zinc-300 font-mono">47 min</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Tokens</span><span className="text-white font-mono">8,241</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Actions found</span><span className="text-white font-mono">6</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Flagged</span><span className="text-zinc-400 font-mono">1 (34%)</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Linear tasks</span><span className="text-zinc-300 font-mono">LIN-441…445</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Celebration result summary */}
      {done && (
        <div className="mb-6 bg-zinc-900 border border-zinc-700 rounded-xl p-4 sm:p-5 animate-celebration-pop">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800 flex-wrap">
            <div className="text-3xl">🎊</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white">
                {lang === 'en' ? 'Meeting Processed!' : 'मीटिंग प्रोसेस पूर्ण!'}
              </h3>
              <p className="text-xs text-zinc-400">
                {lang === 'en' ? 'Q3 Planning — 6 actions extracted in 7.5 seconds' : 'Q3 प्लानिंग — 7.5 सेकंड में 6 एक्शन एक्सट्रैक्ट'}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-mono text-white">5 assigned</span>
              <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-400">1 flagged</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: '6', labelEn: 'Actions Found', labelHi: 'एक्शन मिले', delay: '0ms' },
              { value: '5', labelEn: 'Linear Tasks', labelHi: 'Linear टास्क', delay: '60ms' },
              { value: '8', labelEn: 'Summaries Sent', labelHi: 'सारांश भेजे', delay: '120ms' },
              { value: '79.8%', labelEn: 'Avg Confidence', labelHi: 'औसत कॉन्फिडेंस', delay: '180ms' },
            ].map(stat => (
              <div
                key={stat.labelEn}
                className="p-3 rounded-lg bg-white/5 border border-white/10 text-center animate-step-enter"
                style={{ animationDelay: stat.delay }}
              >
                <div className="text-2xl font-bold text-white tabular-nums">{stat.value}</div>
                <div className="text-xs text-zinc-400 mt-1">{lang === 'en' ? stat.labelEn : stat.labelHi}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Output table */}
      {showTable && (
        <div id="meeting-actions-table" className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden animate-fade-slide">
          <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-zinc-800 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-white">{lang === 'en' ? 'Extracted Action Items' : 'एक्सट्रैक्ट एक्शन आइटम'}</h3>
            <div className="flex gap-2">
              <span className="px-2 py-1 rounded-md bg-white/10 text-white text-xs font-mono">5 assigned</span>
              <span className="px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 text-xs font-mono">1 flagged</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">{lang === 'en' ? 'Action Item' : 'एक्शन आइटम'}</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">{lang === 'en' ? 'Owner' : 'ओनर'}</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">{lang === 'en' ? 'Confidence' : 'कॉन्फिडेंस'}</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Linear</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">{lang === 'en' ? 'Status' : 'स्टेटस'}</th>
                </tr>
              </thead>
              <tbody>
                {ACTION_ITEMS.map((item, rowIdx) => (
                  <tr
                    key={item.id}
                    className={`border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors animate-log-slide ${item.status === 'flagged' ? 'bg-zinc-800/20' : ''}`}
                    style={{ animationDelay: `${rowIdx * 50}ms` }}
                  >
                    <td className="px-4 py-3 text-zinc-200">{lang === 'en' ? item.itemEn : item.itemHi}</td>
                    <td className="px-4 py-3 text-zinc-400 font-mono whitespace-nowrap">{item.owner}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-12 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${item.confidence >= 70 ? 'bg-white' : 'bg-zinc-500'}`}
                            style={{ width: `${item.confidence}%`, transitionDelay: `${rowIdx * 80}ms` }}
                          />
                        </div>
                        <span className={`font-mono ${item.confidence >= 70 ? 'text-white' : 'text-zinc-500'}`}>{item.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {item.linear ? <span className="text-zinc-300">{item.linear}</span> : <span className="text-zinc-700">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'assigned' ? (
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-semibold whitespace-nowrap">✓ assigned</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-semibold whitespace-nowrap">⚠ flagged</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}