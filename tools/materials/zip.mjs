// Minimal zip reader (Node only): list the entries and inflate one. Used to read a deck's first slide title or a document's first paragraph.
// It never extracts to disk and refuses entries that claim to inflate to more than `limit` bytes (zip-bomb guard).
import { inflateRawSync } from 'node:zlib';

/** Entries of a zip as { name, method, csize, usize, offset }, read from the central directory. */
export function listZip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--)
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  if (eocd < 0) return [];
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = [];
  for (let n = 0; n < count && p + 46 <= buf.length && buf.readUInt32LE(p) === 0x02014b50; n++) {
    const nameLen = buf.readUInt16LE(p + 28),
      extraLen = buf.readUInt16LE(p + 30),
      commentLen = buf.readUInt16LE(p + 32);
    out.push({
      name: buf.toString('utf8', p + 46, p + 46 + nameLen),
      method: buf.readUInt16LE(p + 10),
      csize: buf.readUInt32LE(p + 20),
      usize: buf.readUInt32LE(p + 24),
      offset: buf.readUInt32LE(p + 42),
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

/** The text of one entry, or null when it is missing, too large, or uses an unsupported method. */
export function readZipText(buf, name, limit = 5 * 1024 * 1024) {
  const e = listZip(buf).find(x => x.name === name);
  if (!e || e.usize > limit) return null;
  const o = e.offset;
  if (buf.readUInt32LE(o) !== 0x04034b50) return null;
  const start = o + 30 + buf.readUInt16LE(o + 26) + buf.readUInt16LE(o + 28);
  const raw = buf.subarray(start, start + e.csize);
  try {
    if (e.method === 0) return raw.toString('utf8');
    if (e.method === 8) return inflateRawSync(raw, { maxOutputLength: limit }).toString('utf8');
  } catch {
    /* corrupt entry: no text */
  }
  return null;
}

const unxml = s =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
/** Text runs (<a:t> in slides, <w:t> in documents) joined by spaces. */
export const textRuns = (xml, tag) =>
  [...xml.matchAll(new RegExp(`<${tag}(?: [^>]*)?>([^<]*)</${tag}>`, 'g'))]
    .map(m => unxml(m[1]))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
