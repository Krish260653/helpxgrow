'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import PDFExportButton from '@/components/PDFExportButton';

interface AgentNode {
  id: string;
  labelEn: string;
  labelHi: string;
  icon: string;
  role: string;
  model: string;
  color: string;
  borderColor: string;
  bgColor: string;
  x: number;
  y: number;
}

interface CommStep {
  from: string;
  to: string;
  messageEn: string;
  messageHi: string;
  delay: number;
  type: 'request' | 'response' | 'notify' | 'audit';
}

interface LogEntry {
  id: string;
  from: string;
  to: string;
  message: string;
  type: string;
  time: string;
}

const AGENTS: AgentNode[] = [
  {
    id: 'orchestrator',
    labelEn: 'Orchestrator',
    labelHi: 'ऑर्केस्ट्रेटर',
    icon: '🧠',
    role: 'Coordinator',
    model: 'claude-opus-4',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500',
    bgColor: 'bg-cyan-500/10',
    x: 50,
    y: 10,
  },
  {
    id: 'retrieval',
    labelEn: 'Retrieval',
    labelHi: 'रिट्रीवल',
    icon: '🔍',
    role: 'Data Fetcher',
    model: 'claude-haiku-4',
    color: 'text-blue-400',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-500/10',
    x: 15,
    y: 38,
  },
  {
    id: 'decision',
    labelEn: 'Decision',
    labelHi: 'डिसीज़न',
    icon: '⚖️',
    role: 'Evaluator',
    model: 'claude-sonnet-4',
    color: 'text-purple-400',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-500/10',
    x: 85,
    y: 38,
  },
  {
    id: 'execution',
    labelEn: 'Execution',
    labelHi: 'एक्ज़ीक्यूशन',
    icon: '⚡',
    role: 'Action Runner',
    model: 'claude-haiku-4',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-500/10',
    x: 15,
    y: 68,
  },
  {
    id: 'audit',
    labelEn: 'Audit',
    labelHi: 'ऑडिट',
    icon: '📋',
    role: 'Logger',
    model: 'claude-haiku-4',
    color: 'text-green-400',
    borderColor: 'border-green-500',
    bgColor: 'bg-green-500/10',
    x: 50,
    y: 82,
  },
  {
    id: 'compliance',
    labelEn: 'Compliance',
    labelHi: 'कम्प्लायंस',
    icon: '🛡️',
    role: 'Policy Guard',
    model: 'claude-sonnet-4',
    color: 'text-red-400',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-500/10',
    x: 85,
    y: 68,
  },
];

const COMM_STEPS: CommStep[] = [
  {
    from: 'orchestrator',
    to: 'retrieval',
    messageEn: 'Fetch employee data for Arjun Mehta',
    messageHi: 'अर्जुन मेहता का डेटा लाओ',
    delay: 600,
    type: 'request',
  },
  {
    from: 'retrieval',
    to: 'orchestrator',
    messageEn: 'Data retrieved: HR record, role, team',
    messageHi: 'डेटा मिला: HR रिकॉर्ड, रोल, टीम',
    delay: 1200,
    type: 'response',
  },
  {
    from: 'orchestrator',
    to: 'compliance',
    messageEn: 'Validate onboarding policy FIN-POL-07',
    messageHi: 'FIN-POL-07 पॉलिसी वैलिडेट करो',
    delay: 1800,
    type: 'request',
  },
  {
    from: 'compliance',
    to: 'orchestrator',
    messageEn: 'Policy check passed — 47 rules verified',
    messageHi: 'पॉलिसी चेक पास — 47 नियम सत्यापित',
    delay: 2400,
    type: 'response',
  },
  {
    from: 'orchestrator',
    to: 'decision',
    messageEn: 'Evaluate: approve GitHub + Slack access?',
    messageHi: 'मूल्यांकन: GitHub + Slack एक्सेस दें?',
    delay: 3000,
    type: 'request',
  },
  {
    from: 'decision',
    to: 'orchestrator',
    messageEn: 'Approved — confidence 97.3%',
    messageHi: 'अप्रूव्ड — कॉन्फिडेंस 97.3%',
    delay: 3600,
    type: 'response',
  },
  {
    from: 'orchestrator',
    to: 'execution',
    messageEn: 'Provision GitHub, Slack, JIRA accounts',
    messageHi: 'GitHub, Slack, JIRA अकाउंट बनाओ',
    delay: 4200,
    type: 'request',
  },
  {
    from: 'execution',
    to: 'audit',
    messageEn: 'Action log: 3 accounts provisioned',
    messageHi: 'एक्शन लॉग: 3 अकाउंट बनाए',
    delay: 4800,
    type: 'audit',
  },
  {
    from: 'audit',
    to: 'orchestrator',
    messageEn: 'HMAC-signed audit trail created',
    messageHi: 'HMAC-साइन्ड ऑडिट ट्रेल बनाया',
    delay: 5400,
    type: 'notify',
  },
];

export default function AgentMapContent() {
  const { lang } = useApp();
  const [activeStep, setActiveStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
  const [activeEdge, setActiveEdge] = useState<{ from: string; to: string } | null>(null);
  const [floatingPills, setFloatingPills] = useState<
    Array<{ id: string; step: CommStep; visible: boolean }>
  >([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [completed, setCompleted] = useState(false);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const clearTimers = () => {
    timerRefs.current.forEach(t => clearTimeout(t));
    timerRefs.current = [];
  };

  const reset = () => {
    clearTimers();
    setActiveStep(-1);
    setRunning(false);
    setActiveNodes(new Set());
    setActiveEdge(null);
    setFloatingPills([]);
    setLog([]);
    setCompleted(false);
  };

  const simulate = () => {
    reset();
    setRunning(true);

    COMM_STEPS.forEach((step, idx) => {
      const t1 = setTimeout(() => {
        setActiveStep(idx);
        setActiveNodes(prev => new Set([...prev, step.from, step.to]));
        setActiveEdge({ from: step.from, to: step.to });

        const pillId = `pill-${idx}-${Date.now()}`;
        setFloatingPills(prev => [
          ...prev,
          { id: pillId, step, visible: true },
        ]);

        const now = new Date();
        const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        setLog(prev => [
          {
            id: `log-${idx}`,
            from: step.from,
            to: step.to,
            message: lang === 'en' ? step.messageEn : step.messageHi,
            type: step.type,
            time: ts,
          },
          ...prev,
        ]);

        // Remove pill after 2.5s
        const t2 = setTimeout(() => {
          setFloatingPills(prev => prev.filter(p => p.id !== pillId));
        }, 2500);
        timerRefs.current.push(t2);
      }, step.delay);
      timerRefs.current.push(t1);
    });

    // Mark complete
    const lastDelay = COMM_STEPS[COMM_STEPS.length - 1].delay + 1200;
    const tDone = setTimeout(() => {
      setRunning(false);
      setCompleted(true);
      setActiveEdge(null);
    }, lastDelay);
    timerRefs.current.push(tDone);
  };

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [log]);

  useEffect(() => () => clearTimers(), []);

  const getAgent = (id: string) => AGENTS.find(a => a.id === id)!;

  const typeColors: Record<string, string> = {
    request: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
    response: 'bg-green-500/20 border-green-500/40 text-green-300',
    notify: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
    audit: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
  };

  const typeLabels: Record<string, string> = {
    request: 'REQ',
    response: 'RES',
    notify: 'NTF',
    audit: 'AUD',
  };

  return (
    <div id="agent-map-pdf-target" className="min-h-screen bg-zinc-950 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0 sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🕸️</span>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {lang === 'en' ? 'Agent Communication Map' : 'एजेंट कम्युनिकेशन मैप'}
            </h1>
          </div>
          <p className="text-sm text-zinc-500 ml-9">
            {lang === 'en' ?'6 specialized agents collaborating in real-time' :'6 विशेष एजेंट रियल-टाइम में सहयोग करते हैं'}
          </p>
        </div>
        <PDFExportButton
          targetId="agent-map-pdf-target"
          filename="agent-communication-map"
          title="Agent Communication Map"
          lang={lang}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Agent Map */}
        <div className="xl:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 relative overflow-hidden" style={{ minHeight: 480 }}>
            {/* Grid background */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />

            {/* SVG edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              {COMM_STEPS.map((step, idx) => {
                const fromAgent = getAgent(step.from);
                const toAgent = getAgent(step.to);
                const isActive =
                  activeEdge?.from === step.from && activeEdge?.to === step.to;
                const wasActive = activeStep >= idx;
                return (
                  <line
                    key={`edge-${idx}`}
                    x1={`${fromAgent.x}%`}
                    y1={`${fromAgent.y + 6}%`}
                    x2={`${toAgent.x}%`}
                    y2={`${toAgent.y + 6}%`}
                    stroke={isActive ? '#06b6d4' : wasActive ? '#374151' : '#1f2937'}
                    strokeWidth={isActive ? 2 : 1}
                    strokeDasharray={isActive ? '6 3' : 'none'}
                    opacity={isActive ? 1 : wasActive ? 0.6 : 0.3}
                    className={isActive ? 'animate-pulse' : ''}
                  />
                );
              })}
            </svg>

            {/* Agent nodes */}
            {AGENTS.map(agent => {
              const isActive = activeNodes.has(agent.id);
              const isCurrent =
                activeEdge?.from === agent.id || activeEdge?.to === agent.id;
              return (
                <div
                  key={agent.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300`}
                  style={{ left: `${agent.x}%`, top: `${agent.y + 6}%`, zIndex: 2 }}
                >
                  <div
                    className={`
                      flex flex-col items-center gap-1 p-3 rounded-xl border
                      ${agent.bgColor} ${agent.borderColor}
                      ${isCurrent ? 'scale-110 shadow-lg' : isActive ? 'scale-105' : 'opacity-70'}
                      transition-all duration-300 cursor-default
                      w-24 md:w-28
                    `}
                    style={{
                      boxShadow: isCurrent
                        ? `0 0 20px ${agent.borderColor.replace('border-', '').replace('-500', '')}40`
                        : undefined,
                    }}
                  >
                    <div className="text-xl">{agent.icon}</div>
                    <div className={`text-[11px] font-bold ${agent.color}`}>
                      {lang === 'en' ? agent.labelEn : agent.labelHi}
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono">{agent.model}</div>
                    {isCurrent && (
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse mt-0.5" />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Floating message pills */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2" style={{ zIndex: 3 }}>
              {floatingPills.map(pill => (
                <div
                  key={pill.id}
                  className={`
                    px-2.5 py-1 rounded-full border text-[10px] font-medium
                    ${typeColors[pill.step.type]}
                    animate-fade-in-up
                  `}
                >
                  <span className="opacity-60 mr-1">[{typeLabels[pill.step.type]}]</span>
                  {lang === 'en' ? pill.step.messageEn : pill.step.messageHi}
                </div>
              ))}
            </div>

            {/* Completion banner */}
            {completed && (
              <div className="absolute inset-x-4 top-4 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-3" style={{ zIndex: 4 }}>
                <span className="text-xl">✅</span>
                <div>
                  <div className="text-sm font-bold text-green-400">
                    {lang === 'en' ? 'Workflow Complete!' : 'वर्कफ़्लो पूर्ण!'}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {lang === 'en' ?'9 agent messages exchanged • HMAC audit trail created' :'9 एजेंट संदेश • HMAC ऑडिट ट्रेल बना'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <button
              onClick={simulate}
              disabled={running}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-900 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-95 min-h-[44px] touch-manipulation"
            >
              {running ? (
                <>
                  <span className="w-3 h-3 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  {lang === 'en' ? 'Simulating…' : 'सिमुलेट हो रहा है…'}
                </>
              ) : (
                <>
                  <span>▶</span>
                  {lang === 'en' ? 'Simulate Flow' : 'फ्लो सिमुलेट करें'}
                </>
              )}
            </button>
            <button
              onClick={reset}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm transition-all duration-150 min-h-[44px] touch-manipulation"
            >
              {lang === 'en' ? 'Reset' : 'रीसेट'}
            </button>
            {activeStep >= 0 && (
              <span className="text-xs text-zinc-500 font-mono">
                {lang === 'en' ? `Step ${activeStep + 1} / ${COMM_STEPS.length}` : `चरण ${activeStep + 1} / ${COMM_STEPS.length}`}
              </span>
            )}
          </div>

          {/* Step legend */}
          <div className="mt-3 flex flex-wrap gap-2">
            {(['request', 'response', 'notify', 'audit'] as const).map(t => (
              <span key={t} className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${typeColors[t]}`}>
                {typeLabels[t]} — {t}
              </span>
            ))}
          </div>
        </div>

        {/* Communication Log */}
        <div className="xl:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden h-full flex flex-col">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">📡</span>
                <span className="text-sm font-semibold text-white">
                  {lang === 'en' ? 'Communication Log' : 'कम्युनिकेशन लॉग'}
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-500">{log.length} msgs</span>
            </div>
            <div
              ref={logRef}
              className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide"
              style={{ maxHeight: 480 }}
            >
              {log.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-xs">
                  {lang === 'en' ? 'Press Simulate to start' : 'सिमुलेट दबाएं'}
                </div>
              ) : (
                log.map(entry => {
                  const fromA = getAgent(entry.from);
                  const toA = getAgent(entry.to);
                  return (
                    <div
                      key={entry.id}
                      className="bg-zinc-800/60 rounded-lg p-2.5 border border-zinc-700/50 animate-fade-in"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs">{fromA.icon}</span>
                        <span className={`text-[10px] font-bold ${fromA.color}`}>
                          {lang === 'en' ? fromA.labelEn : fromA.labelHi}
                        </span>
                        <span className="text-zinc-600 text-[10px]">→</span>
                        <span className="text-xs">{toA.icon}</span>
                        <span className={`text-[10px] font-bold ${toA.color}`}>
                          {lang === 'en' ? toA.labelEn : toA.labelHi}
                        </span>
                        <span className="ml-auto text-[9px] font-mono text-zinc-600">{entry.time}</span>
                      </div>
                      <div className="text-[11px] text-zinc-300 leading-relaxed">{entry.message}</div>
                      <div className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${typeColors[entry.type]}`}>
                        {typeLabels[entry.type]}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
