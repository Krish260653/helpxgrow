'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PDFExportButton from '@/components/PDFExportButton';

const AGENTS = [
  {
    name: 'Orchestrator',
    role: 'Pipeline Coordinator',
    model: 'Claude Sonnet 4',
    icon: '🎯',
    color: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/5',
    glow: 'hover:border-cyan-500/60 hover:shadow-cyan-500/10',
    desc: 'Central coordinator that routes tasks, manages agent lifecycles, and ensures end-to-end pipeline integrity with retry logic and fallback handling.',
  },
  {
    name: 'Retrieval Agent',
    role: 'Knowledge Retriever',
    model: 'Claude Haiku 3.5',
    icon: '🔍',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    glow: 'hover:border-blue-500/60 hover:shadow-blue-500/10',
    desc: 'Performs semantic search across internal knowledge bases, ticket history, and policy documents using vector embeddings and BM25 hybrid retrieval.',
  },
  {
    name: 'Decision Agent',
    role: 'Logic & Reasoning',
    model: 'Claude Sonnet 4',
    icon: '🧠',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/5',
    glow: 'hover:border-purple-500/60 hover:shadow-purple-500/10',
    desc: 'Applies multi-step chain-of-thought reasoning to evaluate SLA thresholds, priority scores, and escalation criteria against retrieved context.',
  },
  {
    name: 'Execution Agent',
    role: 'Action Executor',
    model: 'Claude Haiku 3.5',
    icon: '⚡',
    color: 'text-yellow-400',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/5',
    glow: 'hover:border-yellow-500/60 hover:shadow-yellow-500/10',
    desc: 'Executes approved actions via tool calls: ticket updates, Slack notifications, calendar scheduling, and CRM record mutations with rollback support.',
  },
  {
    name: 'Audit Agent',
    role: 'Event Logger',
    model: 'Claude Haiku 3.5',
    icon: '📋',
    color: 'text-green-400',
    border: 'border-green-500/30',
    bg: 'bg-green-500/5',
    glow: 'hover:border-green-500/60 hover:shadow-green-500/10',
    desc: 'Captures every agentic action as an HMAC-signed, schema-validated audit event and commits to an immutable append-only log for compliance.',
  },
  {
    name: 'Compliance Agent',
    role: 'Policy Enforcer',
    model: 'Claude Sonnet 4',
    icon: '🛡️',
    color: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    glow: 'hover:border-red-500/60 hover:shadow-red-500/10',
    desc: 'Validates all actions against 47 active compliance rules (ISO 27001, SOC 2, GDPR). Blocks non-compliant operations and triggers policy violation alerts.',
  },
];

const PIPELINE_STEPS = [
  { label: 'Input', icon: '📥', color: 'bg-zinc-700', text: 'text-zinc-300' },
  { label: 'Orchestrator', icon: '🎯', color: 'bg-cyan-500/20', text: 'text-cyan-400' },
  { label: 'Retrieval', icon: '🔍', color: 'bg-blue-500/20', text: 'text-blue-400' },
  { label: 'Decision', icon: '🧠', color: 'bg-purple-500/20', text: 'text-purple-400' },
  { label: 'Compliance', icon: '🛡️', color: 'bg-red-500/20', text: 'text-red-400' },
  { label: 'Execution', icon: '⚡', color: 'bg-yellow-500/20', text: 'text-yellow-400' },
  { label: 'Audit', icon: '📋', color: 'bg-green-500/20', text: 'text-green-400' },
  { label: 'Output', icon: '📤', color: 'bg-zinc-700', text: 'text-zinc-300' },
];

const MODELS_TABLE = [
  {
    agent: 'Orchestrator',
    model: 'Claude Sonnet 4',
    rationale: 'Complex multi-step coordination requires strong reasoning and instruction-following capabilities',
    cost: '$3 / 1M tokens',
    icon: '🎯',
    color: 'text-cyan-400',
  },
  {
    agent: 'Retrieval Agent',
    model: 'Claude Haiku 3.5',
    rationale: 'High-volume, low-latency document retrieval and summarization — speed over depth',
    cost: '$0.25 / 1M tokens',
    icon: '🔍',
    color: 'text-blue-400',
  },
  {
    agent: 'Decision Agent',
    model: 'Claude Sonnet 4',
    rationale: 'Policy evaluation and SLA reasoning demand nuanced chain-of-thought analysis',
    cost: '$3 / 1M tokens',
    icon: '🧠',
    color: 'text-purple-400',
  },
  {
    agent: 'Execution Agent',
    model: 'Claude Haiku 3.5',
    rationale: 'Tool-call execution is structured and deterministic — fast, cheap model suffices',
    cost: '$0.25 / 1M tokens',
    icon: '⚡',
    color: 'text-yellow-400',
  },
  {
    agent: 'Audit Agent',
    model: 'Claude Haiku 3.5',
    rationale: 'Schema-validated log generation is templated and repetitive — minimal reasoning needed',
    cost: '$0.25 / 1M tokens',
    icon: '📋',
    color: 'text-green-400',
  },
  {
    agent: 'Compliance Agent',
    model: 'Claude Sonnet 4',
    rationale: 'Cross-referencing 47 policies with contextual nuance requires high-capability model',
    cost: '$3 / 1M tokens',
    icon: '🛡️',
    color: 'text-red-400',
  },
];

export default function ArchitectureContent() {
  const { lang } = useApp();
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <div id="architecture-pdf-target" className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0 sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🏗️</span>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {lang === 'en' ? 'System Architecture' : 'सिस्टम आर्किटेक्चर'}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">v2.0</span>
          </div>
          <p className="text-sm text-zinc-400">
            {lang === 'en' ?'Multi-agent pipeline design, model selection rationale, and system topology' :'मल्टी-एजेंट पाइपलाइन डिज़ाइन, मॉडल चयन तर्क और सिस्टम टोपोलॉजी'}
          </p>
        </div>
        <PDFExportButton
          targetId="architecture-pdf-target"
          filename="architecture"
          title="System Architecture"
          lang={lang}
        />
      </div>
      {/* Agent Cards */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
          {lang === 'en' ? 'Agent Registry' : 'एजेंट रजिस्ट्री'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENTS?.map((agent, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 sm:p-5 ${agent?.bg} ${agent?.border} ${agent?.glow} hover:shadow-lg transition-all duration-200 cursor-default`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{agent?.icon}</span>
                  <div>
                    <div className={`text-sm font-bold ${agent?.color}`}>{agent?.name}</div>
                    <div className="text-[11px] text-zinc-500">{agent?.role}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-mono border border-zinc-700 whitespace-nowrap ml-2">
                  {agent?.model}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{agent?.desc}</p>
            </div>
          ))}
        </div>
      </div>
      {/* End-to-End Pipeline */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-white mb-5">
          {lang === 'en' ? 'End-to-End Pipeline' : 'एंड-टू-एंड पाइपलाइन'}
        </h2>
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {PIPELINE_STEPS?.map((step, i) => (
            <React.Fragment key={i}>
              <div
                className={`flex flex-col items-center gap-2 px-2 sm:px-3 py-3 rounded-xl border transition-all duration-200 cursor-default flex-shrink-0 ${
                  hoveredStep === i
                    ? `${step?.color} border-zinc-600 scale-105 shadow-lg`
                    : `${step?.color} border-zinc-800`
                }`}
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <span className="text-xl">{step?.icon}</span>
                <span className={`text-[10px] sm:text-[11px] font-semibold ${step?.text} whitespace-nowrap`}>{step?.label}</span>
              </div>
              {i < PIPELINE_STEPS?.length - 1 && (
                <div className={`flex-shrink-0 transition-colors duration-200 ${
                  hoveredStep === i || hoveredStep === i + 1 ? 'text-cyan-400' : 'text-zinc-700'
                }`}>
                  <svg width="16" height="12" viewBox="0 0 20 12" fill="none">
                    <path d="M0 6H16M16 6L11 1M16 6L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-zinc-600 mt-4">
          {lang === 'en' ?'Hover over each stage to highlight. Avg end-to-end latency: 2.3s · 207× faster than manual' :'प्रत्येक चरण पर होवर करें। औसत लेटेंसी: 2.3s · मैनुअल से 207× तेज़'}
        </p>
      </div>
      {/* Models Comparison Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">
            {lang === 'en' ? 'Model Selection Rationale' : 'मॉडल चयन तर्क'}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {lang === 'en' ? 'Cost-optimized model assignment per agent capability' : 'एजेंट क्षमता के अनुसार लागत-अनुकूलित मॉडल असाइनमेंट'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[480px]">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 sm:px-5 py-3 text-zinc-500 font-semibold tracking-wide">AGENT</th>
                <th className="text-left px-4 sm:px-5 py-3 text-zinc-500 font-semibold tracking-wide">MODEL</th>
                <th className="text-left px-4 sm:px-5 py-3 text-zinc-500 font-semibold tracking-wide hidden md:table-cell">RATIONALE</th>
                <th className="text-left px-4 sm:px-5 py-3 text-zinc-500 font-semibold tracking-wide">COST</th>
              </tr>
            </thead>
            <tbody>
              {MODELS_TABLE?.map((row, i) => (
                <tr key={i} className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-zinc-900/50'}`}>
                  <td className="px-4 sm:px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span>{row?.icon}</span>
                      <span className={`font-semibold ${row?.color}`}>{row?.agent}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-5 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono text-[11px] border border-zinc-700 whitespace-nowrap">{row?.model}</span>
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-zinc-400 hidden md:table-cell max-w-xs">{row?.rationale}</td>
                  <td className="px-4 sm:px-5 py-3 font-mono text-zinc-300 whitespace-nowrap">{row?.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
