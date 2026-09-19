import mongoose from 'mongoose';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = resolve(__dirname, '../../DRINKit-product-catalog/data/products.json');
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/drinkit';

const BRAND_SKIP = new Set(['&', 'and', 'the', 'of']);

const INDIAN_BRANDS = ['kingfisher', 'bira', 'bacardi breezer', 'royal stag', "officer's choice"];

function deriveBrand(name) {
  const tokens = name
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !BRAND_SKIP.has(t.toLowerCase()));
  if (tokens.length === 0) return name;
  const brand = [tokens[0]];
  if (tokens.length > 1 && !/^\d/.test(tokens[1])) brand.push(tokens[1]);
  return brand.join(' ');
}

function deriveOrigin(name) {
  const lower = name.toLowerCase();
  return INDIAN_BRANDS.some((b) => lower.startsWith(b)) ? 'India' : 'Imported (demo)';
}

function seededPopularity(id) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h * 33) ^ id.charCodeAt(i)) >>> 0;
  return 40 + (h % 60);
}

const mapProduct = (p, index, total) => ({
  externalId: p.id,
  name: p.name,
  category: p.category.toLowerCase(),
  subCategory: p.subcategory ?? '',
  brand: deriveBrand(p.name),
  origin: deriveOrigin(p.name),
  abv: p.abv_percent,
  volumeMl: p.size_ml,
  price: p.price_inr,
  image: p.localServerImage ?? `https://placehold.co/600x800/1a1a1e/f5d892?text=${encodeURIComponent(p.name)}`,
  description: p.description ?? '',
  flavorTags: p.flavor_profile ?? [],
  tastingNotes: (p.tasting_notes ?? []).join(', '),
  foodPairings: p.food_pairings ?? [],
  occasionTags: p.occasions ?? [],
  cocktailUses: [],
  stock: p.inventory ?? 0,
  isActive: true,
  popularity: seededPopularity(p.id),
  rating: Math.round((4.0 + (index / Math.max(total, 1)) * 0.4) * 10) / 10,
  sweetness: p.sweetness,
  body: p.body,
  moods: p.moods ?? [],
  servingSuggestions: p.serving_suggestions ?? [],
  imageFilename: p.image_filename,
});

const COCKTAIL_SEED = [
  {
    name: 'Classic Mojito',
    baseSpirit: 'White Rum',
    ingredients: ['50ml white rum', '25ml fresh lime', '10 mint leaves', '15ml sugar syrup', 'Soda water'],
    instructions: 'Muddle mint with sugar syrup, add rum and lime, fill with crushed ice, top with soda.',
    flavorTags: ['mint', 'citrus', 'refreshing', 'sweet'],
  },
  {
    name: 'Moscow Mule',
    baseSpirit: 'Vodka',
    ingredients: ['50ml vodka', '20ml lime', '120ml ginger beer', 'Mint sprig'],
    instructions: 'Build in a copper mug, stir gently, garnish with lime and mint.',
    flavorTags: ['spicy', 'ginger', 'citrus'],
  },
  {
    name: 'Gin & Tonic',
    baseSpirit: 'Gin',
    ingredients: ['50ml gin', '150ml tonic', 'Lime wedge', 'Ice'],
    instructions: 'Fill a tall glass with ice, pour gin, top with tonic, squeeze lime.',
    flavorTags: ['botanical', 'juniper', 'refreshing'],
  },
  {
    name: 'Whisky Old Fashioned',
    baseSpirit: 'Bourbon',
    ingredients: ['60ml bourbon', '1 sugar cube', '3 dashes bitters', 'Orange peel'],
    instructions: 'Stir bourbon, sugar and bitters with ice, express orange peel over the glass.',
    flavorTags: ['caramel', 'oaky', 'warm'],
  },
  {
    name: 'Margarita',
    baseSpirit: 'Tequila',
    ingredients: ['50ml blanco tequila', '25ml lime', '25ml triple sec', 'Salt rim'],
    instructions: 'Shake all with ice, strain into a salt-rimmed glass.',
    flavorTags: ['citrus', 'salt', 'agave'],
  },
  {
    name: 'Daiquiri',
    baseSpirit: 'White Rum',
    ingredients: ['60ml white rum', '25ml lime', '10ml sugar syrup'],
    instructions: 'Shake hard with ice, fine strain into a chilled coupe.',
    flavorTags: ['citrus', 'sweet', 'clean'],
  },
  {
    name: 'Bloody Mary',
    baseSpirit: 'Vodka',
    ingredients: ['50ml vodka', '100ml tomato juice', 'Lemon', 'Worcestershire', 'Tabasco', 'Salt & pepper'],
    instructions: 'Roll all in a shaker without ice, pour over ice, garnish lavishly.',
    flavorTags: ['spicy', 'savoury'],
  },
  {
    name: 'Negroni',
    baseSpirit: 'Gin',
    ingredients: ['30ml gin', '30ml sweet vermouth', '30ml campari', 'Orange peel'],
    instructions: 'Stir all with ice over a big cube, express orange peel.',
    flavorTags: ['bitter', 'citrus', 'botanical'],
  },
  {
    name: 'Whisky Sour',
    baseSpirit: 'Bourbon',
    ingredients: ['60ml bourbon', '25ml lemon', '15ml sugar syrup', 'Optional: egg white'],
    instructions: 'Dry shake (if egg white), then shake with ice, strain into a short glass.',
    flavorTags: ['citrus', 'sweet', 'smooth'],
  },
  {
    name: 'Paloma',
    baseSpirit: 'Tequila',
    ingredients: ['50ml tequila reposado', '100ml grapefruit soda', '15ml lime', 'Salt pinch'],
    instructions: 'Build over ice in a highball, stir, salt the rim if you like.',
    flavorTags: ['citrus', 'grapefruit', 'refreshing'],
  },
];

const KNOWLEDGE_SEED = [
  {
    title: 'Whisky vs Rum vs Vodka vs Gin - quick primer',
    body: 'Whisky is fermented grain (barley/wheat/rye/corn), usually barrel-aged, with smoky or oaky notes. Rum is fermented molasses/sugarcane, frequently sweater. Vodka is a neutral distilled grain spirit, made for smoothness and often used in cocktails. Gin is re-distilled or steeped with juniper and botanicals, popular in G&T cocktails.',
  },
  {
    title: 'Reading tasting notes',
    body: 'Tasting notes list aromas, flavors and finish. The nose is what it smells like. The palate is what it tastes like. The finish is how it feels and lingers. Flavor tags synthesize the essences: e.g. a whisky can be smoky and peaty while a gin is citrus and juniper-forward.',
  },
  {
    title: 'Wine 101',
    body: 'Red wines are made by macerating grapes with the skins. Whites are pressed. Rosé is skin contact briefly. Sweetness ranges: dry = the fermentation is complete. ABV for the light range of 12%-14%. Oak barrels concentrate flavors of buttery chardonnay and vanilla notes.',
  },
  {
    title: 'Beer styles EPVs',
    body: 'Lager = clean and light. Wheat beer spicy with the signature banana and clove. IPA = hoppy bitterness and aromas like grapefruit or tropical fruit. Stout = roasted dark malts. Pale ale = midway across the styles. American style beers tend to be stronger. Age beer rarely.',
  },
  {
    title: 'Storing & serving temperature',
    body: 'White wine at 8-13C, red wine at 15-20C. Dark beers benefit from an additional 1-2C. Vodka and gin best chilled. Whisky: a splash of water opens aromas; ice chills and dilutes.',
  },
  {
    title: 'Responsible drinking guidance',
    body: 'Stay hydrated with an 8:1 water/drink ratio. Sip slowly and alternate snacks. Do not combine heavily with medications. Alcohol is meant for pleasure, not competition.',
  },
];

async function cocktailSeedFor(db, products, cocktails) {
  for (const p of products) {
    const uses = cocktails
      .filter((c) => c.baseSpirit.toLowerCase().startsWith(p.category.toLowerCase().slice(0, 3)))
      .map((c) => c.name);
    if (uses.length > 0) {
      await db.collection('products').updateMany({ externalId: p.externalId }, { $set: { cocktailUses: uses } });
    }
  }
}

async function main() {
  const raw = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const manifest = JSON.parse(readFileSync(resolve(__dirname, '../../DRINKit-product-catalog/data/image-sources.json'), 'utf8'));
  const manifestById = new Map(manifest.products.map((m) => [m.id, m]));
  const products = (raw.products ?? raw).map((p) => {
    const m = manifestById.get(p.id);
    if (m?.verified && m.local_file) {
      // local downloaded image will be served from frontend/public/images
      p.localServerImage = `/images/${m.local_file.split('/').slice(1).join('/')}`;
    } else {
      p.localServerImage = null;
    }
    return mapProduct(p, (raw.products ?? raw).indexOf(p), (raw.products ?? raw).length);
  });
  const cocktails = Array.isArray(raw.cocktails) && raw.cocktails.length > 0 ? raw.cocktails : COCKTAIL_SEED;

  await mongoose.connect(MONGODB_URI);
  const prisma = new PrismaClient();

  try {
    const db = mongoose.connection.getClient().db('drinkit');

    await db.dropCollection('products').catch(() => undefined);

    await db.collection('products').insertMany(products);

    await cocktailSeedFor(db, products, cocktails);

    await db.dropCollection('cocktail_recipes').catch(() => undefined);
    await db.collection('cocktail_recipes').insertMany(cocktails);

    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.address.deleteMany();
    await prisma.user.deleteMany();

    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@drinkit.dev',
        passwordHash: adminPassword,
        name: 'DRINKit Admin',
        role: 'admin',
      },
    });

    const demoPassword = await bcrypt.hash('Demo@123', 10);
    const demo = await prisma.user.create({
      data: {
        email: 'demo@drinkit.dev',
        passwordHash: demoPassword,
        name: 'Demo User',
        role: 'user',
      },
    });

    await prisma.address.createMany({
      data: [
        {
          userId: demo.id, label: 'Home', line1: '12 Palm Grove', line2: 'Off Hill Road',
          city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', lat: 18.922, lng: 72.8347,
          isDefault: true,
        },
        {
          userId: admin.id, label: 'Office', line1: '45 Tech Park',
          city: 'Bengaluru', state: 'Karnataka', postalCode: '560103', isDefault: true,
        },
      ],
    });

    console.log(
      `Seeded ${products.length} products, ${cocktails.length} cocktail recipes, ${KNOWLEDGE_SEED.length} knowledge docs.`,
    );
    console.log('Admin: admin@drinkit.dev / Admin@123 — Demo: demo@drinkit.dev / Demo@123');
  } finally {
    await prisma.$disconnect();
    await mongoose.disconnect();
  }
}

void main();
