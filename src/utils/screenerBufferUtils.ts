export type DetectedFormat =
  | 'pdf'
  | 'zip'
  | 'ole2'
  | 'rtf'
  | 'html'
  | 'utf16le'
  | 'utf16be'
  | 'text'
  | 'binary';

export function findPdfHeaderOffset(bytes: Uint8Array): number {
  const limit = Math.min(bytes.length - 5, 2048);
  for (let i = 0; i <= limit; i++) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 && // F
      bytes[i + 4] === 0x2d // -
    ) {
      return i;
    }
  }
  return -1;
}

export function isLikelyPlainText(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return true;
  const sampleLen = Math.min(bytes.length, 4096);
  let printable = 0;
  let nulCount = 0;

  let start = 0;
  if (
    sampleLen >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
  ) {
    start = 3;
  }

  for (let i = start; i < sampleLen; i++) {
    const b = bytes[i];
    if (b === 0) {
      nulCount++;
    } else if (
      (b >= 32 && b <= 126) ||
      b === 9 ||
      b === 10 ||
      b === 13 ||
      b >= 128
    ) {
      printable++;
    }
  }

  if (nulCount > 0) return false;
  const checked = Math.max(1, sampleLen - start);
  return printable / checked >= 0.85;
}

export function detectBufferFormat(
  bytes: Uint8Array,
  mimeType = '',
): DetectedFormat {
  if (bytes.length === 0) return 'text';

  // PDF signature (%PDF-) anywhere in first 2 KB
  if (findPdfHeaderOffset(bytes) !== -1) {
    return 'pdf';
  }

  // ZIP signature (PK\x03\x04 or empty PK\x05\x06) used by .docx
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    ((bytes[2] === 0x03 && bytes[3] === 0x04) ||
      (bytes[2] === 0x05 && bytes[3] === 0x06))
  ) {
    return 'zip';
  }

  // OLE2 Compound Binary Document signature used by legacy .doc
  if (
    bytes.length >= 8 &&
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0 &&
    bytes[4] === 0xa1 &&
    bytes[5] === 0xb1 &&
    bytes[6] === 0x1a &&
    bytes[7] === 0xe1
  ) {
    return 'ole2';
  }

  // UTF-16 BOM
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return 'utf16le';
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return 'utf16be';
  }

  const head = new TextDecoder('utf-8', { fatal: false })
    .decode(bytes.subarray(0, 512))
    .replace(/^\uFEFF/, '')
    .trimStart()
    .toLowerCase();

  if (head.startsWith('{\\rtf')) {
    return 'rtf';
  }

  if (
    head.startsWith('<!doctype html') ||
    head.startsWith('<html') ||
    head.startsWith('<head') ||
    head.startsWith('<body') ||
    (/^<(?:meta|div|p|table|xml)\b/.test(head) && head.includes('>'))
  ) {
    return 'html';
  }

  if (mimeType === 'text/plain' || isLikelyPlainText(bytes)) {
    return 'text';
  }

  return 'binary';
}

export function stripRtfToText(rtf: string): string {
  const skipDestinations = new Set([
    'fonttbl',
    'colortbl',
    'stylesheet',
    'info',
    'pict',
    'object',
    'header',
    'footer',
    'headerl',
    'headerr',
    'headerf',
    'footerl',
    'footerr',
    'footerf',
    'listtable',
    'listoverridetable',
    'themedata',
    'colorschememapping',
    'datastore',
    'latentstyles',
  ]);

  let out = '';
  let depth = 0;
  let skipDepth = -1;
  let i = 0;

  while (i < rtf.length) {
    const ch = rtf[i];
    if (ch === '{') {
      depth++;
      if (skipDepth === -1 && rtf[i + 1] === '\\' && rtf[i + 2] === '*') {
        skipDepth = depth;
      }
      i++;
      continue;
    }
    if (ch === '}') {
      if (skipDepth === depth) {
        skipDepth = -1;
      }
      depth = Math.max(0, depth - 1);
      i++;
      continue;
    }
    if (skipDepth !== -1) {
      i++;
      continue;
    }
    if (ch === '\r' || ch === '\n') {
      i++;
      continue;
    }
    if (ch === '\\') {
      const next = rtf[i + 1];
      if (!next) break;
      if (next === '\\' || next === '{' || next === '}') {
        out += next;
        i += 2;
        continue;
      }
      if (next === '~') {
        out += ' ';
        i += 2;
        continue;
      }
      if (next === "'") {
        const hex = rtf.slice(i + 2, i + 4);
        if (/^[0-9a-fA-F]{2}$/.test(hex)) {
          out += String.fromCharCode(parseInt(hex, 16));
          i += 4;
          continue;
        }
      }
      const ctrlMatch = rtf.slice(i + 1).match(/^([a-zA-Z]+)(-?\d+)? ?/);
      if (ctrlMatch) {
        const word = ctrlMatch[1];
        const param = ctrlMatch[2];
        i += 1 + ctrlMatch[0].length;
        if (skipDestinations.has(word)) {
          skipDepth = depth;
          continue;
        }
        if (word === 'par' || word === 'line' || word === 'row') {
          out += '\n';
        } else if (word === 'tab' || word === 'cell') {
          out += ' ';
        } else if (word === 'u' && param) {
          const code = parseInt(param, 10);
          out += String.fromCharCode(code < 0 ? code + 65536 : code);
          // Skip fallback character after \uN if present
          if (rtf[i] === '?') i++;
        }
        continue;
      }
      i += 2;
      continue;
    }
    out += ch;
    i++;
  }

  return out
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function stripHtmlToText(html: string): string {
  const urls: string[] = [];
  for (const m of html.matchAll(/href\s*=\s*["'](https?:\/\/[^"']+)["']/gi)) {
    if (!urls.includes(m[1])) {
      urls.push(m[1]);
    }
  }

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(?:br|hr)\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|h[1-6]|section|article|header|footer)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const missingUrls = urls.filter((u) => !text.includes(u));
  return missingUrls.length > 0 ? `${text}\n\n${missingUrls.join('\n')}` : text;
}

const DOC_NOISE_PATTERN =
  /^(?:Root Entry|WordDocument|1Table|0Table|Data|SummaryInformation|DocumentSummaryInformation|CompObj|Normal(?:\.dotm?)?|Microsoft Word|MSWordDoc|bjbj|Calibri|Cambria|Arial|Times New Roman|Tahoma|Verdana|Symbol|Wingdings|Default Paragraph Font|Table Normal|Heading \d+)$/i;

export function extractLegacyDocText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];

  // Pass 1: ASCII / Latin-1 printable runs
  let ascii = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if ((b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9) {
      ascii += b === 13 ? '\n' : String.fromCharCode(b);
    } else {
      if (ascii.trim().length >= 4) {
        chunks.push(ascii.trim());
      }
      ascii = '';
    }
  }
  if (ascii.trim().length >= 4) {
    chunks.push(ascii.trim());
  }

  // Pass 2: UTF-16LE text runs (Word .doc Unicode text stream)
  let utf16 = '';
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const lo = bytes[i];
    const hi = bytes[i + 1];
    if (
      hi === 0 &&
      ((lo >= 32 && lo <= 126) || lo === 10 || lo === 13 || lo === 9)
    ) {
      utf16 += lo === 13 ? '\n' : String.fromCharCode(lo);
    } else {
      if (utf16.trim().length >= 4) {
        chunks.push(utf16.trim());
      }
      utf16 = '';
    }
  }
  if (utf16.trim().length >= 4) {
    chunks.push(utf16.trim());
  }

  const lines: string[] = [];
  const seen = new Set<string>();
  for (const chunk of chunks) {
    for (const rawLine of chunk.split('\n')) {
      const line = rawLine.replace(/\s+/g, ' ').trim();
      if (
        line.length >= 3 &&
        /[a-zA-Z]{2,}/.test(line) &&
        !DOC_NOISE_PATTERN.test(line) &&
        !/^Microsoft\s+Word/i.test(line) &&
        !seen.has(line)
      ) {
        seen.add(line);
        lines.push(line);
      }
    }
  }

  return lines.join('\n');
}

export function extractPdfFallbackText(bytes: Uint8Array): string {
  const raw = new TextDecoder('latin1').decode(bytes);
  const parts: string[] = [];
  for (const m of raw.matchAll(/\(([^()\\]{3,160})\)/g)) {
    const s = m[1].replace(/\s+/g, ' ').trim();
    if (/[a-zA-Z]{2,}/.test(s)) {
      parts.push(s);
    }
  }
  return parts.join(' ');
}
