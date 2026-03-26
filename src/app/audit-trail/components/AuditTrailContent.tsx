'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PDFExportButton from '@/components/PDFExportButton';

const AUDIT_EVENTS = [
  { id: 'AUD-001', timestamp: '2026-03-22 09:15:31', agent: 'Orchestrator', action: 'Pipeline Initialized', outcome: 'All 6 agents registered and ready', status: 'success' },
  { id: 'AUD-002', timestamp: '2026-03-22 09:16:04', agent: 'Retrieval Agent', action: 'Knowledge Base Query', outcome: 'Retrieved 142 relevant documents', status: 'success' },
  { id: 'AUD-003', timestamp: '2026-03-22 09:16:47', agent: 'Decision Agent', action: 'Policy Evaluation', outcome: 'SLA threshold breach detected (P1)', status: 'warning' },
  { id: 'AUD-004', timestamp: '2026-03-22 09:17:12', agent: 'Compliance Agent', action: 'HMAC Signature Verify', outcome: 'Payload integrity confirmed — SHA-256 valid', status: 'success' },
  { id: 'AUD-005', timestamp: '2026-03-22 09:17:55', agent: 'Execution Agent', action: 'Escalation Triggered', outcome: 'Ticket #TKT-8821 auto-escalated to L2', status: 'success' },
  { id: 'AUD-006', timestamp: '2026-03-22 09:18:30', agent: 'Audit Agent', action: 'Event Log Commit', outcome: 'Immutable log entry written to chain', status: 'success' },
  { id: 'AUD-007', timestamp: '2026-03-22 09:19:01', agent: 'Compliance Agent', action: 'Policy Reference Check', outcome: 'Rule POL-47 violated — flagged for review', status: 'error' },
];

const STATS = [
  { label: 'Total Events', value: '2,847', sub: 'Last 30 days', icon: '📋', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { label: 'Compliance Rate', value: '98.6%', sub: '+0.4% vs last month', icon: '✅', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  { label: 'Policy Violations', value: '41', sub: '3 critical, 38 minor', icon: '⚠️', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { label: 'Avg Resolution', value: '4.2 min', sub: 'Down from 6.8 min', icon: '⚡', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
];

const JSON_SCHEMA = `{
  "$schema": "https://helpxgrow.ai/schemas/audit-event/v2",
  "type": "object",
  "required": ["id", "timestamp", "agent", "action", "outcome", "status", "hmac"],
  "properties": {
    "id": { "type": "string", "pattern": "^AUD-[0-9]{3,6}$" },
    "timestamp": { "type": "string", "format": "date-time" },
    "agent": {
      "type": "string",
      "enum": ["Orchestrator", "Retrieval Agent", "Decision Agent",
               "Execution Agent", "Audit Agent", "Compliance Agent"]
    },
    "action": { "type": "string", "maxLength": 128 },
    "outcome": { "type": "string", "maxLength": 512 },
    "status": { "type": "string", "enum": ["success", "warning", "error"] },
    "hmac": { "type": "string", "description": "SHA-256 HMAC of payload" },
    "metadata": {
      "type": "object",
      "properties": {
        "policyRef": { "type": "string" },
        "ticketId": { "type": "string" },
        "costUSD": { "type": "number" }
      }
    }
  }
}`;

const GUARDRAILS = [
  {
    icon: '🔐',
    title: 'HMAC-Signed Payloads',
    color: 'text-cyan-400',
    border: 'border-cyan-500/20',
    bg: 'bg-cyan-500/5',
    desc: 'Every audit event is signed with SHA-256 HMAC using a rotating secret key. Signatures are verified before any event is committed to the immutable log, preventing tampering or replay attacks.',
    badge: 'SHA-256',
  },
  {
    icon: '🛡️',
    title: 'Schema Validation',
    color: 'text-green-400',
    border: 'border-green-500/20',
    bg: 'bg-green-500/5',
    desc: 'All incoming audit events are validated against the JSON Schema v2 specification before processing. Malformed events are rejected with a 422 error and logged separately for investigation.',
    badge: 'JSON Schema v2',
  },
  {
    icon: '📜',
    title: 'Policy Reference Engine',
    color: 'text-purple-400',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/5',
    desc: 'Each event is cross-referenced against 47 active compliance policies (ISO 27001, SOC 2, GDPR). Violations are automatically tagged with the specific policy rule ID and escalated to the Compliance Agent.',
    badge: '47 Active Rules',
  },
];

const STATUS_CONFIG = {
  success: { label: 'SUCCESS', cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
  warning: { label: 'WARNING', cls: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  error: { label: 'ERROR', cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
};

export default function AuditTrailContent() {
  const { lang } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON_SCHEMA).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div id="audit-trail-pdf-target" className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0 sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📋</span>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {lang === 'en' ? 'Audit Trail' : 'ऑडिट ट्रेल'}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/30">LIVE</span>
          </div>
          <p className="text-sm text-zinc-400">
            {lang === 'en' ?'Immutable, HMAC-signed event log for all agentic actions' :'सभी एजेंटिक क्रियाओं के लिए अपरिवर्तनीय, HMAC-हस्ताक्षरित इवेंट लॉग'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <PDFExportButton
            targetId="audit-trail-pdf-target"
            filename="audit-trail"
            title="Audit Trail"
            lang={lang}
          />
          <div className="text-right">
            <div className="text-xs text-zinc-500 font-mono">Last updated</div>
            <div className="text-xs text-cyan-400 font-mono">2026-03-22 09:19:01</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {STATS.map((stat, i) => (
          <div key={i} className={`rounded-xl border p-3 sm:p-4 ${stat.bg}`}>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="text-lg sm:text-xl">{stat.icon}</span>
              <span className="text-xs text-zinc-400 font-medium">{stat.label}</span>
            </div>
            <div className={`text-xl sm:text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-[11px] text-zinc-500">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Events Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            {lang === 'en' ? 'Recent Audit Events' : 'हालिया ऑडिट इवेंट'}
          </h2>
          <span className="text-xs text-zinc-500 font-mono">{AUDIT_EVENTS.length} events</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[500px]">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-zinc-500 font-semibold tracking-wide">TIMESTAMP</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-semibold tracking-wide">AGENT</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-semibold tracking-wide">ACTION</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-semibold tracking-wide hidden md:table-cell">OUTCOME</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-semibold tracking-wide">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_EVENTS.map((event, i) => {
                const sc = STATUS_CONFIG[event.status as keyof typeof STATUS_CONFIG];
                return (
                  <tr key={event.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-zinc-900/50'}`}>
                    <td className="px-4 py-3 font-mono text-zinc-400 whitespace-nowrap text-[10px] sm:text-xs">{event.timestamp}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-cyan-300 font-medium text-[10px] sm:text-[11px] whitespace-nowrap">{event.agent}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 font-medium whitespace-nowrap">{event.action}</td>
                    <td className="px-4 py-3 text-zinc-400 hidden md:table-cell max-w-xs truncate">{event.outcome}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.cls} whitespace-nowrap`}>{sc.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Schema */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{ '{}'}</span>
            <h2 className="text-sm font-semibold text-white">
              {lang === 'en' ? 'Audit Event JSON Schema' : 'ऑडिट इवेंट JSON स्कीमा'}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-700 text-zinc-300">v2</span>
          </div>
          <button
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all min-h-[36px] touch-manipulation ${
              copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' :'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
            }`}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <pre className="p-4 sm:p-5 text-xs font-mono text-zinc-300 leading-relaxed bg-zinc-950/50">
            <code>{JSON_SCHEMA}</code>
          </pre>
        </div>
      </div>

      {/* Guardrail Cards */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">
          {lang === 'en' ? 'Security Guardrails' : 'सुरक्षा गार्डरेल'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GUARDRAILS.map((g, i) => (
            <div key={i} className={`rounded-xl border p-4 sm:p-5 ${g.bg} ${g.border}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{g.icon}</span>
                <div>
                  <div className={`text-sm font-bold ${g.color}`}>{g.title}</div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${g.border} ${g.color} bg-transparent`}>{g.badge}</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{g.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
