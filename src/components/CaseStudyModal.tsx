import { useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import type { CaseStudyItem } from '../data/portfolioData';

interface CaseStudyModalProps {
  study: CaseStudyItem | null;
  onClose: () => void;
}

export default function CaseStudyModal({ study, onClose }: CaseStudyModalProps) {
  useEffect(() => {
    if (!study) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [study, onClose]);

  if (!study) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-study-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0F131D] p-6 sm:p-8 text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-medium text-blue-400">
              {study.organization} <span aria-hidden="true">·</span>{' '}
              <span className="font-mono-tabular text-slate-400">{study.period}</span>
            </p>
            <h3 id="case-study-title" className="mt-1.5 text-xl sm:text-2xl font-semibold text-white text-balance">
              {study.title}
            </h3>
          </div>

          <button
            type="button"
            aria-label="Close case study details"
            onClick={onClose}
            className="btn-tactile inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-wrap items-baseline justify-between gap-4">
            <span className="text-sm text-slate-400">{study.metricLabel}</span>
            <span className="font-mono-tabular text-xl font-semibold text-white">
              {study.metricValue}
            </span>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Context &amp; Challenge</h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{study.challenge}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Execution</h4>
            <ul className="mt-2.5 space-y-2.5 text-sm text-slate-300">
              {study.execution.map((step) => (
                <li key={step} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-blue-400" aria-hidden="true" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Verified Outcomes</h4>
            <ul className="mt-2.5 space-y-2.5 text-sm text-slate-200">
              {study.outcomes.map((outcome) => (
                <li key={outcome} className="flex items-start gap-2.5 leading-relaxed">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-xs text-slate-400">
              Systems &amp; Capabilities:{' '}
              <span className="text-slate-200">{study.stack.join(' · ')}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
