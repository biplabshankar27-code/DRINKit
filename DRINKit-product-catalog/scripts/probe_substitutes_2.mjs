#!/usr/bin/env node
// Second probe: stricter beverage-context gate + additional substitute candidates.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'DRINKit-license-verifier/1.0 (local dev catalog)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CANDIDATES = [
  ['WINE','White','Oyster Bay sauvignon blanc',2400,12.5,750],['WINE','Red','Casillero del Diablo',1900,13.5,750],['WINE','Red','Concha y Toro',2100,13.5,750],['WINE','Red','Amarone della Valpolicella',5500,15,750],['WINE','Red','Chianti bottle',2200,12.5,750],['WINE','Sparkling','Prosecco bottle',2300,11,750],['WINE','Red','Sula rhine',900,12,750],['WINE','Red','Sula cabernet',1000,12.5,750],
  ['VODKA','Plain','Russian Standard',2800,40,700],['VODKA','Plain','Grey Goose',6500,40,700],['VODKA','Flavored','Svedka strawberry',2200,35,750],['VODKA','Plain','Wodka Gorbatschow',1600,37.5,750],
  ['GIN','Craft','Hendrick gin midsummer',4200,43.4,700],['GIN','Craft','Beefeater gin',2600,47,750],['GIN','Craft','Hendrick gin bottle',4200,41.4,700],['GIN','Craft','Plymouth Gin',3200,41.2,700],
  ['WHISKY','Scotch','Talisker 10',7000,45.8,700],['WHISKY','Scotch','Laphroaig 10',7800,48,700],['WHISKY','Scotch','Glenlivet 12',8200,40,700],['WHISKY','Scotch','Macallan 12',14000,40,700],['WHISKY','Irish','Bushmills original',3600,40,700],
  ['RUM','Aged','Zacapa 23',6800,40,700],['RUM','White','Pusser Blue Label',4200,54.5,750],['RUM','Aged','Pampero rum',2900,40,700],['RUM','Aged','Santa Teresa 1796 white',3600,40,750],
  ['TEQUILA','Blanco','Patron silver',8900,40,750],['TEQUILA','Reposado','Cazadores reposado',4400,40,750],['TEQUILA','Blanco','Lunazul blanco',2600,38,750],['TEQUILA','Blanco','Casa Noble crystal',7800,40,750],['TEQUILA','Blanco','Tequila label',900,38,700],['TEQUILA','Blanco','Villa Lobos tequila',8200,40,750],['TEQUILA','Blanco','Agave azul tequila',1200,38,750],['TEQUILA','Blanco','Siembra tequila',6200,38,750],
];

async function api(params) {
  const url = new URL(API);
  url.searchParams.set('format', 'json'); url.searchParams.set('origin', '*');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429) { await sleep(1500 * (attempt + 1)); continue; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      if (attempt === 3) return { error: String(e) };
      await sleep(600 * (attempt + 1));
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

const BEVERAGE_CONTEXT = /\b(bottle|gin|vodka|rum|whisk|tequila|wine|beer|lager|ale|distiller|brewery|liquor|bar\b|spirits|boisson|tequila\?)/i;

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
  const brandTokens = name.split(' ').filter((t) => t.length > 2 && !['and', 'the', 'of'].includes(t.toLowerCase()));
  const brand = brandTokens.slice(0, 2).join(' ');
  const queries = [`${name} bottle`, name, `${brand} bottle`];
  const seen = new Set(); const candidates = [];
  for (const q of queries) {
    const titles = await searchFiles(q); await sleep(350);
    const fresh = titles.filter((t) => !seen.has(t)); titles.forEach((t) => seen.add(t));
    if (fresh.length) { const infos = await imageInfo(fresh); await sleep(300);
      for (const c of infos) {
        const lic = normalizeLicense(c.licenseShort);
        const ok = !!lic && name.toLowerCase().split(/[\s'’&]+/).some((t) => t.length > 3 && c.title.toLowerCase().includes(t)) && c.width >= 400 && BEVERAGE_CONTEXT.test(c.title);
        candidates.push({ query: q, ...c, ok, licenseResolved: lic, rejectReason: ok ? null : `license: ${c.licenseShort}` });
      }
    }
  }
  const good = candidates.filter((c) => c.ok).sort((a, b) => b.width * b.height - a.width * a.height);
  const chosen = good[0] ?? null;
  results.push({ category, subcategory, name, priceInr, abv, sizeMl, status: chosen ? 'eligible' : (candidates.length ? 'needs-human' : 'no-candidate'), chosen, candidateCount: candidates.length });
  console.log(`${chosen ? 'OK ' : 'MISS'} ${name} -> ${chosen ? chosen.licenseResolved + ' :: ' + chosen.title : (candidates[0]?.title ?? 'none')}`);
  await sleep(250);
}
fs.writeFileSync(path.join(ROOT, 'data/substitution-candidates-2.json'), JSON.stringify(results, null, 2));
const byCat = {};
for (const r of results) if (r.status === 'eligible') byCat[r.category] = (byCat[r.category] ?? 0) + 1;
console.log('ELIGIBLE per category:', JSON.stringify(byCat));
