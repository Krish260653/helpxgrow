'use client';
import React, { useState } from 'react';

interface PDFExportButtonProps {
  targetId: string;
  filename?: string;
  title?: string;
  lang?: 'en' | 'hi';
  className?: string;
}

export default function PDFExportButton({
  targetId,
  filename = 'helpxgrow-export',
  title,
  lang = 'en',
  className = '',
}: PDFExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const element = document.getElementById(targetId);
      if (!element) {
        console.error(`Element with id "${targetId}" not found`);
        setExporting(false);
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#09090b',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width / 1.5, canvas.height / 1.5],
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Header bar
      pdf.setFillColor(9, 9, 11);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);

      // Footer with timestamp
      const now = new Date();
      const ts = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
      pdf.setFontSize(7);
      pdf.setTextColor(113, 113, 122);
      pdf.text(`HELPxGROW Agentic AI  ·  Exported: ${ts} IST  ·  ${title || filename}`, 10, pageHeight - 6);

      pdf.save(`${filename}-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      title={lang === 'en' ? 'Export to PDF' : 'PDF में एक्सपोर्ट'}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-150 active:scale-95 min-h-[40px] min-w-[40px] touch-manipulation ${className}`}
    >
      {exporting ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin flex-shrink-0" />
          <span className="hidden sm:inline text-xs">{lang === 'en' ? 'Exporting…' : 'एक्सपोर्ट…'}</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <span className="hidden sm:inline text-xs">{lang === 'en' ? 'Export PDF' : 'PDF एक्सपोर्ट'}</span>
        </>
      )}
    </button>
  );
}

.catch(err => console.error("Promise.all failed:", err));