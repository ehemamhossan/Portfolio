import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, X } from 'lucide-react';
import { getMatchBand, type ScreenedCandidate } from '../utils/screenerLogic';
import { inspectFileFormat, renderDocxPreviewHtml } from '../utils/screenerParser';
import type { DetectedFormat } from '../utils/screenerBufferUtils';

interface ResumePreviewModalProps {
  candidate: ScreenedCandidate | null;
  file: File | null;
  onClose: () => void;
}

export default function ResumePreviewModal({
  candidate,
  file,
  onClose,
}: ResumePreviewModalProps) {
  const [detectedFormat, setDetectedFormat] = useState<DetectedFormat>('text');
  const [docxHtml, setDocxHtml] = useState<string>('');
  const [loadingDocx, setLoadingDocx] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const fileUrl = useMemo(() => {
    if (!file) return '';
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  useEffect(() => {
    if (!candidate) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [candidate, onClose]);

  useEffect(() => {
    let active = true;
    setDocxHtml('');
    setDetectedFormat('text');
    if (!file) return;

    inspectFileFormat(file)
      .then((fmt) => {
        if (!active) return;
        setDetectedFormat(fmt);
        if (fmt === 'zip') {
          setLoadingDocx(true);
          return renderDocxPreviewHtml(file)
            .then((html) => {
              if (active) setDocxHtml(html);
            })
            .catch(() => {
              if (active) setDocxHtml('');
            })
            .finally(() => {
              if (active) setLoadingDocx(false);
            });
        }
        return undefined;
      })
      .catch(() => {
        if (active) setDetectedFormat('text');
      });

    return () => {
      active = false;
    };
  }, [file]);

  if (!candidate) return null;

  const band = getMatchBand(candidate.pct);

  const handleCopyEmail = async () => {
    if (!candidate.email) return;
    try {
      await navigator.clipboard.writeText(candidate.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0F131D] p-6 sm:p-8 text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono-tabular font-semibold text-blue-400">
                {candidate.pct}% Match
              </span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span
                className={
                  band.tier === 'strong'
                    ? 'text-emerald-400 font-medium'
                    : band.tier === 'mid'
                      ? 'text-amber-300 font-medium'
                      : 'text-rose-400 font-medium'
                }
              >
                {band.label}
              </span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="text-slate-400 truncate">{candidate.fileName}</span>
            </div>

            <h3 id="resume-modal-title" className="mt-1.5 text-xl sm:text-2xl font-semibold text-white">
              {candidate.name}
            </h3>

            <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
              <span>{candidate.phone || 'No phone found'}</span>
              <span aria-hidden="true" className="mx-2 text-slate-500">·</span>
              <span>{candidate.email || 'No email found'}</span>
              <span aria-hidden="true" className="mx-2 text-slate-500">·</span>
              <span>{candidate.experience.yearsLabel}</span>
            </p>

            {candidate.portfolios.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                {candidate.portfolios.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    <span>{url.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}

            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              {candidate.summary}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close candidate resume"
            onClick={onClose}
            className="btn-tactile inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-white/10 bg-[#090C14] p-4">
            <p className="font-semibold text-white">Matched Job Keywords</p>
            <p className="mt-1.5 leading-relaxed text-slate-300">
              {candidate.matchedSkills.length > 0
                ? candidate.matchedSkills.slice(0, 14).join(' · ')
                : 'No direct JD keyword matches found'}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#090C14] p-4">
            <p className="font-semibold text-white">Missing / Unmatched Terms</p>
            <p className="mt-1.5 leading-relaxed text-slate-400">
              {candidate.missingSkills.length > 0
                ? candidate.missingSkills.join(' · ')
                : 'Strong coverage of top JD keywords'}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-[#080A0F] overflow-hidden">
          {file && detectedFormat === 'pdf' && fileUrl ? (
            <iframe
              src={fileUrl}
              title={`${candidate.name} PDF preview`}
              className="h-[46vh] w-full border-0 bg-white"
            />
          ) : loadingDocx ? (
            <p className="p-8 text-center text-sm text-slate-400">Rendering DOCX preview...</p>
          ) : docxHtml ? (
            <div
              className="max-h-[46vh] overflow-y-auto p-5 text-sm leading-relaxed text-slate-200 space-y-2"
              dangerouslySetInnerHTML={{ __html: docxHtml }}
            />
          ) : (
            <pre className="max-h-[46vh] overflow-y-auto whitespace-pre-wrap p-5 font-sans text-xs sm:text-sm leading-relaxed text-slate-300">
              {candidate.rawText || 'No readable text preview available.'}
            </pre>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {file && fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-tactile inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                <span>Open Original File</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
            {candidate.email && (
              <button
                type="button"
                onClick={handleCopyEmail}
                className="btn-tactile inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 cursor-pointer"
              >
                {copiedEmail ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedEmail ? 'Email Copied' : 'Copy Email'}</span>
              </button>
            )}
          </div>

          <span className="text-xs text-slate-400">
            Bachelor&apos;s degree: {candidate.hasBachelor ? 'Detected' : 'Not detected'}
          </span>
        </div>
      </div>
    </div>
  );
}
