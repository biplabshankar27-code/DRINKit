#!/usr/bin/env node
/**
 * Scoped license verification sweep — beer-* and wine-* products only.
 * Read-only network; writes:
 *   data/verif-beer-wine.json  (verdicts)
 *   data/raw-beer-wine.json    (audit trail of all candidates)
 * Does NOT touch image-sources.json or any combined report.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/../..';
const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/products.json'), 'utf8')).products
  .filter((p) => p.id.startsWith('beer-') || p.id.startsWith('wine-'));

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'DRINKit-license-verifier/1.0 (local dev use)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = new URL(API);
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429) {
        const ra = parseInt(res.headers.get('retry-after') ?? '', 10);
        await sleep(isFinite(ra) ? ra * 1000 : 8000 + 4000 * attempt);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === 7) return { error: String(e) };
      // 429 body isn't JSON; treat parse errors like res.json() failures too
      if (!/Unexpected token|HTTP/.test(String(e))) { if (attempt === 7) return { error: String(e) }; }
      await sleep(4000 + 3000 * attempt);
    }
  }
}

const strip = (h) => (h ?? '').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();

function normalizeLicense(short) {
  if (!short) return null;
  const s = short.trim();
  const low = s.toLowerCase();
  if (/non-free|fair use|fairuse|no license|unknown/.test(low)) return null;
  if (/^(cc0|creative commons cc0|public domain)/i.test(s)) return 'CC0';
  const m = s.match(/^cc (by|by-sa) (1\.0|2\.0|2\.5|3\.0|4\.0)$/i);
  if (m) return `CC ${m[1].toUpperCase()} ${m[2]}`;
  const m2 = s.match(/^creative commons (cc )?(by|by-sa) (1\.0|2\.0|2\.5|3\.0|4\.0)$/i);
  if (m2) return `CC ${m2[2].toUpperCase()} ${m2[3]}`;
  return null;
}

async function searchFiles(query, limit = 6) {
  const data = await api({
    action: 'query',
    list: 'search',
    srsearch: query,
    srnamespace: 6,
    srlimit: limit,
  });
  return (data?.query?.search ?? []).map((r) => r.title);
}

async function imageInfo(titles) {
  if (titles.length === 0) return [];
  const data = await api({
    action: 'query',
    prop: 'imageinfo',
    titles: titles.slice(0, 20).join('|'),
    iiprop: 'url|size|extmetadata',
    iiurlwidth: 640,
  });
  const pages = Object.values(data?.query?.pages ?? {});
  return pages
    .filter((p) => p.imageinfo?.length > 0)
    .map((p) => {
      const ii = p.imageinfo[0];
      const md = ii.extmetadata ?? {};
      return {
        title: p.title,
        url: ii.url,
        thumb: ii.thumburl ?? ii.url,
        width: ii.width,
        height: ii.height,
        licenseShort: strip(md.LicenseShortName?.value),
        licenseUrl: strip(md.LicenseUrl?.value),
        descriptionUrl: ii.descriptionurl,
        artist: strip(md.Artist?.value),
        credit: strip(md.Credit?.value),
      };
    });
}

const brandOf = (name) => {
  const cleaned = name.replace(/[?]/g, '');
  const tokens = cleaned.split(' ');
  const stop = new Set(['&', 'and', 'the', 'of', 'de', 'del']);
  const firstMeaningful = tokens.slice(0, 2).filter((t) => !stop.has(t.toLowerCase()));
  return firstMeaningful.join(' ');
};

function verdictFor(info, product) {
  const license = normalizeLicense(info.licenseShort);
  if (!license) return { ok: false, reason: `license: ${info.licenseShort || 'unknown'}` };
  const nameLc = product.name.toLowerCase();
  const titleLc = info.title.toLowerCase();
  const tokens = [...new Set(nameLc.split(/[\s'’&]+/))].filter((t) => t.length > 3);
  const hit = tokens.some((t) => titleLc.includes(t));
  if (!hit) return { ok: false, reason: 'title not matching product' };
  return { ok: true, license };
}

const CKPT_RESULTS = path.join(ROOT, 'scripts/tmp/ckpt-verif-beer-wine.json');
const CKPT_TRAIL = path.join(ROOT, 'scripts/tmp/ckpt-raw-beer-wine.json');
const results = fs.existsSync(CKPT_RESULTS) ? JSON.parse(fs.readFileSync(CKPT_RESULTS, 'utf8')) : [];
const rawTrail = fs.existsSync(CKPT_TRAIL) ? JSON.parse(fs.readFileSync(CKPT_TRAIL, 'utf8')) : [];
const doneIds = new Set(results.map((r) => r.id));
let eligible = results.filter((r) => r.status === 'eligible').length;

function checkpoint() {
  fs.writeFileSync(CKPT_RESULTS, JSON.stringify(results, null, 2));
  fs.writeFileSync(CKPT_TRAIL, JSON.stringify(rawTrail, null, 2));
}

for (const product of products) {
  if (doneIds.has(product.id)) continue;
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${product.id} …`);
  const brand = brandOf(product.name);
  const queries = [
    product.name,
    `${brand} bottle`,
    `${brand} ${product.subcategory.split(' ')[0] ?? ''}`.trim(),
  ];
  const seen = new Set();
  const candidates = [];
  const allTitles = [];
  for (const q of queries) {
    const titles = await searchFiles(q, 8);
    await sleep(1000);
    for (const t of titles) {
      if (!seen.has(t)) {
        seen.add(t);
        allTitles.push(t);
      }
      rawTrail.push({ id: product.id, name: product.name, query: q, title: t });
    }
  }
  // de-dup trail entries by id+title+query
  const productTrail = [];
  for (const t of rawTrail) if (t.id !== product.id) productTrail.push(t);
  const tSeen = new Set();
  for (const r of rawTrail) {
    if (r.id !== product.id) continue;
    const k = `${r.title}|${r.query}`;
    if (tSeen.has(k)) continue;
    tSeen.add(k);
    productTrail.push(r);
  }
  rawTrail.length = 0;
  rawTrail.push(...productTrail);
  const infos = allTitles.length === 0 ? [] : await imageInfo(allTitles);
  await sleep(1000);
  for (const info of infos) {
    const v = verdictFor(info, product);
    candidates.push({ query: 'batch', ...info, ok: v.ok, licenseResolved: v.license, rejectReason: v.reason });
    rawTrail.push({ id: product.id, name: product.name, query: 'batch', ...info, ok: v.ok, licenseResolved: v.license, rejectReason: v.reason });
  }
  const good = candidates
    .filter((c) => c.ok && (c.width ?? 0) >= 400)
    .sort((a, b) => (b.width * b.height) - (a.width * a.height));
  const chosen = good[0] ?? null;
  const status = chosen ? 'eligible' : candidates.length === 0 ? 'no-candidate' : 'needs-human';
  if (status === 'eligible') eligible++;

  results.push({
    id: product.id,
    name: product.name,
    status,
    chosen: chosen
      ? {
          title: chosen.title,
          url: chosen.thumb ?? chosen.url,
          thumb: chosen.thumb,
          fileUrl: chosen.url,
          descriptionUrl: chosen.descriptionUrl,
          licenseResolved: chosen.licenseResolved,
          licenseTag: chosen.licenseShort,
          artist: chosen.artist,
          credit: chosen.credit,
          width: chosen.width,
          height: chosen.height,
          attribution: `${chosen.artist || chosen.credit || 'Wikimedia Commons contributor'} — via Wikimedia Commons, ${chosen.licenseResolved}`,
        }
      : { rejectReasons: candidates.slice(0, 3).map((c) => ({ title: c.title, reason: c.rejectReason, license: c.licenseShort })) },
    candidateCount: candidates.length,
  });
  checkpoint();
  console.log(`  -> ${status}${status === 'eligible' ? ` ${chosen.licenseResolved}` : ''}`);
  await sleep(1000);
}

fs.writeFileSync(path.join(ROOT, 'data/verif-beer-wine.json'), JSON.stringify(results, null, 2));
fs.writeFileSync(path.join(ROOT, 'data/raw-beer-wine.json'), JSON.stringify(rawTrail, null, 2));

const counts = {
  eligible: results.filter((r) => r.status === 'eligible').length,
  'needs-human': results.filter((r) => r.status === 'needs-human').length,
  'no-candidate': results.filter((r) => r.status === 'no-candidate').length,
};
console.log(`DONE ${products.length} products`, JSON.stringify(counts));
for (const r of results.filter((x) => x.status === 'eligible').slice(0, 3)) {
  console.log(`EXAMPLE ${r.id} | ${r.chosen.licenseResolved} | ${r.chosen.title}`);
}
