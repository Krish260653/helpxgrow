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
    .catch(err => console.error(err))