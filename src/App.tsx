import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Download, Globe2, Sparkles } from 'lucide-react';
import NexusScene from './three/NexusScene';
import TopBar from './components/TopBar';
import SceneDock from './components/SceneDock';
import CaseStudyModal from './components/CaseStudyModal';
import ContactSection from './components/ContactSection';
import RevealOnScroll from './components/RevealOnScroll';
import ResumeScreener from './components/ResumeScreener';
import {
  AI_TOOLS,
  CASE_STUDIES,
  CERTIFICATIONS_AND_EXTRAS,
  CORE_COMPETENCIES,
  EDUCATION,
  EXPERIENCES,
  HERO_METRICS,
  PROFILE,
  SOFTWARE_TOOLS,
  type CaseStudyItem,
  type ExperienceCategory,
} from './data/portfolioData';
import {
  clamp01,
  filterCaseStudies,
  filterExperiences,
  type CameraPreset,
} from './utils/portfolioLogic';

const FILTER_OPTIONS: Array<{ id: ExperienceCategory; label: string }> = [
  { id: 'all', label: 'All Domains' },
  { id: 'sales', label: 'B2B Sales' },
  { id: 'hr', label: 'HR & Recruitment' },
  { id: 'digital', label: 'Digital & Ops' },
];

export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [autoRotate, setAutoRotate] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const [activeFilter, setActiveFilter] = useState<ExperienceCategory>('all');
  const [selectedStudy, setSelectedStudy] = useState<CaseStudyItem | null>(null);

  useEffect(() => {
    let rafId = 0;
    const updateScroll = () => {
      rafId = 0;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const next = docHeight > 0 ? clamp01(window.scrollY / docHeight) : 0;
      setScrollProgress((prev) => (Math.abs(prev - next) > 0.002 ? next : prev));
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(updateScroll);
      }
    };

    updateScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT';
      if (isInput) return;

      if (e.key.toLowerCase() === 'h') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredExperiences = filterExperiences(EXPERIENCES, activeFilter);
  const filteredCaseStudies = filterCaseStudies(CASE_STUDIES, activeFilter);

  return (
    <div
      data-scroll-progress={scrollProgress.toFixed(2)}
      className="relative min-h-screen text-[#F3F5F8]"
    >
      {/* Fixed interactive 3D Web3-style Three.js backdrop */}
      <NexusScene
        scrollProgress={scrollProgress}
        preset={cameraPreset}
        autoRotate={autoRotate}
      />

      {/* Subtle vertical scroll progress hairline */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-40 h-0.5 bg-transparent pointer-events-none"
      >
        <div
          className="h-full bg-blue-500 origin-left transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${scrollProgress})` }}
        />
      </div>

      <TopBar onNavigate={handleNavigate} />

      <main className="relative z-10">
        {/* HERO SECTION — Split layout keeping right/center 3D sculpture unobstructed */}
        <section
          id="hero"
          aria-labelledby="hero-heading"
          className="mx-auto max-w-6xl px-6 pt-10 pb-12 sm:pt-14 sm:pb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5 rounded-2xl border border-white/10 bg-[#0B0E17]/95 p-6 sm:p-9 shadow-2xl">
              <p className="text-xs sm:text-sm font-medium text-blue-400">
                {PROFILE.title}
              </p>

              <h1
                id="hero-heading"
                className="text-3xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.12] text-balance"
              >
                {PROFILE.headline}
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-slate-300">
                {PROFILE.summary}
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleNavigate('screener')}
                  className="btn-tactile inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer whitespace-nowrap"
                >
                  <span>Try Resume Screener</span>
                  <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigate('projects')}
                  className="btn-tactile inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer whitespace-nowrap"
                >
                  <span>Case Studies</span>
                </button>

                <a
                  href={PROFILE.resumePdfPath}
                  download="Emam_Hossan_Resume.pdf"
                  className="btn-tactile inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap"
                >
                  <Download className="h-4 w-4 text-blue-400" aria-hidden="true" />
                  <span>Resume PDF</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 pt-5 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <Globe2 className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                  <span>US &amp; Global Remote Ready</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>{PROFILE.location}</span>
                <span aria-hidden="true">·</span>
                <span>English (Advanced) &amp; Bengali (Native)</span>
              </div>
            </div>

            {/* Right column intentionally open to showcase the 3D WebGL Nexus sculpture */}
            <div className="lg:col-span-5 hidden lg:block min-h-[360px] pointer-events-none" aria-hidden="true" />
          </div>

          {/* 4-Column Quantitative KPI Strip placed full-width below Hero Split */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HERO_METRICS.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-white/10 bg-[#0E131E]/95 p-5"
              >
                <p className="font-mono-tabular text-2xl font-semibold text-white">
                  {metric.value}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-200">{metric.label}</p>
                <p className="mt-1 text-xs text-slate-400">{metric.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURED CREATIVE TOOL — Shortlist Resume Screener */}
        <ResumeScreener />

        {/* EXPERIENCE & ACHIEVEMENTS FILTER BAR */}
        <section
          id="experience"
          aria-labelledby="experience-heading"
          className="mx-auto max-w-6xl px-6 py-16 sm:py-24 border-t border-white/10"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-medium text-blue-400">Career Trajectory</p>
              <h2
                id="experience-heading"
                className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-white text-balance"
              >
                Experience Across Sales, HR &amp; Operations
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Showing <span className="font-mono-tabular text-white">{filteredExperiences.length}</span> of{' '}
                <span className="font-mono-tabular">{EXPERIENCES.length}</span> roles
              </p>
            </div>

            <div
              role="group"
              aria-label="Filter experience and projects by domain"
              className="inline-flex flex-wrap sm:flex-nowrap items-center gap-1 rounded-xl border border-white/10 bg-[#0E131E]/95 p-1 shrink-0"
            >
              {FILTER_OPTIONS.map((opt) => {
                const active = activeFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setActiveFilter(opt.id)}
                    aria-pressed={active}
                    className={`btn-tactile whitespace-nowrap shrink-0 rounded-lg px-3.5 py-2 text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-10 space-y-5">
            {filteredExperiences.map((exp, idx) => (
              <RevealOnScroll key={exp.id} delayMs={Math.min(idx * 45, 180)}>
                <article className="rounded-2xl border border-white/10 bg-[#0D111B]/95 p-6 sm:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white">
                        {exp.role}
                      </h3>
                      <p className="mt-1 text-sm text-slate-300">
                        <span className="font-medium text-blue-400">{exp.company}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{exp.industry}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="text-slate-400">{exp.location}</span>
                      </p>
                      {exp.subtitle && (
                        <p className="mt-1 text-xs font-medium text-slate-300">{exp.subtitle}</p>
                      )}
                    </div>
                    <p className="font-mono-tabular text-xs sm:text-sm text-slate-400 whitespace-nowrap shrink-0">
                      {exp.period}
                    </p>
                  </div>

                  <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
                    {exp.highlights.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5 leading-relaxed">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-blue-400" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-4 pt-3 border-t border-white/5 text-xs text-slate-400">
                    Tools &amp; Focus: <span className="text-slate-300">{exp.tools.join(' · ')}</span>
                  </p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        {/* KEY PROJECTS & CASE STUDIES */}
        <section
          id="projects"
          aria-labelledby="projects-heading"
          className="mx-auto max-w-6xl px-6 py-16 sm:py-24 border-t border-white/10"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-blue-400">Selected Case Studies</p>
              <h2
                id="projects-heading"
                className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-white text-balance"
              >
                Flagship Initiatives &amp; Quantified Delivery
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Select any initiative to inspect full execution &amp; outcomes
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCaseStudies.map((study, idx) => (
              <RevealOnScroll key={study.id} delayMs={Math.min(idx * 45, 180)} className="flex">
                <article className="flex w-full flex-col justify-between rounded-2xl border border-white/10 bg-[#0D111B]/95 p-6 sm:p-7 hover:border-blue-500/40 transition-colors">
                  <div>
                    <div className="flex items-baseline justify-between gap-4 text-xs text-slate-400">
                      <span className="font-medium text-blue-400">{study.organization}</span>
                      <span className="font-mono-tabular">{study.period}</span>
                    </div>

                    <h3 className="mt-3 text-xl font-semibold text-white text-balance">
                      {study.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-slate-300">
                      {study.summary}
                    </p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-mono-tabular text-base font-semibold text-white">
                        {study.metricValue}
                      </p>
                      <p className="text-xs text-slate-400">{study.metricLabel}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedStudy(study)}
                      className="btn-tactile inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 hover:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
                    >
                      <span>View Case Study</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        {/* CAPABILITIES, SOFTWARE & AI TOOLS */}
        <section
          id="capabilities"
          aria-labelledby="capabilities-heading"
          className="mx-auto max-w-6xl px-6 py-16 sm:py-24 border-t border-white/10"
        >
          <div>
            <p className="text-xs font-medium text-blue-400">Operational Toolkit</p>
            <h2
              id="capabilities-heading"
              className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-white text-balance"
            >
              Core Competencies, Systems &amp; AI Workflow
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#0D111B]/95 p-6 sm:p-7">
              <h3 className="text-base font-semibold text-white">Core Competencies</h3>
              <p className="mt-1 text-xs text-slate-400">
                Commercial revenue execution paired with full-cycle HR governance
              </p>
              <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-slate-300">
                {CORE_COMPETENCIES.map((item) => (
                  <li key={item} className="border-b border-white/5 pb-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#0D111B]/95 p-6 sm:p-7">
              <h3 className="text-base font-semibold text-white">Software &amp; Enterprise Platforms</h3>
              <p className="mt-1 text-xs text-slate-400">
                CRM, HRMS, ERP, analytics, and brand production tools
              </p>
              <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-slate-300">
                {SOFTWARE_TOOLS.map((tool) => (
                  <li key={tool} className="border-b border-white/5 pb-2">
                    {tool}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-3 rounded-2xl border border-blue-500/25 bg-[#0D1322]/95 p-6 sm:p-7">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" aria-hidden="true" />
                <span>AI Tools &amp; Models</span>
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Daily leverage for faster research, QA, and outreach
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-slate-200">
                {AI_TOOLS.map((ai) => (
                  <li key={ai} className="border-b border-white/10 pb-2">
                    {ai}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* EDUCATION, CERTIFICATIONS & LANGUAGES */}
        <section
          id="credentials"
          aria-labelledby="credentials-heading"
          className="mx-auto max-w-6xl px-6 py-16 sm:py-24 border-t border-white/10"
        >
          <div>
            <p className="text-xs font-medium text-blue-400">Academic &amp; Professional Foundation</p>
            <h2
              id="credentials-heading"
              className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-white text-balance"
            >
              Education, Certification &amp; Languages
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0D111B]/95 p-6 sm:p-7">
              <h3 className="text-base font-semibold text-white">Education</h3>
              <div className="mt-5 divide-y divide-white/10">
                {EDUCATION.map((edu) => (
                  <div key={edu.degree} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div>
                      <p className="text-sm sm:text-base font-medium text-white">{edu.degree}</p>
                      <p className="mt-0.5 text-xs sm:text-sm text-slate-400">{edu.institution}</p>
                    </div>
                    <p className="font-mono-tabular text-xs text-slate-400 whitespace-nowrap shrink-0">
                      {edu.period}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#0D111B]/95 p-6 sm:p-7 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white">Certification</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {CERTIFICATIONS_AND_EXTRAS.certification}
                </p>
              </div>

              <div className="border-t border-white/10 pt-5">
                <h3 className="text-base font-semibold text-white">Languages</h3>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                  {CERTIFICATIONS_AND_EXTRAS.languages.map((lang) => (
                    <span key={lang.name}>
                      <span className="font-medium text-white">{lang.name}</span>{' '}
                      <span className="text-slate-400">({lang.level})</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-5">
                <h3 className="text-base font-semibold text-white">Community &amp; Interests</h3>
                <p className="mt-2 text-sm text-slate-300">
                  {CERTIFICATIONS_AND_EXTRAS.interests.join(' · ')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-white/10">
          <ContactSection />
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-[#080A0F]/95 py-8 pb-24 md:pb-24">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} {PROFILE.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a
              href={PROFILE.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              LinkedIn
            </a>
            <a
              href={PROFILE.googlePortfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Portfolio Archive
            </a>
            <a href={`mailto:${PROFILE.email}`} className="hover:text-white transition-colors">
              {PROFILE.email}
            </a>
          </div>
        </div>
      </footer>

      <SceneDock
        preset={cameraPreset}
        onPresetChange={setCameraPreset}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate((prev) => !prev)}
        collapsed={dockCollapsed}
        onToggleCollapsed={() => setDockCollapsed((prev) => !prev)}
        scrollProgress={scrollProgress}
      />

      <CaseStudyModal study={selectedStudy} onClose={() => setSelectedStudy(null)} />
    </div>
  );
}
