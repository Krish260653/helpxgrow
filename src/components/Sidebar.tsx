'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import AppLogo from '@/components/ui/AppLogo';

const NAV_ITEMS = [
  { href: '/home-dashboard', labelEn: 'Home', labelHi: 'होम', section: 'main' },
  { href: '/employee-onboarding-demo', labelEn: 'Onboarding Demo', labelHi: 'ऑनबोर्डिंग', section: 'demos' },
  { href: '/meeting-actions-demo', labelEn: 'Meeting → Actions', labelHi: 'मीटिंग → एक्शन', section: 'demos' },
  { href: '/sla-breach-prevention-demo', labelEn: 'SLA Breach', labelHi: 'SLA ब्रीच', section: 'demos' },
  { href: '/agent-communication-map', labelEn: 'Agent Map', labelHi: 'एजेंट मैप', section: 'demos' },
  { href: '/speed-comparison', labelEn: 'Speed Comparison', labelHi: 'स्पीड तुलना', section: 'demos' },
  { href: '/cost-dashboard', labelEn: 'Cost Dashboard', labelHi: 'लागत डैशबोर्ड', section: 'analytics' },
  { href: '/audit-trail', labelEn: 'Audit Trail', labelHi: 'ऑडिट ट्रेल', section: 'system' },
  { href: '/architecture', labelEn: 'Architecture', labelHi: 'आर्किटेक्चर', section: 'system' },
  { href: '/settings', labelEn: 'Settings', labelHi: 'सेटिंग्स', section: 'account' },
  { href: '/help-support', labelEn: 'Help & Support', labelHi: 'सहायता', section: 'account' },
  { href: '/sign-up-login-screen', labelEn: 'Sign In / Up', labelHi: 'साइन इन / अप', section: 'account' },
];

const SECTIONS: Record<string, { en: string; hi: string }> = {
  main: { en: 'Platform', hi: 'प्लेटफ़ॉर्म' },
  demos: { en: 'Demos', hi: 'डेमो' },
  analytics: { en: 'Analytics', hi: 'विश्लेषण' },
  system: { en: 'System', hi: 'सिस्टम' },
  account: { en: 'Account', hi: 'अकाउंट' },
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { lang, visitedPages } = useApp();

  const visitedCount = visitedPages.size;
  const progressPct = Math.round((visitedCount / NAV_ITEMS.length) * 100);

  const groupedItems: Record<string, typeof NAV_ITEMS> = {};
  NAV_ITEMS.forEach(item => {
    if (!groupedItems[item.section]) groupedItems[item.section] = [];
    groupedItems[item.section].push(item);
  });

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-60 flex flex-col
        bg-[hsl(220,13%,6%)] border-r border-[hsl(220,8%,14%)]
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-[18px] border-b border-[hsl(220,8%,14%)]">
        <AppLogo size={28} />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-white tracking-tight leading-none">HELPxGROW</div>
          <div className="text-[10px] text-[hsl(220,9%,42%)] font-mono mt-0.5 tracking-wide">Agentic AI</div>
        </div>
        <button onClick={onClose} className="lg:hidden text-[hsl(220,9%,42%)] hover:text-white transition-colors p-1">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 1l12 12M13 1L1 13"/>
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        {Object.entries(groupedItems).map(([section, items]) => (
          <div key={`section-${section}`} className="mb-1">
            <div className="px-4 pt-3 pb-1.5">
              <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-[hsl(220,8%,35%)]">
                {lang === 'en' ? SECTIONS[section].en : SECTIONS[section].hi}
              </span>
            </div>
            {items.map(item => {
              const isActive = pathname === item.href;
              const pageIdx = NAV_ITEMS.findIndex(n => n.href === item.href);
              const isVisited = visitedPages.has(pageIdx);
              return (
                <Link
                  key={`nav-${item.href}`}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-2.5 px-4 py-2 mx-2 rounded-md text-[13px]
                    transition-all duration-150 group
                    ${isActive
                      ? 'bg-[hsl(220,9%,14%)] text-white font-medium'
                      : 'text-[hsl(220,9%,52%)] hover:text-[hsl(220,14%,82%)] hover:bg-[hsl(220,9%,11%)]'
                    }
                  `}
                >
                  <span className={`w-1 h-1 rounded-full flex-shrink-0 transition-colors ${
                    isActive ? 'bg-white' : isVisited ? 'bg-[hsl(220,8%,35%)]' : 'bg-transparent'
                  }`} />
                  <span className="truncate">{lang === 'en' ? item.labelEn : item.labelHi}</span>
                  {isActive && (
                    <span className="ml-auto w-1 h-1 rounded-full bg-white/60" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Progress tracker */}
      <div className="px-4 py-4 border-t border-[hsl(220,8%,14%)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-[hsl(220,9%,42%)]">{lang === 'en' ? 'Explored' : 'एक्सप्लोर'}</span>
          <span className="text-[11px] font-mono text-[hsl(220,9%,60%)]">{visitedCount}/{NAV_ITEMS.length}</span>
        </div>
        <div className="h-[3px] bg-[hsl(220,8%,14%)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[hsl(220,14%,72%)] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </aside>
  );
}