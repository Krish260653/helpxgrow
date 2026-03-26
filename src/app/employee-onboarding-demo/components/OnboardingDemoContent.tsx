'use client';
import React, { useState, useRef, useEffect } from 'react';
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

const INITIAL_STEPS: Step[] = [
  { id: 'step-01', icon: '📥', titleEn: 'Parse HRIS Data', titleHi: 'HRIS डेटा पार्स करें', descEn: 'Extract employee profile from Workday', descHi: 'Workday से प्रोफ़ाइल एक्सट्रैक्ट', duration: 1200, status: 'idle', logEn: '[09:15:31] Orchestrator → Workday API call. Employee: Arjun Mehta, Role: SWE-II, Team: Platform', logHi: '[09:15:31] ऑर्केस्ट्रेटर → Workday API. कर्मचारी: अर्जुन मेहता, रोल: SWE-II' },
  { id: 'step-02', icon: '💻', titleEn: 'Create GitHub Account', titleHi: 'GitHub अकाउंट बनाएं', descEn: 'Provision repo access & team membership', descHi: 'रेपो एक्सेस और टीम मेंबरशिप', duration: 1500, status: 'idle', logEn: '[09:15:32] Execution → GitHub API. User: arjun-mehta-helpxgrow. Teams: platform-eng, swe-ii. Repos: 14 granted.', logHi: '[09:15:32] एक्सेक्यूशन → GitHub API. यूजर: arjun-mehta-helpxgrow. 14 रेपो ग्रांटेड.' },
  { id: 'step-03', icon: '💬', titleEn: 'Setup Slack Account', titleHi: 'Slack अकाउंट सेटअप', descEn: 'Create account + join 4 channels', descHi: 'अकाउंट + 4 चैनल ज्वाइन', duration: 1300, status: 'idle', logEn: '[09:15:34] Execution → Slack API. Channels: #platform-eng #onboarding #general #swe-team. Welcome DM sent.', logHi: '[09:15:34] एक्सेक्यूशन → Slack API. 4 चैनल ज्वाइन। वेलकम DM भेजा।' },
  { id: 'step-04', icon: '🐛', titleEn: 'Provision JIRA Access', titleHi: 'JIRA एक्सेस प्रोविज़न', descEn: 'HTTP 403 → retry × 2 → ticket raised', descHi: 'HTTP 403 → 2 बार रीट्राय → टिकट', duration: 3500, status: 'idle', preColor: 'error', logEn: '[09:15:36] Execution → JIRA API. ✗ HTTP 403 Forbidden. Retry 1 (10s backoff)… ✗ HTTP 403. Retry 2 (20s backoff)… ✗ HTTP 403. Escalating → INC-8821 raised. Workflow continues.', logHi: '[09:15:36] एक्सेक्यूशन → JIRA API. ✗ HTTP 403। रीट्राय 1 (10s)… ✗ HTTP 403। रीट्राय 2 (20s)… INC-8821 रेज़ किया। वर्कफ़्लो जारी।' },
  { id: 'step-05', icon: '🤝', titleEn: 'Assign Buddy Mentor', titleHi: 'बडी मेंटर असाइन', descEn: 'Skill-match: Priya Sharma (94%)', descHi: 'स्किल-मैच: प्रिया शर्मा (94%)', duration: 1100, status: 'idle', logEn: '[09:15:41] Decision → Skill graph query. Top match: Priya Sharma (94%) — Python, K8s, Platform team. Notification sent.', logHi: '[09:15:41] डिसीज़न → स्किल ग्राफ। मैच: प्रिया शर्मा (94%) — Python, K8s। नोटिफ़िकेशन भेजा।' },
  { id: 'step-06', icon: '📅', titleEn: 'Schedule Orientations', titleHi: 'ओरिएंटेशन शेड्यूल', descEn: 'Book 3 sessions in calendar', descHi: '3 सेशन कैलेंडर में बुक', duration: 1000, status: 'idle', logEn: '[09:15:42] Execution → Google Calendar API. Sessions: IT orientation (Day 1), Team sync (Day 2), HR policy (Day 3).', logHi: '[09:15:42] एक्सेक्यूशन → Google Calendar। 3 सेशन: IT, टीम सिंक, HR पॉलिसी।' },
  { id: 'step-07', icon: '📦', titleEn: 'Send Welcome Pack', titleHi: 'वेलकम पैक भेजें', descEn: 'Email with IT ticket mention', descHi: 'IT टिकट mention के साथ ईमेल', duration: 900, status: 'idle', logEn: '[09:15:43] Execution → SendGrid. To: arjun.mehta@company.com. Subject: Welcome to Platform Team! [Note: JIRA access pending — INC-8821]', logHi: '[09:15:43] एक्सेक्यूशन → SendGrid। वेलकम ईमेल भेजा। [INC-8821 नोट शामिल]' },
  { id: 'step-08', icon: '✅', titleEn: 'Finalize & Audit Log', titleHi: 'फ़ाइनलाइज़ और ऑडिट', descEn: 'HMAC-signed completion entry', descHi: 'HMAC-साइन्ड कम्पलीशन एंट्री', duration: 700, status: 'idle', logEn: '[09:15:44] Audit → HMAC-signed entry. WorkflowID: WF-2026-0322-001. 7/8 steps OK. INC-8821 pending. Signature: sha256:a1b2c3…', logHi: '[09:15:44] ऑडिट → HMAC-साइन्ड। WF-2026-0322-001। 7/8 स्टेप्स OK। INC-8821 पेंडिंग।' },
];

const ONBOARDING_TOUR_STEPS: TourStep[] = [
  {
    target: '#onboarding-run-btn',
    titleEn: 'Run the Demo',
    titleHi: 'डेमो चलाएं',
    descEn: 'Click "Run Demo" to start the 8-step autonomous onboarding workflow for Arjun Mehta. Watch each agent act in real time.',
    descHi: '"डेमो चलाएं" पर क्लिक करें और 8-स्टेप ऑटोनॉमस ऑनबोर्डिंग वर्कफ़्लो देखें।',
    placement: 'bottom',
  },
  {
    target: '#onboarding-steps-panel',
    titleEn: 'Workflow Steps',
    titleHi: 'वर्कफ़्लो स्टेप्स',
    descEn: 'Each card shows one agent action — from parsing HRIS data to creating GitHub accounts, Slack setup, and JIRA provisioning (with error recovery).',
    descHi: 'प्रत्येक कार्ड एक एजेंट एक्शन दिखाता है — HRIS से GitHub, Slack, और JIRA तक।',
    placement: 'right',
  },
  {
    target: '#onboarding-logs-panel',
    titleEn: 'Live Agent Logs',
    titleHi: 'लाइव एजेंट लॉग्स',
    descEn: 'Real-time log stream showing exact API calls, timestamps, and agent decisions as the workflow executes.',
    descHi: 'रियल-टाइम लॉग स्ट्रीम — API कॉल, टाइमस्टैम्प और एजेंट निर्णय।',
    placement: 'top',
  },
];

interface AnimatedLogEntry {
  text: string;
  key: number;
}

export default function OnboardingDemoContent() {
  const { lang, addNotification } = useApp();
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [logs, setLogs] = useState<AnimatedLogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
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
    setTimeout(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, 50);
  };

  const reset = () => {
    setSteps(INITIAL_STEPS);
    setLogs([]);
    setRunning(false);
    setDone(false);
    setShowConfetti(false);
    setRevealedSteps(new Set());
    setProgressPct(0);
    runningRef.current = false;
  };

  const runDemo = async () => {
    if (running || done) { if (done) reset(); return; }
    setRunning(true);
    setLogsOpen(true);
    runningRef.current = true;
    setLogs([]);
    addLog(lang === 'en' ? '▶ Starting Employee Onboarding Workflow — Arjun Mehta' : '▶ एम्प्लॉई ऑनबोर्डिंग वर्कफ़्लो शुरू — अर्जुन मेहता');

    // Log workflow start
    await workflowLogService.insert({
      workflowName: 'Employee Onboarding',
      status: 'running',
      agentId: 'Orchestrator',
      userEmail: 'arjun.mehta@company.com',
      metadata: { event: 'workflow_started', employee: 'Arjun Mehta', role: 'SWE-II' },
    });

    for (let i = 0; i < INITIAL_STEPS.length; i++) {
      if (!runningRef.current) break;
      const step = INITIAL_STEPS[i];
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s));
      // Reveal step number with animation
      setRevealedSteps(prev => new Set([...prev, i]));
      await new Promise(r => setTimeout(r, step.duration));

      const isError = step.id === 'step-04';
      const finalStatus: StepStatus = isError ? 'error' : 'success';
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: finalStatus } : s));
      // Update progress bar
      setProgressPct(Math.round(((i + 1) / INITIAL_STEPS.length) * 100));
      addLog(lang === 'en' ? step.logEn : step.logHi);

      // Log each step to Supabase
      await workflowLogService.insert({
        workflowName: 'Employee Onboarding',
        status: isError ? 'error' : 'success',
        agentId: isError ? 'Execution' : 'Orchestrator',
        userEmail: 'arjun.mehta@company.com',
        metadata: {
          step_id: step.id,
          step_title: step.titleEn,
          step_index: i + 1,
          total_steps: INITIAL_STEPS.length,
          log: step.logEn,
          ...(isError ? { incident: 'INC-8821', error_code: 'HTTP 403' } : {}),
        },
      });

      if (isError) {
        addNotification({ type: 'error', agent: 'Execution', message: 'JIRA HTTP 403 — INC-8821 raised, workflow continues' });
        toast.error('JIRA provisioning failed — INC-8821 raised');
      } else if (i === 4) {
        addNotification({ type: 'success', agent: 'Decision', message: 'Buddy assigned: Priya Sharma (94% skill match)' });
      } else if (i === INITIAL_STEPS.length - 1) {
        addNotification({ type: 'success', agent: 'Orchestrator', message: 'Onboarding complete: 7/8 steps. JIRA pending INC-8821.' });
        toast.success('Onboarding workflow complete — 7/8 steps');
        setShowConfetti(true);
        // Log workflow completion
        await workflowLogService.insert({
          workflowName: 'Employee Onboarding',
          status: 'success',
          agentId: 'Audit',
          userEmail: 'arjun.mehta@company.com',
          metadata: {
            event: 'workflow_completed',
            steps_completed: 7,
            steps_total: 8,
            incident: 'INC-8821',
            hmac_signed: true,
            workflow_id: `WF-${Date.now()}`,
          },
        });
      }
      await new Promise(r => setTimeout(r, 200));
    }

    setRunning(false);
    setDone(true);
    addLog(lang === 'en' ? '■ Workflow complete. 7/8 steps succeeded. JIRA access pending — INC-8821.' : '■ वर्कफ़्लो पूर्ण। 7/8 स्टेप्स सफल। JIRA एक्सेस पेंडिंग — INC-8821।');
  };

  const getStepColor = (step: Step) => {
    switch (step.status) {
      case 'running': return 'border-white/40 bg-white/5 shadow-white/10 shadow-lg';
      case 'success': return 'border-white/20 bg-white/5';
      case 'error': return 'border-zinc-500/40 bg-zinc-500/10';
      case 'warning': return 'border-zinc-400/40 bg-zinc-400/10';
      default:
        if (step.preColor === 'error') return 'border-zinc-600/20 bg-zinc-600/5';
        return 'border-zinc-800 bg-zinc-900/50';
    }
  };

  const getDotColor = (step: Step) => {
    switch (step.status) {
      case 'running': return 'bg-white animate-pulse-dot';
      case 'success': return 'bg-white';
      case 'error': return 'bg-zinc-400';
      case 'warning': return 'bg-zinc-400';
      default:
        if (step.preColor === 'error') return 'bg-zinc-700';
        return 'bg-zinc-700';
    }
  };

  const completedCount = steps.filter(s => s.status === 'success').length;
  const errorCount = steps.filter(s => s.status === 'error').length;

  return (
    <div id="onboarding-pdf-target" className="p-4 sm:p-6 xl:p-8 2xl:p-10 max-w-screen-2xl mx-auto">
      <Confetti active={showConfetti} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0 sm:justify-between mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">👤</span>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {lang === 'en' ? 'Employee Onboarding Demo' : 'एम्प्लॉई ऑनबोर्डिंग डेमो'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500">
            {lang === 'en' ? 'New hire: Arjun Mehta · SWE-II · Platform Team · Start date: March 22, 2026' : 'नया कर्मचारी: अर्जुन मेहता · SWE-II · प्लेटफ़ॉर्म टीम · शुरुआत: 22 मार्च 2026'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <GuidedTour
            steps={ONBOARDING_TOUR_STEPS}
            lang={lang}
            storageKey="tour-onboarding-demo"
          />
          <PDFExportButton
            targetId="onboarding-pdf-target"
            filename="onboarding-demo"
            title="Employee Onboarding Demo"
            lang={lang}
          />
          {done && (
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 text-sm font-medium transition-all duration-150 active:scale-95 min-h-[40px] touch-manipulation"
            >
              ↺ {lang === 'en' ? 'Reset' : 'रीसेट'}
            </button>
          )}
          <button
            id="onboarding-run-btn"
            onClick={runDemo}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-white hover:bg-zinc-200 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-semibold text-sm transition-all duration-150 active:scale-95 shadow-lg shadow-white/10 min-h-[40px] touch-manipulation"
          >
            {running ? (
              <>
                <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                {lang === 'en' ? 'Running…' : 'चल रहा है…'}
              </>
            ) : done ? (
              `↺ ${lang === 'en' ? 'Run Again' : 'फिर चलाएं'}`
            ) : (
              `▶ ${lang === 'en' ? 'Run Demo' : 'डेमो चलाएं'}`
            )}
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

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Steps */}
        <div id="onboarding-steps-panel" className="xl:col-span-3 space-y-3">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all duration-300 ${getStepColor(step)}`}
              style={revealedSteps.has(i) ? { animationDelay: `${i * 30}ms` } : {}}
            >
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${getDotColor(step)}`} />
                {i < steps.length - 1 && <div className="w-0.5 h-8 bg-zinc-800" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-base">{step.icon}</span>
                  <span className="text-sm font-semibold text-white">
                    {lang === 'en' ? step.titleEn : step.titleHi}
                  </span>
                  {step.status === 'running' && (
                    <span className="ml-auto text-xs text-zinc-400 font-mono animate-pulse">processing…</span>
                  )}
                  {step.status === 'success' && (
                    <span className="ml-auto text-xs text-white font-mono animate-step-reveal">✓ done</span>
                  )}
                  {step.status === 'error' && (
                    <span className="ml-auto text-xs text-zinc-400 font-mono animate-step-reveal">✗ error</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">{lang === 'en' ? step.descEn : step.descHi}</p>
                {step.id === 'step-04' && step.status === 'error' && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 animate-fade-slide">
                    <span className="text-xs text-zinc-400 font-mono break-all">HTTP 403 → Retry ×2 → INC-8821 raised → Workflow continues ✓</span>
                  </div>
                )}
                {step.id === 'step-05' && step.status === 'success' && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 animate-fade-slide">
                    <span className="text-xs text-white font-mono">Priya Sharma assigned (94% match)</span>
                  </div>
                )}
              </div>
              {/* Animated step number */}
              <div
                className={`flex-shrink-0 text-xs font-mono transition-all duration-300 ${
                  revealedSteps.has(i)
                    ? step.status === 'success' ?'text-white animate-step-reveal'
                      : step.status === 'error' ?'text-zinc-400 animate-step-reveal'
                      : step.status === 'running' ?'text-zinc-300' :'text-zinc-700' :'text-zinc-700'
                }`}
              >
                0{i + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Log + Result */}
        <div className="xl:col-span-2 space-y-4">
          {/* Collapsible Live log */}
          <div id="onboarding-logs-panel" className="bg-black border border-zinc-800 rounded-xl overflow-hidden">
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
              <div
                ref={logRef}
                className="h-48 sm:h-64 overflow-y-auto p-4 space-y-1.5 scrollbar-hide font-mono text-[11px]"
              >
                {logs.length === 0 && (
                  <span className="text-zinc-700">{lang === 'en' ? '// Waiting for execution…' : '// एक्सेक्यूशन का इंतज़ार…'}</span>
                )}
                {logs.map((entry) => {
                  const isError = entry.text.includes('✗') || entry.text.includes('403') || entry.text.includes('error');
                  const isSuccess = entry.text.includes('✓') || entry.text.includes('complete') || entry.text.includes('पूर्ण');
                  return (
                    <div
                      key={`log-${entry.key}`}
                      className={`leading-relaxed break-words animate-log-slide ${isError ? 'text-zinc-400' : isSuccess ? 'text-white' : 'text-zinc-400'}`}
                    >
                      {entry.text}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Result summary with celebration */}
          {done && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 sm:p-5 animate-celebration-pop">
              {/* Celebration header */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800 flex-wrap">
                <div className="text-3xl">🎉</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'en' ? 'Workflow Complete!' : 'वर्कफ़्लो पूर्ण!'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {lang === 'en' ? 'Arjun Mehta onboarded in 11.7 seconds' : 'अर्जुन मेहता 11.7 सेकंड में ऑनबोर्ड'}
                  </p>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20">
                  <span className="text-xs font-mono text-white">WF-2026-0322-001</span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center animate-step-enter" style={{ animationDelay: '0ms' }}>
                  <div className="text-2xl font-bold text-white tabular-nums">{completedCount}</div>
                  <div className="text-xs text-zinc-400 mt-1">{lang === 'en' ? 'Steps Completed' : 'स्टेप्स पूर्ण'}</div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-center animate-step-enter" style={{ animationDelay: '60ms' }}>
                  <div className="text-2xl font-bold text-zinc-300 tabular-nums">{errorCount}</div>
                  <div className="text-xs text-zinc-500 mt-1">{lang === 'en' ? 'Errors Handled' : 'एरर हैंडल'}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center animate-step-enter" style={{ animationDelay: '120ms' }}>
                  <div className="text-2xl font-bold text-white tabular-nums">11.7s</div>
                  <div className="text-xs text-zinc-400 mt-1">{lang === 'en' ? 'Total Time' : 'कुल समय'}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center animate-step-enter" style={{ animationDelay: '180ms' }}>
                  <div className="text-2xl font-bold text-white tabular-nums">0</div>
                  <div className="text-xs text-zinc-400 mt-1">{lang === 'en' ? 'Manual Steps' : 'मैनुअल स्टेप्स'}</div>
                </div>
              </div>

              {/* Key outcomes */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs animate-log-slide" style={{ animationDelay: '240ms' }}>
                  <span className="text-white">✓</span>
                  <span className="text-zinc-300">{lang === 'en' ? 'GitHub, Slack, Calendar provisioned' : 'GitHub, Slack, Calendar प्रोविज़न'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs animate-log-slide" style={{ animationDelay: '300ms' }}>
                  <span className="text-white">✓</span>
                  <span className="text-zinc-300">{lang === 'en' ? 'Buddy mentor: Priya Sharma (94% match)' : 'बडी मेंटर: प्रिया शर्मा (94%)'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs animate-log-slide" style={{ animationDelay: '360ms' }}>
                  <span className="text-zinc-500">⚠</span>
                  <span className="text-zinc-500">{lang === 'en' ? 'JIRA pending — INC-8821 auto-raised' : 'JIRA पेंडिंग — INC-8821 ऑटो-रेज़'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs animate-log-slide" style={{ animationDelay: '420ms' }}>
                  <span className="text-white">✓</span>
                  <span className="text-zinc-300">{lang === 'en' ? 'HMAC-signed audit log created' : 'HMAC-साइन्ड ऑडिट लॉग बनाया'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}