// Fetch a publicly shared Google Drive / Docs file. No account, key or token is used: if the file is not shared with
// "Anyone with the link", Google answers with a sign-in page and we say so. The fetch function is injectable for tests.
import { parseDriveUrl, MAX_MATERIAL_BYTES } from '../../packages/curriculum/src/materials.ts';

const filenameFrom = disp => {
  if (!disp) return '';
  const star = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/.exec(disp);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim());
    } catch {
      /* fall through */
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/.exec(disp);
  return plain ? plain[1].trim() : '';
};

async function readCapped(res, max) {
  const len = Number(res.headers.get('content-length') ?? 0);
  if (len > max) throw new Error(`The file is ${(len / 1048576).toFixed(1)} MB; the limit is ${max / 1048576} MB.`);
  const chunks = [];
  let total = 0;
  for await (const c of res.body) {
    total += c.length;
    if (total > max) throw new Error(`The file is larger than the ${max / 1048576} MB limit.`);
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}

/** Returns { name, bytes }. Throws an Error whose message is a sentence for the teacher. */
export async function fetchDrive(link, { fetchFn = fetch, maxBytes = MAX_MATERIAL_BYTES } = {}) {
  const d = parseDriveUrl(link);
  if (!d.ok) throw new Error(d.reason);
  const get = async url => {
    let res;
    try {
      res = await fetchFn(url, { redirect: 'follow', headers: { 'user-agent': 'accounting-universe-materials/1' } });
    } catch (e) {
      throw new Error(`Could not reach Google Drive (${e.cause?.code ?? e.message}). Check the internet connection, or upload the file instead.`, { cause: e });
    }
    if (!res.ok)
      throw new Error(
        res.status === 404
          ? 'Google Drive says the file does not exist (404). Check the link.'
          : res.status === 403 || res.status === 401
            ? 'Google Drive refused access. Set sharing to “Anyone with the link” and try again.'
            : `Google Drive answered ${res.status}.`,
      );
    return res;
  };
  let res = await get(d.url);
  let bytes = await readCapped(res, maxBytes);
  // Large files first return a "cannot scan for viruses" page with a confirm form: follow it once.
  const head = bytes.subarray(0, 2048).toString('utf8').toLowerCase();
  if ((res.headers.get('content-type') ?? '').includes('text/html') && head.includes('download anyway')) {
    const html = bytes.toString('utf8');
    const action = /action="([^"]+)"/.exec(html)?.[1]?.replace(/&amp;/g, '&');
    const fields = Object.fromEntries([...html.matchAll(/<input[^>]+type="hidden"[^>]+name="([^"]+)"[^>]+value="([^"]*)"/g)].map(m => [m[1], m[2]]));
    if (action && /^https:\/\/[a-z0-9.-]*google(usercontent)?\.com\//.test(action)) {
      res = await get(`${action}?${new URLSearchParams(fields)}`);
      bytes = await readCapped(res, maxBytes);
    }
  }
  const fromHeader = filenameFrom(res.headers.get('content-disposition'));
  const name = fromHeader || `drive-${d.id.slice(0, 8)}${d.ext ? '.' + d.ext : ''}`;
  return { name: d.ext && !/\.[A-Za-z0-9]{1,5}$/.test(name) ? `${name}.${d.ext}` : name, bytes: new Uint8Array(bytes) };
}
