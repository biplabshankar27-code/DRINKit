#!/usr/bin/env node
// Generates frontend/data/catalog.json from the DRINKit product catalog package.
// Only reads; safe to re-run. Includes local image paths for downloaded assets.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));            // frontend/scripts
const FRONTEND = path.join(ROOT, '..');                               // frontend
const CATALOG = path.join(FRONTEND, '..', 'DRINKit-product-catalog', 'data', 'products.json');
const IMAGES_DIR = path.join(FRONTEND, 'public', 'images');

const raw = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));

const imageFor = (p) => {
  const cat = (p.category ?? '').toLowerCase();
  const dir = path.join(IMAGES_DIR, cat);
  if (fs.existsSync(dir)) {
    const hit = fs.readdirSync(dir).find((f) => f.toLowerCase().startsWith(`${p.id.toLowerCase()}.`));
    if (hit) return `/images/${cat}/${hit}`;
  }
  return `https://placehold.co/600x800/1a1a1e/f5d892?text=${encodeURIComponent(p.name)}`;
};

const products = raw.products.map((p, idx) => ({
  _id: `prd_${String(idx + 1).padStart(3, '0')}`,
  externalId: p.id,
  name: p.name,
  category: (p.category ?? '').toLowerCase(),
  subCategory: p.subcategory ?? '',
  brand: (p.brand && !p.brand.includes('Demo')) ? p.brand : p.name.split(' ').slice(0, 2).join(' '),
  origin: (p.origin && !p.origin.includes('Demo')) ? p.origin : 'Imported (demo)',
  abv: p.abv_percent,
  volumeMl: p.size_ml,
  price: p.price_inr,
  compareAtPrice: p.compare_at_price ?? undefined,
  image: imageFor(p),
  imageFilename: p.image_filename,
  description: p.description ?? '',
  flavorTags: p.flavor_profile ?? [],
  tastingNotes: Array.isArray(p.tasting_notes) ? p.tasting_notes.join(', ') : (p.tasting_notes ?? ''),
  foodPairings: p.food_pairings ?? [],
  occasionTags: p.occasions ?? [],
  cocktailUses: [],
  stock: p.inventory ?? 20,
  popularity: 40 + ((idx * 37) % 60),
  rating: Math.round((4 + ((idx % 6) / 10)) * 10) / 10,
  isActive: p.is_available !== false,
  sweetness: p.sweetness ?? undefined,
  body: p.body ?? undefined,
  moods: p.moods ?? [],
  servingSuggestions: p.serving_suggestions ?? [],
}));

const out = { generatedAt: new Date().toISOString(), products };
const dest = path.join(FRONTEND, 'data', 'catalog.json');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out));
const local = products.filter((p) => p.image.startsWith('/images/')).length;
console.log(`catalog.json written: ${products.length} products (${local} with local images) -> ${dest}`);
