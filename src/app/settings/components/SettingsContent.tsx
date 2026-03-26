'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PDFExportButton from '@/components/PDFExportButton';

interface ProfileData {
  name: string;
  email: string;
  role: string;
  company: string;
}

export default function SettingsContent() {
  const { lang, toggleLang, clearAllNotifications } = useApp();

  const [profile, setProfile] = useState<ProfileData>({
    name: 'Demo User',
    email: 'demo@helpxgrow.ai',
    role: 'Platform Admin',
    company: 'HELPxGROW',
  });
  const [profileSaved, setProfileSaved] = useState(false);

  const [notifications, setNotifications] = useState({
    workflowComplete: true,
    errorAlerts: true,
    agentActivity: false,
    weeklyReport: true,
    emailDigest: false,
  });

  const [resetConfirm, setResetConfirm] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState<string | null>(null);

  const handleProfileSave = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleReset = (type: string) => {
    if (resetConfirm !== type) {
      setResetConfirm(type);
      return;
    }
    // Execute reset
    if (type === 'notifications') {
      clearAllNotifications();
    } else if (type === 'all') {
      clearAllNotifications();
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
    }
    setResetConfirm(null);
    setResetDone(type);
    setTimeout(() => setResetDone(null), 3000);
  };

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const notifItems = [
    { key: 'workflowComplete' as const, labelEn: 'Workflow Completion', labelHi: 'वर्कफ़्लो पूर्णता', descEn: 'Notify when any demo workflow finishes', descHi: 'डेमो वर्कफ़्लो पूर्ण होने पर सूचित करें' },
    { key: 'errorAlerts' as const, labelEn: 'Error Alerts', labelHi: 'एरर अलर्ट', descEn: 'Notify on agent errors and failures', descHi: 'एजेंट एरर पर सूचित करें' },
    { key: 'agentActivity' as const, labelEn: 'Agent Activity Feed', labelHi: 'एजेंट एक्टिविटी', descEn: 'Real-time agent communication updates', descHi: 'रियल-टाइम एजेंट अपडेट' },
    { key: 'weeklyReport' as const, labelEn: 'Weekly Summary', labelHi: 'साप्ताहिक सारांश', descEn: 'Weekly platform usage digest', descHi: 'साप्ताहिक प्लेटफ़ॉर्म उपयोग सारांश' },
    { key: 'emailDigest' as const, labelEn: 'Email Digest', labelHi: 'ईमेल डाइजेस्ट', descEn: 'Daily email summary of all activity', descHi: 'दैनिक ईमेल सारांश' },
  ];

  const resetActions = [
    { key: 'notifications', labelEn: 'Clear Notification History', labelHi: 'नोटिफ़िकेशन इतिहास साफ़ करें', descEn: 'Remove all stored notifications from this session', descHi: 'सभी नोटिफ़िकेशन हटाएं', icon: '🔔' },
    { key: 'progress', labelEn: 'Reset Demo Progress', labelHi: 'डेमो प्रगति रीसेट', descEn: 'Clear visited pages and exploration progress', descHi: 'विज़िट किए पेज और प्रगति साफ़ करें', icon: '📊' },
    { key: 'all', labelEn: 'Full Data Reset', labelHi: 'पूर्ण डेटा रीसेट', descEn: 'Clear all local storage and reset platform to defaults', descHi: 'सभी लोकल डेटा साफ़ करें और डिफ़ॉल्ट पर रीसेट करें', icon: '⚠️', danger: true },
  ];

  return (
    <div id="settings-pdf-target" className="p-4 sm:p-6 xl:p-8 2xl:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0 sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⚙️</span>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {lang === 'en' ? 'Settings' : 'सेटिंग्स'}
            </h1>
          </div>
          <p className="text-sm text-zinc-500">
            {lang === 'en' ? 'Manage your profile, preferences, and demo data' : 'अपना प्रोफ़ाइल, प्राथमिकताएं और डेमो डेटा प्रबंधित करें'}
          </p>
        </div>
        <PDFExportButton
          targetId="settings-pdf-target"
          filename="settings"
          title="Settings"
          lang={lang}
        />
      </div>

      <div className="space-y-6">
        {/* User Profile */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
            <span className="text-lg">👤</span>
            <h2 className="text-sm font-semibold text-white">{lang === 'en' ? 'User Profile' : 'यूजर प्रोफ़ाइल'}</h2>
          </div>
          <div className="p-4 sm:p-6">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl flex-shrink-0">
                👤
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{profile.name}</div>
                <div className="text-xs text-zinc-500">{profile.email}</div>
                <div className="mt-1 px-2 py-0.5 inline-block rounded-full bg-white/10 border border-white/20 text-[10px] font-mono text-white">{profile.role}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">{lang === 'en' ? 'Full Name' : 'पूरा नाम'}</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-white/40 transition-colors min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">{lang === 'en' ? 'Email' : 'ईमेल'}</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-white/40 transition-colors min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">{lang === 'en' ? 'Role' : 'भूमिका'}</label>
                <input
                  type="text"
                  value={profile.role}
                  onChange={e => setProfile(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-white/40 transition-colors min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">{lang === 'en' ? 'Company' : 'कंपनी'}</label>
                <input
                  type="text"
                  value={profile.company}
                  onChange={e => setProfile(p => ({ ...p, company: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-white/40 transition-colors min-h-[44px]"
                />
              </div>
            </div>

            <button
              onClick={handleProfileSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-sm font-semibold transition-all duration-150 active:scale-95 min-h-[44px] touch-manipulation"
            >
              {profileSaved ? '✓ Saved!' : (lang === 'en' ? 'Save Profile' : 'प्रोफ़ाइल सेव करें')}
            </button>
          </div>
        </section>

        {/* Language Preference */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
            <span className="text-lg">🌐</span>
            <h2 className="text-sm font-semibold text-white">{lang === 'en' ? 'Language Preference' : 'भाषा प्राथमिकता'}</h2>
          </div>
          <div className="p-4 sm:p-6">
            <p className="text-xs text-zinc-500 mb-4">
              {lang === 'en' ? 'Choose your preferred display language for the platform interface.' : 'प्लेटफ़ॉर्म इंटरफ़ेस के लिए अपनी पसंदीदा भाषा चुनें।'}
            </p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => lang === 'hi' && toggleLang()}
                className={`flex items-center gap-3 px-4 sm:px-5 py-3 rounded-xl border text-sm font-medium transition-all duration-150 min-h-[52px] touch-manipulation ${
                  lang === 'en' ?'bg-white text-black border-white' :'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
                }`}
              >
                <span className="text-lg">🇬🇧</span>
                <div className="text-left">
                  <div className="font-semibold">English</div>
                  <div className="text-[10px] opacity-60">EN</div>
                </div>
                {lang === 'en' && <span className="ml-2 text-xs">✓</span>}
              </button>
              <button
                onClick={() => lang === 'en' && toggleLang()}
                className={`flex items-center gap-3 px-4 sm:px-5 py-3 rounded-xl border text-sm font-medium transition-all duration-150 min-h-[52px] touch-manipulation ${
                  lang === 'hi' ?'bg-white text-black border-white' :'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
                }`}
              >
                <span className="text-lg">🇮🇳</span>
                <div className="text-left">
                  <div className="font-semibold">हिंदी</div>
                  <div className="text-[10px] opacity-60">HI</div>
                </div>
                {lang === 'hi' && <span className="ml-2 text-xs">✓</span>}
              </button>
            </div>
            <p className="text-[11px] text-zinc-600 mt-3">
              {lang === 'en' ? 'Language changes apply instantly across all screens.' : 'भाषा परिवर्तन तुरंत सभी स्क्रीन पर लागू होता है।'}
            </p>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
            <span className="text-lg">🔔</span>
            <h2 className="text-sm font-semibold text-white">{lang === 'en' ? 'Notification Settings' : 'नोटिफ़िकेशन सेटिंग्स'}</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {notifItems.map(item => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{lang === 'en' ? item.labelEn : item.labelHi}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{lang === 'en' ? item.descEn : item.descHi}</div>
                </div>
                <button
                  onClick={() => toggleNotif(item.key)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 touch-manipulation ${
                    notifications[item.key] ? 'bg-white' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200 ${
                      notifications[item.key] ? 'left-5 bg-black' : 'left-0.5 bg-zinc-400'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Demo Data Reset */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
            <span className="text-lg">🗑️</span>
            <h2 className="text-sm font-semibold text-white">{lang === 'en' ? 'Demo Data Controls' : 'डेमो डेटा कंट्रोल'}</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <p className="text-xs text-zinc-500">
              {lang === 'en' ? 'Reset demo data, clear history, or restore platform defaults.' : 'डेमो डेटा रीसेट करें, इतिहास साफ़ करें, या डिफ़ॉल्ट पुनर्स्थापित करें।'}
            </p>
            {resetActions.map(action => (
              <div
                key={action.key}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-150 ${
                  action.danger ? 'border-zinc-700 bg-zinc-800/50' : 'border-zinc-800 bg-zinc-800/30'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xl flex-shrink-0">{action.icon}</span>
                  <div>
                    <div className={`text-sm font-medium ${action.danger ? 'text-red-400' : 'text-white'}`}>
                      {lang === 'en' ? action.labelEn : action.labelHi}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">{lang === 'en' ? action.descEn : action.descHi}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {resetDone === action.key && (
                    <span className="text-xs text-green-400 font-medium">✓ Done</span>
                  )}
                  <button
                    onClick={() => handleReset(action.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 min-h-[40px] touch-manipulation ${
                      resetConfirm === action.key
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                        : action.danger
                        ? 'border border-zinc-600 text-zinc-400 hover:text-red-400 hover:border-red-500/40 bg-transparent' :'border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 bg-transparent'
                    }`}
                  >
                    {resetConfirm === action.key
                      ? (lang === 'en' ? '⚠ Confirm Reset' : '⚠ रीसेट कन्फ़र्म')
                      : (lang === 'en' ? 'Reset' : 'रीसेट')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
