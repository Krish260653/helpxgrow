'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp, PAGES } from '@/context/AppContext';

const PAGE_NAMES_EN: Record<string, string> = {
  '/home-dashboard': 'Home',
  '/employee-onboarding-demo': 'Onboarding Demo',
  '/meeting-actions-demo': 'Meeting → Actions',
  '/sla-breach-prevention-demo': 'SLA Breach Prevention',
  '/cost-dashboard': 'Cost Dashboard',
  '/sign-up-login-screen': 'Sign In / Up',
  '/agent-communication-map': 'Agent Map',
  '/speed-comparison': 'Speed Comparison',
  '/audit-trail': 'Audit Trail',
  '/architecture': 'Architecture',
  '/settings': 'Settings',
};

const PAGE_NAMES_HI: Record<string, string> = {
  '/home-dashboard': 'होम',
  '/employee-onboarding-demo': 'ऑनबोर्डिंग',
  '/meeting-actions-demo': 'मीटिंग → एक्शन',
  '/sla-breach-prevention-demo': 'SLA ब्रीच',
  '/cost-dashboard': 'लागत डैशबोर्ड',
  '/sign-up-login-screen': 'साइन इन',
  '/agent-communication-map': 'एजेंट मैप',
  '/speed-comparison': 'स्पीड तुलना',
  '/audit-trail': 'ऑडिट ट्रेल',
  '/architecture': 'आर्किटेक्चर',
  '/settings': 'सेटिंग्स',
};

interface TopbarProps {
  onMenuClick: () => void;
  onNotifClick: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export default function Topbar({ onMenuClick, onNotifClick, onPrevPage, onNextPage }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, toggleLang, unreadCount, clearUnread, presentationMode, togglePresentation, currentPageIndex } = useApp();

  const pageName = lang === 'en' ? (PAGE_NAMES_EN[pathname] || 'Platform') : (PAGE_NAMES_HI[pathname] || 'प्लेटफ़ॉर्म');

  return (
    <header className="flex items-center gap-3 px-4 lg:px-5 h-[52px] border-b border-[hsl(220,8%,14%)] bg-[hsl(220,13%,6%)]/95 backdrop-blur-sm sticky top-0 z-30">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-md text-[hsl(220,9%,45%)] hover:text-white hover:bg-[hsl(220,9%,12%)] transition-all"
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect y="2" width="16" height="1.5" rx="0.75"/>
          <rect y="7.25" width="16" height="1.5" rx="0.75"/>
          <rect y="12.5" width="16" height="1.5" rx="0.75"/>
        </svg>
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px]">
        <span className="text-[hsl(220,9%,38%)] hidden sm:inline">{lang === 'en' ? 'Platform' : 'प्लेटफ़ॉर्म'}</span>
        <span className="text-[hsl(220,8%,28%)] hidden sm:inline">/</span>
        <span className="text-[hsl(220,14%,88%)] font-medium">{pageName}</span>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 ml-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[hsl(152,45%,55%)] animate-pulse-dot" />
        <span className="text-[11px] text-[hsl(220,9%,45%)] hidden sm:inline">Live</span>
      </div>

      {/* Presentation controls */}
      {presentationMode && (
        <div className="flex items-center gap-2 ml-1 px-2.5 py-1 rounded-md bg-[hsl(220,9%,12%)] border border-[hsl(220,8%,18%)]">
          <button onClick={onPrevPage} className="text-[11px] text-[hsl(220,9%,55%)] hover:text-white transition-colors">← Prev</button>
          <span className="text-[11px] font-mono text-[hsl(220,9%,45%)]">{currentPageIndex + 1}/{PAGES.length}</span>
          <button onClick={onNextPage} className="text-[11px] text-[hsl(220,9%,55%)] hover:text-white transition-colors">Next →</button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        {/* Lang toggle */}
        <button
          onClick={toggleLang}
          className="px-2.5 py-1 rounded-md text-[11px] font-semibold font-mono border border-[hsl(220,8%,20%)] text-[hsl(220,9%,55%)] hover:border-[hsl(220,8%,32%)] hover:text-white transition-all duration-150"
        >
          {lang === 'en' ? 'EN' : 'हि'}
        </button>

        {/* Cost button */}
        <button
          onClick={() => router.push('/cost-dashboard')}
          className="px-2.5 py-1 rounded-md text-[11px] font-medium text-[hsl(220,9%,50%)] hover:text-white hover:bg-[hsl(220,9%,12%)] border border-[hsl(220,8%,18%)] hover:border-[hsl(220,8%,26%)] transition-all duration-150"
        >
          {lang === 'en' ? 'Cost' : 'लागत'}
        </button>

        {/* Notifications */}
        <button
          onClick={() => { onNotifClick(); clearUnread(); }}
          className="relative p-1.5 rounded-md text-[hsl(220,9%,50%)] hover:text-white hover:bg-[hsl(220,9%,12%)] border border-[hsl(220,8%,18%)] hover:border-[hsl(220,8%,26%)] transition-all duration-150"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 1a4 4 0 0 1 4 4v2.5l1 1.5H2l1-1.5V5a4 4 0 0 1 4-4z"/>
            <path d="M5.5 11a1.5 1.5 0 0 0 3 0"/>
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-white text-[9px] font-bold text-black px-0.5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Present button */}
        <button
          onClick={togglePresentation}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all duration-150 ${
            presentationMode
              ? 'bg-[hsl(220,9%,14%)] text-white border-[hsl(220,8%,26%)]'
              : 'text-[hsl(220,9%,50%)] hover:text-white border-[hsl(220,8%,18%)] hover:border-[hsl(220,8%,26%)] hover:bg-[hsl(220,9%,12%)]'
          }`}
        >
          {presentationMode ? (lang === 'en' ? 'Exit' : 'बाहर') : (lang === 'en' ? 'Present' : 'प्रेजेंट')}
        </button>
      </div>
    </header>
  );
}