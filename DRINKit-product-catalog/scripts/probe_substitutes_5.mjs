#!/usr/bin/env node
// Round 5 probe: fill remaining vodka/tequila/whisky/rum gaps with more brands.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'DRINKit-license-verifier/1.0 (local dev catalog)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CANDIDATES = [
  ['VODKA','Plain','Ketel One Botanical',3200,30,750],['VODKA','Plain','Beluga vodka',5500,40,750],['VODKA','Plain','Chopin vodka',6500,40,750],['VODKA','Plain','Crystal Head Vodka',7800,40,750],['VODKA','Plain','Stolichnaya Elit',5800,40,750],['VODKA','Plain','Zubrowka',2800,40,700],['VODKA','Plain','Tito vodka',3200,40,750],
  ['TEQUILA','Blanco','Cien anos tequila',5200,40,700],['TEQUILA','Blanco','Desmadre tequila',5200,40,750],['TEQUILA','Blanco','Komino tequila',5200,38,750],['TEQUILA','Blanco','Corralejo tequila',5200,38,750],['TEQUILA','Blanco','Camarena tequila',2600,38,750],['TEQUILA','Blanco','Casa Dragones tequila',9800,40,700],['TEQUILA','Reposado','Exotico tequila',2400,38,750],['TEQUILA','Blanco','Rancho La Gloria tequila',1900,13.9,750],['TEQUILA','Blanco','Alta tequila',3200,40,750],['TEQUILA','Blanco','Cabo tequila',3400,40,750],
  ['WHISKY','Blended','Dewars bottle',2900,40,750],['WHISKY','Blended','Chivas Regal bottle',3200,40,700],['WHISKY','Blended','Paul John whisky',5500,42.8,700],['WHISKY','Blended','Indri Indian whisky',6500,46,700],
  ['RUM','Aged','Old Port rum',900,42.8,750],['RUM','Aged','Contessa rum',1100,42.8,750],['RUM','Aged','Malibu rum',1500,21,700],
];
async function api(params) {
  const url = new URL(API);
  url.searchParams.set('format', 'json'); url.searchParams.set('origin', '*');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  for (let a = 0; a < 4; a++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429) { await sleep(1500 * (a + 1)); continue; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch { if (a === 3) return { error: 'x' }; await sleep(600 * (a + 1)); }
  }
}
const normalizeLicense = (short) => {
  if (!short) return null;
  const s = short.trim();
  if (/^(CC0|Public domain)/i.test(s)) return 'CC0';
  const m = s.match(/^CC (BY(?:-SA)?)\s?([1-4])\.0/i);
  if (m) return `CC ${m[1].toUpperCase()} ${m[2]}.0`;
  return null;
};
const BEVERAGE = /\b(bottle|vodka|rum|whisk|tequila|wine|beer|lager|distiller|liquor|spirits|beverage|botella|flasco)/i;
async function searchFiles(q) {
  const data = await api({ action: 'query', list: 'search', srsearch: q, srnamespace: 6, srlimit: 10 });
  return (data?.query?.search ?? []).map((r) => r.title);
}
async function imageInfo(titles) {
  if (!titles.length) return [];
  const data = await api({ action: 'query', prop: 'imageinfo', titles: titles.slice(0, 20).join('|'), iiprop: 'url|size|extmetadata', iiurlwidth: 640 });
  return Object.values(data?.query?.pages ?? {}).filter((p) => p.imageinfo?.length > 0).map((p) => {
    const ii = p.imageinfo[0], md = ii.extmetadata ?? {};
    const strip = (h) => (h ?? '').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
    return { title: p.title, url: ii.url, thumb: ii.thumburl ?? ii.url, width: ii.width, height: ii.height, licenseShort: strip(md.LicenseShortName?.value), licenseUrl: strip(md.LicenseUrl?.value), descriptionUrl: ii.descriptionurl, artist: strip(md.Artist?.value), credit: strip(md.Credit?.value) };
  });
}
const results = [];
for (const [category, subcategory, name, priceInr, abv, sizeMl] of CANDIDATES) {
  const tokens = name.split(' ').filter((t) => t.length > 2 && !['and', 'the', 'of'].includes(t.toLowerCase()));
  const seen = new Set(); const candidates = [];
  for (const q of [`${name} bottle`, name]) {
    const titles = await searchFiles(q); await sleep(400);
    const fresh = titles.filter((t) => !seen.has(t)); titles.forEach((t) => seen.add(t));
    if (fresh.length) {
      const infos = await imageInfo(fresh); await sleep(300);
      for (const c of infos) {
        const lic = normalizeLicense(c.licenseShort);
        const ok = !!lic && tokens.some((t) => c.title.toLowerCase().includes(t.toLowerCase())) && c.width >= 400 && BEVERAGE.test(c.title);
        candidates.push({ ...c, ok, licenseResolved: lic });
      }
    }
  }
  const good = candidates.filter((c) => c.ok).sort((a, b) => b.width * b.height - a.width * a.height);
  const chosen = good[0] ?? null;
  results.push({ category, subcategory, name, priceInr, abv, sizeMl, status: chosen ? 'eligible' : (candidates.length ? 'needs-human' : 'no-candidate'), chosen, candidateCount: candidates.length });
  console.log(`${chosen ? 'OK ' : 'MISS'} ${name} -> ${chosen ? chosen.licenseResolved + ' :: ' + chosen.title : (candidates[0]?.title ?? 'none')}`);
  await sleep(300);
}
fs.writeFileSync(path.join(ROOT, 'data/substitution-candidates-5.json'), JSON.stringify(results, null, 2));
console.log('DONE');
