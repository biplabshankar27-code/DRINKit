#!/usr/bin/env node
/**
 * Whisky/Rum subset — Commons license verification sweep (read-only network).
 * Subset: products whose id starts with 'whisky-' or 'rum-' (30 of 120).
 * Writes:
 *   data/verif-whisky-rum.json  (per-product verdicts)
 *   data/raw-whisky-rum.json    (audit trail of all candidates)
 * Does NOT touch image-sources.json or the combined report.
 *
 * License policy (task-approved):
 *   accept: CC0 (incl. 'Public domain'), CC BY 1.0/2.0/2.5/3.0/4.0, CC BY-SA 1.0/2.5/3.0/4.0
 *   reject: Non-free / Fair use / No license / unknown / other (incl. GFDL-only)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/../..';
const allProducts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/products.json'), 'utf8')).products;
const products = allProducts.filter((p) => p.id.startsWith('whisky-') || p.id.startsWith('rum-'));

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'DRINKit-license-verifier/1.0 (local dev)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = new URL(API);
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429) {
        await sleep(30000 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === 3) return { error: String(e) };
        await sleep(2000);
      await sleep(600 * (attempt + 1));
    }
  }
}

// ---- license rules ----
const ACCEPT_VERSIONS = '1\\.0|2\\.5|3\\.0|4\\.0|2\\.0';
function resolveLicense(short) {
  if (!short) return null;
  const s = short.trim();
  if (/^(cc0|creative commons cc0|public domain)/i.test(s)) return 'CC0';
  const m = s.match(new RegExp(`^CC (BY|BY-SA) (${ACCEPT_VERSIONS})$`, 'i'));
  if (m) return `CC ${m[1].toUpperCase()} ${m[2]}`;
  return null;
}

const stripHtml = (h) =>
  (h ?? '').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;|&#\d+;/gi, ' ').replace(/\s+/g, ' ').trim();

// ---- Commons helpers ----
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
        url: ii.url.split('?')[0],
        thumb: (ii.thumburl ?? ii.url).split('?')[0],
        width: ii.width,
        height: ii.height,
        licenseTag: stripHtml(md.LicenseShortName?.value),
        descriptionUrl: (ii.descriptionurl ?? '').split('?')[0],
        artist: stripHtml(md.Artist?.value),
        credit: stripHtml(md.Credit?.value),
      };
    });
}

// ---- brand extraction ----
const BRAND_OVERRIDES = {
  "Royal Stag Deluxe": 'Royal Stag',
  'Blenders Pride': "Blender's Pride",
  'Old Monk XXX': 'Old Monk',
  'Bacardi Carta Blanca': 'Bacardi',
  'Bacardi Black': 'Bacardi',
  'Bacardi Gold': 'Bacardi',
  'Bacardi Añejo Cuatro': 'Bacardi',
  'Captain Morgan Dark Rum': 'Captain Morgan',
  'Havana Club 3 Años': 'Havana Club',
  'Mount Gay Eclipse': 'Mount Gay',
  'Flor de Caña 7': 'Flor de Caña',
  'The Glenlivet 15': 'Glenlivet',
  'The Glenlivet 18': 'Glenlivet',
};

function brandOf(name) {
  if (BRAND_OVERRIDES[name]) return BRAND_OVERRIDES[name];
  const stop = new Set(['&', 'and', 'the', 'of', 'de', 'del']);
  const tokens = name
    .split(/\s+/)
    .filter((t) => !stop.has(t.toLowerCase()) && !/^\d+$/.test(t));
  return tokens.slice(0, 2).join(' ');
}

// ---- relevance gate ----
function titleHit(info, product) {
  const titleLc = info.title.toLowerCase();
  const tokens = [...new Set(product.name.toLowerCase().split(/[\s'’,.&-]+/))].filter((t) => t.length > 3);
  return tokens.some((t) => titleLc.includes(t));
}

function verdictFor(info, product) {
      const licenseResolved = resolveLicense(info.licenseTag);
      if (!licenseResolved) return { ok: false, reason: `license: ${info.licenseTag || 'unknown'}` };
      const BLOCKLIST = ['geograph', 'pub', 'inn', 'hotel', 'restaurant', 'road,', 'party', 'statue', 'fashion', 'desai', 'event'];
      const tl = info.title.toLowerCase();
      if (BLOCKLIST.some((b) => tl.includes(b))) return { ok: false, reason: 'non-product match (place/event/person image)' };
      const BEVERAGE = /whisky|whiskey|scotch|bourbon|single.?malt|blend|\brum\b|bottle|distiller|añejo|anejo/i;
      if (!BEVERAGE.test(info.title)) return { ok: false, reason: 'title lacks beverage context' };
      if (!titleHit(info, product)) return { ok: false, reason: 'title not matching product' };
  if ((info.width ?? 0) < 400) return { ok: false, reason: `width ${info.width} < 400` };
  return { ok: true, licenseResolved };
}

// ---- main sweep ----
const results = [];
const raw = [];

const CKPT = path.join(ROOT, 'data/tmp-whisky-rum-ckpt.json');
let ckpt = {};
if (fs.existsSync(CKPT)) {
  ckpt = JSON.parse(fs.readFileSync(CKPT, 'utf8'));
  results.push(...ckpt.results);
  raw.push(...ckpt.raw);
  console.log(`resuming: ${results.length} already done`);
}

for (const product of products) {
  if (results.some((r) => r.id === product.id)) continue;
  const brand = brandOf(product.name);
  const firstSub = (product.subcategory ?? '').split(' ')[0] ?? '';
  const queries = [product.name, `${brand} bottle`, `${brand} ${firstSub}`.trim()];

  const seenTitles = new Set();
  const candidates = [];
  for (const q of queries) {
    const titles = await searchFiles(q);
    await sleep(2500);
    if (titles.length === 0) continue;
    const fresh = titles.filter((t) => !seenTitles.has(t));
    const infos = await imageInfo(fresh);
    for (const t of titles) seenTitles.add(t);
    await sleep(2500);
    for (const info of infos) {
      const v = verdictFor(info, product);
      candidates.push({ query: q, ...info, ok: v.ok, licenseResolved: v.licenseResolved, rejectReason: v.reason });
    }
  }

  const good = candidates
    .filter((c) => c.ok)
    .sort((a, b) => b.width * b.height - a.width * a.height);
  const chosen = good[0] ?? null;
  const status = chosen ? 'eligible' : candidates.length === 0 ? 'no-candidate' : 'needs-human';

  raw.push({
    id: product.id,
    name: product.name,
    queries,
    candidates: candidates.map((c) => ({
      query: c.query,
      title: c.title,
      licenseTag: c.licenseTag,
      licenseResolved: c.licenseResolved,
      width: c.width,
      height: c.height,
      ok: c.ok,
      rejectReason: c.rejectReason,
    })),
  });

  results.push({
    id: product.id,
    name: product.name,
    status,
    chosen: chosen
      ? {
          title: chosen.title,
          url: chosen.thumb,
          thumb: chosen.thumb,
          fileUrl: chosen.url,
          descriptionUrl: chosen.descriptionUrl,
          licenseResolved: chosen.licenseResolved,
          licenseTag: chosen.licenseTag,
          artist: chosen.artist,
          credit: chosen.credit,
          width: chosen.width,
          height: chosen.height,
          attribution: `${chosen.artist || chosen.credit || 'Wikimedia Commons contributor'} — via Wikimedia Commons, ${chosen.licenseResolved}`,
        }
      : {
          rejectReasons: candidates
            .slice(0, 5)
            .map((c) => ({ title: c.title, reason: c.rejectReason, license: c.licenseTag })),
        },
    candidateCount: candidates.length,
  });

  console.log(`${product.id} ${product.name} -> ${status} (${candidates.length} candidates)`);
  fs.writeFileSync(CKPT, JSON.stringify({ results: [...results], raw: [...raw] }, null, 2));
}

fs.writeFileSync(path.join(ROOT, 'data/verif-whisky-rum.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  subset: 'whisky-*, rum-*',
  policy: 'accept CC0/Public domain, CC BY 1.0/2.0/2.5/3.0/4.0, CC BY-SA 1.0/2.5/3.0/4.0; reject Non-free/Fair use/No license/unknown/other',
  counts: {
    eligible: results.filter((r) => r.status === 'eligible').length,
    needsHuman: results.filter((r) => r.status === 'needs-human').length,
    noCandidate: results.filter((r) => r.status === 'no-candidate').length,
    total: results.length,
  },
  products: results,
}, null, 2));

fs.writeFileSync(path.join(ROOT, 'data/raw-whisky-rum.json'), JSON.stringify(raw, null, 2));

console.log(`DONE eligible=${results.filter((r) => r.status === 'eligible').length} needs_human=${results.filter((r) => r.status === 'needs-human').length} no_candidate=${results.filter((r) => r.status === 'no-candidate').length} / ${results.length}`);
