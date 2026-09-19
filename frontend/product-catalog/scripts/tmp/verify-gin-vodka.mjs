#!/usr/bin/env node
// tmp verification sweep — gin-/vodka- products only (read-only network; writes verif + raw JSON)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/../..';
const all = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/products.json'), 'utf8')).products;
const products = all.filter((p) => p.id.startsWith('gin-') || p.id.startsWith('vodka-'));

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
        const ra = parseInt(res.headers.get('retry-after'), 10);
        await sleep((Number.isFinite(ra) && ra > 0 ? ra : 10) * 1000 + 500);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === 5) return { error: String(e) };
      await sleep(1000 * 2 ** attempt);
    }
  }
}

function normalizeLicense(short) {
  if (!short) return null;
  const s = String(short).trim();
  if (/^(CC0|Creative Commons 0|Public domain)/i.test(s)) return 'CC0';
  const m = s.match(/^CC (BY(?:-SA)?) (1\.0|2\.0|2\.5|3\.0|4\.0)$/i);
  if (m) return `CC ${m[1].toUpperCase()} ${m[2]}`;
  const w = s.match(/^(Creative Commons|CC)[\s:]+(BY[- ]?SA|BY[- ]?BY)[\s-]*(1\.0|2\.0|2\.5|3\.0|4\.0)/i);
  if (w) {
    const act = /SA/i.test(w[2]) ? 'CC BY-SA' : 'CC BY';
    return `${act} ${w[3]}`;
  }
  const pd = /public domain|no rights reserved|cc0/i.test(s) ? 'CC0' : null;
  return pd;
}

async function searchFiles(query, limit = 6) {
  const data = await api({ action: 'query', list: 'search', srsearch: query, srnamespace: 6, srlimit: limit });
  return (data?.query?.search ?? []).map((r) => r.title);
}

const strip = (h) => (h ?? '').replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

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
  const tokens = name.split(' ');
  const stop = new Set(['&', 'and', 'the', 'of', 'de', 'del']);
  const meaningful = tokens.filter((t) => !stop.has(t.toLowerCase()));
  return meaningful.slice(0, 2).join(' ');
};

function verdictFor(info, product) {
  const license = normalizeLicense(info.licenseShort);
  if (!license) {
    const raw = info.licenseShort || 'unknown';
    const reason = /non-free|fair use|no license|unknown/i.test(raw)
      ? `license rejected: ${raw}`
      : `unsupported license: ${raw}`;
    return { ok: false, reason, license: null };
  }
  const nameLc = product.name.toLowerCase();
  const titleLc = info.title.toLowerCase();
  const tokens = [...new Set(nameLc.split(/[\s'â€™&]+/))].filter((t) => t.length > 3);
  if (!tokens.some((t) => titleLc.includes(t))) return { ok: false, reason: 'title not matching product', license };
  if ((info.width ?? 0) < 400) return { ok: false, reason: `width ${info.width} < 400`, license };
  return { ok: true, license };
}

const results = [];
const raw = { generated_at: new Date().toISOString(), ua: UA, products: [] };

// resume support
const RAW_OUT = path.join(ROOT, 'data/raw-gin-vodka.json');
const done = new Map();
if (fs.existsSync(RAW_OUT)) {
  try {
    for (const p of JSON.parse(fs.readFileSync(RAW_OUT, 'utf8')).products) done.set(p.id, p);
  } catch {}
}

function buildResult(product, candidates) {
  const score = (c) => {
    const t = c.title.toLowerCase();
    const ctx = /vodka|gin/.test(t) ? 1 : 0;
    const brandTokens = product.name.toLowerCase().split(/[\s'’&]+/).filter((tok) => tok.length > 3);
    const hits = brandTokens.filter((tok) => t.includes(tok)).length;
    return ctx * 1e12 + hits * 1e9 + c.width * c.height;
  };
  const good = candidates
    .filter((c) => c.ok)
    .sort((a, b) => score(b) - score(a));
  const chosen = good[0] ?? null;
  const status = chosen ? 'eligible' : candidates.length === 0 ? 'no-candidate' : 'needs-human';
  return {
    id: product.id,
    name: product.name,
    status,
    chosen: chosen
      ? {
          title: chosen.title,
          url: chosen.url,
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
      : { rejectReasons: candidates.slice(0, 5).map((c) => ({ title: c.title, reason: c.rejectReason, license: c.licenseShort })) },
    candidateCount: candidates.length,
  };
}

for (const product of products) {
  if (done.has(product.id)) {
    const prev = done.get(product.id);
    raw.products.push(prev);
    results.push(buildResult(product, prev.candidates));
    console.log(`[${results.length}/${products.length}] ${product.id} (cached) ${results.at(-1).status}`);
    continue;
  }
  const brand = brandOf(product.name);
  const subFirst = (product.subcategory || '').split(' ')[0];
  const queries = [
    product.name,
    `${brand} bottle`,
    `${brand} ${subFirst}`.trim(),
  ].filter((q, i, a) => q && a.indexOf(q) === i);

  const seen = new Set();
  const candidates = [];
  for (const q of queries) {
    const titles = await searchFiles(q, 6);
    await sleep(120);
    if (titles.length === 0) continue;
    const infos = await imageInfo(titles.filter((t) => !seen.has(t)));
    for (const t of titles) seen.add(t);
    await sleep(120);
    for (const info of infos) {
      if (!seen.has(info.title)) seen.add(info.title);
      const v = verdictFor(info, product);
      candidates.push({ query: q, ...info, ok: v.ok, licenseResolved: v.license, rejectReason: v.reason });
    }
  }


  raw.products.push({ id: product.id, name: product.name, queries, candidates: candidates.map(({ ok, licenseResolved, rejectReason, ...c }) => ({ ...c, ok, licenseResolved, rejectReason })) });
  fs.writeFileSync(RAW_OUT, JSON.stringify(raw, null, 2));
  results.push(buildResult(product, candidates));
  console.log(`[${results.length}/${products.length}] ${product.id} ${results.at(-1).status}`);
}

const counts = {
  eligible: results.filter((r) => r.status === 'eligible').length,
  needsHuman: results.filter((r) => r.status === 'needs-human').length,
  noCandidate: results.filter((r) => r.status === 'no-candidate').length,
};

fs.writeFileSync(path.join(ROOT, 'data/verif-gin-vodka.json'), JSON.stringify({ generated_at: new Date().toISOString(), counts, products: results }, null, 2));
fs.writeFileSync(path.join(ROOT, 'data/raw-gin-vodka.json'), JSON.stringify(raw, null, 2));
console.log(JSON.stringify(counts));
