#!/usr/bin/env node
// Probe substitute products: same rules as the Phase 1 verifier, but on a curated candidate list.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'DRINKit-license-verifier/1.0 (local dev catalog)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CANDIDATES = [
  // [category, subcategory, priceInr, abv, sizeMl, name]  — order matters, early entries preferred
  ['BEER','Lager','Kingfisher Ultra',300,5,650],['BEER','Lager','Tuborg beer',180,4.7,500],['BEER','Lager','Foster lager',200,5,650],['BEER','Lager','Stella Artois',420,5.2,330],['BEER','Lager','Heineken bottle',480,5,330],['BEER','Lager','Corona Extra',600,4.5,355],
  ['WINE','Red',"Jacob's Creek Shiraz",1500,13.9,750],['WINE','Red','Lindeman shiraz',1200,13.5,750],['WINE','Rose','Sula Rasa',1450,11.5,750],['WINE','Sparkling','Sula zinfandel',1200,12,750],['WINE','Sparkling','Riondo prosecco',1800,11,750],['WINE','Red','Yellow tail shiraz',1700,13,750],['WINE','White','Cave de Lugny Chablis',2600,12.5,750],
  ['VODKA','Premium','Magic Moments Remix',1200,42.8,750],['VODKA','Flavored','Absolut citron',2600,40,750],['VODKA','Plain','Smirnoff 21',1900,40,750],['VODKA','Plain','Ketel one',4200,40,750],['VODKA','Plain','Belvedere',5200,40,750],['VODKA','Plain','Finlandia',2500,40,750],
  ['GIN','Craft','Bombay Sapphire',3500,40,750],['GIN','Craft','Tanqueray London Dry',3200,43.1,750],['GIN','Flavored','Gordons pink',2400,37.5,700],['GIN','Craft','Jaisalmer gin',3300,43,700],['GIN','Craft','Greater than gin',2800,42.8,700],
  ['WHISKY','Blended','Royal Challenge',1350,42.8,750],['WHISKY','Blended','McDowell No.1',1250,42.8,750],['WHISKY','Scotch',"Teacher's Highland Cream",2200,46.7,750],['WHISKY','Scotch','Dewar White Label',2900,40,750],['WHISKY','Scotch','Johnnie Walker Black Label',5300,40,750],['WHISKY','Scotch','Ballantine Finest',2400,40,700],['WHISKY','Bourbon','Woodford Reserve',7800,43.2,700],
  ['RUM','White','Bacardi Carta Blanca',1800,42.8,750],['RUM','Dark','Appleton Estate',4800,43,750],['RUM','Aged','Barcelo rum',3400,38,750],['RUM','White','Brugal Extra Viejo',3100,38,750],['RUM','Aged','Mount Gay rum',3600,43,700],['RUM','Aged','El Dorado 12',4200,40,750],['RUM','Spiced','Krabby Frog off',0,0,0],
  ['TEQUILA','Blanco','Jose Cuervo Especial',3200,38,750],['TEQUILA','Reposado','Jose Cuervo Reposado',3800,38,700],['TEQUILA','Blanco','Sauza Blue',2500,38,750],['TEQUILA','Reposado','Sauza Hornitos',3000,40,700],['TEQUILA','Blanco','Herradura Silver',6200,40,750],['TEQUILA','Blanco','Olmeca Blanco',2800,38,700],['TEQUILA','Reposado','El Jimador Reposado',3400,38,700],['TEQUILA','Blanco','Espolon Blanco',3600,40,750],
  ['RTD','Canned Cocktail','Bacardi Breezer pineapple',180,4.8,330],['RTD','Canned Cocktail','Bacardi Breezer watermelon',180,4.8,330],['RTD','Canned Cocktail','Bacardi Breezer green apple',180,4.8,330],['RTD','Canned Cocktail','Bacardi Breezer lemon',180,4.8,330],['RTD','Hard Seltzer','Smirnoff seltzer',220,4.7,330],
];

async function api(params) {
  const url = new URL(API);
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
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
  const m = s.match(/^CC (BY(?:-SA)?)\s?([1-4])\.0/i) ?? s.match(/^(Creative Commons|CC)?\s*(BY(?:-SA)?) ([1-4])\.0/i);
  if (m) return `CC ${m[1].toUpperCase()} ${m[2]}.0`.replace(/\s+/g, ' ');
  return null;
};

async function searchFiles(query) {
  const data = await api({ action: 'query', list: 'search', srsearch: query, srnamespace: 6, srlimit: 8 });
  return (data?.query?.search ?? []).map((r) => r.title);
}

async function imageInfo(titles) {
  if (!titles.length) return [];
  const data = await api({
    action: 'query', prop: 'imageinfo',
    titles: titles.slice(0, 20).join('|'),
    iiprop: 'url|size|extmetadata', iiurlwidth: 640,
  });
  return Object.values(data?.query?.pages ?? {})
    .filter((p) => p.imageinfo?.length > 0)
    .map((p) => {
      const ii = p.imageinfo[0], md = ii.extmetadata ?? {};
      const strip = (h) => (h ?? '').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
      return {
        title: p.title, url: ii.url, thumb: ii.thumburl ?? ii.url, width: ii.width, height: ii.height,
        licenseShort: strip(md.LicenseShortName?.value), licenseUrl: strip(md.LicenseUrl?.value),
        descriptionUrl: ii.descriptionurl, artist: strip(md.Artist?.value), credit: strip(md.Credit?.value),
      };
    });
}

const results = [];
for (const [category, subcategory, name, priceInr, abv, sizeMl] of CANDIDATES) {
  const brandTokens = name.split(' ').filter((t) => t.length > 2 && !['and', 'the', 'of'].includes(t.toLowerCase()));
  const brand = brandTokens.slice(0, 2).join(' ');
  const queries = [name, `${brand} bottle`];
  const seen = new Set();
  const candidates = [];
  for (const q of queries) {
    const titles = await searchFiles(q); await sleep(300);
    const fresh = titles.filter((t) => !seen.has(t)); titles.forEach((t) => seen.add(t));
    if (fresh.length === 0) continue;
    const infos = await imageInfo(fresh); await sleep(300);
    for (const c of infos) {
      const lic = normalizeLicense(c.licenseShort);
      const ok = !!lic && name.toLowerCase().split(/[\s'’&]+/).some((t) => t.length > 3 && c.title.toLowerCase().includes(t)) && c.width >= 400;
      candidates.push({ query: q, ...c, ok, licenseResolved: lic, rejectReason: ok ? null : `license: ${c.licenseShort}` });
    }
  }
  const good = candidates.filter((c) => c.ok).sort((a, b) => b.width * b.height - a.width * a.height);
  const chosen = good[0] ?? null;
  results.push({ category, subcategory, name, priceInr, abv, sizeMl, status: chosen ? 'eligible' : (candidates.length ? 'needs-human' : 'no-candidate'), chosen, candidateCount: candidates.length });
  console.log(`${chosen ? 'OK ' : 'MISS'} ${name} -> ${chosen ? chosen.licenseResolved + ' :: ' + chosen.title : (candidates.length ? candidates[0].title : 'none')}`);
  await sleep(250);
}
fs.writeFileSync(path.join(ROOT, 'data/substitution-candidates.json'), JSON.stringify(results, null, 2));
const byCat = {};
for (const r of results) if (r.status === 'eligible') byCat[r.category] = (byCat[r.category] ?? 0) + 1;
console.log('ELIGIBLE per category:', JSON.stringify(byCat));
