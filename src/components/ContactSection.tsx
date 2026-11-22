import { useState, type FormEvent } from 'react';
import { Check, Copy, Download, ExternalLink, Mail, MapPin, Phone, Send } from 'lucide-react';
import { PROFILE } from '../data/portfolioData';
import { validateContactForm, type ContactFormInput } from '../utils/portfolioLogic';

export default function ContactSection() {
  const [form, setForm] = useState<ContactFormInput>({
    name: '',
    email: '',
    company: '',
    inquiryType: 'Remote B2B Sales / Client Outreach',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormInput, string>>>({});
  const [submittedRecord, setSubmittedRecord] = useState<ContactFormInput | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2400);
    } catch {
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2400);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validation = validateContactForm(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setSubmittedRecord({ ...form });
  };

  const handleReset = () => {
    setSubmittedRecord(null);
    setForm({
      name: '',
      email: '',
      company: '',
      inquiryType: 'Remote B2B Sales / Client Outreach',
      message: '',
    });
    setErrors({});
  };

  return (
    <section id="contact" aria-labelledby="contact-heading" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="text-xs font-medium text-blue-400">International Collaboration</p>
            <h2 id="contact-heading" className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-white text-balance">
              Ready for Global Sales, Talent &amp; Operations Roles
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              Available for remote B2B sales, full-cycle international recruitment, and AI-enabled HR operations across US, European, and APAC time zones.
            </p>
          </div>

          <div className="space-y-3 border-t border-white/10 pt-6 text-sm">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#10141F]/90 p-4">
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Direct Email</p>
                <a
                  href={`mailto:${PROFILE.email}`}
                  className="mt-0.5 block truncate font-medium text-white hover:text-blue-400 transition-colors"
                >
                  {PROFILE.email}
                </a>
              </div>
              <button
                type="button"
                onClick={handleCopyEmail}
                aria-label="Copy email address"
                className="btn-tactile inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
              >
                {copiedEmail ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-[#10141F]/90 p-4">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                  <span>Phone / WhatsApp</span>
                </p>
                <a
                  href={`tel:${PROFILE.phone}`}
                  className="mt-1 block font-mono-tabular text-sm font-medium text-white hover:text-blue-400"
                >
                  {PROFILE.phone}
                </a>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#10141F]/90 p-4">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                  <span>Base &amp; Availability</span>
                </p>
                <p className="mt-1 text-sm font-medium text-white">Mirpur, Dhaka · Remote</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={PROFILE.resumePdfPath}
                download="Emam_Hossan_Resume.pdf"
                className="btn-tactile inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Download className="h-4 w-4 text-blue-400" aria-hidden="true" />
                <span>Download Resume PDF</span>
              </a>
              <a
                href={PROFILE.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-tactile inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span>LinkedIn Profile</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0F131D]/95 p-6 sm:p-8">
          {submittedRecord ? (
            <div data-testid="contact-confirmation" className="py-6 space-y-5">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Inquiry Prepared for Emam Hossan</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Thank you, <span className="font-medium text-white">{submittedRecord.name}</span>. Your brief regarding{' '}
                  <span className="font-medium text-white">{submittedRecord.inquiryType}</span> is ready to send directly to{' '}
                  <span className="font-mono-tabular text-blue-400">{PROFILE.email}</span>.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={`mailto:${PROFILE.email}?subject=${encodeURIComponent(
                    `${submittedRecord.inquiryType} — ${submittedRecord.company || submittedRecord.name}`,
                  )}&body=${encodeURIComponent(
                    `Name: ${submittedRecord.name}\nEmail: ${submittedRecord.email}\nCompany: ${submittedRecord.company || 'N/A'}\n\n${submittedRecord.message}`,
                  )}`}
                  className="btn-tactile inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span>Open in Email Client</span>
                </a>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-tactile rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  Send Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white">Start a Conversation</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Share details about a role, international project, or B2B partnership.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-medium text-slate-300">
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Rachel Alvarez"
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#080A0F] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.name && (
                    <p role="alert" className="mt-1.5 text-xs text-rose-400">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-xs font-medium text-slate-300">
                    Work Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="rachel@company.com"
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#080A0F] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.email && (
                    <p role="alert" className="mt-1.5 text-xs text-rose-400">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-company" className="block text-xs font-medium text-slate-300">
                    Company / Organization
                  </label>
                  <input
                    id="contact-company"
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                    placeholder="Optional"
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#080A0F] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="contact-type" className="block text-xs font-medium text-slate-300">
                    Focus Area
                  </label>
                  <select
                    id="contact-type"
                    value={form.inquiryType}
                    onChange={(e) => setForm((prev) => ({ ...prev, inquiryType: e.target.value }))}
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#080A0F] px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Remote B2B Sales / Client Outreach">Remote B2B Sales / Client Outreach</option>
                    <option value="Global HR & Full-Cycle Recruitment">Global HR &amp; Full-Cycle Recruitment</option>
                    <option value="AI HRMS / ERP Operations">AI HRMS / ERP Operations</option>
                    <option value="Digital Marketing & Employer Branding">Digital Marketing &amp; Employer Branding</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-medium text-slate-300">
                  Role or Project Brief
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Share team location, role scope, or timeline..."
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#080A0F] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.message && (
                  <p role="alert" className="mt-1.5 text-xs text-rose-400">
                    {errors.message}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <p className="text-xs text-slate-400">Responds promptly across US, EU &amp; APAC hours.</p>
                <button
                  type="submit"
                  className="btn-tactile inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span>Send Inquiry</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
