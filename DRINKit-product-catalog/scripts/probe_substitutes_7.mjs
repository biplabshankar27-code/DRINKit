#!/usr/bin/env node
// ROUND 7 — final small batch: gin/rtd/vodka leftovers.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'DRINKit-license-verifier/1.0 (local dev catalog)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CANDIDATES = [
  ['GIN','Craft','Brokers gin',2200,40,700],['GIN','Craft','Sipsmith gin',3200,41.6,700],['GIN','Craft','Aviation gin',4200,44,750],['GIN','Flavored','Gin Mare',5200,42.7,700],['GIN','Craft','Gordons bottle',2000,47.3,700],['GIN','Craft','Bombay bottle',2800,40,700],['GIN','Craft','Plymouth gin bottle',3000,41.2,700],
  ['VODKA','Plain','Ketel one vodka',3000,40,750],['VODKA','Plain','Stolichnaya vodka',2700,40,700],['VODKA','Plain','Chopin',6500,40,700],['VODKA','Plain','Svedka',2200,40,750],['VODKA','Plain','Gorbatschow',1600,37.5,750],
  ['RTD','Canned Cocktail','hard lemonade',200,5,330],['RTD','Hard Seltzer','hard seltzer can',220,5,330],['RTD','Canned Cocktail','cocktails cans',240,5,330],['RTD','Canned Cocktail','margarita can',240,9.5,355],['RTD','Hard Seltzer','wild basin seltzer',220,5,330],
];
async function api(params) {
  const url = new URL(API);
  url.searchParams.set('format', 'json'); url.searchParams.set('origin', '*');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  for (let a = 0; a < 4; a++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429) { await sleep(1500 * (a + 1)); continue; }
      if (!res.ok) throw new Error('http ' + res.status);
      return await res.json();
    } catch { if (a === 3) return { error: 'x' }; await sleep(600 * (a + 1)); }
  }
}
const normLic = (s) => { if (!s) return null; const x = s.trim(); if (/^(CC0|public domain)/i.test(x)) return 'CC0'; const m = x.match(/^CC (BY(?:-SA)?)\s?([1-4])\.0/i); if (m) return `CC ${m[1].toUpperCase()} ${m[2]}.0`; return null; };
const BAD = /(\.pdf|\.djvu|\.webm|trophy|map|census|band|concert|festival|stadium|building|statue|monument|logo)/i;
const GOOD = /\b(bottle|vodka|rum|whisk|tequila|wine|beer|lager|ale|gin|distiller|liquor|spirits|seltzer|breezer|can\b)/i;
(async () => {
  const results = [];
  for (const [category, subcategory, name, priceInr, abv, sizeMl] of CANDIDATES) {
    const seen = new Set(); const candidates = [];
    for (const q of [`${name} bottle`, name]) {
      const d = await api({ action: 'query', list: 'search', srsearch: q, srnamespace: 6, srlimit: 10 });
      const titles = (d?.query?.search ?? []).map((r) => r.title); await sleep(400);
      const fresh = titles.filter((t) => !seen.has(t)); titles.forEach((t) => seen.add(t));
      if (!fresh.length) continue;
      const d2 = await api({ action: 'query', prop: 'imageinfo', titles: fresh.slice(0, 20).join('|'), iiprop: 'url|size|extmetadata', iiurlwidth: 640 });
      await sleep(300);
      for (const p of Object.values(d2?.query?.pages ?? {}).filter((p) => p.imageinfo?.length > 0)) {
        const ii = p.imageinfo[0], md = ii.extmetadata ?? {};
        const strip = (h) => (h ?? '').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
        const c = { title: p.title, url: ii.url, descriptionUrl: ii.descriptionurl, width: ii.width, height: ii.height, licenseShort: strip(md.LicenseShortName?.value), artist: strip(md.Artist?.value), credit: strip(md.Credit?.value) };
        const lic = normLic(c.licenseShort);
        const ok = !!lic && name.toLowerCase().split(/[\s'’&]+/).some((t) => t.length > 3 && c.title.toLowerCase().includes(t)) && !BAD.test(c.title) && GOOD.test(c.title) && c.width >= 400;
        candidates.push({ ...c, ok, licenseResolved: lic });
      }
    }
    const good = candidates.filter((c) => c.ok).sort((a, b) => b.width * b.height - a.width * a.height);
    const chosen = good[0] ?? null;
    results.push({ category, subcategory, name, priceInr, abv, sizeMl, status: chosen ? 'eligible' : (candidates.length ? 'needs-human' : 'no-candidate'), chosen, candidateCount: candidates.length });
    console.log(`${chosen ? 'OK ' : 'MISS'} ${name} -> ${chosen ? chosen.licenseResolved + ' :: ' + chosen.title.slice(0, 70) : (candidates[0]?.title.slice(0, 60) ?? 'none')}`);
    await sleep(250);
  }
  fs.writeFileSync(path.join(ROOT, 'data/substitution-candidates-7.json'), JSON.stringify(results, null, 2));
  console.log('DONE');
})();
