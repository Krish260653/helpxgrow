'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useChat } from '@/lib/hooks/useChat';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are HELPxGROW AI assistant — an expert on the HELPxGROW agentic AI platform. 
Key facts: 207× faster than manual processes, 99% SLA compliance, $4.2K penalty avoided in SLA demo, 
HMAC-signed audit trail, smart model routing (Opus/Sonnet/Haiku), 6 specialized agents (Orchestrator, Retrieval, Decision, Execution, Audit, Compliance).
Answer in 120 words or less. Bold key terms with **bold**. If user writes in Hindi, respond in Hindi with Devanagari script.`;

const SUGGESTIONS = [
  { en: 'How does JIRA recovery work?', hi: 'JIRA रिकवरी कैसे काम करती है?' },
  { en: 'What is the autonomy score?', hi: 'ऑटोनॉमी स्कोर क्या है?' },
  { en: 'Explain the architecture', hi: 'आर्किटेक्चर समझाओ' },
];

export default function ChatWidget() {
  const { lang } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevResponseRef = useRef<string>('');

  const { response, isLoading, error, sendMessage } = useChat(
    'ANTHROPIC',
    'claude-sonnet-4-5-20250929',
    false
  );

  // Show toast on error
  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  // Capture assistant response when done loading
  useEffect(() => {
    if (response && !isLoading && response !== prevResponseRef.current) {
      prevResponseRef.current = response;
      setMessages(prev => [
        ...prev,
        { id: `msg-a-${Date.now()}`, role: 'assistant', content: response },
      ]);
    }
  }, [response, isLoading]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, open]);

  const sendUserMessage = (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { id: `msg-u-${Date.now()}`, role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');

    // Build API messages: system + last 6 messages
    const history = updatedMessages.slice(-6).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    sendMessage(
      [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
      { max_tokens: 600, temperature: 0.7 }
    );
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={`part-${i}`} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={`part-${i}`}>{part}</span>;
    });
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[hsl(220,9%,16%)] hover:bg-[hsl(220,9%,20%)] border border-[hsl(220,8%,26%)] hover:border-[hsl(220,8%,34%)] text-white flex items-center justify-center shadow-xl shadow-black/40 transition-all duration-150 active:scale-95"
          aria-label="Open AI chat"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 2H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3l3 3 3-3h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
          </svg>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[340px] h-[480px] rounded-xl border border-[hsl(220,8%,18%)] bg-[hsl(220,10%,9%)] shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(220,8%,14%)]">
            <div className="w-7 h-7 rounded-full bg-[hsl(220,9%,16%)] border border-[hsl(220,8%,24%)] flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[hsl(220,14%,72%)]">
                <circle cx="6.5" cy="6.5" r="5.5"/>
                <path d="M4 6.5h5M6.5 4v5"/>
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-white">HELPxGROW AI</div>
              <div className="text-[10px] text-[hsl(220,9%,42%)]">
                {lang === 'en' ? 'Powered by Claude Sonnet' : 'Claude Sonnet द्वारा संचालित'}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto text-[hsl(220,9%,42%)] hover:text-white transition-colors p-1"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 1l10 10M11 1L1 11"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-full bg-[hsl(220,9%,14%)] border border-[hsl(220,8%,20%)] flex items-center justify-center mx-auto mb-3">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[hsl(220,14%,60%)]">
                    <circle cx="8" cy="8" r="7"/>
                    <path d="M5.5 6.5C5.5 5.1 6.6 4 8 4s2.5 1.1 2.5 2.5c0 1.5-2.5 3-2.5 3"/>
                    <circle cx="8" cy="12" r="0.5" fill="currentColor"/>
                  </svg>
                </div>
                <p className="text-[12px] text-[hsl(220,9%,45%)]">
                  {lang === 'en' ? 'Ask me anything about HELPxGROW' : 'HELPxGROW के बारे में कुछ भी पूछें'}
                </p>
                <div className="mt-4 space-y-1.5">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={`suggestion-${i}`}
                      onClick={() => sendUserMessage(lang === 'en' ? s.en : s.hi)}
                      className="block w-full text-left px-3 py-2 rounded-lg bg-[hsl(220,9%,12%)] hover:bg-[hsl(220,9%,15%)] border border-[hsl(220,8%,18%)] hover:border-[hsl(220,8%,24%)] text-[12px] text-[hsl(220,9%,60%)] hover:text-white transition-all duration-150"
                    >
                      {lang === 'en' ? s.en : s.hi}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-[12px] leading-relaxed ${
                    msg.role === 'user' ?'bg-[hsl(220,9%,18%)] text-white border border-[hsl(220,8%,26%)]' :'bg-[hsl(220,9%,12%)] text-[hsl(220,9%,72%)] border border-[hsl(220,8%,18%)]'
                  }`}
                >
                  {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[hsl(220,9%,12%)] border border-[hsl(220,8%,18%)] px-4 py-3 rounded-lg flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div
                      key={`dot-${i}`}
                      className="w-1.5 h-1.5 rounded-full bg-[hsl(220,9%,45%)] animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[hsl(220,8%,14%)]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendUserMessage(input)}
                placeholder={lang === 'en' ? 'Ask about HELPxGROW…' : 'HELPxGROW के बारे में पूछें…'}
                className="flex-1 bg-[hsl(220,9%,12%)] border border-[hsl(220,8%,18%)] rounded-lg px-3 py-2 text-[12px] text-white placeholder-[hsl(220,9%,35%)] focus:outline-none focus:border-[hsl(220,8%,32%)] transition-colors"
              />
              <button
                onClick={() => sendUserMessage(input)}
                disabled={!input.trim() || isLoading}
                className="px-3 py-2 rounded-lg bg-[hsl(220,9%,18%)] hover:bg-[hsl(220,9%,22%)] border border-[hsl(220,8%,26%)] text-white text-[12px] font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 6h8M7 3l3 3-3 3"/>
                </svg>
              </button>
            </div>
            <div className="mt-1.5 text-[10px] text-[hsl(220,9%,30%)] text-center">
              {lang === 'en' ? 'Last 6 messages in context' : 'अंतिम 6 संदेश संदर्भ में'}
            </div>
          </div>
        </div>
      )}
    </>
  );
}