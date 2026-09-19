#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const sources = ['beer-wine', 'gin-vodka', 'whisky-rum', 'tequila-rtd'];
const all = sources.flatMap((s) => {
  const parsed = JSON.parse(fs.readFileSync(path.join(ROOT, `data/verif-${s}.json`), 'utf8'));
  return Array.isArray(parsed) ? parsed : (parsed.products ?? []);
});
// dedupe by id (older tmp scripts may leave duplicates)
const byId = new Map();
for (const r of all) if (r && typeof r.id === 'string') byId.set(r.id + '|' + r.name, r);
const deduped = [...byId.values()];

// Downgrade semantically weak "eligible" picks flagged in review
const QUARANTINE = {
  'tequila-04': 'candidate is a Goya portrait (Hungarian person), not the tequila bottle',
  'tequila-07': 'candidate is a historical bath artwork, not the tequila',
  'tequila-05': 'candidate is a generic shopfront shared with tequila-06, not the specific bottle',
  'tequila-06': 'candidate is a generic shopfront, not the specific bottle',
  'rtd-15': 'candidate is an SXSW event whiteboard photo, not the product',
};
for (const r of all) {
  if (r.status === 'eligible' && QUARANTINE[r.id]) {
    r.status = 'needs-human';
    r.chosen = { rejectReasons: [{ title: r.chosen?.title, reason: QUARANTINE[r.id], license: r.chosen?.license }] };
  }
}

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/image-sources.json'), 'utf8'));
manifest.products = manifest.products.map((row) => {
  const r = deduped.find((x) => x && x.id === row.id);
  if (r?.status === 'eligible') {
    return {
      ...row,
      source_url: r.chosen.url,
      license: `${r.chosen.licenseResolved} (${r.chosen.licenseTag})`,
      attribution: r.chosen.attribution,
      verified: true,
      file_page: r.chosen.descriptionUrl,
    };
  }
  return row;
});
manifest.verification = {
  reviewed_at: new Date().toISOString(),
  eligible: deduped.filter((r) => r.status === 'eligible').length,
  needs_human: deduped.filter((r) => r.status === 'needs-human').length,
  no_candidate: deduped.filter((r) => r.status === 'no-candidate').length,
  quarantined_after_review: Object.keys(QUARANTINE).length,
  policy: 'CC0 / CC BY / CC BY-SA accepted with attribution; Non-free, Fair use and unknown licenses rejected.',
};
fs.writeFileSync(path.join(ROOT, 'data/image-sources.json'), JSON.stringify(manifest, null, 2));

const catLabel = { beer: 'BEER', whisky: 'WHISKY', rum: 'RUM', gin: 'GIN', vodka: 'VODKA', wine: 'WINE', tequila: 'TEQUILA', rtd: 'RTD' };
let md = '# DRINKit image license verification report\n\n';
md += `Date: ${new Date().toISOString()}  \nPolicy: accept CC0/CC BY/CC BY-SA 1.0-4.0 with attribution; reject Non-free/Fair use/unknown.  \n`;
md += `**Eligible: ${deduped.filter((r) => r.status === 'eligible').length}/120** · needs-human: ${deduped.filter((r) => r.status === 'needs-human').length} · no candidate: ${deduped.filter((r) => r.status === 'no-candidate').length} · quarantined after review: ${Object.keys(QUARANTINE).length}\n\n`;
for (const [slug, label] of Object.entries(catLabel)) {
  const rows = deduped.filter((r) => typeof r.id === 'string' && r.id.startsWith(slug + '-'));
  if (rows.length === 0) continue;
  const ok = rows.filter((r) => r.status === 'eligible').length;
  md += `\n## ${label} — ${ok}/${rows.length} eligible\n\n| Product | Verdict | License | File / Reason |\n|---|---|---|---|\n`;
  for (const r of rows) {
    if (r.status === 'eligible') {
      md += `| ${r.name} | ✅ | ${r.chosen.licenseResolved} (${r.chosen.licenseTag}) | [${r.chosen.title.replace(/^File:/, '')}](${r.chosen.descriptionUrl}) |\n`;
    } else {
      let reason;
      if (r.status === 'no-candidate') reason = 'no search hits on Commons';
      else {
        const rr = r.chosen?.rejectReasons ?? [];
        reason = rr.map ? rr.slice(0, 2).map((x) => `${x.title.replace(/^File:/, '')}: ${x.reason}`).join('; ') : 'ambiguous';
      }
      md += `| ${r.name} | ⚠️ ${r.status} | — | ${String(reason).slice(0, 140)} |\n`;
    }
  }
}
fs.writeFileSync(path.join(ROOT, 'data/verification-report.md'), md);
console.log('MERGED eligible=' + deduped.filter((r) => r.status === 'eligible').length + '/' + all.length);
