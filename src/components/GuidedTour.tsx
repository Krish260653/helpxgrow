'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface TourStep {
  target: string; // CSS selector for the element to highlight
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TooltipPosition {
  top: number;
  left: number;
  placement: string;
}

interface GuidedTourProps {
  steps: TourStep[];
  lang: string;
  storageKey: string; // unique key per page to remember if tour was seen
  onComplete?: () => void;
}

function getTooltipPosition(
  targetEl: Element | null,
  placement: string,
  tooltipW: number,
  tooltipH: number
): TooltipPosition {
  if (!targetEl || placement === 'center') {
    return {
      top: window.innerHeight / 2 - tooltipH / 2,
      left: window.innerWidth / 2 - tooltipW / 2,
      placement: 'center',
    };
  }

  const rect = targetEl.getBoundingClientRect();
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  const margin = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = 0;
  let left = 0;
  let resolvedPlacement = placement;

  if (placement === 'bottom') {
    top = rect.bottom + scrollY + margin;
    left = rect.left + scrollX + rect.width / 2 - tooltipW / 2;
  } else if (placement === 'top') {
    top = rect.top + scrollY - tooltipH - margin;
    left = rect.left + scrollX + rect.width / 2 - tooltipW / 2;
  } else if (placement === 'right') {
    top = rect.top + scrollY + rect.height / 2 - tooltipH / 2;
    left = rect.right + scrollX + margin;
  } else if (placement === 'left') {
    top = rect.top + scrollY + rect.height / 2 - tooltipH / 2;
    left = rect.left + scrollX - tooltipW - margin;
  }

  // Clamp to viewport
  left = Math.max(12, Math.min(left, vw + scrollX - tooltipW - 12));
  top = Math.max(scrollY + 12, Math.min(top, scrollY + vh - tooltipH - 12));

  return { top, left, placement: resolvedPlacement };
}

export default function GuidedTour({ steps, lang, storageKey, onComplete }: GuidedTourProps) {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({ top: 0, left: 0, placement: 'bottom' });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const TOOLTIP_W = 300;
  const TOOLTIP_H = 160;

  const positionTooltip = useCallback((stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step) return;

    const placement = step.placement || 'bottom';
    if (placement === 'center') {
      setHighlightRect(null);
      setTooltipPos({
        top: window.innerHeight / 2 - TOOLTIP_H / 2 + window.scrollY,
        left: window.innerWidth / 2 - TOOLTIP_W / 2,
        placement: 'center',
      });
      return;
    }

    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const freshRect = el.getBoundingClientRect();
        setHighlightRect(freshRect);
        const pos = getTooltipPosition(el, placement, TOOLTIP_W, TOOLTIP_H);
        setTooltipPos(pos);
      }, 350);
    } else {
      setHighlightRect(null);
      setTooltipPos({
        top: window.innerHeight / 2 - TOOLTIP_H / 2 + window.scrollY,
        left: window.innerWidth / 2 - TOOLTIP_W / 2,
        placement: 'center',
      });
    }
  }, [steps]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setActive(true);
    setVisible(false);
    setTimeout(() => {
      setVisible(true);
      positionTooltip(0);
    }, 100);
  }, [positionTooltip]);

  // Auto-start if not seen before
  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      const timer = setTimeout(() => startTour(), 800);
      return () => clearTimeout(timer);
    }
  }, [storageKey, startTour]);

  const goToStep = useCallback((index: number) => {
    setVisible(false);
    setTimeout(() => {
      setCurrentStep(index);
      setVisible(true);
      positionTooltip(index);
    }, 200);
  }, [positionTooltip]);

  const next = () => {
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    } else {
      endTour();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const endTour = () => {
    setVisible(false);
    setTimeout(() => {
      setActive(false);
      setHighlightRect(null);
      localStorage.setItem(storageKey, 'seen');
      onComplete?.();
    }, 200);
  };

  const step = steps[currentStep];

  return (
    <>
      {/* Tour trigger button */}
      <button
        onClick={startTour}
        title={lang === 'en' ? 'Start guided tour' : 'गाइडेड टूर शुरू करें'}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[hsl(220,8%,22%)] bg-[hsl(220,10%,11%)] hover:border-[hsl(220,8%,32%)] hover:bg-[hsl(220,9%,14%)] transition-all duration-150 text-[12px] font-medium text-[hsl(220,14%,65%)] min-h-[36px] touch-manipulation"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-shrink-0">
          <circle cx="7" cy="7" r="6" />
          <path d="M7 5v.5M7 7.5v2" strokeLinecap="round" />
          <circle cx="7" cy="5" r="0.5" fill="currentColor" />
        </svg>
        {lang === 'en' ? 'Tour' : 'टूर'}
      </button>

      {/* Overlay */}
      {active && (
        <div
          className="fixed inset-0 z-[9998]"
          style={{ pointerEvents: 'none' }}
        >
          {/* Dark overlay with cutout */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            <defs>
              <mask id="tour-mask">
                <rect width="100%" height="100%" fill="white" />
                {highlightRect && (
                  <rect
                    x={highlightRect.left - 6}
                    y={highlightRect.top - 6}
                    width={highlightRect.width + 12}
                    height={highlightRect.height + 12}
                    rx="8"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.65)"
              mask="url(#tour-mask)"
            />
          </svg>

          {/* Highlight border */}
          {highlightRect && (
            <div
              className="absolute rounded-xl pointer-events-none"
              style={{
                top: highlightRect.top - 6,
                left: highlightRect.left - 6,
                width: highlightRect.width + 12,
                height: highlightRect.height + 12,
                boxShadow: '0 0 0 2px hsl(220,14%,65%), 0 0 20px rgba(255,255,255,0.08)',
                transition: 'all 0.3s ease',
              }}
            />
          )}
        </div>
      )}

      {/* Backdrop click to close */}
      {active && (
        <div
          className="fixed inset-0 z-[9998]"
          style={{ pointerEvents: 'auto', background: 'transparent' }}
          onClick={endTour}
        />
      )}

      {/* Tooltip */}
      {active && step && (
        <div
          ref={tooltipRef}
          className={`fixed z-[9999] transition-all duration-200 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: TOOLTIP_W,
            pointerEvents: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[hsl(220,10%,10%)] border border-[hsl(220,8%,22%)] rounded-xl shadow-2xl shadow-black/60 overflow-hidden">
            {/* Progress bar */}
            <div className="h-0.5 bg-[hsl(220,8%,16%)]">
              <div
                className="h-full bg-[hsl(220,14%,65%)] transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            <div className="p-4">
              {/* Step counter */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[hsl(220,9%,38%)] tracking-wider uppercase">
                  {lang === 'en' ? `Step ${currentStep + 1} of ${steps.length}` : `चरण ${currentStep + 1} / ${steps.length}`}
                </span>
                <button
                  onClick={endTour}
                  className="w-5 h-5 flex items-center justify-center rounded text-[hsl(220,9%,40%)] hover:text-white hover:bg-[hsl(220,8%,18%)] transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 1l8 8M9 1L1 9" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Title */}
              <h4 className="text-[13px] font-semibold text-white mb-1.5 leading-snug">
                {lang === 'en' ? step.titleEn : step.titleHi}
              </h4>

              {/* Description */}
              <p className="text-[12px] text-[hsl(220,9%,52%)] leading-relaxed mb-4">
                {lang === 'en' ? step.descEn : step.descHi}
              </p>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={prev}
                  disabled={currentStep === 0}
                  className="text-[11px] font-medium text-[hsl(220,9%,42%)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded hover:bg-[hsl(220,8%,16%)]"
                >
                  {lang === 'en' ? '← Back' : '← पीछे'}
                </button>

                {/* Dot indicators */}
                <div className="flex items-center gap-1">
                  {steps.map((_, i) => (
                    <button
                      key={`dot-${i}`}
                      onClick={() => goToStep(i)}
                      className={`rounded-full transition-all duration-200 ${
                        i === currentStep
                          ? 'w-4 h-1.5 bg-white' :'w-1.5 h-1.5 bg-[hsl(220,8%,28%)] hover:bg-[hsl(220,8%,40%)]'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={next}
                  className="text-[11px] font-semibold text-white bg-[hsl(220,8%,18%)] hover:bg-[hsl(220,8%,24%)] border border-[hsl(220,8%,26%)] px-3 py-1 rounded-lg transition-colors"
                >
                  {currentStep === steps.length - 1
                    ? (lang === 'en' ? 'Done ✓' : 'पूर्ण ✓')
                    : (lang === 'en' ? 'Next →' : 'अगला →')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
