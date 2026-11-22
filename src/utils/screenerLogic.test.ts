import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeCandidateText,
  buildBatchSummary,
  buildJdKeywords,
  buildShortlistCsv,
  detectBachelor,
  extractEmail,
  extractExperienceSummary,
  extractName,
  extractPhone,
  extractPortfolios,
  extractSkills,
  filterAndRankCandidates,
  getMatchBand,
  SAMPLE_JD,
  SAMPLE_RESUMES,
  validateResumeFile,
} from './screenerLogic';
import {
  detectBufferFormat,
  extractLegacyDocText,
  findPdfHeaderOffset,
  stripHtmlToText,
  stripRtfToText,
} from './screenerBufferUtils';

test('validateResumeFile enforces extensions, 10MB cap, and 25-file batch limit', () => {
  assert.equal(validateResumeFile({ name: 'cv.pdf', size: 1024 }, 0).ok, true);
  assert.equal(validateResumeFile({ name: 'cv.docx', size: 5000 }, 24).ok, true);
  assert.equal(validateResumeFile({ name: 'cv.doc', size: 5000 }, 5).ok, true);
  assert.equal(validateResumeFile({ name: 'cv.exe', size: 1000 }, 0).ok, false);
  assert.equal(validateResumeFile({ name: 'huge.pdf', size: 11 * 1024 * 1024 }, 0).ok, false);
  assert.equal(validateResumeFile({ name: 'extra.pdf', size: 1000 }, 25).ok, false);
});

test('extractEmail, extractPhone, extractPortfolios, and extractExperienceSummary parse candidate metadata accurately', () => {
  const sample = SAMPLE_RESUMES[0].text;
  assert.equal(extractEmail(sample), 'hr.emamhossan@gmail.com');
  assert.equal(extractPhone(sample), '+880-1706-558256');
  assert.equal(extractPhone('Worked 2019 - 2023\nPhone: (202) 555-0148'), '(202) 555-0148');

  const portfolios = extractPortfolios(sample);
  assert.ok(portfolios.some((u) => u.includes('linkedin.com/in/emam-hossan-recruiter')));
  assert.ok(portfolios.some((u) => u.includes('sites.google.com/view/emamhossan')));

  // Country-subdomain LinkedIn and root domain URL without trailing slash should match, while tool names and emails should not
  assert.deepEqual(extractPortfolios('https://danielbrooks.dev'), ['https://danielbrooks.dev']);
  assert.deepEqual(extractPortfolios('Profile: bd.linkedin.com/in/sarah-khan'), [
    'https://bd.linkedin.com/in/sarah-khan',
  ]);
  assert.deepEqual(
    extractPortfolios('Skilled in Monday.com and user@outboundpro.co.uk'),
    [],
  );
  assert.equal(
    extractName('Johnathan Smith | Senior B2B Recruiter\njohn@acme.io', 'resume.pdf'),
    'Johnathan Smith',
  );

  const exp = extractExperienceSummary(sample);
  assert.equal(exp.yearsLabel, '4+ yrs');
  assert.ok(exp.highlights.length >= 1);

  const skills = extractSkills(sample);
  assert.ok(skills.includes('Monday.com'));
  assert.ok(skills.includes('Cold Calling'));
});

test('detectBachelor distinguishes completed degrees from in-progress degrees', () => {
  assert.equal(detectBachelor('BBA in Human Resources Management — BUFT'), true);
  assert.equal(detectBachelor('Currently pursuing Bachelor of Science in CS'), false);
  assert.equal(detectBachelor('Diploma in Graphic Design'), false);
});

test('analyzeCandidateText, filterAndRankCandidates, and buildBatchSummary produce structured contact, LinkedIn, portfolio, and summary outputs', () => {
  const kw = buildJdKeywords(SAMPLE_JD);
  assert.ok(kw.length > 5);

  const analyzed = SAMPLE_RESUMES.map((s) =>
    analyzeCandidateText({
      id: s.id,
      fileName: s.fileName,
      text: s.text,
      jdKeywords: kw,
    }),
  );

  const allRanked = filterAndRankCandidates(analyzed, { minMatch: 0, requireBachelor: false });
  assert.equal(allRanked.length, 4);
  assert.equal(allRanked[0].name, 'EMAM HOSSAN');
  assert.ok(allRanked[0].pct > allRanked[3].pct);
  assert.ok(allRanked[0].linkedinUrl.includes('linkedin.com/in/emam-hossan-recruiter'));
  assert.ok(allRanked[0].portfolioLinks.some((u) => u.includes('sites.google.com/view/emamhossan')));
  assert.ok(allRanked[0].summary.includes('Strong Match'));
  assert.ok(allRanked[2].portfolioLinks.includes('https://danielbrooks.dev'));

  const batchSummary = buildBatchSummary(allRanked);
  assert.equal(batchSummary.total, 4);
  assert.equal(batchSummary.emailCount, 4);
  assert.equal(batchSummary.phoneCount, 4);
  assert.equal(batchSummary.linkedinCount, 2);
  assert.equal(batchSummary.portfolioCount, 3);

  const degreeOnly = filterAndRankCandidates(analyzed, { minMatch: 0, requireBachelor: true });
  assert.equal(degreeOnly.length, 3);
  assert.ok(degreeOnly.every((c) => c.hasBachelor));

  assert.equal(getMatchBand(75).label, 'Strong Match');
  assert.equal(getMatchBand(45).label, 'Partial Match');
  assert.equal(getMatchBand(15).label, 'Low Match');
});

test('buildShortlistCsv outputs valid CSV header and LinkedIn/Portfolio/Summary columns', () => {
  const kw = buildJdKeywords(SAMPLE_JD);
  const candidate = analyzeCandidateText({
    id: 'c1',
    fileName: SAMPLE_RESUMES[0].fileName,
    text: SAMPLE_RESUMES[0].text,
    jdKeywords: kw,
  });
  const csv = buildShortlistCsv([candidate]);
  const lines = csv.split('\n');
  assert.equal(lines.length, 2);
  assert.ok(lines[0].includes('LinkedIn Profile,Portfolio / Links,Result Summary'));
  assert.ok(lines[1].includes('EMAM HOSSAN'));
  assert.ok(lines[1].includes('hr.emamhossan@gmail.com'));
});

test('buffer sniffing and RTF/HTML/UTF-16LE DOC decoders handle diverse resume structures cleanly', () => {
  const plainBytes = new TextEncoder().encode('EMAM HOSSAN\n+880-1706-558256\nhr.emamhossan@gmail.com');
  assert.equal(detectBufferFormat(plainBytes, 'text/plain'), 'text');
  assert.equal(detectBufferFormat(plainBytes), 'text');

  const paddedPdf = new Uint8Array([0x0a, 0x20, 0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
  assert.equal(findPdfHeaderOffset(paddedPdf), 2);
  assert.equal(detectBufferFormat(paddedPdf), 'pdf');

  const zipBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
  assert.equal(detectBufferFormat(zipBytes), 'zip');

  const oleBytes = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  assert.equal(detectBufferFormat(oleBytes), 'ole2');

  const rtfText = stripRtfToText(
    '{\\rtf1\\ansi{\\fonttbl{\\f0 Arial;}}Jane Doe\\par +1-555-222-3333\\par jane@doe.io\\par https://linkedin.com/in/janedoe}',
  );
  assert.ok(rtfText.includes('Jane Doe'));
  assert.ok(rtfText.includes('jane@doe.io'));
  assert.ok(!rtfText.includes('Arial'));

  const htmlText = stripHtmlToText(
    '<html><body><h1>Alex Rivera</h1><p><a href="https://linkedin.com/in/alexrivera">LinkedIn</a> · alex@rivera.co</p></body></html>',
  );
  assert.ok(htmlText.includes('Alex Rivera'));
  assert.ok(htmlText.includes('https://linkedin.com/in/alexrivera'));

  // UTF-16LE string embedded in a binary .doc buffer
  const sampleStr = 'Nadia Karim\n+1-415-890-3341\nnadia@cloud.io';
  const buf = new ArrayBuffer(sampleStr.length * 2);
  const view = new Uint8Array(buf);
  for (let i = 0; i < sampleStr.length; i++) {
    view[i * 2] = sampleStr.charCodeAt(i);
    view[i * 2 + 1] = 0;
  }
  const legacyText = extractLegacyDocText(buf);
  assert.ok(legacyText.includes('Nadia Karim'));
  assert.ok(legacyText.includes('nadia@cloud.io'));
});

