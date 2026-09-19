#!/usr/bin/env node
// Round 4 mini-probe: tequila-heavy, plus rum + vodka gaps.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'DRINKit-license-verifier/1.0 (local dev catalog)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CANDIDATES = [
  ['TEQUILA','Blanco','Casa Komos',7200,40,750],['TEQUILA','Blanco','Lunazul tequila',2600,38,750],['TEQUILA','Blanco','Olmeca tequila',2800,38,700],['TEQUILA','Reposado','Herradura reposado',6200,40,750],['TEQUILA','Blanco','Herradura blanco',6200,40,750],['TEQUILA','Blanco','Jose Cuervo black',5800,40,750],['TEQUILA','Blanco','Cuervo 1800',4600,38,750],['TEQUILA','Blanco','Cincoro tequila',8200,40,750],['TEQUILA','Blanco','Lobos tequila',5800,40,750],['TEQUILA','Blanco','Casamigos tequila',5800,40,750],['TEQUILA','Blanco','Teremana tequila',4800,38,750],['TEQUILA','Blanco','Casa Dragones',9800,40,700],['TEQUILA','Blanco','Clase Azul',18500,40,750],['TEQUILA','Blanco','Avion tequila',6800,40,750],['TEQUILA','Blanco','Ocho tequila',7600,38,750],
  ['RUM','Aged','Zacapa rum',6800,40,700],['RUM','Aged','Myers rum',2600,40,700],['RUM','Aged','Diplomatico rum',5000,40,700],['RUM','Dark','Ron Zacapa',6800,40,700],['RUM','Dark','Plantation rum',3500,40,750],['RUM','Aged','Capitan Morgan',1800,40,700],
  ['VODKA','Plain','Ketel vodka bottle',3000,40,750],['VODKA','Plain','Stoli vodka',2700,40,750],['VODKA','Premium','Absolut Elyx',7800,42.3,750],['VODKA','Plain','Stolichnaya bottle',2700,40,750],['VODKA','Plain','Ciroc vodka bottle',4500,40,750],
  ['BEER','Lager','Carlsberg beer bottle',250,5,500],['BEER','Lager','Tuborg closeup',190,5,500],
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
    } catch {
      if (a === 3) return { error: 'x' };
      await sleep(600 * (a + 1));
    }
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
const BEVERAGE = /\b(bottle|gin|vodka|rum|whisk|tequila|wine|beer|lager|ale|distiller|brewery|liquor|spirits|beverage|botella)/i;

async function searchFiles(query) {
  const data = await api({ action: 'query', list: 'search', srsearch: query, srnamespace: 6, srlimit: 10 });
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
    const titles = await searchFiles(q); await sleep(350);
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
fs.writeFileSync(path.join(ROOT, 'data/substitution-candidates-4.json'), JSON.stringify(results, null, 2));
console.log('DONE');
