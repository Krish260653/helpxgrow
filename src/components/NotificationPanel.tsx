'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

type FilterOption = 'all' | 'hour' | 'today' | 'week';

const FILTER_OPTIONS: { value: FilterOption; labelEn: string; labelHi: string }[] = [
  { value: 'all', labelEn: 'All', labelHi: 'सभी' },
  { value: 'hour', labelEn: 'Last Hour', labelHi: 'पिछला घंटा' },
  { value: 'today', labelEn: 'Today', labelHi: 'आज' },
  { value: 'week', labelEn: 'This Week', labelHi: 'इस सप्ताह' },
];

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const { notifications, clearAllNotifications, lang } = useApp();
  const [filter, setFilter] = useState<FilterOption>('all');

  const typeConfig = {
    success: { dot: 'bg-[hsl(152,45%,55%)]', label: 'text-[hsl(152,45%,55%)]' },
    error: { dot: 'bg-[hsl(0,65%,58%)]', label: 'text-[hsl(0,65%,58%)]' },
    info: { dot: 'bg-[hsl(210,70%,58%)]', label: 'text-[hsl(210,70%,58%)]' },
  };

  const filteredNotifications = useMemo(() => {
    const now = Date.now();
    return notifications.filter(n => {
      const ts = n.fullTimestamp ?? now;
      if (filter === 'hour') return now - ts <= 3600000;
      if (filter === 'today') {
        const d = new Date(ts);
        const today = new Date();
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      }
      if (filter === 'week') return now - ts <= 7 * 24 * 3600000;
      return true;
    });
  }, [notifications, filter]);

  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={onClose} />}
      <div
        className={`
          fixed right-0 top-0 bottom-0 z-50 w-[320px]
          bg-[hsl(220,10%,9%)] border-l border-[hsl(220,8%,14%)]
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(220,8%,14%)]">
          <div>
            <h3 className="text-[13px] font-semibold text-white">
              {lang === 'en' ? 'Notifications' : 'सूचनाएं'}
            </h3>
            <p className="text-[11px] text-[hsl(220,9%,42%)] mt-0.5">
              {filteredNotifications.length} {lang === 'en' ? 'events' : 'इवेंट'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium text-[hsl(0,65%,58%)] border border-[hsl(0,65%,30%)] hover:bg-[hsl(0,65%,12%)] transition-all"
              >
                {lang === 'en' ? 'Clear all' : 'सब हटाएं'}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-md text-[hsl(220,9%,42%)] hover:text-white hover:bg-[hsl(220,9%,14%)] transition-all">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 1l10 10M11 1L1 11"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Timestamp Filter */}
        <div className="px-4 py-2.5 border-b border-[hsl(220,8%,14%)] flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                filter === opt.value
                  ? 'bg-[hsl(220,9%,16%)] text-white border border-[hsl(220,8%,26%)]'
                  : 'text-[hsl(220,9%,45%)] border border-[hsl(220,8%,18%)] hover:text-[hsl(220,14%,72%)] hover:border-[hsl(220,8%,24%)]'
              }`}
            >
              {lang === 'en' ? opt.labelEn : opt.labelHi}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-3 space-y-1 px-3">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <div className="w-8 h-8 rounded-full border border-[hsl(220,8%,20%)] flex items-center justify-center mb-3">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[hsl(220,9%,38%)]">
                  <path d="M7 1a4 4 0 0 1 4 4v2.5l1 1.5H2l1-1.5V5a4 4 0 0 1 4-4z"/>
                  <path d="M5.5 11a1.5 1.5 0 0 0 3 0"/>
                </svg>
              </div>
              <p className="text-[12px] text-[hsl(220,9%,42%)]">
                {lang === 'en' ? 'No notifications' : 'कोई सूचना नहीं'}
              </p>
              <p className="text-[11px] text-[hsl(220,9%,32%)] mt-0.5">
                {lang === 'en' ? 'Try a different filter' : 'अलग फ़िल्टर आज़माएं'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notif => {
              const cfg = typeConfig[notif.type];
              return (
                <div key={notif.id} className="flex gap-3 p-3 rounded-lg bg-[hsl(220,9%,11%)] border border-[hsl(220,8%,16%)] hover:border-[hsl(220,8%,22%)] transition-colors">
                  <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-semibold ${cfg.label}`}>{notif.agent}</span>
                      <span className="text-[10px] font-mono text-[hsl(220,9%,35%)] flex-shrink-0">{notif.timestamp}</span>
                    </div>
                    <p className="text-[12px] text-[hsl(220,9%,65%)] mt-0.5 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[hsl(220,8%,14%)]">
          <p className="text-[10px] text-[hsl(220,9%,32%)] text-center">
            {lang === 'en' ? 'Persisted across sessions · Max 50 events' : 'सत्रों में सहेजा गया · अधिकतम 50 इवेंट'}
          </p>
        </div>
      </div>
    </>
  );
}