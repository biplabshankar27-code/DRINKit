#!/usr/bin/env node
// Round 3 probe: fill remaining holes — tequila (8 needed), rum (6), cheap whisky, RTD non-Breezer.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'DRINKit-license-verifier/1.0 (local dev catalog)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CANDIDATES = [
  ['TEQUILA','Blanco','Don Julio bottle',7500,40,750],['TEQUILA','Blanco','Patron reposado',9500,40,750],['TEQUILA','Blanco','Patron anejo',11500,40,750],['TEQUILA','Blanco','Patron bottle',8900,40,750],['TEQUILA','Blanco','Herradura tequila',6200,40,750],['TEQUILA','Blanco','Sauza tequila',2500,38,700],['TEQUILA','Blanco','1800 tequila bottle',4600,38,750],['TEQUILA','Blanco','Gran Centenario',5800,40,750],['TEQUILA','Blanco','Fortaleza tequila',7800,40,750],['TEQUILA','Blanco','Tapatio tequila',5200,38,750],['TEQUILA','Blanco','Tequila bottle Mexico',1400,38,700],['TEQUILA','Blanco','Tequila Agave tequila',1600,38,750],['TEQUILA','Blanco','Cuervo tequila',3200,38,750],['TEQUILA','Blanco','Tequila Rose',1600,15,750],['TEQUILA','Blanco','Tequila bottles',2200,38,700],
  ['WHISKY','Blended','Antiquity Blue',1500,42.8,750],['WHISKY','Blended','Officers Choice whisky',1050,42.8,750],['WHISKY','Blended','Original Choice whisky',950,42.8,750],['WHISKY','Blended','Bagpiper whisky',700,42.8,750],['WHISKY','Blended','Director Special whisky',700,42.8,750],['WHISKY','Blended','Imperial Blue whisky',750,42.8,750],
  ['RUM','Dark','Brugal rum',3100,38,750],['RUM','Aged','Havana Club rum',2600,40,700],['RUM','Aged','El Dorado rum',4200,40,750],['RUM','Spiced','Sailor Jerry rum',2900,40,700],['RUM','Dark','Gosling Black Seal',3800,40,750],['RUM','White','Bacardi rum bottle',1800,42.8,750],['RUM','Aged','Flor de Cana',3300,40,700],
  ['RTD','Canned Cocktail','Mikes Hard Lemonade',220,5,330],['RTD','Canned Cocktail','Hooper Hooch',200,5.4,330],['RTD','Cannong Cocktail','Bangla 001',160,8,300],['RTD','Hard Seltzer','Bud Light Seltzer',200,5,330],['RTD','Canned Cocktail','Mark Anthony wine coolers',180,5,330],['RTD','Canned Cocktail','Long Islandiced tea can',200,5,330],
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
    } catch (e) {
      if (a === 3) return { error: String(e) };
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
const BEVERAGE_CONTEXT = /\b(bottle|gin|vodka|rum|whisk|tequila|wine|beer|lager|ale|distiller|brewery|liquor|spirits|desperados|beverage)/i;

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
  if (priceInr === 0) continue;
  const tokens = name.split(' ').filter((t) => t.length > 2 && !['and', 'the', 'of'].includes(t.toLowerCase()));
  const queries = [`${name} bottle`, name];
  const seen = new Set(); const candidates = [];
  for (const q of queries) {
    const titles = await searchFiles(q); await sleep(350);
    const fresh = titles.filter((t) => !seen.has(t)); titles.forEach((t) => seen.add(t));
    if (fresh.length) {
      const infos = await imageInfo(fresh); await sleep(300);
      for (const c of infos) {
        const lic = normalizeLicense(c.licenseShort);
        const ok = !!lic && tokens.some((t) => c.title.toLowerCase().includes(t.toLowerCase())) && c.width >= 400 && BEVERAGE_CONTEXT.test(c.title);
        candidates.push({ query: q, ...c, ok, licenseResolved: lic, rejectReason: `license: ${c.licenseShort}` });
      }
    }
  }
  const good = candidates.filter((c) => c.ok).sort((a, b) => b.width * b.height - a.width * a.height);
  const chosen = good[0] ?? null;
  results.push({ category, subcategory, name, priceInr, abv, sizeMl, status: chosen ? 'eligible' : (candidates.length ? 'needs-human' : 'no-candidate'), chosen, candidateCount: candidates.length });
  console.log(`${chosen ? 'OK ' : 'MISS'} ${name} -> ${chosen ? chosen.licenseResolved + ' :: ' + chosen.title : (candidates[0]?.title ?? 'none')}`);
  await sleep(250);
}
fs.writeFileSync(path.join(ROOT, 'data/substitution-candidates-3.json'), JSON.stringify(results, null, 2));
console.log('DONE');
