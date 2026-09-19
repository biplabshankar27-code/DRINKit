#!/usr/bin/env node
/**
 * Phase 1 — Commons license verification sweep (read-only network).
 * Produces:
 *   data/verification-report.md   (per-product verdicts, human reviewable)
 *   data/image-sources.json       (eligible rows filled + verified:true)
 *   data/commons-raw.json         (audit trail of all candidates considered)
 *
 * License policy (user-approved):
 *   accept: CC0, CC BY 1.0-4.0, CC BY-SA 1.0-4.0
 *   reject: Non-free / Fair use / No license / anything else
 * Ambiguous rows -> needs-human (LLM arbitration happens only there).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/products.json'), 'utf8')).products;
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/image-sources.json'), 'utf8'));
const manifestIndex = new Map(manifest.products.map((p) => [p.id, p]));

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'DRINKit-license-verifier/1.0 (development catalog; contact: local use only)';
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
        await sleep(1500 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === 3) return { error: String(e) };
      await sleep(600 * (attempt + 1));
    }
  }
}

const ACCEPT = /^(cc0|creative commons cc0|cc by(?:-sa)? ([1-4])\.0|cc by(?:-sa)?-nc.*)$/i;

function normalizeLicense(short) {
  if (!short) return null;
  const s = short.trim();
  const m = s.match(/^(CC|Creative Commons)\s*(0|BY-SA 4\.0|BY-SA 3\.0|BY-SA 2\.5|BY-SA 2\.0|BY-SA 1\.0|BY 4\.0|BY 3\.0|BY 2\.5|BY 2\.0|BY 1\.0)/i);
  if (m) {
    const hasZero = /(^| )0( |$)/.test(s) || s.toLowerCase().includes('cc0');
    if (hasZero) return 'CC0';
    return s.replace(/^(Creative Commons|CC)\s*/i, '').replace(/\s+/g, ' ').trim();
  }
  if (/^(CC0|Public domain(?: |$))/i.test(s)) return 'CC0';
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
      const strip = (h) => (h ?? '').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
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
  const brandMap = {
    'King Fisher': 'Kingfisher',
    'Kings Go': 'Kingfisher',
    "Miller's Beer": 'Miller',
    "Armando's": 'Armando',
    "Rose Wine?": '',
  };
  const cleaned = name.replace(/[?]/g, '');
  if (brandMap[cleaned]) return brandMap[cleaned];
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
  // crude relevance: require at least one of brand/name tokens (len>3) in title
  const tokens = [...new Set(nameLc.split(/[\s'’&]+/))].filter((t) => t.length > 3);
  const hit = tokens.some((t) => titleLc.includes(t));
  if (!hit) return { ok: false, reason: 'title not matching product' };
  return { ok: true, license };
}

const results = [];
let eligible = 0;

for (const product of products) {
  const brand = brandOf(product.name);
  const queries = [
    product.name,
    `${brand} bottle`,
    `${brand} ${product.subcategory.split(' ')[0] ?? ''}`.trim(),
  ];
  const seen = new Set();
  const candidates = [];
  for (const q of queries) {
    const titles = await searchFiles(q);
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
          fileUrl: chosen.url,
          descriptionUrl: chosen.descriptionUrl,
          license: chosen.licenseResolved,
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
}

// ---- write image-sources.json (only eligible rows become verified) ----
manifest.products = manifest.products.map((row) => {
  const r = results.find((x) => x.id === row.id);
  if (r?.status === 'eligible') {
    return {
      ...row,
      source_url: r.chosen.url,
      license: `${r.chosen.license} (${r.chosen.licenseTag})`,
      attribution: r.chosen.attribution,
      verified: true,
      file_page: r.chosen.descriptionUrl,
    };
  }
  return row;
});
manifest.verification = {
  reviewed_at: new Date().toISOString(),
  eligible: results.filter((r) => r.status === 'eligible').length,
  needs_human: results.filter((r) => r.status === 'needs-human').length,
  no_candidate: results.filter((r) => r.status === 'no-candidate').length,
  policy: 'CC0 / CC BY / CC BY-SA accepted with attribution; Non-free rejected.',
};

fs.writeFileSync(path.join(ROOT, 'data/commons-raw.json'), JSON.stringify(results, null, 2));
fs.writeFileSync(path.join(ROOT, 'data/image-sources.json'), JSON.stringify(manifest, null, 2));

// ---- human-readable report ----
const cat = (id) => id.split('-')[0];
const catLabel = { beer: 'BEER', whisky: 'WHISKY', rum: 'RUM', gin: 'GIN', vodka: 'VODKA', wine: 'WINE', tequila: 'TEQUILA', rtd: 'RTD' };
	let md = '# DRINKit image license verification report\n\n';
md += `Date: ${new Date().toISOString()}  \nPolicy: accept CC0/CC BY/CC BY-SA (attribution required), reject Non-free/Fair use.  \n`;
md += `**Eligible: ${eligible}/${products.length}** · needs-human: ${results.filter((r) => r.status === 'needs-human').length} · no candidate: ${results.filter((r) => r.status === 'no-candidate').length}\n\n`;
for (const [slug, label] of Object.entries(catLabel)) {
  const rows = results.filter((r) => cat(r.id) === slug);
  if (rows.length === 0) continue;
  const ok = rows.filter((r) => r.status === 'eligible').length;
  md += `\n## ${label} — ${ok}/${rows.length} eligible\n\n`;
  md += '| Product | Verdict | License | File / Reason |\n|---|---|---|---|\n';
  for (const r of rows) {
    if (r.status === 'eligible') {
      md += `| ${r.name} | ✅ | ${r.chosen.license} (${r.chosen.licenseTag}) | [file](${r.chosen.descriptionUrl}) |\n`;
    } else {
      const reason = r.status === 'no-candidate' ? 'no search hits' : (r.chosen.rejectReasons ?? r.chosen).map?.((x) => x.reason).join('; ') ?? 'ambiguous';
      md += `| ${r.name} | ⚠️ ${r.status} | — | ${String(reason).slice(0, 120)} |\n`;
    }
  }
}
fs.writeFileSync(path.join(ROOT, 'data/verification-report.md'), md);
console.log(`DONE eligible=${eligible}/${products.length} needs_human=${results.filter((r) => r.status === 'needs-human').length} no_candidate=${results.filter((r) => r.status === 'no-candidate').length}`);
console.log('Per category:', JSON.stringify(Object.fromEntries(Object.entries(catLabel).map(([slug, label]) => {
  const rows = results.filter((r) => cat(r.id) === slug);
  return [label, rows.filter((r) => r.status === 'eligible').length + '/' + rows.length];
}))));
