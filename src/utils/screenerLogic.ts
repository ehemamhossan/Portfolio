export const MAX_RESUMES_PER_BATCH = 25;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const SUPPORTED_EXTENSIONS = ['pdf', 'docx', 'doc', 'txt'] as const;

export interface JdKeyword {
  word: string;
  weight: number;
}

export interface ExperienceSummary {
  yearsLabel: string;
  highlights: string[];
}

export interface ScreenedCandidate {
  id: string;
  fileName: string;
  name: string;
  phone: string;
  email: string;
  linkedinUrl: string;
  portfolioLinks: string[];
  portfolios: string[];
  experience: ExperienceSummary;
  matchedSkills: string[];
  missingSkills: string[];
  extractedSkills: string[];
  summary: string;
  pct: number;
  hasBachelor: boolean;
  rawText: string;
  parseError?: string;
}

export interface BatchScreeningSummary {
  total: number;
  strongCount: number;
  partialCount: number;
  emailCount: number;
  phoneCount: number;
  linkedinCount: number;
  portfolioCount: number;
  topCandidateName: string;
  topCandidatePct: number;
}

export interface FileValidationResult {
  ok: boolean;
  error?: string;
}

export interface SampleResumeSeed {
  id: string;
  fileName: string;
  text: string;
}

const STOPWORDS = new Set(
  (
    'a an the and or but if while of to in on for with at by from up about into over after under again further then once here there all any both each few more most other some such no nor not only own same so than too very s t can will just don should now is are was were be been being have has had do does did this that these those i you he she it we they what which who whom as must shall would could ought responsible responsibilities requirements requirement required require skills skill experience experienced years year job role position candidate candidates looking seeking company team work working plus preferred etc including strong ability knowledge excellent good demonstrated proven using across within based'
  ).split(' '),
);

const NAME_SKIP_WORDS = new Set([
  'resume',
  'cv',
  'curriculum',
  'vitae',
  'profile',
  'summary',
  'objective',
  'contact',
  'address',
  'personal',
  'details',
  'information',
  'page',
  'portfolio',
  'linkedin',
  'email',
  'phone',
]);

const KNOWN_SKILLS: string[] = [
  'B2B Sales',
  'Cold Calling',
  'Lead Generation',
  'Client Outreach',
  'CRM Management',
  'Monday.com',
  'HubSpot',
  'Salesforce',
  'Pipedrive',
  'Full-Cycle Recruitment',
  'Talent Acquisition',
  'ATS Management',
  'Bulk Hiring',
  'Onboarding',
  'HR Operations',
  'HRMS',
  'ERP',
  'Payroll',
  'Compliance',
  'Vendor Management',
  'Employee Relations',
  'Employer Branding',
  'Digital Marketing',
  'Social Media Management',
  'SEO',
  'Content Marketing',
  'Google Workspace',
  'Microsoft Excel',
  'Airtable',
  'WordPress',
  'Canva',
  'Photoshop',
  'Illustrator',
  'ChatGPT',
  'Claude',
  'Google Gemini',
  'Perplexity AI',
  'Python',
  'SQL',
  'TypeScript',
  'React',
  'Project Management',
  'Data Analysis',
  'Negotiation',
  'Account Management',
];

export function getFileExtension(fileName: string): string {
  const parts = fileName.trim().toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

export function validateResumeFile(
  fileMeta: { name: string; size: number },
  currentCount: number,
): FileValidationResult {
  if (currentCount >= MAX_RESUMES_PER_BATCH) {
    return {
      ok: false,
      error: `Maximum ${MAX_RESUMES_PER_BATCH} resumes allowed per screening batch.`,
    };
  }
  const ext = getFileExtension(fileMeta.name);
  if (!SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number])) {
    return {
      ok: false,
      error: `"${fileMeta.name}" is unsupported. Upload PDF, DOCX, DOC, or TXT files.`,
    };
  }
  if (fileMeta.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `"${fileMeta.name}" exceeds the 10 MB per-file limit.`,
    };
  }
  return { ok: true };
}

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9+.#-]*/g) || [])
    .map((w) => w.replace(/\.+$/, ''))
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

export function buildJdKeywords(jdText: string): JdKeyword[] {
  const tokens = tokenize(jdText);
  const freq: Record<string, number> = {};
  for (const t of tokens) {
    freq[t] = (freq[t] || 0) + 1;
  }

  const bigramFreq: Record<string, number> = {};
  for (let i = 0; i < tokens.length - 1; i++) {
    const bg = `${tokens[i]} ${tokens[i + 1]}`;
    bigramFreq[bg] = (bigramFreq[bg] || 0) + 1;
  }

  const lower = jdText.toLowerCase();
  const boostSections = ['requirements', 'qualifications', 'skills', 'must have', 'responsibilities'];

  let list: JdKeyword[] = Object.entries(freq).map(([word, count]) => {
    let weight = count;
    for (const sec of boostSections) {
      const idx = lower.indexOf(sec);
      if (idx !== -1) {
        const hitIdx = lower.indexOf(word, idx);
        if (hitIdx > idx && hitIdx - idx < 450) {
          weight += 1;
        }
      }
    }
    return { word, weight };
  });

  const bigrams: JdKeyword[] = Object.entries(bigramFreq)
    .filter(([, c]) => c >= 1)
    .map(([word, count]) => ({ word, weight: count + 1 }));

  list = list.concat(bigrams);
  list.sort((a, b) => b.weight - a.weight);

  // Deduplicate keeping highest weight
  const seen = new Set<string>();
  const unique: JdKeyword[] = [];
  for (const item of list) {
    if (!seen.has(item.word)) {
      seen.add(item.word);
      unique.push(item);
    }
  }
  return unique.slice(0, 36);
}

export function extractEmail(text: string): string {
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  const valid = matches.find(
    (m) => !/\.(?:png|jpe?g|gif|svg|webp|pdf|docx?)$/i.test(m),
  );
  return valid ? valid.replace(/\.+$/, '') : '';
}

export function extractPhone(text: string): string {
  const matches = text.match(/(\+?\d{1,3}[\s.-]?)?(\(?\d{2,5}\)?[\s.-]?){2,4}\d{2,4}/g);
  if (!matches) return '';
  const candidate = matches.find((raw) => {
    const trimmed = raw.trim();
    // Skip year ranges like "2019 - 2023" or "2021–2026"
    if (/^(?:19|20)\d{2}\s*[-–—.]\s*(?:19|20)\d{2}$/.test(trimmed)) return false;
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 8 && /^(?:19|20)\d{2}(?:19|20)\d{2}$/.test(digits)) {
      return false;
    }
    return digits.length >= 8 && digits.length <= 15;
  });
  return candidate ? candidate.trim() : '';
}

export function extractPortfolios(text: string): string[] {
  const regex =
    /(?:https?:\/\/|www\.)(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[a-zA-Z0-9_./~?#=&%-]*)?|(?:(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[a-zA-Z0-9_.-]+|github\.com\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*|sites\.google\.com\/view\/[a-zA-Z0-9_/-]+|behance\.net\/[a-zA-Z0-9_.-]+|dribbble\.com\/[a-zA-Z0-9_.-]+|linktr\.ee\/[a-zA-Z0-9_.-]+)|(?:[a-zA-Z0-9-]+\.)+(?:io|dev|me|co|com|org|net|site|app)\/[a-zA-Z0-9_./~?#=&%-]+/gi;

  const cleaned: string[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(regex)) {
    const raw = match[0];
    const trimmed = raw.replace(/[),.;:]+$/, '');
    const idx = match.index ?? -1;
    // Skip email domain fragments (preceded by @)
    if (idx > 0 && text[idx - 1] === '@') continue;
    if (trimmed.includes('@')) continue;

    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const key = normalized
      .replace(/\/+$/, '')
      .replace(/\/home$/i, '')
      .toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      cleaned.push(normalized);
    }
  }
  return cleaned.slice(0, 6);
}

export function extractLinkedInUrl(portfolios: string[]): string {
  return portfolios.find((url) => /linkedin\.com\/in\//i.test(url)) || '';
}

function looksLikeName(line: string): boolean {
  if (line.length < 3 || line.length > 48) return false;
  if (/[@\d/]/.test(line)) return false;
  if (!/^[A-Za-z][A-Za-z.\s'-]+$/.test(line)) return false;
  const words = line.trim().split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  const lower = line.toLowerCase();
  for (const skip of NAME_SKIP_WORDS) {
    if (lower.includes(skip)) return false;
  }
  if (line.endsWith(':')) return false;
  return words.every((w) => /^[A-Z][a-z'.-]*$/.test(w) || /^[A-Z]{2,}$/.test(w));
}

export function extractName(text: string, filename: string): string {
  const rawLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Split header lines that use pipes, bullets, or wide column spacing into candidate segments
  const headerSegments: string[] = [];
  for (const line of rawLines.slice(0, 12)) {
    headerSegments.push(line);
    const parts = line
      .split(/\s*[|•]\s*|\s{3,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 1) {
      headerSegments.push(...parts);
    }
  }

  for (const seg of headerSegments) {
    if (looksLikeName(seg)) return seg;
  }

  const emailIdx = rawLines.findIndex((l) =>
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(l),
  );
  if (emailIdx > 0) {
    for (let i = Math.max(0, emailIdx - 3); i < emailIdx; i++) {
      if (looksLikeName(rawLines[i])) return rawLines[i];
    }
  }

  for (const line of rawLines.slice(0, 8)) {
    const firstChunk = line.split(/\s*[|•]\s*|\s{3,}/)[0]?.trim() || line;
    if (
      firstChunk.length > 2 &&
      firstChunk.length < 42 &&
      !/[@\d/]/.test(firstChunk) &&
      firstChunk.split(/\s+/).length <= 4 &&
      /^[A-Za-z][A-Za-z.\s'-]+$/.test(firstChunk)
    ) {
      return firstChunk;
    }
  }

  return filename.replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/[_-]+/g, ' ');
}

export function extractExperienceSummary(text: string): ExperienceSummary {
  const explicitMatch = text.match(/(\d{1,2}\+?)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)?/i);
  let yearsLabel = explicitMatch ? `${explicitMatch[1]} yrs` : '';

  if (!yearsLabel) {
    const years = Array.from(text.matchAll(/\b(20\d{2}|19\d{2})\b/g))
      .map((m) => parseInt(m[1], 10))
      .filter((y) => y >= 1995 && y <= 2030);
    if (years.length >= 2) {
      const span = Math.max(...years) - Math.min(...years);
      if (span >= 1 && span <= 35) {
        yearsLabel = `${span}+ yrs`;
      }
    }
  }
  if (!yearsLabel) {
    yearsLabel = 'Experience listed';
  }

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length >= 8 && l.length <= 120);

  const expStart = lines.findIndex((l) =>
    /^(work\s+experience|professional\s+experience|experience|career\s+history)/i.test(l),
  );

  const searchPool = expStart !== -1 ? lines.slice(expStart + 1, expStart + 18) : lines.slice(4, 24);
  const highlights: string[] = [];

  for (const line of searchPool) {
    if (/^(education|certifications?|skills|languages|references)\b/i.test(line)) break;
    // Pick concise role/company or bullet highlights
    const cleaned = line.replace(/^[•\-–*]\s*/, '').trim();
    if (
      cleaned.length >= 10 &&
      !/@/.test(cleaned) &&
      !cleaned.toLowerCase().startsWith('http')
    ) {
      highlights.push(cleaned);
    }
    if (highlights.length >= 2) break;
  }

  return { yearsLabel, highlights };
}

export function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];

  for (const skill of KNOWN_SKILLS) {
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');
    if (regex.test(lower)) {
      found.push(skill);
    }
  }
  return found.slice(0, 12);
}

export function detectBachelor(text: string): boolean {
  const lower = text.toLowerCase();
  const degreeTerms =
    /(bachelor|b\.?\s?sc\.?|b\.?\s?a\.?\b|b\.?\s?com\.?|b\.?\s?tech\.?|b\.?\s?eng\.?|\bbba\b|\bbca\b|\bllb\b|b\.?\s?ed\.?|undergraduate\s+degree)/;
  const match = lower.match(degreeTerms);
  if (!match || match.index === undefined) return false;
  const pursuingTerms = /(pursuing|currently enrolled|expected graduation|ongoing|in progress|candidate for)/;
  const contextWindow = lower.slice(Math.max(0, match.index - 60), match.index + 60);
  return !pursuingTerms.test(contextWindow);
}

export function scoreResume(
  text: string,
  jdKeywords: JdKeyword[],
): { pct: number; matched: string[]; missing: string[] } {
  const resumeTokens = new Set(tokenize(text));
  const lower = text.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];
  let totalWeight = 0;
  let gotWeight = 0;

  for (const k of jdKeywords) {
    totalWeight += k.weight;
    const hit = k.word.includes(' ') ? lower.includes(k.word) : resumeTokens.has(k.word);
    if (hit) {
      gotWeight += k.weight;
      matched.push(k.word);
    } else {
      missing.push(k.word);
    }
  }

  const pct = totalWeight > 0 ? Math.min(100, Math.round((gotWeight / totalWeight) * 100)) : 0;
  return { pct, matched, missing: missing.slice(0, 8) };
}

export function buildCandidateSummary(params: {
  pct: number;
  experience: ExperienceSummary;
  matchedSkills: string[];
  phone: string;
  email: string;
  linkedinUrl: string;
  portfolioLinks: string[];
  hasBachelor: boolean;
}): string {
  const band = getMatchBand(params.pct);
  const parts: string[] = [`${band.label} (${params.pct}%)`];

  if (params.experience.yearsLabel && params.experience.yearsLabel !== 'Not readable') {
    parts.push(params.experience.yearsLabel);
  }
  if (params.hasBachelor) {
    parts.push("Bachelor's detected");
  }
  if (params.matchedSkills.length > 0) {
    parts.push(`Top JD hits: ${params.matchedSkills.slice(0, 4).join(', ')}`);
  }

  const contactBits: string[] = [];
  if (params.phone) contactBits.push('phone');
  if (params.email) contactBits.push('email');
  if (params.linkedinUrl) contactBits.push('LinkedIn');
  if (params.portfolioLinks.length > 0) contactBits.push('portfolio');
  if (contactBits.length > 0) {
    parts.push(`Extracted ${contactBits.join(', ')}`);
  }

  return parts.join(' · ');
}

export function analyzeCandidateText(params: {
  id: string;
  fileName: string;
  text: string;
  jdKeywords: JdKeyword[];
}): ScreenedCandidate {
  const { id, fileName, text, jdKeywords } = params;
  if (!text || text.trim().length < 20) {
    return {
      id,
      fileName,
      name: fileName.replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/[_-]+/g, ' '),
      phone: '',
      email: '',
      linkedinUrl: '',
      portfolioLinks: [],
      portfolios: [],
      experience: { yearsLabel: 'Not readable', highlights: [] },
      matchedSkills: [],
      missingSkills: jdKeywords.slice(0, 6).map((k) => k.word),
      extractedSkills: [],
      summary: 'Unable to extract readable text from this file.',
      pct: 0,
      hasBachelor: false,
      rawText: text || '',
      parseError: 'Could not extract readable text from this file.',
    };
  }

  const { pct, matched, missing } = scoreResume(text, jdKeywords);
  const phone = extractPhone(text);
  const email = extractEmail(text);
  const portfolios = extractPortfolios(text);
  const linkedinUrl = extractLinkedInUrl(portfolios);
  const portfolioLinks = portfolios.filter((u) => !/linkedin\.com\/in\//i.test(u));
  const experience = extractExperienceSummary(text);
  const hasBachelor = detectBachelor(text);

  return {
    id,
    fileName,
    name: extractName(text, fileName),
    phone,
    email,
    linkedinUrl,
    portfolioLinks,
    portfolios,
    experience,
    matchedSkills: matched,
    missingSkills: missing,
    extractedSkills: extractSkills(text),
    summary: buildCandidateSummary({
      pct,
      experience,
      matchedSkills: matched,
      phone,
      email,
      linkedinUrl,
      portfolioLinks,
      hasBachelor,
    }),
    pct,
    hasBachelor,
    rawText: text,
  };
}

export function buildBatchSummary(candidates: ScreenedCandidate[]): BatchScreeningSummary {
  const sorted = [...candidates].sort((a, b) => b.pct - a.pct);
  const top = sorted[0];
  return {
    total: candidates.length,
    strongCount: candidates.filter((c) => c.pct >= 65).length,
    partialCount: candidates.filter((c) => c.pct >= 35 && c.pct < 65).length,
    emailCount: candidates.filter((c) => Boolean(c.email)).length,
    phoneCount: candidates.filter((c) => Boolean(c.phone)).length,
    linkedinCount: candidates.filter((c) => Boolean(c.linkedinUrl)).length,
    portfolioCount: candidates.filter((c) => c.portfolioLinks.length > 0).length,
    topCandidateName: top?.name || '—',
    topCandidatePct: top?.pct ?? 0,
  };
}

export function filterAndRankCandidates(
  candidates: ScreenedCandidate[],
  options: { minMatch: number; requireBachelor: boolean },
): ScreenedCandidate[] {
  return [...candidates]
    .filter((c) => c.pct >= options.minMatch && (!options.requireBachelor || c.hasBachelor))
    .sort((a, b) => b.pct - a.pct);
}

export function getMatchBand(pct: number): { tier: 'strong' | 'mid' | 'low'; label: string } {
  if (pct >= 65) return { tier: 'strong', label: 'Strong Match' };
  if (pct >= 35) return { tier: 'mid', label: 'Partial Match' };
  return { tier: 'low', label: 'Low Match' };
}

function escapeCsvCell(value: string): string {
  const safe = value.replace(/"/g, '""');
  return `"${safe}"`;
}

export function buildShortlistCsv(candidates: ScreenedCandidate[]): string {
  const header = [
    'Rank',
    'Name',
    'Match %',
    'Fit Tier',
    'Phone',
    'Email',
    'LinkedIn Profile',
    'Portfolio / Links',
    'Result Summary',
    'Experience',
    'Matched JD Keywords',
    'Extracted Skills',
    'Bachelors Degree',
  ].join(',');

  const rows = candidates.map((c, idx) => {
    const band = getMatchBand(c.pct);
    return [
      String(idx + 1),
      escapeCsvCell(c.name),
      `${c.pct}%`,
      escapeCsvCell(band.label),
      escapeCsvCell(c.phone || 'N/A'),
      escapeCsvCell(c.email || 'N/A'),
      escapeCsvCell(c.linkedinUrl || 'N/A'),
      escapeCsvCell(c.portfolioLinks.join(' | ') || 'N/A'),
      escapeCsvCell(c.summary),
      escapeCsvCell(
        [c.experience.yearsLabel, ...c.experience.highlights].filter(Boolean).join(' — '),
      ),
      escapeCsvCell(c.matchedSkills.slice(0, 10).join(', ')),
      escapeCsvCell(c.extractedSkills.join(', ')),
      c.hasBachelor ? 'Yes' : 'No',
    ].join(',');
  });

  return [header, ...rows].join('\n');
}

export const SAMPLE_JD = `Senior Talent Acquisition & B2B Growth Specialist (Remote)
Requirements & Qualifications:
- 3+ years of experience in full-cycle recruitment, ATS management, and remote B2B sales outreach.
- Proven background in cold calling, client follow-ups, CRM management (Monday.com or HubSpot), and lead generation.
- Strong command of Microsoft Excel, Google Workspace, HRMS/ERP systems, and vendor management.
- Experience with employer branding, social media management, and AI tools (ChatGPT, Claude, Google Gemini).
- Bachelor's degree in Human Resources, Business Administration, or a related discipline required.`;

export const SAMPLE_RESUMES: SampleResumeSeed[] = [
  {
    id: 'sample-emam',
    fileName: 'Emam_Hossan_Resume.pdf',
    text: `EMAM HOSSAN
Sales & Marketing Specialist | HR & Recruitment Professional
+880-1706-558256 | hr.emamhossan@gmail.com
linkedin.com/in/emam-hossan-recruiter | sites.google.com/view/emamhossan
PROFESSIONAL SUMMARY
Results-driven professional with 4+ years of experience across full-cycle recruitment, HR operations, and digital marketing, now working in remote B2B sales and client outreach. Skilled in cold calling, client follow-ups, CRM management in Monday.com, Microsoft Excel, Google Workspace, ATS management, HRMS/ERP systems, employer branding, social media management, and AI tools including Claude, ChatGPT, and Google Gemini.
WORK EXPERIENCE
Sales and Marketing Specialist | Tribune Training Academy | Remote (Apr 2026 – Present)
HR Specialist (Project-Based) | Ray Advertising | USA-Based | AI-Based HRMS & ERP Implementation (Jan 2026 – Feb 2026)
Sr. Executive – HR & Administration | CodersTrust | Dhaka (Oct 2023 – Dec 2025)
EDUCATION
BBA in Human Resources Management — BGMEA University of Fashion & Technology`,
  },
  {
    id: 'sample-nadia',
    fileName: 'Nadia_Karim_CV.docx',
    text: `Nadia Karim
+1-415-890-3341 | nadia.karim.talent@gmail.com
https://www.linkedin.com/in/nadiakarim-hr
SUMMARY
Talent Acquisition Lead with 5 years of experience in ATS management, full-cycle recruitment, onboarding, and employer branding for SaaS teams. Proficient in Google Workspace, Microsoft Excel, HubSpot, and ChatGPT.
WORK EXPERIENCE
Talent Acquisition Specialist | CloudScale Inc (2022 – Present)
Led technical and B2B sales hiring pipelines, vendor management, and campus outreach.
EDUCATION
Bachelor of Business Administration (BBA) — North South University`,
  },
  {
    id: 'sample-daniel',
    fileName: 'Daniel_Brooks_B2B.pdf',
    text: `Daniel Brooks
+44-7700-900412 | daniel.brooks@outboundpro.co.uk
https://danielbrooks.dev
SUMMARY
Remote B2B Sales Executive with 3 years of experience in cold calling, lead generation, client follow-ups, and CRM management using Monday.com and Salesforce. Skilled in digital marketing, Microsoft Excel, and Google Gemini.
WORK EXPERIENCE
B2B Account Executive | GrowthBridge UK (2023 – Present)
Managed outbound sales cadence and pipeline conversion.
EDUCATION
BSc in Marketing — University of Manchester`,
  },
  {
    id: 'sample-arjun',
    fileName: 'Arjun_Mehta_Profile.pdf',
    text: `Arjun Mehta
+91-98201-44510 | arjun.mehta@designcraft.in
https://behance.net/arjunmehta
SUMMARY
Visual Designer with 2 years of experience in Canva, Photoshop, Illustrator, and WordPress landing pages for digital marketing agencies.
WORK EXPERIENCE
Junior Graphic Designer | PixelCraft Studio (2024 – 2026)
EDUCATION
Diploma in Graphic Design — Arena Animation`,
  },
];
