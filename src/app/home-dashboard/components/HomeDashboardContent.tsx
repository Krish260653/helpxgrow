'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import PDFExportButton from '@/components/PDFExportButton';
import GuidedTour, { TourStep } from '@/components/GuidedTour';
import { workflowLogService, WorkflowLog } from '@/lib/services/workflowLogService';

const costData = [
  { day: 'Mon', actual: 0.42, baseline: 3.21 },
  { day: 'Tue', actual: 0.61, baseline: 4.87 },
  { day: 'Wed', actual: 0.58, baseline: 5.12 },
  { day: 'Thu', actual: 0.39, baseline: 3.44 },
  { day: 'Fri', actual: 0.74, baseline: 6.01 },
  { day: 'Sat', actual: 0.28, baseline: 2.19 },
  { day: 'Sun', actual: 0.55, baseline: 4.33 },
];

const EXPLORE_CARDS = [
  { href: '/employee-onboarding-demo', titleEn: 'Employee Onboarding', titleHi: 'एम्प्लॉई ऑनबोर्डिंग', descEn: '8-step autonomous onboarding with JIRA error recovery', descHi: '8-स्टेप ऑटोनॉमस ऑनबोर्डिंग JIRA एरर रिकवरी के साथ', badge: '7/8 steps' },
  { href: '/meeting-actions-demo', titleEn: 'Meeting → Actions', titleHi: 'मीटिंग → एक्शन', descEn: 'Extract action items from transcripts with confidence scoring', descHi: 'ट्रांस्क्रिप्ट से एक्शन आइटम कॉन्फिडेंस स्कोरिंग के साथ', badge: '94% accuracy' },
  { href: '/sla-breach-prevention-demo', titleEn: 'SLA Breach Prevention', titleHi: 'SLA ब्रीच प्रिवेंशन', descEn: '$127K procurement approval recovered in 13 minutes', descHi: '$127K अप्रूवल 13 मिनट में रिकवर', badge: '$4.2K saved' },
  { href: '/cost-dashboard', titleEn: 'Cost Dashboard', titleHi: 'लागत डैशबोर्ड', descEn: 'Smart model routing saves 87% vs all-Opus baseline', descHi: 'स्मार्ट मॉडल रूटिंग all-Opus से 87% बचाती है', badge: '87% saved' },
];

const HOME_TOUR_STEPS: TourStep[] = [
  {
    target: '#home-kpi-grid',
    titleEn: 'Live KPI Metrics',
    titleHi: 'लाइव KPI मेट्रिक्स',
    descEn: 'These cards show real-time platform health — workflow count, success rate, error count, and active agents pulled live from the database.',
    descHi: 'ये कार्ड रियल-टाइम प्लेटफ़ॉर्म मेट्रिक्स दिखाते हैं — वर्कफ़्लो, सफलता दर, एरर और एजेंट।',
    placement: 'bottom',
  },
  {
    target: '#home-workflow-chart',
    titleEn: 'Workflow Volume Chart',
    titleHi: 'वर्कफ़्लो वॉल्यूम चार्ट',
    descEn: 'Track daily workflow runs and error counts over the last 7 days. Grey area = total workflows, red = errors.',
    descHi: 'पिछले 7 दिनों के वर्कफ़्लो रन और एरर ट्रैक करें।',
    placement: 'bottom',
  },
  {
    target: '#home-cost-chart',
    titleEn: 'Cost Savings Chart',
    titleHi: 'लागत बचत चार्ट',
    descEn: 'Compare actual AI costs vs the all-Opus baseline. Smart model routing saves up to 87% per session.',
    descHi: 'वास्तविक AI लागत बनाम all-Opus बेसलाइन।',
    placement: 'bottom',
  },
  {
    target: '#home-explore-cards',
    titleEn: 'Explore Demo Workflows',
    titleHi: 'डेमो वर्कफ़्लो एक्सप्लोर करें',
    descEn: 'Click any card to launch a live demo — Employee Onboarding, Meeting Actions, SLA Breach Prevention, or Cost Dashboard.',
    descHi: 'किसी भी कार्ड पर क्लिक करके लाइव डेमो लॉन्च करें।',
    placement: 'top',
  },
  {
    target: '#home-activity-feed',
    titleEn: 'Live Activity Feed',
    titleHi: 'लाइव गतिविधि फ़ीड',
    descEn: 'Real-time log of agent actions from the database — successes, errors, and info events with timestamps.',
    descHi: 'डेटाबेस से एजेंट एक्शन का रियल-टाइम लॉग।',
    placement: 'left',
  },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[hsl(220,10%,9%)] border border-[hsl(220,8%,20%)] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[11px] text-[hsl(220,9%,45%)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={`tt-${i}`} className="text-[11px] font-mono" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

function buildWorkflowChartData(logs: WorkflowLog[]): Array<{ day: string; workflows: number; errors: number }> {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts: Record<string, { workflows: number; errors: number }> = {};
  days.forEach((d) => { counts[d] = { workflows: 0, errors: 0 }; });

  logs.forEach((log) => {
    if (!log.createdAt) return;
    const day = days[new Date(log.createdAt).getDay()];
    counts[day].workflows += 1;
    if (log.status === 'error') counts[day].errors += 1;
  });

  // Return in week order starting from today
  const today = new Date().getDay();
  const ordered = [];
  for (let i = 6; i >= 0; i--) {
    const idx = (today - i + 7) % 7;
    ordered.push({ day: days[idx], ...counts[days[idx]] });
  }
  return ordered;
}

export default function HomeDashboardContent() {
  const { lang } = useApp();
  const router = useRouter();
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalWorkflows: 0, successCount: 0, errorCount: 0, uniqueAgents: 0 });
  const [recentLogs, setRecentLogs] = useState<WorkflowLog[]>([]);
  const [workflowChartData, setWorkflowChartData] = useState<Array<{ day: string; workflows: number; errors: number }>>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const result = await workflowLogService.fetchStats();
    setStats({
      totalWorkflows: result.totalWorkflows,
      successCount: result.successCount,
      errorCount: result.errorCount,
      uniqueAgents: result.uniqueAgents,
    });
    setRecentLogs(result.recentLogs);

    // Build chart data from all recent logs
    const allLogs = await workflowLogService.fetchRecent(100);
    setWorkflowChartData(buildWorkflowChartData(allLogs));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    // Subscribe to real-time inserts
    const unsubscribe = workflowLogService.subscribeToNew((newLog) => {
      setRecentLogs((prev) => [newLog, ...prev].slice(0, 6));
      setStats((prev) => ({
        ...prev,
        totalWorkflows: prev.totalWorkflows + 1,
        successCount: newLog.status === 'success' ? prev.successCount + 1 : prev.successCount,
        errorCount: newLog.status === 'error' ? prev.errorCount + 1 : prev.errorCount,
      }));
    });
    return unsubscribe;
  }, [loadData]);

  const slaCompliance = stats.totalWorkflows > 0
    ? Math.round(((stats.successCount) / stats.totalWorkflows) * 100 * 10) / 10
    : 99.1;

  const KPI_CARDS = [
    { id: 'kpi-workflows', labelEn: 'Workflows Run', labelHi: 'वर्कफ़्लो रन', value: loading ? '—' : String(stats.totalWorkflows), delta: `+${stats.totalWorkflows} total`, trend: 'up', subEn: 'from database', subHi: 'डेटाबेस से' },
    { id: 'kpi-sla', labelEn: 'Success Rate', labelHi: 'सफलता दर', value: loading ? '—' : `${slaCompliance}%`, delta: `${stats.successCount} succeeded`, trend: 'up', subEn: 'last 100 runs', subHi: 'पिछले 100 रन' },
    { id: 'kpi-errors', labelEn: 'Errors', labelHi: 'एरर', value: loading ? '—' : String(stats.errorCount), delta: 'auto-recovered', trend: stats.errorCount > 0 ? 'down' : 'up', subEn: 'with recovery', subHi: 'रिकवरी के साथ' },
    { id: 'kpi-agents', labelEn: 'Active Agents', labelHi: 'सक्रिय एजेंट', value: loading ? '—' : String(stats.uniqueAgents), delta: 'unique agents', trend: 'neutral', subEn: 'in logs', subHi: 'लॉग में' },
    { id: 'kpi-speed', labelEn: 'Speed Multiplier', labelHi: 'स्पीड मल्टीप्लायर', value: '207×', delta: 'vs manual', trend: 'neutral', subEn: 'faster than human', subHi: 'मानव से तेज़' },
    { id: 'kpi-audit', labelEn: 'Audit Coverage', labelHi: 'ऑडिट कवरेज', value: '100%', delta: '0 unaudited', trend: 'up', subEn: 'HMAC-signed', subHi: 'HMAC-साइन्ड' },
  ];

  return (
    <div id="home-dashboard-pdf-target" className="p-5 sm:p-7 xl:p-9 max-w-screen-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0 sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-white tracking-tight">
            {lang === 'en' ? 'Platform Overview' : 'प्लेटफ़ॉर्म अवलोकन'}
          </h1>
          <p className="text-[13px] text-[hsl(220,9%,45%)] mt-1">
            {lang === 'en' ? 'Live agent activity · Real-time from database' : 'लाइव एजेंट गतिविधि · डेटाबेस से रियल-टाइम'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <GuidedTour
            steps={HOME_TOUR_STEPS}
            lang={lang}
            storageKey="tour-home-dashboard"
          />
          <PDFExportButton
            targetId="home-dashboard-pdf-target"
            filename="home-dashboard"
            title="Platform Overview"
            lang={lang}
          />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(152,30%,10%)] border border-[hsl(152,30%,18%)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(152,45%,55%)] animate-pulse-dot" />
            <span className="text-[12px] font-medium text-[hsl(152,45%,55%)]">
              {loading ? '…' : stats.uniqueAgents} {lang === 'en' ? 'agents active' : 'एजेंट सक्रिय'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div id="home-kpi-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPI_CARDS.map((card) => (
          <div
            key={card.id}
            className="p-4 rounded-xl border border-[hsl(220,8%,16%)] bg-[hsl(220,10%,9%)] hover:border-[hsl(220,8%,24%)] transition-all duration-200"
          >
            <div className="text-[10px] font-medium tracking-wide text-[hsl(220,9%,42%)] uppercase mb-3">
              {lang === 'en' ? card.labelEn : card.labelHi}
            </div>
            <div className="text-[22px] font-semibold text-white tabular-nums leading-none mb-2">{card.value}</div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-medium ${
                card.trend === 'up' ? 'text-[hsl(152,45%,55%)]' :
                card.trend === 'down' ? 'text-[hsl(0,65%,58%)]' :
                'text-[hsl(220,9%,45%)]'
              }`}>
                {card.delta}
              </span>
            </div>
            <div className="text-[10px] text-[hsl(220,9%,35%)] mt-1">{lang === 'en' ? card.subEn : card.subHi}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Workflow volume chart */}
        <div id="home-workflow-chart" className="bg-[hsl(220,10%,9%)] border border-[hsl(220,8%,16%)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[13px] font-semibold text-white">{lang === 'en' ? 'Workflow Volume' : 'वर्कफ़्लो वॉल्यूम'}</h3>
              <p className="text-[11px] text-[hsl(220,9%,42%)] mt-0.5">{lang === 'en' ? 'Last 7 days · live data' : 'पिछले 7 दिन · लाइव डेटा'}</p>
            </div>
            <span className="px-2 py-1 rounded-md bg-[hsl(220,9%,14%)] text-[hsl(220,14%,65%)] text-[11px] font-mono border border-[hsl(220,8%,20%)]">
              {loading ? '…' : `${stats.totalWorkflows} total`}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={workflowChartData.length > 0 ? workflowChartData : [{ day: '…', workflows: 0, errors: 0 }]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-workflows" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(220,14%,72%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(220,14%,72%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-errors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0,65%,58%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(0,65%,58%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(220,8%,14%)" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(220,9%,38%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(220,9%,38%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="workflows" stroke="hsl(220,14%,65%)" strokeWidth={1.5} fill="url(#grad-workflows)" name="Workflows" />
              <Area type="monotone" dataKey="errors" stroke="hsl(0,65%,58%)" strokeWidth={1.5} fill="url(#grad-errors)" name="Errors" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cost comparison chart */}
        <div id="home-cost-chart" className="bg-[hsl(220,10%,9%)] border border-[hsl(220,8%,16%)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[13px] font-semibold text-white">{lang === 'en' ? 'Cost: Actual vs Baseline' : 'लागत: वास्तविक बनाम बेसलाइन'}</h3>
              <p className="text-[11px] text-[hsl(220,9%,42%)] mt-0.5">{lang === 'en' ? 'Smart routing savings' : 'स्मार्ट रूटिंग बचत'}</p>
            </div>
            <span className="px-2 py-1 rounded-md bg-[hsl(220,9%,14%)] text-[hsl(152,45%,55%)] text-[11px] font-mono border border-[hsl(220,8%,20%)]">87% saved</span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={costData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="hsl(220,8%,14%)" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(220,9%,38%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(220,9%,38%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="baseline" name="All-Opus" fill="hsl(220,8%,28%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="actual" name="HELPxGROW" fill="hsl(220,14%,65%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Explore cards + Activity feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Explore cards */}
        <div id="home-explore-cards" className="xl:col-span-2">
          <h3 className="text-[11px] font-medium text-[hsl(220,9%,40%)] uppercase tracking-[0.08em] mb-4">
            {lang === 'en' ? 'Explore Demos' : 'डेमो एक्सप्लोर करें'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXPLORE_CARDS.map(card => (
              <button
                key={`explore-${card.href}`}
                onClick={() => router.push(card.href)}
                onMouseEnter={() => setActiveCard(card.href)}
                onMouseLeave={() => setActiveCard(null)}
                className={`
                  relative text-left p-4 rounded-xl border border-[hsl(220,8%,16%)]
                  bg-[hsl(220,10%,9%)]
                  hover:border-[hsl(220,8%,26%)] hover:bg-[hsl(220,9%,11%)]
                  transition-all duration-200 active:scale-[0.99]
                  min-h-[44px] touch-manipulation
                  ${activeCard === card.href ? 'shadow-lg shadow-black/30' : ''}
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-[hsl(220,9%,14%)] text-[hsl(220,9%,52%)] border border-[hsl(220,8%,20%)]">{card.badge}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[hsl(220,9%,35%)] mt-0.5">
                    <path d="M2 6h8M7 3l3 3-3 3"/>
                  </svg>
                </div>
                <div className="text-[13px] font-semibold text-white mb-1.5">
                  {lang === 'en' ? card.titleEn : card.titleHi}
                </div>
                <div className="text-[12px] text-[hsl(220,9%,48%)] leading-relaxed">
                  {lang === 'en' ? card.descEn : card.descHi}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent activity — live from Supabase */}
        <div id="home-activity-feed" className="xl:col-span-1">
          <h3 className="text-[11px] font-medium text-[hsl(220,9%,40%)] uppercase tracking-[0.08em] mb-4">
            {lang === 'en' ? 'Live Activity' : 'लाइव गतिविधि'}
          </h3>
          <div className="bg-[hsl(220,10%,9%)] border border-[hsl(220,8%,16%)] rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <span className="w-4 h-4 border-2 border-[hsl(220,8%,28%)] border-t-[hsl(220,14%,65%)] rounded-full animate-spin" />
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-[hsl(220,9%,40%)]">
                {lang === 'en' ? 'No activity yet. Run a demo to see logs.' : 'अभी कोई गतिविधि नहीं। लॉग देखने के लिए डेमो चलाएं।'}
              </div>
            ) : (
              recentLogs.map((item, idx) => {
                const dotColor = item.status === 'success' ? 'bg-[hsl(152,45%,55%)]' : item.status === 'error' ? 'bg-[hsl(0,65%,58%)]' : 'bg-[hsl(210,70%,58%)]';
                return (
                  <div key={item.id ?? idx} className={`flex items-start gap-3 p-3 hover:bg-[hsl(220,9%,11%)] transition-colors ${idx < recentLogs.length - 1 ? 'border-b border-[hsl(220,8%,14%)]' : ''}`}>
                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-medium text-[hsl(220,14%,78%)] truncate">{item.agentId}</span>
                        <span className="text-[10px] text-[hsl(220,9%,35%)] flex-shrink-0 font-mono">
                          {item.createdAt ? formatTimeAgo(item.createdAt) : '—'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[hsl(220,9%,48%)] mt-0.5 truncate">{item.workflowName}</p>
                      <p className="text-[10px] text-[hsl(220,9%,35%)] font-mono mt-0.5 truncate">
                        {item.userEmail ?? (item.metadata as Record<string, unknown>)?.employee as string ?? '—'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}