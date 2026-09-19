#!/usr/bin/env node
// Rename downloaded images to short <id>.<ext> names; update manifest + products + frontend copies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/image-sources.json'), 'utf8'));
let renamed = 0;
for (const row of manifest.products) {
  if (!row.verified || !row.local_file) continue;
  const cat = String(row.id).split('-')[0];
  const dir = path.join(ROOT, 'images', cat);
  const oldPath = path.join(ROOT, row.local_file);
  if (!fs.existsSync(oldPath)) continue;
  const ext = path.extname(oldPath) || '.jpg';
  const newName = `${row.id}${ext.toLowerCase()}`;
  const newPath = path.join(dir, newName);
  if (oldPath !== newPath) {
    fs.renameSync(oldPath, newPath);
    renamed++;
  }
  row.local_file = `images/${cat}/${newName}`;
  row.image_filename = `${cat}/${newName}`;
}
fs.writeFileSync(path.join(ROOT, 'data/image-sources.json'), JSON.stringify(manifest, null, 2));
// mirror into frontend/public/images
const FE = path.join(ROOT, '../public/images');
let copied = 0;
for (const row of manifest.products) {
  if (!row.verified || !row.local_file) continue;
  const src = path.join(ROOT, row.local_file);
  if (!fs.existsSync(src)) continue;
  const dest = path.join(FE, ...row.local_file.split('/').slice(1));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  copied++;
}
console.log(`renamed=${renamed} copied=${copied}`);
