'use client';
import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import PDFExportButton from '@/components/PDFExportButton';

interface AgentMeter {
  id: string;
  icon: string;
  nameEn: string;
  nameHi: string;
  model: string;
  inputPricePer1M: number;
  outputPricePer1M: number;
  inputTokens: number;
  outputTokens: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  calls: number;
  color: string;
  accentBg: string;
  accentBorder: string;
}

const INITIAL_AGENTS: AgentMeter[] = [
  {
    id: 'agent-orchestrator',
    icon: '🧠',
    nameEn: 'Orchestrator',
    nameHi: 'ऑर्केस्ट्रेटर',
    model: 'claude-opus-4',
    inputPricePer1M: 15,
    outputPricePer1M: 75,
    inputTokens: 0,
    outputTokens: 0,
    maxInputTokens: 12000,
    maxOutputTokens: 3000,
    calls: 0,
    color: '#a78bfa',
    accentBg: 'bg-purple-500/10',
    accentBorder: 'border-purple-500/20',
  },
  {
    id: 'agent-decision',
    icon: '⚖️',
    nameEn: 'Decision',
    nameHi: 'डिसीज़न',
    model: 'claude-sonnet-4',
    inputPricePer1M: 3,
    outputPricePer1M: 15,
    inputTokens: 0,
    outputTokens: 0,
    maxInputTokens: 18000,
    maxOutputTokens: 4500,
    calls: 0,
    color: '#60a5fa',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/20',
  },
  {
    id: 'agent-retrieval',
    icon: '🔍',
    nameEn: 'Retrieval',
    nameHi: 'रिट्रीवल',
    model: 'claude-haiku-4',
    inputPricePer1M: 0.8,
    outputPricePer1M: 4,
    inputTokens: 0,
    outputTokens: 0,
    maxInputTokens: 45000,
    maxOutputTokens: 9000,
    calls: 0,
    color: '#34d399',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/20',
  },
  {
    id: 'agent-execution',
    icon: '⚡',
    nameEn: 'Execution',
    nameHi: 'एक्सेक्यूशन',
    model: 'claude-haiku-4',
    inputPricePer1M: 0.8,
    outputPricePer1M: 4,
    inputTokens: 0,
    outputTokens: 0,
    maxInputTokens: 38000,
    maxOutputTokens: 7500,
    calls: 0,
    color: '#fbbf24',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/20',
  },
];

// 10-step simulation plan
const SIMULATION_STEPS: Array<{ agentId: string; inputDelta: number; outputDelta: number; callsDelta: number }> = [
  { agentId: 'agent-orchestrator', inputDelta: 1200, outputDelta: 280, callsDelta: 1 },
  { agentId: 'agent-retrieval', inputDelta: 4500, outputDelta: 900, callsDelta: 3 },
  { agentId: 'agent-decision', inputDelta: 1800, outputDelta: 450, callsDelta: 2 },
  { agentId: 'agent-execution', inputDelta: 3800, outputDelta: 750, callsDelta: 4 },
  { agentId: 'agent-orchestrator', inputDelta: 2100, outputDelta: 520, callsDelta: 1 },
  { agentId: 'agent-retrieval', inputDelta: 8200, outputDelta: 1600, callsDelta: 5 },
  { agentId: 'agent-decision', inputDelta: 3200, outputDelta: 820, callsDelta: 2 },
  { agentId: 'agent-execution', inputDelta: 7400, outputDelta: 1450, callsDelta: 6 },
  { agentId: 'agent-orchestrator', inputDelta: 1800, outputDelta: 390, callsDelta: 1 },
  { agentId: 'agent-decision', inputDelta: 2100, outputDelta: 540, callsDelta: 1 },
];

function calcCost(agent: AgentMeter): number {
  const inputCost = (agent.inputTokens / 1_000_000) * agent.inputPricePer1M;
  const outputCost = (agent.outputTokens / 1_000_000) * agent.outputPricePer1M;
  return inputCost + outputCost;
}

function calcAllOpusCost(agent: AgentMeter): number {
  // Hypothetical: all agents use opus pricing ($15/$75 per 1M)
  const inputCost = (agent.inputTokens / 1_000_000) * 15;
  const outputCost = (agent.outputTokens / 1_000_000) * 75;
  return inputCost + outputCost;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={`ctt-${i}`} className="text-xs font-mono" style={{ color: p.color }}>
          {p.name}: ${typeof p.value === 'number' ? p.value.toFixed(4) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function CostDashboardContent() {
  const { lang, addNotification } = useApp();
  const [agents, setAgents] = useState<AgentMeter[]>(INITIAL_AGENTS);
  const [simulating, setSimulating] = useState(false);
  const [simDone, setSimDone] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const runningRef = useRef(false);

  const totalActual = agents.reduce((sum, a) => sum + calcCost(a), 0);
  const totalAllOpus = agents.reduce((sum, a) => sum + calcAllOpusCost(a), 0);
  const totalSaved = totalAllOpus - totalActual;
  const savingsPct = totalAllOpus > 0 ? Math.round((totalSaved / totalAllOpus) * 100) : 0;

  const reset = () => {
    setAgents(INITIAL_AGENTS);
    setSimulating(false);
    setSimDone(false);
    setCurrentStep(0);
    runningRef.current = false;
  };

  const runSimulation = async () => {
    if (simulating) return;
    if (simDone) { reset(); return; }
    setSimulating(true);
    runningRef.current = true;

    for (let i = 0; i < SIMULATION_STEPS.length; i++) {
      if (!runningRef.current) break;
      const step = SIMULATION_STEPS[i];
      setCurrentStep(i + 1);
      setAgents(prev => prev.map(a => {
        if (a.id === step.agentId) {
          return {
            ...a,
            inputTokens: a.inputTokens + step.inputDelta,
            outputTokens: a.outputTokens + step.outputDelta,
            calls: a.calls + step.callsDelta,
          };
        }
        return a;
      }));
      await new Promise(r => setTimeout(r, 600));
    }

    setSimulating(false);
    setSimDone(true);
    addNotification({ type: 'success', agent: 'Cost Monitor', message: `Simulation complete. Saved $${totalSaved.toFixed(4)} vs all-Opus baseline.` });
    toast.success(`Cost simulation complete — ${savingsPct}% saved vs all-Opus`);
  };

  const chartData = agents.map(a => ({
    name: a.nameEn,
    actual: parseFloat(calcCost(a).toFixed(5)),
    allOpus: parseFloat(calcAllOpusCost(a).toFixed(5)),
  }));

  return (
    <div id="cost-dashboard-pdf-target" className="p-4 sm:p-6 xl:p-8 2xl:p-10 max-w-screen-2xl mx-auto">
      {/* Live header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0 sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💰</span>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {lang === 'en' ? 'Cost Dashboard' : 'लागत डैशबोर्ड'}
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-zinc-400">
              {lang === 'en' ? 'Total spend this session:' : 'इस सेशन में खर्च:'}
              <span className="text-yellow-400 font-mono font-bold ml-2">${totalActual.toFixed(4)}</span>
            </span>
            {totalSaved > 0 && (
              <span className="text-sm text-zinc-400">
                {lang === 'en' ? 'vs all-Opus: saving' : 'all-Opus से बचत:'}
                <span className="text-green-400 font-mono font-bold ml-2">${totalSaved.toFixed(4)}</span>
                <span className="text-green-400 font-mono ml-1">({savingsPct}%)</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PDFExportButton
            targetId="cost-dashboard-pdf-target"
            filename="cost-dashboard"
            title="Cost Dashboard"
            lang={lang}
          />
          {simDone && (
            <button onClick={reset} className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 text-sm font-medium transition-all duration-150 active:scale-95 min-h-[40px] touch-manipulation">
              ↺ {lang === 'en' ? 'Reset' : 'रीसेट'}
            </button>
          )}
          <button
            onClick={runSimulation}
            disabled={simulating}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-zinc-900 font-semibold text-sm transition-all duration-150 active:scale-95 shadow-lg shadow-yellow-500/20 min-h-[40px] touch-manipulation"
          >
            {simulating ? (
              <>
                <span className="w-3 h-3 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                {lang === 'en' ? `Step ${currentStep}/10…` : `स्टेप ${currentStep}/10…`}
              </>
            ) : simDone ? `↺ ${lang === 'en' ? 'Reset' : 'रीसेट'}` : `▶ ${lang === 'en' ? 'Simulate Workflow Costs' : 'वर्कफ़्लो लागत सिमुलेट'}`}
          </button>
        </div>
      </div>

      {/* Agent meters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {agents.map(agent => {
          const actualCost = calcCost(agent);
          const inputPct = agent.maxInputTokens > 0 ? Math.min(100, (agent.inputTokens / agent.maxInputTokens) * 100) : 0;
          const outputPct = agent.maxOutputTokens > 0 ? Math.min(100, (agent.outputTokens / agent.maxOutputTokens) * 100) : 0;
          return (
            <div key={agent.id} className={`p-5 rounded-xl border ${agent.accentBg} ${agent.accentBorder}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{agent.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{lang === 'en' ? agent.nameEn : agent.nameHi}</div>
                  <div className="text-[10px] font-mono text-zinc-500">{agent.model}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-sm font-bold tabular-nums" style={{ color: agent.color }}>${actualCost.toFixed(4)}</div>
                  <div className="text-[10px] text-zinc-600">{agent.calls} {lang === 'en' ? 'calls' : 'कॉल'}</div>
                </div>
              </div>

              {/* Input tokens bar */}
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-zinc-500">{lang === 'en' ? 'Input tokens' : 'इनपुट टोकन'}</span>
                  <span className="text-[10px] font-mono text-zinc-400">{agent.inputTokens.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${inputPct}%`, backgroundColor: agent.color }}
                  />
                </div>
                <div className="text-[9px] text-zinc-700 mt-0.5 font-mono">${agent.inputPricePer1M}/1M in</div>
              </div>

              {/* Output tokens bar */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-zinc-500">{lang === 'en' ? 'Output tokens' : 'आउटपुट टोकन'}</span>
                  <span className="text-[10px] font-mono text-zinc-400">{agent.outputTokens.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 opacity-70"
                    style={{ width: `${outputPct}%`, backgroundColor: agent.color }}
                  />
                </div>
                <div className="text-[9px] text-zinc-700 mt-0.5 font-mono">${agent.outputPricePer1M}/1M out</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts + Savings */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Cost comparison chart */}
        <div className="xl:col-span-2 2xl:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">{lang === 'en' ? 'Actual vs All-Opus Cost' : 'वास्तविक बनाम All-Opus लागत'}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">{lang === 'en' ? 'Smart routing vs hypothetical all-Opus baseline' : 'स्मार्ट रूटिंग बनाम all-Opus बेसलाइन'}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="allOpus" name="All-Opus" fill="#52525b" radius={[2, 2, 0, 0]} />
              <Bar dataKey="actual" name="HELPxGROW" radius={[2, 2, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={INITIAL_AGENTS[index]?.color || '#06b6d4'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Savings calculator */}
        <div className="xl:col-span-1 2xl:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">{lang === 'en' ? 'Savings Calculator' : 'बचत कैलकुलेटर'}</h3>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">{lang === 'en' ? 'Actual cost (smart routing)' : 'वास्तविक लागत (स्मार्ट रूटिंग)'}</div>
              <div className="text-xl font-bold tabular-nums text-yellow-400">${totalActual.toFixed(4)}</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">{lang === 'en' ? 'All-Opus hypothetical' : 'All-Opus हाइपोथेटिकल'}</div>
              <div className="text-xl font-bold tabular-nums text-zinc-400">${totalAllOpus.toFixed(4)}</div>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="text-xs text-green-400 mb-1">{lang === 'en' ? 'You saved' : 'आपने बचाया'}</div>
              <div className="text-2xl font-bold tabular-nums text-green-400">${totalSaved.toFixed(4)}</div>
              {savingsPct > 0 && (
                <div className="mt-1.5">
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full transition-all duration-700"
                      style={{ width: `${savingsPct}%` }}
                    />
                  </div>
                  <div className="text-xs text-green-400 font-mono mt-1">{savingsPct}% {lang === 'en' ? 'reduction' : 'कमी'}</div>
                </div>
              )}
            </div>

            {/* Model pricing reference */}
            <div className="pt-2 border-t border-zinc-800">
              <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">{lang === 'en' ? 'Model Pricing (per 1M tokens)' : 'मॉडल प्राइसिंग (प्रति 1M टोकन)'}</div>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between"><span className="text-purple-400">opus-4</span><span className="text-zinc-500">$15 in / $75 out</span></div>
                <div className="flex justify-between"><span className="text-blue-400">sonnet-4</span><span className="text-zinc-500">$3 in / $15 out</span></div>
                <div className="flex justify-between"><span className="text-emerald-400">haiku-4</span><span className="text-zinc-500">$0.80 in / $4 out</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}