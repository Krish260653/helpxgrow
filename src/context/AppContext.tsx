'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type Lang = 'en' | 'hi';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  agent: string;
  message: string;
  timestamp: string;
  fullTimestamp: number;
}

interface AppContextType {
  lang: Lang;
  toggleLang: () => void;
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'fullTimestamp'>) => void;
  clearAllNotifications: () => void;
  unreadCount: number;
  clearUnread: () => void;
  presentationMode: boolean;
  togglePresentation: () => void;
  currentPageIndex: number;
  setCurrentPageIndex: (i: number) => void;
  visitedPages: Set<number>;
  markPageVisited: (i: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const PAGES = [
  '/home-dashboard',
  '/employee-onboarding-demo',
  '/meeting-actions-demo',
  '/sla-breach-prevention-demo',
  '/cost-dashboard',
  '/sign-up-login-screen',
  '/agent-communication-map',
  '/speed-comparison',
  '/audit-trail',
  '/architecture',
  '/settings',
];

const STORAGE_KEY = 'helpxgrow_notifications';

const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: 'notif-init-1', type: 'success', agent: 'Orchestrator', message: 'Platform initialized. All agents ready.', timestamp: '09:15:31', fullTimestamp: Date.now() - 3600000 },
  { id: 'notif-init-2', type: 'info', agent: 'Compliance', message: 'Policy engine loaded: 47 rules active.', timestamp: '09:15:32', fullTimestamp: Date.now() - 3599000 },
];

function loadNotifications(): Notification[] {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATIONS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_NOTIFICATIONS;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const [notifications, setNotifications] = useState<Notification[]>(DEFAULT_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(2);
  const [presentationMode, setPresentationMode] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([0]));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadNotifications();
    setNotifications(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
    } catch {}
  }, [notifications, hydrated]);

  const toggleLang = useCallback(() => setLang(l => l === 'en' ? 'hi' : 'en'), []);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'fullTimestamp'>) => {
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    setNotifications(prev => [{
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: ts,
      fullTimestamp: Date.now(),
      ...n,
    }, ...prev].slice(0, 50));
    setUnreadCount(c => c + 1);
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const clearUnread = useCallback(() => setUnreadCount(0), []);
  const togglePresentation = useCallback(() => setPresentationMode(p => !p), []);
  const markPageVisited = useCallback((i: number) => setVisitedPages(prev => new Set([...prev, i])), []);

  return (
    <AppContext.Provider value={{
      lang, toggleLang,
      notifications, addNotification, clearAllNotifications,
      unreadCount, clearUnread,
      presentationMode, togglePresentation,
      currentPageIndex, setCurrentPageIndex,
      visitedPages, markPageVisited,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { PAGES };