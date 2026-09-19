#!/usr/bin/env node
// Downloads VERIFIED rows from image-sources.json into images/<category>/<slug>.<ext>
// Only downloads rows with verified:true and a source_url (licensing gate still applies).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/image-sources.json'), 'utf8'));
const UA = 'DRINKit asset downloader/1.0 (catalog images; contact: local dev use only)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const extOf = (p) => {
  try {
    const clean = new URL(p).pathname;
    return path.extname(clean) || '.jpg';
  } catch { return '.jpg'; }
};

const slugify = (filePage) => {
  const t = filePage.replace('https://commons.wikimedia.org/wiki/', '').replace(/^File:/i, '').replace(/\.[a-z]+$/i, '');
  return t.replace(/[^\w-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '').toLowerCase();
};

let ok = 0, fail = 0, skipped = 0;
const failures = [];
for (const row of manifest.products) {
  if (!row.verified || !row.source_url) continue;
  const cat = String(row.id).split('-')[0];
  const base = slugify(row.file_page ?? row.image_filename.replace(/^file:/i, ''));
  const ext = extOf(row.source_url) || '.jpg';
  const fname = `${base}${ext}`;
  const dir = path.join(ROOT, 'images', cat);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, fname);
  // resume: skip existing files
  if (fs.existsSync(dest) && fs.statSync(dest).size > 3000) {
    row.local_file = `images/${cat}/${fname}`;
    ok++;
    continue;
  }
  // thumbnail endpoint: 640px wide, small + fast; falls back to direct source
  let title = String(row.file_page ?? '').replace('https://commons.wikimedia.org/wiki/', '') || `File:${row.image_filename}`;
  title = title.replace(/^File:/i, '').split('?')[0];
  let decoded = title;
  try { decoded = decodeURIComponent(title); } catch {}
  const thumb = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(decoded) + '?width=640';
  const urls = [thumb];
  if (/\.(tiff?|pdf)$/i.test(ext)) urls.push(row.source_url);
  else urls.push('https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(decoded));
  try {
    let done = false;
    for (const url of urls) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
          if (res.status === 429) { await sleep(2000 * (attempt + 1)); continue; }
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length < 3000) throw new Error(`file too small (${buf.length}b)`);
          fs.writeFileSync(dest, buf);
          row.local_file = `images/${cat}/${fname}`;
          ok++;
          done = true;
          break;
        } catch (e) {
          if (attempt === 2) throw e;
          await sleep(1200 * (attempt + 1));
        }
      }
      if (done) break;
    }
    if (!done) throw new Error('all attempts failed');
  } catch (e) {
    fail++;
    failures.push({ id: row.id, error: String(e) });
  }
  await sleep(120);
}
fs.writeFileSync(path.join(ROOT, 'data/image-sources.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(ROOT, 'data/download-report.json'), JSON.stringify({ ok, fail, failures }, null, 2));
console.log(`DOWNLOADED ok=${ok} fail=${fail}`);
for (const f of failures.slice(0, 10)) console.log('FAIL', f.id, f.error);
