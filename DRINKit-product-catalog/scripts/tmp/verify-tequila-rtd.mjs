#!/usr/bin/env node
/**
 * Subset license verification sweep: products with id starting tequila- or rtd-.
 * Outputs:
 *   data/verif-tequila-rtd.json  (per-product verdicts)
 *   data/raw-tequila-rtd.json    (raw audit trail)
 * Read-only network; does NOT touch image-sources.json.
 *
 * License policy: accept CC0 (incl 'Public domain'), CC BY 1.0/2.0/2.5/3.0/4.0,
 * CC BY-SA 1.0/2.5/3.0/4.0. Reject Non-free/Fair use/No license/unknown/other.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/../..';
const allProducts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/products.json'), 'utf8')).products;
const products = allProducts.filter((p) => p.id.startsWith('tequila-') || p.id.startsWith('rtd-'));

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'DRINKit-license-verifier/1.0 (local dev)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = new URL(API);
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429) {
        const ra = Number(res.headers.get('retry-after')) || 0;
        await sleep(Math.max(ra * 1000 + 1000, 5000 * 2 ** attempt));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text.trimStart().startsWith('{')) {
        const ra = Number(res.headers.get('retry-after')) || 0;
        await sleep(Math.max(ra * 1000 + 1000, 10000 * 2 ** attempt));
        continue;
      }
      return JSON.parse(text);
    } catch (e) {
      if (attempt === 5) return { error: String(e) };
      await sleep(2000 * 2 ** attempt);
    }
  }
  return { error: 'rate limited' };
}

const ACCEPT_RE = /^(cc0|public domain|cc by (1\.0|2\.0|2\.5|3\.0|4\.0)|cc by-sa (1\.0|2\.5|3\.0|4\.0))$/i;

function licenseVerdict(short) {
  const s = (short ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return { ok: false, reason: 'No license' };
  if (ACCEPT_RE.test(s)) return { ok: true, license: /^cc0|public domain/i.test(s) ? 'CC0' : s.toUpperCase().replace(/^CC /, 'CC ') };
  if (/non-free|fair use|fairuse/i.test(s)) return { ok: false, reason: `Non-free: ${s}` };
  return { ok: false, reason: `other license: ${s}` };
}

async function searchFiles(query, limit = 6) {
  const data = await api({ action: 'query', list: 'search', srsearch: query, srnamespace: 6, srlimit: limit });
  return (data?.query?.search ?? []).map((r) => r.title);
}

const strip = (h) => (h ?? '').replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

async function imageInfo(titles) {
  if (titles.length === 0) return [];
  const data = await api({ action: 'query', prop: 'imageinfo', titles: titles.slice(0, 20).join('|'), iiprop: 'url|size|extmetadata' });
  const pages = Object.values(data?.query?.pages ?? {});
  return pages
    .filter((p) => p.imageinfo?.length > 0)
    .map((p) => {
      const ii = p.imageinfo[0];
      const md = ii.extmetadata ?? {};
      return {
        title: p.title,
        url: ii.url,
        width: ii.width,
        height: ii.height,
        licenseShort: strip(md.LicenseShortName?.value),
        descriptionUrl: ii.descriptionurl,
        artist: strip(md.Artist?.value),
        credit: strip(md.Credit?.value),
      };
    });
}

function brandOf(name) {
  const stop = new Set(['&', 'and', 'the', 'of']);
  const tokens = name.split(/\s+/).filter((t) => !stop.has(t.toLowerCase()));
  return tokens.slice(0, 2).join(' ');
}

function relevance(product, title) {
  const tokens = [...new Set(product.name.toLowerCase().split(/[\s'’&]+/))].filter((t) => t.length > 3);
  const brandTokens = [...new Set(brandOf(product.name).toLowerCase().split(/[\s'’&]+/))].filter((t) => t.length > 3);
  const titleLc = title.toLowerCase();
  const brandHit = tokens.some((t) => brandTokens.includes(t) && titleLc.includes(t));
  const hit = tokens.find((t) => titleLc.includes(t));
  if (!hit) return null;
  return { hit, brandHit };
}

const results = [];
const raw = [];
let eligible = 0;

for (const product of products) {
  const brand = brandOf(product.name);
  const subTok = (product.subcategory ?? '').split(/\s+/)[0] ?? '';
  const queries = [
    product.name,
    brand ? `${brand} bottle` : null,
    brand ? `${brand} ${subTok}`.trim() : null,
  ].filter(Boolean);

  const seen = new Set();
  const candidates = [];
  for (const q of queries) {
    const titles = await searchFiles(q);
    await sleep(700);
    const fresh = titles.filter((t) => !seen.has(t));
    for (const t of titles) seen.add(t);
    if (fresh.length === 0) continue;
    const infos = await imageInfo(fresh);
    await sleep(700);
    for (const info of infos) {
      const isBitmap = /\.(jpe?g|png|webp|gif)$/i.test(info.title);
      const lv = licenseVerdict(info.licenseShort);
      const hit = isBitmap ? relevance(product, info.title) : null;
      const reasons = [];
      if (!isBitmap) reasons.push('not a bitmap image file');
      if (!lv.ok) reasons.push(lv.reason);
      if (!hit) reasons.push('title not matching product');
      if ((info.width ?? 0) < 400) reasons.push(`width ${info.width} < 400`);
      candidates.push({ query: q, ...info, ok: reasons.length === 0, brandHit: hit?.brandHit ?? false, licenseResolved: lv.license ?? null, rejectReasons: reasons });
    }
  }

  raw.push({ id: product.id, name: product.name, queries, candidateCount: candidates.length, candidates });

  const good = candidates.filter((c) => c.ok).sort((a, b) => (b.brandHit - a.brandHit) || (b.width * b.height - a.width * a.height));
  const chosen = good[0] ?? null;
  const status = chosen ? 'eligible' : candidates.length === 0 ? 'no-candidate' : 'needs-human';
  console.log(`${product.id} ${status} (candidates=${candidates.length})`);
  if (status === 'eligible') eligible++;

  results.push({
    id: product.id,
    name: product.name,
    status,
    chosen: chosen
      ? {
          title: chosen.title,
          url: chosen.url,
          descriptionUrl: chosen.descriptionUrl,
          license: chosen.licenseResolved,
          licenseTag: chosen.licenseShort,
          artist: chosen.artist,
          credit: chosen.credit,
          width: chosen.width,
          height: chosen.height,
          attribution: `${chosen.artist || chosen.credit || 'Wikimedia Commons contributor'} — via Wikimedia Commons, ${chosen.licenseResolved}`,
        }
      : { rejectReasons: candidates.slice(0, 5).map((c) => ({ title: c.title, license: c.licenseShort, reasons: c.rejectReasons })) },
    candidateCount: candidates.length,
  });
}

fs.writeFileSync(path.join(ROOT, 'data/verif-tequila-rtd.json'), JSON.stringify({
  generated_at: new Date().toISOString(),
  policy: 'CC0 (incl Public domain), CC BY 1.0/2.0/2.5/3.0/4.0, CC BY-SA 1.0/2.5/3.0/4.0; others rejected',
  counts: {
    total: results.length,
    eligible,
    needs_human: results.filter((r) => r.status === 'needs-human').length,
    no_candidate: results.filter((r) => r.status === 'no-candidate').length,
  },
  products: results,
}, null, 2));

fs.writeFileSync(path.join(ROOT, 'data/raw-tequila-rtd.json'), JSON.stringify(raw, null, 2));

console.log(`DONE eligible=${eligible}/${products.length} needs_human=${results.filter((r) => r.status === 'needs-human').length} no_candidate=${results.filter((r) => r.status === 'no-candidate').length}`);
