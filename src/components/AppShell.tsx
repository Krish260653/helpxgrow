'use client';
import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp, PAGES } from '@/context/AppContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import NotificationPanel from './NotificationPanel';
import ChatWidget from './ChatWidget';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { presentationMode, currentPageIndex, setCurrentPageIndex, markPageVisited, addNotification } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const presentationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAuthPage = pathname === '/sign-up-login-screen';

  useEffect(() => {
    const idx = PAGES.indexOf(pathname);
    if (idx !== -1) {
      setCurrentPageIndex(idx);
      markPageVisited(idx);
    }
  }, [pathname, setCurrentPageIndex, markPageVisited]);

  useEffect(() => {
    if (presentationMode) {
      presentationRef.current = setInterval(() => {
        setCurrentPageIndex(prev => {
          const next = prev + 1;
          if (next >= PAGES.length) {
            clearInterval(presentationRef.current!);
            return prev;
          }
          router.push(PAGES[next]);
          markPageVisited(next);
          return next;
        });
      }, 8000);
    } else {
      if (presentationRef.current) clearInterval(presentationRef.current);
    }
    return () => { if (presentationRef.current) clearInterval(presentationRef.current); };
  }, [presentationMode, router, setCurrentPageIndex, markPageVisited]);

  const navigatePrev = () => {
    const prev = Math.max(0, currentPageIndex - 1);
    router.push(PAGES[prev]);
  };
  const navigateNext = () => {
    const next = Math.min(PAGES.length - 1, currentPageIndex + 1);
    router.push(PAGES[next]);
  };

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(220,13%,6%)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          onNotifClick={() => { setNotifOpen(true); }}
          onPrevPage={navigatePrev}
          onNextPage={navigateNext}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="page-transition min-h-full">
            {children}
          </div>
        </main>

        {/* Prev/Next footer nav */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-[hsl(220,8%,14%)] bg-[hsl(220,13%,6%)]/90 backdrop-blur-sm">
          <button
            onClick={navigatePrev}
            disabled={currentPageIndex === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium text-[hsl(220,9%,45%)] hover:text-white hover:bg-[hsl(220,9%,12%)] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150 min-h-[36px] touch-manipulation"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2L4 6l4 4"/>
            </svg>
            <span className="hidden sm:inline">Previous</span>
          </button>
          <span className="text-[11px] text-[hsl(220,9%,35%)] font-mono">{currentPageIndex + 1} / {PAGES.length}</span>
          <button
            onClick={navigateNext}
            disabled={currentPageIndex === PAGES.length - 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium text-[hsl(220,9%,45%)] hover:text-white hover:bg-[hsl(220,9%,12%)] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150 min-h-[36px] touch-manipulation"
          >
            <span className="hidden sm:inline">Next</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 2l4 4-4 4"/>
            </svg>
          </button>
        </div>
      </div>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      <ChatWidget />
    </div>
  );
}