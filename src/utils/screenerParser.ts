import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import {
  detectBufferFormat,
  extractLegacyDocText,
  extractPdfFallbackText,
  findPdfHeaderOffset,
  stripHtmlToText,
  stripRtfToText,
  type DetectedFormat,
} from './screenerBufferUtils';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function extractHrefUrlsFromHtml(html: string): string[] {
  const urls: string[] = [];
  for (const m of html.matchAll(/href\s*=\s*["'](https?:\/\/[^"']+)["']/gi)) {
    if (!urls.includes(m[1])) {
      urls.push(m[1]);
    }
  }
  return urls;
}

async function extractPdfTextWithPdfJs(pdfBytes: Uint8Array): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  let text = '';
  const discoveredUrls: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    let lastY: number | null = null;

    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue;
      const y = Array.isArray(item.transform) ? item.transform[5] : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
        text += '\n';
      } else if (text.length > 0 && !text.endsWith('\n')) {
        text += ' ';
      }
      text += item.str;
      lastY = y;
    }
    text += '\n\n';

    try {
      const annotations = await page.getAnnotations();
      for (const annot of annotations) {
        const url =
          (typeof annot.url === 'string' && annot.url) ||
          (typeof annot.unsafeUrl === 'string' && annot.unsafeUrl) ||
          '';
        if (url && /^https?:\/\//i.test(url) && !discoveredUrls.includes(url)) {
          discoveredUrls.push(url);
        }
      }
    } catch {
      // Non-fatal: continue even if an annotation stream cannot be read
    }
  }

  const missingUrls = discoveredUrls.filter((u) => !text.includes(u));
  if (missingUrls.length > 0) {
    text += `\nLinks: ${missingUrls.join(' ')}\n`;
  }

  return text;
}

export async function inspectFileFormat(file: File): Promise<DetectedFormat> {
  const slice = await file.slice(0, 4096).arrayBuffer();
  return detectBufferFormat(new Uint8Array(slice), file.type);
}

export async function extractTextFromFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const format = detectBufferFormat(bytes, file.type);

  if (format === 'text') {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes).replace(/^\uFEFF/, '');
  }

  if (format === 'utf16le') {
    return new TextDecoder('utf-16le', { fatal: false }).decode(bytes).replace(/^\uFEFF/, '');
  }

  if (format === 'utf16be') {
    return new TextDecoder('utf-16be', { fatal: false }).decode(bytes).replace(/^\uFEFF/, '');
  }

  if (format === 'rtf') {
    const raw = new TextDecoder('latin1').decode(bytes);
    return stripRtfToText(raw);
  }

  if (format === 'html') {
    const raw = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    return stripHtmlToText(raw);
  }

  if (format === 'pdf') {
    const offset = findPdfHeaderOffset(bytes);
    const pdfBytes = offset > 0 ? bytes.subarray(offset) : bytes;
    try {
      const extracted = await extractPdfTextWithPdfJs(pdfBytes);
      if (extracted.trim().length >= 15) {
        return extracted;
      }
    } catch {
      // Fall through to recovery extractor below
    }
    const fallback = extractPdfFallbackText(pdfBytes);
    if (fallback.trim().length >= 15) {
      return fallback;
    }
    // Retry once via pdf.js directly if fallback was also sparse so caller gets a clean error if truly unreadable
    return extractPdfTextWithPdfJs(pdfBytes);
  }

  if (format === 'zip') {
    const rawResult = await mammoth.extractRawText({ arrayBuffer: buf });
    let text = rawResult.value || '';
    try {
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buf });
      const hrefs = extractHrefUrlsFromHtml(htmlResult.value || '').filter(
        (u) => !text.includes(u),
      );
      if (hrefs.length > 0) {
        text += `\nLinks: ${hrefs.join(' ')}\n`;
      }
    } catch {
      // Non-fatal if HTML link sweep fails
    }
    return text;
  }

  if (format === 'ole2') {
    return extractLegacyDocText(buf);
  }

  // Last-resort check for unrecognized containers (e.g., ASCII/Unicode runs in malformed files)
  return extractLegacyDocText(buf);
}

export async function renderDocxPreviewHtml(file: File): Promise<string> {
  const format = await inspectFileFormat(file);
  if (format !== 'zip') return '';
  const buf = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer: buf });
  return result.value;
}
