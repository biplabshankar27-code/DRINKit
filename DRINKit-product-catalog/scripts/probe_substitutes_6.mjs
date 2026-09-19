#!/usr/bin/env node
// ROUND 6 — final probing for remaining damaged rows (audit + swap leftovers).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'DRINKit-license-verifier/1.0 (local dev catalog)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CANDIDATES = [
  ['BEER','Lager','Tuborg beer closeup',190,4.6,500],['BEER','Lager','Budweiser bottle',260,5,330],['BEER','Lager','Bud Light',280,4.2,355],['BEER','Lager','Sol beer bottle',280,4.5,355],['BEER','Lager','Miller beer bottle',240,4.7,355],['BEER','Lager','Coors Light',280,4.2,355],['BEER','Lager','San Miguel beer',300,5,330],
  ['WINE','Red','Merlot bottle',1600,13,750],['WINE','Red','Sauvignon blanc',1500,12.5,750],['WINE','Red','Fratelli wine',1200,13,750],['WINE','Sparkling','Prosecco',2300,11,750],['WINE','Red','Shiraz bottle',1300,13,750],['WINE','Red','Pinot noir bottle',1800,13,750],
  ['VODKA','Plain','Chopin potato',6500,40,700],['VODKA','Plain','Ketel one bottle',3000,40,750],['VODKA','Plain','Stoli gold',3200,40,750],['VODKA','Plain','Smirnoff Black',2100,40,750],['VODKA','Plain','Beluga gold',6500,40,700],
  ['GIN','Craft','Bols gin',2400,40,700],['GIN','Craft','Hendrick gin',4600,41.4,700],['GIN','Craft','Seagram gin',1800,40,750],['GIN','Flavored','Bombay East',3200,42.8,700],['GIN','Craft','The botanist gin',5200,46,700],['GIN','Craft','Gin bottle London',2200,40,700],['GIN','Craft','Gin and tonic bottle',1900,40,330],
  ['WHISKY','Scotch','Glenmorangie bottle',8700,40,700],['WHISKY','Scotch','Ardbeg whisky',8800,46,700],['WHISKY','Blended','Chivas bottle',3200,40,700],['WHISKY','Blended','Highland Park whisky',8800,40,700],['WHISKY','Scotch','Glenfiddich bottle',6500,40,700],['WHISKY','Blended','Whisky bottle blended',1350,42.8,750],
  ['RUM','Aged','Brugal rum bottle',3100,38,700],['RUM','Dark','Appleton estate rum',4800,43,700],['RUM','Aged','Old monk rum',1000,42.8,750],['RUM','Dark','Ron rhum',2400,38,700],
  ['RTD','Canned Cocktail','Bacardi breezer can',180,4.8,330],['RTD','Canned Cocktail','Mike hard lemonade',220,5,330],['RTD','Canned Cocktail','Longdrink bottle',220,5,330],['RTD','Hard Seltzer','Seltzer can',220,5,330],['RTD','Canned Cocktail','Cocktail can',200,5,330],
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
const normalizeLicense = (short) => {
  if (!short) return null;
  const s = short.trim();
  if (/^(CC0|Public domain)/i.test(s)) return 'CC0';
  const m = s.match(/^CC (BY(?:-SA)?)\s?([1-4])\.0/i);
  if (m) return `CC ${m[1].toUpperCase()} ${m[2]}.0`;
  return null;
};
const BAD_TITLE = /(\.pdf|\.djvu|\.webm|trophy|map|census|band|concert|festival|stadium|building|headquarters|distillery entrance|statue|monument|census|festival)/i;
const GOOD_CONTEXT = /\b(bottle|vodka|rum|whisk|tequila|wine|beer|lager|ale|gin|distiller|brewery|liquor|spirits|beverage|botella|flasche|can\b|cans|seltzer|breezer|drink)/i;
async function searchFiles(q) {
  const d = await api({ action: 'query', list: 'search', srsearch: q, srnamespace: 6, srlimit: 10 });
  return (d?.query?.search ?? []).map((r) => r.title);
}
async function imageInfo(titles) {
  if (!titles.length) return [];
  const d = await api({ action: 'query', prop: 'imageinfo', titles: titles.slice(0, 20).join('|'), iiprop: 'url|size|extmetadata', iiurlwidth: 640 });
  return Object.values(d?.query?.pages ?? {}).filter((p) => p.imageinfo?.length > 0).map((p) => {
    const ii = p.imageinfo[0], md = ii.extmetadata ?? {};
    const strip = (h) => (h ?? '').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
    return { title: p.title, url: ii.url, descriptionUrl: ii.descriptionurl, width: ii.width, height: ii.height, licenseShort: strip(md.LicenseShortName?.value), artist: strip(md.Artist?.value), credit: strip(md.Credit?.value) };
  });
}
const results = [];
for (const [category, subcategory, name, priceInr, abv, sizeMl] of CANDIDATES) {
  const seen = new Set(); const candidates = [];
  for (const q of [name, `${name} bottle`]) {
    const titles = await searchFiles(q); await sleep(350);
    const fresh = titles.filter((t) => !seen.has(t)); titles.forEach((t) => seen.add(t));
    if (fresh.length) {
      const infos = await imageInfo(fresh); await sleep(250);
      for (const c of infos) {
        const lic = normalizeLicense(c.licenseShort);
        const tokensOK = name.toLowerCase().split(/[\s'’&]+/).some((t) => t.length > 3 && c.title.toLowerCase().includes(t));
        const ok = !!lic && tokensOK && !BAD_TITLE.test(c.title) && GOOD_CONTEXT.test(c.title) && c.width >= 400 && !/\.(pdf|djvu|webm)$/i.test(c.url || '');
        candidates.push({ ...c, ok, licenseResolved: lic });
      }
    }
  }
  const good = candidates.filter((c) => c.ok).sort((a, b) => b.width * b.height - a.width * a.height);
  const chosen = good[0] ?? null;
  results.push({ category, subcategory, name, priceInr, abv, sizeMl, status: chosen ? 'eligible' : (candidates.length ? 'needs-human' : 'no-candidate'), chosen, candidateCount: candidates.length });
  console.log(`${chosen ? 'OK ' : 'MISS'} ${name} -> ${chosen ? chosen.licenseResolved + ' :: ' + chosen.title.slice(0, 80) : (candidates[0]?.title.slice(0, 60) ?? 'none')}`);
  await sleep(250);
}
fs.writeFileSync(path.join(ROOT, 'data/substitution-candidates-6.json'), JSON.stringify(results, null, 2));
console.log('DONE');
