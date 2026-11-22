import { useRef, useState, type DragEvent } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  analyzeCandidateText,
  buildBatchSummary,
  buildJdKeywords,
  buildShortlistCsv,
  filterAndRankCandidates,
  getMatchBand,
  MAX_RESUMES_PER_BATCH,
  SAMPLE_JD,
  SAMPLE_RESUMES,
  validateResumeFile,
  type ScreenedCandidate,
} from '../utils/screenerLogic';
import { extractTextFromFile } from '../utils/screenerParser';
import ResumePreviewModal from './ResumePreviewModal';

interface QueuedResume {
  id: string;
  file: File;
  name: string;
  size: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResumeScreener() {
  const [jdText, setJdText] = useState('');
  const [jdFileName, setJdFileName] = useState('');
  const [queuedFiles, setQueuedFiles] = useState<QueuedResume[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [screeningProgress, setScreeningProgress] = useState('');
  const [isScreening, setIsScreening] = useState(false);

  const [allResults, setAllResults] = useState<ScreenedCandidate[]>([]);
  const [hasScreened, setHasScreened] = useState(false);
  const [minMatch, setMinMatch] = useState(0);
  const [requireBachelor, setRequireBachelor] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewCandidate, setPreviewCandidate] = useState<ScreenedCandidate | null>(null);

  const jdFileInputRef = useRef<HTMLInputElement | null>(null);
  const cvFileInputRef = useRef<HTMLInputElement | null>(null);

  const jdWordCount = jdText.trim() ? jdText.trim().split(/\s+/).filter(Boolean).length : 0;

  const handleJdFileUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadError('');
    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length < 15) {
        setUploadError(`Could not read sufficient text from JD "${file.name}". Please paste the JD directly.`);
        return;
      }
      setJdText(text.trim());
      setJdFileName(file.name);
    } catch {
      setUploadError(`Failed to parse JD file "${file.name}". Try PDF, DOCX, DOC, or TXT.`);
    }
  };

  const enqueueFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError('');
    const nextItems: QueuedResume[] = [];
    const errors: string[] = [];

    let count = queuedFiles.length;
    for (const file of Array.from(fileList)) {
      const check = validateResumeFile({ name: file.name, size: file.size }, count);
      if (!check.ok) {
        if (check.error) errors.push(check.error);
        continue;
      }
      nextItems.push({
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        name: file.name,
        size: file.size,
      });
      count += 1;
    }

    if (errors.length > 0) {
      setUploadError(errors[0]);
    }
    if (nextItems.length > 0) {
      setQueuedFiles((prev) => [...prev, ...nextItems]);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    enqueueFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((item) => item.id !== id));
    setUploadError('');
  };

  const handleRunScreening = async () => {
    if (jdText.trim().length < 15) {
      setUploadError('Please paste or upload a job description (at least 15 characters).');
      return;
    }
    if (queuedFiles.length === 0) {
      setUploadError('Please upload at least 1 resume (PDF, DOCX, DOC, or TXT) or try the sample batch.');
      return;
    }

    setUploadError('');
    setIsScreening(true);
    const jdKeywords = buildJdKeywords(jdText);
    const screened: ScreenedCandidate[] = [];

    for (let i = 0; i < queuedFiles.length; i++) {
      const item = queuedFiles[i];
      setScreeningProgress(`Reading ${i + 1} of ${queuedFiles.length}: ${item.name}`);
      try {
        const text = await extractTextFromFile(item.file);
        screened.push(
          analyzeCandidateText({
            id: item.id,
            fileName: item.name,
            text,
            jdKeywords,
          }),
        );
      } catch (err) {
        screened.push(
          analyzeCandidateText({
            id: item.id,
            fileName: item.name,
            text: '',
            jdKeywords,
          }),
        );
        if (err instanceof Error && err.message) {
          screened[screened.length - 1].parseError = err.message;
        }
      }
    }

    screened.sort((a, b) => b.pct - a.pct);
    setAllResults(screened);
    setHasScreened(true);
    setScreeningProgress('');
    setIsScreening(false);
  };

  const handleLoadSampleBatch = () => {
    setUploadError('');
    setJdText(SAMPLE_JD);
    setJdFileName('Sample_Role_JD.txt');

    const sampleFiles: QueuedResume[] = SAMPLE_RESUMES.map((s) => {
      const file = new File([s.text], s.fileName, { type: 'text/plain' });
      return {
        id: s.id,
        file,
        name: s.fileName,
        size: file.size,
      };
    });
    setQueuedFiles(sampleFiles);

    const jdKeywords = buildJdKeywords(SAMPLE_JD);
    const analyzed = SAMPLE_RESUMES.map((s) =>
      analyzeCandidateText({
        id: s.id,
        fileName: s.fileName,
        text: s.text,
        jdKeywords,
      }),
    ).sort((a, b) => b.pct - a.pct);

    setAllResults(analyzed);
    setHasScreened(true);
  };

  const handleResetAll = () => {
    setJdText('');
    setJdFileName('');
    setQueuedFiles([]);
    setAllResults([]);
    setHasScreened(false);
    setMinMatch(0);
    setRequireBachelor(false);
    setUploadError('');
    setScreeningProgress('');
  };

  const filteredResults = filterAndRankCandidates(allResults, {
    minMatch,
    requireBachelor,
  });
  const batchSummary = buildBatchSummary(filteredResults);

  const handleExportCsv = () => {
    if (filteredResults.length === 0) return;
    const csv = buildShortlistCsv(filteredResults);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shortlist-ranked-candidates.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyEmail = async (id: string, email: string) => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const activePreviewFile = previewCandidate
    ? queuedFiles.find((q) => q.id === previewCandidate.id)?.file ?? null
    : null;

  return (
    <section
      id="screener"
      aria-labelledby="screener-heading"
      className="mx-auto max-w-6xl px-6 py-16 sm:py-20 border-t border-white/10"
    >
      {/* Section Header highlighting Emam's original recruiter tool */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-blue-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Original Recruiter Utility Built by Emam Hossan</span>
          </p>
          <h2
            id="screener-heading"
            className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-white text-balance"
          >
            Shortlist — AI-Ready Resume Screener
          </h2>
          <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-slate-300">
            Built to help fellow recruiters and hiring teams shortlist faster. Paste or upload a job description, bulk-drop resumes, and extract ranked matches with contact details, portfolios, experience, and skills—100% locally in your browser.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleLoadSampleBatch}
            className="btn-tactile whitespace-nowrap rounded-lg border border-blue-500/40 bg-blue-600/15 px-4 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
          >
            Try Sample JD &amp; 4 CVs
          </button>

          {(jdText || queuedFiles.length > 0 || hasScreened) && (
            <button
              type="button"
              onClick={handleResetAll}
              className="btn-tactile inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Dual-Column Input Workbench */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Job Description */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0D111B]/95 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">01. Job Description</h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Paste the full posting or upload a JD file (PDF, DOCX, DOC, TXT)
              </p>
            </div>

            <div className="shrink-0">
              <input
                ref={jdFileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="sr-only"
                aria-label="Upload job description file"
                onChange={(e) => {
                  void handleJdFileUpload(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => jdFileInputRef.current?.click()}
                className="btn-tactile inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                <span>Upload JD</span>
              </button>
            </div>
          </div>

          <label htmlFor="screener-jd-input" className="sr-only">
            Job description text
          </label>
          <textarea
            id="screener-jd-input"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste job requirements, target skills, tools, and experience expectations here..."
            rows={8}
            className="mt-4 w-full flex-1 rounded-xl border border-white/10 bg-[#080A0F] p-4 text-sm leading-relaxed text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
          />

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span className="truncate">{jdFileName ? `Source: ${jdFileName}` : 'Ready for paste or file upload'}</span>
            <span className="font-mono-tabular shrink-0">{jdWordCount} words</span>
          </div>
        </div>

        {/* Panel 2: Bulk Candidate Resumes */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0D111B]/95 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">02. Candidate Resumes</h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Bulk upload up to <span className="font-mono-tabular text-slate-200">{MAX_RESUMES_PER_BATCH}</span> PDF, DOCX, DOC, or TXT files · max 10 MB each
              </p>
            </div>
            <span className="font-mono-tabular text-xs text-slate-300 whitespace-nowrap shrink-0">
              {queuedFiles.length} / {MAX_RESUMES_PER_BATCH} queued
            </span>
          </div>

          <input
            ref={cvFileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt"
            className="sr-only"
            aria-label="Select candidate resume files"
            onChange={(e) => {
              enqueueFiles(e.target.files);
              e.target.value = '';
            }}
          />

          <div
            role="button"
            tabIndex={0}
            aria-label="Drop candidate resumes here or click to browse PDF, DOCX, DOC, or TXT files"
            onClick={() => cvFileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                cvFileInputRef.current?.click();
              }
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            className={`mt-4 flex min-h-[168px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isDragging
                ? 'border-blue-400 bg-blue-600/10'
                : 'border-white/20 bg-[#080A0F]/80 hover:border-blue-500/60'
            }`}
          >
            <FileText className="h-7 w-7 text-blue-400" aria-hidden="true" />
            <p className="mt-2.5 text-sm font-medium text-white">
              Drop resumes here or click to browse
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Supports PDF, DOCX, DOC &amp; TXT · Max {MAX_RESUMES_PER_BATCH} files per batch · 10 MB/file
            </p>
          </div>

          {queuedFiles.length > 0 && (
            <ul
              aria-label="Queued candidate resumes"
              className="mt-3 max-h-36 overflow-y-auto divide-y divide-white/10 rounded-xl border border-white/10 bg-[#080A0F] px-3"
            >
              {queuedFiles.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-2 text-xs text-slate-300"
                >
                  <span className="truncate font-medium text-slate-200">{item.name}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono-tabular text-slate-400">{formatBytes(item.size)}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => handleRemoveFile(item.id)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-rose-400 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Validation Error + Screen Action Bar */}
      {uploadError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs sm:text-sm text-rose-300"
        >
          {uploadError}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-slate-400">
          {screeningProgress || 'Privacy-first: all resume parsing & ranking execute locally in your browser.'}
        </p>

        <button
          type="button"
          onClick={() => void handleRunScreening()}
          disabled={isScreening}
          className="btn-tactile whitespace-nowrap rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
        >
          {isScreening ? 'Screening Resumes...' : 'Screen & Rank Candidates'}
        </button>
      </div>

      {/* Ranked Output */}
      {hasScreened && (
        <div
          data-testid="screener-results"
          className="mt-10 rounded-2xl border border-white/10 bg-[#0D111B]/95 p-6 sm:p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <h3 className="text-xl font-semibold text-white">
                Ranked Shortlist —{' '}
                <span className="font-mono-tabular">
                  {filteredResults.length} of {allResults.length}
                </span>{' '}
                candidates
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Sorted highest-to-lowest by weighted job description alignment
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireBachelor}
                  onChange={(e) => setRequireBachelor(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-[#080A0F] text-blue-600 focus:ring-blue-500"
                />
                <span>Bachelor&apos;s degree required</span>
              </label>

              <div className="flex items-center gap-2">
                <label htmlFor="min-match-slider" className="whitespace-nowrap text-slate-400">
                  Min. match
                </label>
                <input
                  id="min-match-slider"
                  type="range"
                  min={0}
                  max={100}
                  value={minMatch}
                  onChange={(e) => setMinMatch(Number(e.target.value))}
                  className="w-24 accent-blue-500 cursor-pointer"
                />
                <span className="font-mono-tabular w-9 text-right text-white">{minMatch}%</span>
              </div>

              {filteredResults.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="btn-tactile inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-white hover:bg-white/10 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>
          </div>

          {filteredResults.length > 0 && (
            <div
              data-testid="screener-summary"
              className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl border border-white/10 bg-[#080A0F]/90 p-4 text-xs"
            >
              <div>
                <span className="block text-slate-400">Result Summary</span>
                <span className="mt-0.5 block font-semibold text-white">
                  <span className="font-mono-tabular">{batchSummary.strongCount}</span> Strong ·{' '}
                  <span className="font-mono-tabular">{batchSummary.partialCount}</span> Partial
                </span>
              </div>
              <div className="min-w-0">
                <span className="block text-slate-400">Top Candidate</span>
                <span className="mt-0.5 block truncate font-semibold text-emerald-400">
                  {batchSummary.topCandidateName} ({batchSummary.topCandidatePct}%)
                </span>
              </div>
              <div>
                <span className="block text-slate-400">Direct Contacts Extracted</span>
                <span className="mt-0.5 block font-mono-tabular text-slate-200">
                  Phone {batchSummary.phoneCount}/{batchSummary.total} · Email {batchSummary.emailCount}/{batchSummary.total}
                </span>
              </div>
              <div>
                <span className="block text-slate-400">Profiles &amp; Portfolios</span>
                <span className="mt-0.5 block font-mono-tabular text-slate-200">
                  LinkedIn {batchSummary.linkedinCount}/{batchSummary.total} · Portfolio {batchSummary.portfolioCount}/{batchSummary.total}
                </span>
              </div>
            </div>
          )}

          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No candidates match the current threshold
              {requireBachelor ? " with a detected bachelor's degree" : ''}. Adjust the slider or degree filter above.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredResults.map((candidate, index) => {
                const band = getMatchBand(candidate.pct);
                const tierColor =
                  band.tier === 'strong'
                    ? 'text-emerald-400 border-emerald-500/40'
                    : band.tier === 'mid'
                      ? 'text-amber-300 border-amber-400/40'
                      : 'text-rose-400 border-rose-500/40';

                return (
                  <article
                    key={candidate.id}
                    className="rounded-xl border border-white/10 bg-[#080A0F]/90 p-5 sm:p-6"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                      {/* Rank + Score + Name + Contact */}
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className="flex flex-col items-center shrink-0">
                          <span className="font-mono-tabular text-xs text-slate-400">
                            #{index + 1}
                          </span>
                          <div
                            className={`mt-1 flex h-12 w-12 items-center justify-center rounded-full border-2 font-mono-tabular text-sm font-semibold ${tierColor}`}
                          >
                            {candidate.pct}%
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-2.5">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <h4 className="text-lg font-semibold text-white">
                              {candidate.name}
                            </h4>
                            <span
                              className={`text-xs font-medium ${
                                band.tier === 'strong'
                                  ? 'text-emerald-400'
                                  : band.tier === 'mid'
                                    ? 'text-amber-300'
                                    : 'text-rose-400'
                              }`}
                            >
                              {band.label}
                            </span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="font-mono-tabular text-xs text-slate-400">
                              {candidate.experience.yearsLabel}
                            </span>
                          </div>

                          {/* Highlighted Contact, LinkedIn & Portfolio Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs border-y border-white/10 py-3">
                            <div>
                              <span className="block text-slate-400">Contact Number</span>
                              <span className="mt-0.5 block font-mono-tabular text-slate-200">
                                {candidate.phone || 'Not provided'}
                              </span>
                            </div>

                            <div className="min-w-0">
                              <span className="block text-slate-400">Email</span>
                              {candidate.email ? (
                                <div className="mt-0.5 flex items-center gap-2">
                                  <span className="truncate text-slate-200">{candidate.email}</span>
                                  <button
                                    type="button"
                                    aria-label={`Copy email for ${candidate.name}`}
                                    onClick={() => void handleCopyEmail(candidate.id, candidate.email)}
                                    className="inline-flex shrink-0 items-center text-slate-400 hover:text-white cursor-pointer"
                                  >
                                    {copiedId === candidate.id ? (
                                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="mt-0.5 block text-slate-400">Not provided</span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <span className="block text-slate-400">LinkedIn Profile</span>
                              {candidate.linkedinUrl ? (
                                <a
                                  href={candidate.linkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-0.5 inline-flex items-center gap-1 truncate text-blue-400 hover:text-blue-300 hover:underline max-w-full"
                                >
                                  <span className="truncate">
                                    {candidate.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}
                                  </span>
                                  <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                                </a>
                              ) : (
                                <span className="mt-0.5 block text-slate-400">Not detected</span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <span className="block text-slate-400">Portfolio / Links</span>
                              {candidate.portfolioLinks.length > 0 ? (
                                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                                  {candidate.portfolioLinks.slice(0, 2).map((url) => (
                                    <a
                                      key={url}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 truncate text-blue-400 hover:text-blue-300 hover:underline max-w-full"
                                    >
                                      <span className="truncate">{url.replace(/^https?:\/\//, '')}</span>
                                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <span className="mt-0.5 block text-slate-400">None detected</span>
                              )}
                            </div>
                          </div>

                          {/* Result Summary, Experience & Extracted Skills */}
                          <div className="space-y-1.5 text-xs">
                            <p className="text-slate-200 leading-relaxed">
                              <span className="font-medium text-blue-300">Result Summary: </span>
                              {candidate.summary}
                            </p>

                            {candidate.experience.highlights.length > 0 && (
                              <p className="text-slate-300 leading-relaxed">
                                <span className="font-medium text-slate-200">Experience: </span>
                                {candidate.experience.highlights.join(' · ')}
                              </p>
                            )}

                            <p className="text-slate-300 leading-relaxed">
                              <span className="font-medium text-slate-200">Matched JD Keywords: </span>
                              {candidate.matchedSkills.length > 0
                                ? candidate.matchedSkills.slice(0, 10).join(' · ')
                                : 'No direct keyword hits'}
                            </p>

                            {candidate.extractedSkills.length > 0 && (
                              <p className="text-slate-400 leading-relaxed">
                                <span className="font-medium text-slate-300">Extracted Skills: </span>
                                {candidate.extractedSkills.join(' · ')}
                              </p>
                            )}

                            {candidate.parseError && (
                              <p className="text-rose-400">{candidate.parseError}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex lg:flex-col items-end justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewCandidate(candidate)}
                          className="btn-tactile whitespace-nowrap rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 hover:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
                        >
                          Inspect Resume
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ResumePreviewModal
        candidate={previewCandidate}
        file={activePreviewFile}
        onClose={() => setPreviewCandidate(null)}
      />
    </section>
  );
}
