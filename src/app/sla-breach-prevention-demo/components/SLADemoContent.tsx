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

interface AnimatedLogEntry {
  text: string;
  key: number;
}

const INITIAL_STEPS: Step[] = [
  { id: 'sla-01', icon: '🚨', titleEn: 'Breach Detected', titleHi: 'ब्रीच डिटेक्ट', descEn: '$127K approval — 48h 13m elapsed, SLA at risk', descHi: '$127K अप्रूवल — 48h 13m, SLA खतरे में', duration: 1000, status: 'idle', preColor: 'error', logEn: '[09:30:11] Compliance → SLA monitor triggered. WorkflowID: FIN-2026-0320-PRO. Amount: $127,400. Elapsed: 48h 13m. SLA limit: 48h. Status: BREACHED.', logHi: '[09:30:11] कम्प्लायंस → SLA मॉनिटर। FIN-2026-0320-PRO। $127,400। 48h 13m elapsed। BREACHED।' },
  { id: 'sla-02', icon: '🔍', titleEn: 'Check Approver Status', titleHi: 'अप्रूवर स्टेटस चेक', descEn: 'James Okonkwo — OOO (medical leave)', descHi: 'जेम्स ओकोनकवो — OOO (मेडिकल लीव)', duration: 1200, status: 'idle', logEn: '[09:30:12] Retrieval → HRIS query: James Okonkwo (CFO-2). Status: OOO — medical leave. Return date: April 2, 2026. Cannot approve.', logHi: '[09:30:12] रिट्रीवल → HRIS: जेम्स ओकोनकवो। स्टेटस: OOO — मेडिकल लीव। वापसी: 2 अप्रैल।' },
  { id: 'sla-03', icon: '📋', titleEn: 'Policy Lookup', titleHi: 'पॉलिसी लुकअप', descEn: 'FIN-POL-07: delegate authorization rules', descHi: 'FIN-POL-07: डेलीगेट ऑथराइज़ेशन नियम', duration: 1000, status: 'idle', logEn: '[09:30:13] Compliance → Policy FIN-POL-07 loaded. Rule: CFO delegate authorized when primary OOO. Limit: $200K. Delegate: Sarah Chen.', logHi: '[09:30:13] कम्प्लायंस → FIN-POL-07। नियम: CFO डेलीगेट ऑथराइज़्ड। लिमिट: $200K। डेलीगेट: सारा चेन।' },
  { id: 'sla-04', icon: '↪️', titleEn: 'Reroute to Delegate', titleHi: 'डेलीगेट को रीरूट', descEn: 'Sarah Chen — $200K limit, 2h window', descHi: 'सारा चेन — $200K लिमिट, 2h विंडो', duration: 900, status: 'idle', logEn: '[09:30:14] Orchestrator → Reroute to Sarah Chen (CFO Delegate). Amount $127,400 within $200K limit. Response window: 2 hours. Notification sent.', logHi: '[09:30:14] ऑर्केस्ट्रेटर → सारा चेन को रीरूट। $127,400 < $200K लिमिट। 2h विंडो। नोटिफ़िकेशन।' },
  { id: 'sla-05', icon: '🔒', titleEn: 'Create Audit Entry', titleHi: 'ऑडिट एंट्री बनाएं', descEn: 'HMAC-signed with FIN-POL-07 citation', descHi: 'FIN-POL-07 citation के साथ HMAC-साइन्ड', duration: 800, status: 'idle', logEn: '[09:30:15] Audit → HMAC-signed entry. Action: SLA breach reroute. Policy: FIN-POL-07. Signature: sha256:f9e8d7… Immutable log appended.', logHi: '[09:30:15] ऑडिट → HMAC-साइन्ड। SLA ब्रीच रीरूट। FIN-POL-07। sha256:f9e8d7…' },
  { id: 'sla-06', icon: '✅', titleEn: 'Sarah Chen Approves', titleHi: 'सारा चेन ने अप्रूव किया', descEn: 'Breach duration: 13 min · $4,200 penalty avoided', descHi: 'ब्रीच: 13 मिनट · $4,200 पेनल्टी बची', duration: 1300, status: 'idle', logEn: '[09:30:28] Execution → Sarah Chen approved $127,400 (FIN-2026-0320-PRO). Total breach duration: 13 minutes. Penalty avoided: $4,200. CFO dashboard updated.', logHi: '[09:30:28] एक्सेक्यूशन → सारा चेन ने $127,400 अप्रूव किया। ब्रीच: 13 मिनट। $4,200 पेनल्टी बची।' },
];

const IMPACT_ITEMS = [
  { id: 'impact-breach', icon: '⏱️', valueEn: '13 min', valueHi: '13 मिनट', labelEn: 'Breach Duration', labelHi: 'ब्रीच अवधि', color: 'text-zinc-300', bg: 'bg-zinc-800 border-zinc-700' },
  { id: 'impact-saved', icon: '💰', valueEn: '$4,200', valueHi: '$4,200', labelEn: 'Penalty Avoided', labelHi: 'पेनल्टी बची', color: 'text-white', bg: 'bg-white/5 border-white/10' },
  { id: 'impact-manual', icon: '🤖', valueEn: '0', valueHi: '0', labelEn: 'Manual Steps', labelHi: 'मैनुअल स्टेप्स', color: 'text-white', bg: 'bg-white/5 border-white/10' },
  { id: 'impact-audit', icon: '🔒', valueEn: '100%', valueHi: '100%', labelEn: 'Audited', labelHi: 'ऑडिटेड', color: 'text-white', bg: 'bg-white/5 border-white/10' },
];

const SLA_TOUR_STEPS: TourStep[] = [
  {
    target: '#sla-run-btn',
    titleEn: 'Run the Demo',
    titleHi: 'डेमो चलाएं',
    descEn: 'Click "Run Demo" to watch the autonomous SLA breach recovery. A $127K approval was stuck for 48h 13m — the system resolves it in 13 minutes.',
    descHi: '"डेमो चलाएं" पर क्लिक करें। $127K अप्रूवल 48h से अटका था — सिस्टम 13 मिनट में हल करेगा।',
    placement: 'bottom',
  },
  {
    target: '#sla-steps-panel',
    titleEn: 'Recovery Pipeline',
    titleHi: 'रिकवरी पाइपलाइन',
    descEn: '6 steps: detect breach → check approver status → policy lookup → reroute to delegate → create audit entry → approval confirmed.',
    descHi: '6 स्टेप्स: ब्रीच डिटेक्ट → अप्रूवर चेक → पॉलिसी → डेलीगेट रीरूट → ऑडिट → अप्रूवल।',
    placement: 'right',
  },
  {
    target: '#sla-impact-cards',
    titleEn: 'Impact Summary',
    titleHi: 'इम्पैक्ट सारांश',
    descEn: 'See the outcome: 13-minute breach duration, $4,200 penalty avoided, zero manual steps, and 100% audit coverage.',
    descHi: 'परिणाम देखें: 13 मिनट ब्रीच, $4,200 पेनल्टी बची, 0 मैनुअल स्टेप्स, 100% ऑडिट।',
    placement: 'top',
  },
  {
    target: '#sla-logs-panel',
    titleEn: 'Live Agent Logs',
    titleHi: 'लाइव एजेंट लॉग्स',
    descEn: 'Compliance, Retrieval, and Orchestrator agents coordinate autonomously — every decision logged with HMAC signatures.',
    descHi: 'कम्प्लायंस, रिट्रीवल और ऑर्केस्ट्रेटर एजेंट स्वायत्त रूप से काम करते हैं — HMAC साइन्ड लॉग।',
    placement: 'top',
  },
];

export default function SLADemoContent() {
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
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 50);
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
    if (running) return;
    if (done) { reset(); return; }
    setRunning(true);
    setLogsOpen(true);
    runningRef.current = true;
    addLog(lang === 'en' ? '▶ SLA Breach Prevention — FIN-2026-0320-PRO ($127,400)' : '▶ SLA ब्रीच प्रिवेंशन — FIN-2026-0320-PRO ($127,400)');

    // Log workflow start
    await workflowLogService.insert({
      workflowName: 'SLA Breach Prevention',
      status: 'running',
      agentId: 'Compliance',
      userEmail: 'sarah.chen@company.com',
      metadata: { event: 'workflow_started', workflow_id: 'FIN-2026-0320-PRO', amount: 127400 },
    });

    for (let i = 0; i < INITIAL_STEPS.length; i++) {
      if (!runningRef.current) break;
      const step = INITIAL_STEPS[i];
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s));
      setRevealedSteps(prev => new Set([...prev, i]));
      await new Promise(r => setTimeout(r, step.duration));

      const isBreachStep = step.id === 'sla-01';
      const finalStatus: StepStatus = isBreachStep ? 'error' : 'success';
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: finalStatus } : s));
      setProgressPct(Math.round(((i + 1) / INITIAL_STEPS.length) * 100));
      addLog(lang === 'en' ? step.logEn : step.logHi);

      // Log each step to Supabase
      await workflowLogService.insert({
        workflowName: 'SLA Breach Prevention',
        status: isBreachStep ? 'error' : 'success',
        agentId: isBreachStep ? 'Compliance' : 'Orchestrator',
        userEmail: 'sarah.chen@company.com',
        metadata: {
          step_id: step.id,
          step_title: step.titleEn,
          step_index: i + 1,
          total_steps: INITIAL_STEPS.length,
          log: step.logEn,
          workflow_id: 'FIN-2026-0320-PRO',
          amount: 127400,
          ...(isBreachStep ? { breach_detected: true, elapsed_hours: 48.22 } : {}),
        },
      });

      if (isBreachStep) {
        addNotification({ type: 'error', agent: 'Compliance', message: 'SLA breach detected: FIN-2026-0320-PRO — $127,400 approval overdue' });
        toast.error('SLA breach detected — autonomous recovery initiated');
      } else if (step.id === 'sla-04') {
        addNotification({ type: 'info', agent: 'Orchestrator', message: 'Rerouted to Sarah Chen (FIN-POL-07 delegate, $200K limit)' });
      } else if (i === INITIAL_STEPS.length - 1) {
        addNotification({ type: 'success', agent: 'Execution', message: 'Breach resolved: 13 min duration, $4,200 penalty avoided, CFO dashboard updated' });
        toast.success('SLA breach resolved — $4,200 penalty avoided');
        setShowConfetti(true);
        // Log workflow completion
        await workflowLogService.insert({
          workflowName: 'SLA Breach Prevention',
          status: 'success',
          agentId: 'Audit',
          userEmail: 'sarah.chen@company.com',
          metadata: {
            event: 'workflow_completed',
            workflow_id: 'FIN-2026-0320-PRO',
            amount: 127400,
            breach_duration_min: 13,
            penalty_avoided: 4200,
            policy: 'FIN-POL-07',
            hmac_signed: true,
          },
        });
      }
      await new Promise(r => setTimeout(r, 150));
    }

    setRunning(false);
    setDone(true);
  };

  const getStepBorder = (step: Step) => {
    switch (step.status) {
      case 'running': return 'border-white/40 bg-white/5';
      case 'success': return 'border-white/20 bg-white/5';
      case 'error': return 'border-zinc-500/40 bg-zinc-500/10';
      default:
        if(step.preColor === 'error') return 'border-zinc-600/20 bg-zinc-600/5';
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

  return (
    <div id="sla-pdf-target" className="p-4 sm:p-6 xl:p-8 2xl:p-10 max-w-screen-2xl mx-auto">
      <Confetti active={showConfetti} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0 sm:justify-between mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🛡️</span>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {lang === 'en' ? 'SLA Breach Prevention Demo' : 'SLA ब्रीच प्रिवेंशन डेमो'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500">
            {lang === 'en' ? 'Procurement approval FIN-2026-0320-PRO · $127,400 · 48h 13m elapsed' : 'प्रोक्योरमेंट अप्रूवल FIN-2026-0320-PRO · $127,400 · 48h 13m elapsed'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <GuidedTour
            steps={SLA_TOUR_STEPS}
            lang={lang}
            storageKey="tour-sla-demo"
          />
          <PDFExportButton
            targetId="sla-pdf-target"
            filename="sla-breach-demo"
            title="SLA Breach Prevention Demo"
            lang={lang}
          />
          {done && (
            <button onClick={reset} className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 text-sm font-medium transition-all duration-150 active:scale-95 min-h-[40px] touch-manipulation">
              ↺ {lang === 'en' ? 'Reset' : 'रीसेट'}
            </button>
          )}
          <button
            id="sla-run-btn"
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
            <span className="text-[11px] text-zinc-500 font-mono">{lang === 'en' ? 'Recovery Progress' : 'रिकवरी प्रगति'}</span>
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
        <div id="sla-steps-panel" className="xl:col-span-3 space-y-3">
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
                  {step.status === 'error' && <span className="ml-auto text-xs text-zinc-400 font-mono animate-step-reveal">✗ breached</span>}
                </div>
                <p className="text-xs text-zinc-500">{lang === 'en' ? step.descEn : step.descHi}</p>
                {step.id === 'sla-01' && step.status === 'error' && (
                  <div className="mt-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 animate-fade-slide">
                    <span className="text-xs text-zinc-400 font-mono break-words">48h 13m elapsed — SLA limit exceeded → autonomous recovery triggered</span>
                  </div>
                )}
                {step.id === 'sla-04' && step.status === 'success' && (
                  <div className="mt-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 animate-fade-slide">
                    <span className="text-xs text-zinc-300 font-mono">Sarah Chen (CFO Delegate) — $200K auth limit — 2h response window</span>
                  </div>
                )}
                {step.id === 'sla-06' && step.status === 'success' && (
                  <div className="mt-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 animate-fade-slide">
                    <span className="text-xs text-white font-mono">✓ Approved — breach duration: 13 min — $4,200 penalty avoided</span>
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

        {/* Log + info */}
        <div className="xl:col-span-2 space-y-4">
          {/* Collapsible Live log */}
          <div id="sla-logs-panel" className="bg-black border border-zinc-800 rounded-xl overflow-hidden">
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
              <div ref={logRef} className="h-44 sm:h-56 overflow-y-auto p-4 space-y-1.5 scrollbar-hide font-mono text-[11px]">
                {logs.length === 0 && <span className="text-zinc-700">{lang === 'en' ? '// Waiting for execution…' : '// एक्सेक्यूशन का इंतज़ार…'}</span>}
                {logs.map((entry) => (
                  <div
                    key={`slog-${entry.key}`}
                    className={`leading-relaxed break-words animate-log-slide ${entry.text.includes('BREACHED') || entry.text.includes('breach') ? 'text-zinc-400' : entry.text.includes('approved') || entry.text.includes('avoided') || entry.text.includes('बची') ? 'text-white' : entry.text.includes('Reroute') || entry.text.includes('रीरूट') ? 'text-zinc-300' : 'text-zinc-400'}`}
                  >
                    {entry.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Case details */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">{lang === 'en' ? 'Case Details' : 'केस विवरण'}</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between gap-2"><span className="text-zinc-500 flex-shrink-0">Workflow ID</span><span className="text-zinc-300 font-mono text-right">FIN-2026-0320-PRO</span></div>
              <div className="flex justify-between gap-2"><span className="text-zinc-500">Amount</span><span className="text-white font-mono">$127,400</span></div>
              <div className="flex justify-between gap-2"><span className="text-zinc-500 flex-shrink-0">Primary approver</span><span className="text-zinc-500 font-mono text-right">James Okonkwo (OOO)</span></div>
              <div className="flex justify-between gap-2"><span className="text-zinc-500">Delegate</span><span className="text-white font-mono">Sarah Chen</span></div>
              <div className="flex justify-between gap-2"><span className="text-zinc-500">Policy</span><span className="text-zinc-300 font-mono">FIN-POL-07</span></div>
              <div className="flex justify-between gap-2"><span className="text-zinc-500 flex-shrink-0">Breach duration</span><span className="text-zinc-300 font-mono">13 minutes</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Impact grid + celebration */}
      {done && (
        <div id="sla-impact-cards" className="space-y-6 animate-fade-slide">
          {/* Celebration banner */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 sm:p-5 animate-celebration-pop">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800 flex-wrap">
              <div className="text-3xl">🛡️</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white">
                  {lang === 'en' ? 'Breach Resolved Autonomously!' : 'ब्रीच स्वायत्त रूप से हल!'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {lang === 'en' ? '$4,200 penalty avoided — zero human intervention required' : '$4,200 पेनल्टी बची — कोई मैनुअल हस्तक्षेप नहीं'}
                </p>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20">
                <span className="text-xs font-mono text-white">FIN-POL-07 ✓</span>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {IMPACT_ITEMS.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3 sm:p-4 rounded-xl border ${item.bg} text-center animate-step-enter`}
                  style={{ animationDelay: `${idx * 70}ms` }}
                >
                  <div className="text-xl sm:text-2xl mb-2">{item.icon}</div>
                  <div className={`text-xl sm:text-2xl font-bold tabular-nums ${item.color} mb-1`}>{lang === 'en' ? item.valueEn : item.valueHi}</div>
                  <div className="text-xs text-zinc-500">{lang === 'en' ? item.labelEn : item.labelHi}</div>
                </div>
              ))}
            </div>
          </div>

          {/* HMAC Audit log */}
          <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-zinc-800 flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-white">{lang === 'en' ? 'HMAC-Signed Override Log' : 'HMAC-साइन्ड ओवरराइड लॉग'}</h3>
              <span className="px-2 py-1 rounded-md bg-white/10 text-white text-xs font-mono">FIN-POL-07 cited</span>
            </div>
            <div className="p-4 sm:p-5 font-mono text-xs leading-relaxed overflow-x-auto">
              <div className="space-y-1 min-w-[280px]">
                {[
                  ['"event"', '"sla_breach_reroute"'],
                  ['"workflowId"', '"FIN-2026-0320-PRO"'],
                  ['"amount"', '127400'],
                  ['"originalApprover"', '"James Okonkwo"'],
                  ['"delegate"', '"Sarah Chen"'],
                  ['"policyRef"', '"FIN-POL-07"'],
                  ['"breachDurationMinutes"', '13'],
                  ['"penaltyAvoided"', '4200'],
                  ['"hmacSignature"', '"sha256:f9e8d7c6b5a4…"'],
                ].map(([key, val], idx) => (
                  <div key={key} className="animate-log-slide" style={{ animationDelay: `${idx * 40}ms` }}>
                    <span className="text-zinc-300">{key}</span>
                    <span className="text-zinc-600">: </span>
                    <span className="text-white">{val}</span>
                    {idx < 8 && <span className="text-zinc-600">,</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}