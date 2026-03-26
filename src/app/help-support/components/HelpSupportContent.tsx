'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

interface FAQItem {
  id: string;
  questionEn: string;
  questionHi: string;
  answerEn: string;
  answerHi: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    questionEn: 'What are the 3 demo workflows?',
    questionHi: '3 डेमो वर्कफ़्लो क्या हैं?',
    answerEn: 'The platform includes Employee Onboarding (8-step HRIS provisioning), Meeting → Actions (NLP extraction + Linear task creation), and SLA Breach Prevention (autonomous approval rerouting). Each demo runs a live simulation with real-time logs.',
    answerHi: 'प्लेटफ़ॉर्म में एम्प्लॉई ऑनबोर्डिंग (8-स्टेप HRIS), मीटिंग → एक्शन (NLP + Linear टास्क), और SLA ब्रीच प्रिवेंशन (ऑटोनॉमस रीरूटिंग) शामिल हैं।',
  },
  {
    id: 'faq-2',
    questionEn: 'How do I run a demo?',
    questionHi: 'डेमो कैसे चलाएं?',
    answerEn: 'Navigate to any demo screen from the sidebar under DEMOS. Click the "▶ Run Demo" button to start the simulation. Each step executes sequentially with live log output. Click "↺ Reset" to restart.',
    answerHi: 'साइडबार में DEMOS सेक्शन से किसी भी डेमो स्क्रीन पर जाएं। "▶ डेमो चलाएं" बटन क्लिक करें। प्रत्येक स्टेप लाइव लॉग के साथ चलेगा।',
  },
  {
    id: 'faq-3',
    questionEn: 'What is the AI Chat assistant?',
    questionHi: 'AI चैट असिस्टेंट क्या है?',
    answerEn: 'The chat widget (bottom-right) is powered by Claude (Anthropic). It supports both English and Hindi, maintains conversation context, and can answer questions about the platform, workflows, and agentic AI concepts.',
    answerHi: 'चैट विजेट (नीचे-दाएं) Claude (Anthropic) द्वारा संचालित है। यह अंग्रेज़ी और हिंदी दोनों में काम करता है।',
  },
  {
    id: 'faq-4',
    questionEn: 'How does the Audit Trail work?',
    questionHi: 'ऑडिट ट्रेल कैसे काम करता है?',
    answerEn: 'Every agent action is HMAC-signed and recorded in the Audit Trail (System → Audit Trail). Each entry includes timestamp, agent name, action taken, outcome, and a cryptographic signature for tamper-proof logging.',
    answerHi: 'प्रत्येक एजेंट एक्शन HMAC-साइन्ड होता है और ऑडिट ट्रेल में रिकॉर्ड होता है। प्रत्येक एंट्री में टाइमस्टैम्प, एजेंट नाम, और क्रिप्टोग्राफ़िक सिग्नेचर शामिल है।',
  },
  {
    id: 'faq-5',
    questionEn: 'Can I export demo results to PDF?',
    questionHi: 'क्या मैं डेमो रिज़ल्ट PDF में एक्सपोर्ट कर सकता हूं?',
    answerEn: 'Yes. Each demo screen has an "Export PDF" button in the header. It captures the full workflow — steps, logs, timestamps, and result summary — and downloads it as a PDF file.',
    answerHi: 'हां। प्रत्येक डेमो स्क्रीन के हेडर में "Export PDF" बटन है। यह पूरे वर्कफ़्लो को PDF के रूप में डाउनलोड करता है।',
  },
  {
    id: 'faq-6',
    questionEn: 'How do I switch between English and Hindi?',
    questionHi: 'अंग्रेज़ी और हिंदी के बीच कैसे स्विच करें?',
    answerEn: 'Go to Settings (Account → Settings) and toggle the Language preference between English and Hindi. The entire UI updates instantly including all demo content, logs, and navigation labels.',
    answerHi: 'Settings (Account → Settings) में जाएं और Language प्रेफ़रेंस टॉगल करें। पूरा UI तुरंत अपडेट हो जाता है।',
  },
];

const CONTACT_ITEMS = [
  {
    id: 'contact-docs',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    titleEn: 'Documentation',
    titleHi: 'डॉक्यूमेंटेशन',
    descEn: 'Full platform docs, API reference, and integration guides',
    descHi: 'पूर्ण प्लेटफ़ॉर्म डॉक्स, API रेफ़रेंस, और इंटीग्रेशन गाइड',
    actionEn: 'View Docs →',
    actionHi: 'डॉक्स देखें →',
  },
  {
    id: 'contact-email',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    titleEn: 'Email Support',
    titleHi: 'ईमेल सपोर्ट',
    descEn: 'Reach our team for technical issues or enterprise inquiries',
    descHi: 'तकनीकी समस्याओं या एंटरप्राइज़ पूछताछ के लिए हमसे संपर्क करें',
    actionEn: 'support@helpxgrow.ai',
    actionHi: 'support@helpxgrow.ai',
  },
  {
    id: 'contact-status',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    titleEn: 'System Status',
    titleHi: 'सिस्टम स्टेटस',
    descEn: 'Check real-time platform uptime and incident history',
    descHi: 'रियल-टाइम प्लेटफ़ॉर्म अपटाइम और इंसिडेंट हिस्ट्री देखें',
    actionEn: 'All systems operational',
    actionHi: 'सभी सिस्टम चालू',
  },
];

export default function HelpSupportContent() {
  const { lang } = useApp();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <div className="p-4 sm:p-6 xl:p-8 2xl:p-10 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white flex-shrink-0">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {lang === 'en' ? 'Help & Support' : 'सहायता और समर्थन'}
          </h1>
        </div>
        <p className="text-sm text-zinc-500 ml-9">
          {lang === 'en' ? 'Find answers, contact support, and learn how to use the platform' : 'उत्तर खोजें, सपोर्ट से संपर्क करें, और प्लेटफ़ॉर्म का उपयोग सीखें'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQ — left 2 cols */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            {lang === 'en' ? 'Frequently Asked Questions' : 'अक्सर पूछे जाने वाले प्रश्न'}
          </h2>
          {FAQ_ITEMS.map((faq, idx) => {
            const isOpen = openFaq === faq.id;
            return (
              <div
                key={faq.id}
                className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/50 animate-step-enter"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left touch-manipulation hover:bg-zinc-800/40 transition-colors"
                >
                  <span className="text-sm font-medium text-zinc-200 pr-4">
                    {lang === 'en' ? faq.questionEn : faq.questionHi}
                  </span>
                  <span className={`text-zinc-500 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 animate-fade-slide">
                    <p className="text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3">
                      {lang === 'en' ? faq.answerEn : faq.answerHi}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact + Quick links — right col */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            {lang === 'en' ? 'Contact & Resources' : 'संपर्क और संसाधन'}
          </h2>
          {CONTACT_ITEMS.map((item, idx) => (
            <div
              key={item.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-step-enter"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="text-zinc-400 flex-shrink-0 mt-0.5">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {lang === 'en' ? item.titleEn : item.titleHi}
                  </h3>
                  <p className="text-xs text-zinc-500 mb-2 leading-relaxed">
                    {lang === 'en' ? item.descEn : item.descHi}
                  </p>
                  <span className={`text-xs font-mono ${item.id === 'contact-status' ? 'text-zinc-300' : 'text-zinc-300 hover:text-white cursor-pointer transition-colors'}`}>
                    {lang === 'en' ? item.actionEn : item.actionHi}
                    {item.id === 'contact-status' && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-white ml-2 align-middle" />
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Quick nav */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-step-enter" style={{ animationDelay: '200ms' }}>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              {lang === 'en' ? 'Quick Links' : 'त्वरित लिंक'}
            </h3>
            <div className="space-y-2">
              {[
                { href: '/employee-onboarding-demo', labelEn: 'Onboarding Demo', labelHi: 'ऑनबोर्डिंग डेमो' },
                { href: '/meeting-actions-demo', labelEn: 'Meeting → Actions', labelHi: 'मीटिंग → एक्शन' },
                { href: '/sla-breach-prevention-demo', labelEn: 'SLA Breach Demo', labelHi: 'SLA ब्रीच डेमो' },
                { href: '/audit-trail', labelEn: 'Audit Trail', labelHi: 'ऑडिट ट्रेल' },
                { href: '/settings', labelEn: 'Settings', labelHi: 'सेटिंग्स' },
              ].map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between text-xs text-zinc-400 hover:text-white transition-colors py-1 group"
                >
                  <span>{lang === 'en' ? link.labelEn : link.labelHi}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
