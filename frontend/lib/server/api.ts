import {
  ApiLineItem,
  ApiOrder,
  ApiProduct,
  ApiUser,
  hashPassword,
  newId,
  readToken,
  signToken,
  state,
  verifyPassword,
} from './store';

export interface ApiResult {
  status: number;
  body: unknown;
}

const ok = (body: unknown, status = 200): ApiResult => ({ status, body });
const err = (status: number, message: string | string[]): ApiResult => ({
  status,
  body: { statusCode: status, message, error: status === 401 ? 'Unauthorized' : 'Bad Request' },
});

const CATEGORIES: { name: string; subCategories: string[] }[] = [
  { name: 'Beer', subCategories: ['Lager', 'IPA', 'Wheat', 'Stout', 'Pale Ale'] },
  { name: 'Wine', subCategories: ['Red', 'White', 'Rose', 'Sparkling', 'Dessert'] },
  { name: 'Whisky', subCategories: ['Single Malt', 'Blended', 'Bourbon', 'Scotch', 'Irish'] },
  { name: 'Rum', subCategories: ['White Rum', 'Dark Rum', 'Spiced Rum', 'Aged Rum', 'Flavored'] },
  { name: 'Gin', subCategories: ['London Dry', 'Flavored', 'Craft Gin'] },
  { name: 'Vodka', subCategories: ['Plain', 'Flavored', 'Premium', 'Gift Pack'] },
  { name: 'Tequila', subCategories: ['Blanco', 'Reposado', 'Anejo'] },
  { name: 'RTD', subCategories: ['Canned Cocktail', 'Hard Seltzer', 'Rum & Cola RTD'] },
];

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const lower = (s: string | undefined) => (s ?? '').toLowerCase();

function findProduct(id: string): ApiProduct | undefined {
  const db = state();
  return db.products.find((p) => p._id === id || p.externalId === id);
}

function adminProductsView(): ApiProduct[] {
  return state().products.filter((p) => p.isActive);
}

/* ---------------- catalog ---------------- */

function catalogList(params: URLSearchParams): ApiResult {
  const db = state();
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.get('limit') ?? 20) || 20));
  const category = params.get('category');
  const subCategory = params.get('subCategory');
  const origin = params.get('origin');
  const flavors = params.get('flavors');
  const q = params.get('q');
  const minPrice = params.get('minPrice');
  const maxPrice = params.get('maxPrice');
  const abvMin = params.get('abvMin');
  const abvMax = params.get('abvMax');
  const sort = params.get('sort') ?? 'popular';

  let items = db.products.filter((p) => p.isActive);
  if (category) items = items.filter((p) => lower(p.category) === lower(category));
  if (subCategory) items = items.filter((p) => lower(p.subCategory) === lower(subCategory));
  if (origin) items = items.filter((p) => lower(p.origin) === lower(origin));
  if (flavors) {
    const list = flavors.split(',').map((f) => f.trim().toLowerCase()).filter(Boolean);
    if (list.length) items = items.filter((p) => p.flavorTags.some((t) => list.includes(lower(t))));
  }
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    items = items.filter((p) => rx.test(p.name) || rx.test(p.brand) || rx.test(p.description));
  }
  if (minPrice) items = items.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) items = items.filter((p) => p.price <= Number(maxPrice));
  if (abvMin) items = items.filter((p) => p.abv >= Number(abvMin));
  if (abvMax) items = items.filter((p) => p.abv <= Number(abvMax));

  const sorters: Record<string, (a: ApiProduct, b: ApiProduct) => number> = {
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    popular: (a, b) => b.popularity - a.popularity,
    rating: (a, b) => b.rating - a.rating,
    new: (a, b) => b._id.localeCompare(a._id),
  };
  items = [...items].sort(sorters[sort] ?? sorters.popular);

  const total = items.length;
  const start = (page - 1) * limit;
  return ok({ items: items.slice(start, start + limit), total, page, limit });
}

function catalogCategories(): ApiResult {
  const db = state();
  const counts = new Map<string, number>();
  for (const p of db.products) {
    if (!p.isActive) continue;
    counts.set(lower(p.category), (counts.get(lower(p.category)) ?? 0) + 1);
  }
  return ok(CATEGORIES.map((c) => ({ ...c, productCount: counts.get(lower(c.name)) ?? 0 })));
}

/* ---------------- cart ---------------- */

function cartTotals(userId: string) {
  const db = state();
  const items = db.carts[userId] ?? [];
  const itemsTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = itemsTotal > 999 ? 0 : 49;
  return { items, itemsTotal, deliveryFee, grandTotal: itemsTotal + deliveryFee };
}

function toLine(product: ApiProduct, quantity: number): ApiLineItem {
  return {
    productId: product._id,
    name: product.name,
    image: product.image,
    price: product.price,
    quantity,
    category: product.category,
    stock: product.stock,
  };
}

/* ---------------- auth helpers ---------------- */

interface Ctx {
  params: URLSearchParams;
  body: Record<string, unknown>;
  auth: string | null;
}

async function requireUser(ctx: Ctx): Promise<{ user: ApiUser } | ApiResult> {
  const payload = await readToken(ctx.auth);
  if (!payload) return err(401, 'Unauthorized');
  const user = state().users.find((u) => u.id === payload.sub);
  if (!user) return err(401, 'Unauthorized');
  return { user };
}

async function requireAdmin(ctx: Ctx): Promise<{ user: ApiUser } | ApiResult> {
  const res = await requireUser(ctx);
  if ('status' in res) return res;
  if (res.user.role !== 'admin') return err(403, 'Admin access required');
  return res;
}

/* ---------------- AI (Groq + fallback) ---------------- */

const STOP = new Set(['the', 'and', 'for', 'with', 'what', 'you', 'your', 'me', 'give', 'some', 'have', 'has', 'can', 'recommend', 'suggest', 'best', 'good', 'any', 'want', 'need', 'buy', 'get', 'help', 'drink', 'drinks', 'please', 'would', 'like']);

function keywordSearch(message: string, limit: number): ApiProduct[] {
  const db = state();
  const words = lower(message).replace(/[^\w\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).slice(0, 6);
  if (!words.length) return [];
  const scored = db.products
    .filter((p) => p.isActive && p.stock > 0)
    .map((p) => {
      let score = 0;
      for (const w of words) {
        if (lower(p.name).includes(w)) score += 3;
        if (lower(p.brand).includes(w)) score += 2;
        if (lower(p.category).includes(w)) score += 2;
        if (lower(p.subCategory).includes(w)) score += 1;
        if (p.flavorTags.some((t) => lower(t).includes(w))) score += 2;
        if (lower(p.moods?.join(' ')).includes(w)) score += 1;
      }
      if (/under|below|cheap|budget/i.test(message)) score += 0;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.popularity - a.p.popularity);
  return scored.slice(0, limit).map((x) => x.p);
}

function fallbackReply(message: string): { reply: string; picks: ApiProduct[] } {
  const picks = keywordSearch(message, 3);
  const list = picks.length ? picks : state().products.filter((p) => p.stock > 0).sort((a, b) => b.popularity - a.popularity).slice(0, 3);
  const lines = list.map((p) => `• **${p.name}** — ₹${p.price}, ABV ${p.abv}%. ${p.tastingNotes.split(',')[0]}. Pairings: ${(p.foodPairings ?? []).slice(0, 2).join(', ') || 'versatile'}.`);
  return { reply: "Here are some drinks I think you'll enjoy based on your message:\n" + lines.join('\n'), picks: list };
}

function parseBudget(message: string): number | null {
  const m = message.match(/(?:under|below|less than|up ?to|max(?:imum)?|budget(?: of)?|within)\s*(?:rs\.?|inr|₹)?\s*([\d][\d,]*)\s*(k\b)?/i);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ''));
  if (!n) return null;
  return m[2] ? n * 1000 : n;
}

function catalogContext(message: string): string {
  const budget = parseBudget(message);
  const inStock = state().products.filter((p) => p.stock > 0);
  const pool = budget ? inStock.filter((p) => p.price <= budget) : inStock;
  const list = keywordSearch(message, 6).filter((p) => !budget || p.price <= budget);
  const picks = list.length ? list : [...pool].sort((a, b) => b.popularity - a.popularity).slice(0, 4);
  const header = budget ? `User budget: Rs ${budget} maximum — only products at or below this price.\n` : '';
  if (!picks.length) return `${header}NO IN-STOCK PRODUCTS AT OR BELOW THIS BUDGET.`;
  return header + picks
    .map((p) => `id: ${p._id} | ${p.name} | ${p.category} (${p.subCategory}) | brand: ${p.brand} | ABV ${p.abv}% | Rs ${p.price} | flavors: ${p.flavorTags.join(', ')} | body: ${p.body ?? '-'} | sweetness: ${p.sweetness ?? '-'} | moods: ${(p.moods ?? []).join(', ') || '-'} | notes: ${p.tastingNotes.slice(0, 140)}`)
    .join('\n');
}

const SYSTEM_PROMPT = `You are the DRINKit AI Bartender — a friendly, knowledgeable drinks assistant inside a premium liquor e-commerce store.

Rules (follow strictly):
- Recommend only products from the CATALOG CONTEXT. Never invent products, brands, ABVs, or prices.
- If the user states a budget (e.g. "under 4000"), every product you name MUST cost at or below it. If nothing in the context fits, say so and suggest raising the budget — never name an over-budget bottle.
- Quote prices exactly as they appear in the CATALOG CONTEXT, in ₹ with commas (e.g. ₹3,500). Never estimate, round, or alter a price.
- Name at most 3 products. For each, one short line: **Name** (₹price) — why it fits (taste, occasion, pairing). Do not discuss any product you are not recommending.
- The products you name MUST be exactly the products listed after RECOMMENDED_ids, in the same order.

End every reply that recommends products with a line exactly like:
RECOMMENDED_ids: id1, id2

Keep answers short and scannable; encourage responsible drinking; assume adults of legal drinking age.`;

interface ParsedReply { text: string; ids: string[] }
function parseRecommendationIds(raw: string): ParsedReply {
  const marker = /RECOMMENDED_ids:\s*(.+)/i;
  const match = raw.match(marker);
  if (!match) return { text: raw.trim(), ids: [] };
  const ids = match[1].split(',').map((x) => x.trim()).filter((x) => /^[a-z]+_\w+$/i.test(x)).slice(0, 3);
  return { text: raw.replace(marker, '').trim(), ids };
}

function namesToIds(text: string): string[] {
  const db = state();
  const names = [...text.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => lower(m[1].trim()));
  const ids: string[] = [];
  for (const n of names) {
    const hit = db.products.find((p) => lower(p.name) === n || lower(p.name).includes(n) || n.includes(lower(p.name)));
    if (hit && !ids.includes(hit._id)) ids.push(hit._id);
  }
  return ids.slice(0, 3);
}

async function chatReply(message: string): Promise<{ reply: string; recommendations: ApiProduct[] }> {
  const apiKey = process.env.GROQ_API_KEY;
  let replyText = '';
  let modelIds: string[] = [];

  if (apiKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b',
          temperature: 0.4,
          max_tokens: 1500,
          reasoning_effort: 'low',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'system', content: `CATALOG CONTEXT (in stock):\n${catalogContext(message)}` },
            { role: 'user', content: message },
          ],
        }),
      });
      if (!res.ok) throw new Error(`groq ${res.status}`);
      const data = await res.json();
      const raw: string = data?.choices?.[0]?.message?.content ?? '';
      const parsed = parseRecommendationIds(raw);
      if (!parsed.text) throw new Error('empty model reply');
      replyText = parsed.text;
      modelIds = parsed.ids.length ? parsed.ids : namesToIds(parsed.text);
    } catch {
      const fb = fallbackReply(message);
      replyText = fb.reply;
      modelIds = fb.picks.map((p) => p._id);
    }
  } else {
    const fb = fallbackReply(message);
    replyText = fb.reply;
    modelIds = fb.picks.map((p) => p._id);
  }

  const recommendations: ApiProduct[] = modelIds
    .map((id) => findProduct(id))
    .filter((p): p is ApiProduct => !!p && p.stock > 0)
    .slice(0, 3);

  if (!recommendations.length) {
    recommendations.push(...keywordSearch(message, 3));
  }
  return { reply: replyText, recommendations };
}

/* ---------------- recommendations ---------------- */

function similarProducts(base: ApiProduct, limit: number): ApiProduct[] {
  const db = state();
  return db.products
    .filter((p) => p.isActive && p._id !== base._id)
    .map((p) => {
      let score = p.flavorTags.filter((t) => base.flavorTags.map(lower).includes(lower(t))).length * 2;
      if (lower(p.category) === lower(base.category)) score += 1.5;
      if (lower(p.origin) === lower(base.origin)) score += 0.5;
      const priceDiff = Math.abs(p.price - base.price) / Math.max(p.price, base.price, 1);
      score += (1 - priceDiff) * 1.5;
      score += p.popularity / 1000;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

function popularProducts(limit: number): ApiProduct[] {
  return state().products.filter((p) => p.isActive).sort((a, b) => b.popularity - a.popularity || b.rating - a.rating).slice(0, limit);
}

/* ---------------- dispatcher ---------------- */

export async function handleApi(method: string, segments: string[], ctx: Ctx): Promise<ApiResult> {
  const db = state();
  const [a, b, c, d] = segments;
  const json = <T>(data: unknown) => data as T;

  // ---- auth ----
  if (a === 'auth' && b === 'register' && method === 'POST') {
    const { email, password, name } = ctx.body as { email?: string; password?: string; name?: string };
    if (!email || !password || !name) return err(400, []);
    if (db.users.some((u) => lower(u.email) === lower(email))) return err(401, 'Email already registered');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return err(400, 'Password must be at least 8 characters and contain letters and numbers');
    const user: ApiUser = { id: newId('usr'), email, name, role: 'user', passwordHash: hashPassword(password), createdAt: new Date().toISOString() };
    db.users.push(user);
    return ok({ accessToken: await signToken(user), user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }
  if (a === 'auth' && b === 'login' && method === 'POST') {
    const { email, password } = ctx.body as { email?: string; password?: string };
    const user = db.users.find((u) => lower(u.email) === lower(email ?? ''));
    if (!user || !verifyPassword(password ?? '', user.passwordHash)) return err(401, 'Invalid credentials');
    return ok({ accessToken: await signToken(user), user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }
  if (a === 'auth' && b === 'profile' && method === 'GET') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    return ok({ sub: res.user.id, email: res.user.email, role: res.user.role });
  }

  // ---- users ----
  if (a === 'users' && b === 'me' && c === 'addresses' && method === 'GET') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    return ok(db.addresses.filter((x) => x.userId === res.user.id));
  }
  if (a === 'users' && b === 'me' && c === 'addresses' && method === 'POST') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    const body = ctx.body as Partial<{ label: string; line1: string; line2?: string; city: string; state: string; postalCode: string; isDefault?: boolean }>;
    if (!body.label || !body.line1 || !body.city || !body.state || !body.postalCode) return err(400, 'Missing address fields');
    if (body.isDefault) db.addresses.filter((x) => x.userId === res.user.id).forEach((x) => (x.isDefault = false));
    const address = { id: newId('addr'), userId: res.user.id, label: body.label, line1: body.line1, line2: body.line2, city: body.city, state: body.state, postalCode: body.postalCode, isDefault: body.isDefault ?? false };
    db.addresses.push(address);
    return ok(address, 201);
  }
  if (a === 'users' && b === 'me' && c === 'addresses' && d && method === 'DELETE') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    db.addresses = db.addresses.filter((x) => !(x.id === d && x.userId === res.user.id));
    return ok({ deleted: true });
  }
  if (a === 'users' && b === 'me' && method === 'GET') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    const { passwordHash: _omit, ...profile } = res.user;
    return ok(profile);
  }

  // ---- catalog ----
  if (a === 'catalog' && b === 'products' && c === 'by-ids' && method === 'GET') {
    const ids = (ctx.params.get('ids') ?? '').split(',').map((x) => x.trim()).filter(Boolean);
    const items = ids.map((id) => findProduct(id)).filter((p): p is ApiProduct => !!p);
    return ok({ items });
  }
  if (a === 'catalog' && b === 'products' && method === 'GET') return catalogList(ctx.params);
  if (a === 'catalog' && b === 'categories' && method === 'GET') return catalogCategories();
  if (a === 'catalog' && b === 'products' && c && method === 'GET') {
    const product = findProduct(c);
    return product ? ok(product) : err(400, 'Product not found');
  }
  if (a === 'catalog' && b === 'admin' && c === 'products' && method === 'POST') {
    const res = await requireAdmin(ctx);
    if ('status' in res) return res;
    const body = ctx.body as Partial<ApiProduct>;
    const product: ApiProduct = {
      _id: newId('prd'),
      name: body.name ?? 'Untitled',
      externalId: body.externalId,
      category: lower(body.category ?? 'beer'),
      subCategory: body.subCategory ?? 'Custom',
      brand: body.brand ?? 'DRINKit',
      origin: body.origin ?? 'India',
      abv: Number(body.abv ?? 5),
      volumeMl: Number(body.volumeMl ?? 750),
      price: Number(body.price ?? 100),
      compareAtPrice: body.compareAtPrice,
      image: body.image ?? `https://placehold.co/600x800/1a1a1e/f5d892?text=${encodeURIComponent(body.name ?? 'New')}`,
      description: body.description ?? '',
      flavorTags: body.flavorTags ?? [],
      tastingNotes: body.tastingNotes ?? '',
      foodPairings: body.foodPairings ?? [],
      occasionTags: body.occasionTags ?? [],
      cocktailUses: [],
      stock: Number(body.stock ?? 10),
      popularity: 50,
      rating: 4,
      isActive: true,
      sweetness: body.sweetness,
      body: body.body,
      moods: body.moods ?? [],
      servingSuggestions: body.servingSuggestions ?? [],
    };
    db.products.push(product);
    return ok(product, 201);
  }
  if (a === 'catalog' && b === 'admin' && c === 'products' && d && method === 'PATCH') {
    const res = await requireAdmin(ctx);
    if ('status' in res) return res;
    const product = db.products.find((p) => p._id === d);
    if (!product) return err(400, 'Product not found');
    Object.assign(product, ctx.body, { _id: product._id });
    return ok(product);
  }
  if (a === 'catalog' && b === 'admin' && c === 'products' && d && segments[4] === 'stock' && method === 'PATCH') {
    const res = await requireAdmin(ctx);
    if ('status' in res) return res;
    const product = db.products.find((p) => p._id === d);
    if (!product) return err(400, 'Product not found');
    product.stock = Number((ctx.body as { stock?: number }).stock ?? product.stock);
    return ok(product);
  }
  if (a === 'catalog' && b === 'admin' && c === 'products' && d && method === 'DELETE') {
    const res = await requireAdmin(ctx);
    if ('status' in res) return res;
    const product = db.products.find((p) => p._id === d);
    if (product) product.isActive = false;
    return ok({ deleted: true });
  }

  // ---- cart ----
  if (a === 'cart' && method === 'GET') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    return ok(cartTotals(res.user.id));
  }
  if (a === 'cart' && b === 'items' && method === 'POST') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    const { productId, quantity } = ctx.body as { productId?: string; quantity?: number };
    const product = productId ? findProduct(productId) : undefined;
    if (!product) return err(400, 'Product not found');
    if (product.stock < (quantity ?? 1)) return err(400, `Only ${product.stock} left in stock`);
    const items = (db.carts[res.user.id] ??= []);
    const line = items.find((i) => i.productId === product._id);
    if (line) {
      line.quantity = Math.min(20, line.quantity + (quantity ?? 1));
      if (line.quantity > product.stock) return err(400, `Only ${product.stock} left in stock`);
      line.stock = product.stock;
    } else {
      items.push(toLine(product, quantity ?? 1));
    }
    return ok(cartTotals(res.user.id), 201);
  }
  if (a === 'cart' && b === 'items' && method === 'PATCH') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    const { productId, quantity } = ctx.body as { productId?: string; quantity?: number };
    const items = (db.carts[res.user.id] ??= []);
    const line = items.find((i) => i.productId === productId);
    if (!line) return err(404, 'Item not in cart');
    if ((quantity ?? 1) === 0) {
      db.carts[res.user.id] = items.filter((i) => i.productId !== productId);
    } else {
      if ((quantity ?? 1) > line.stock) return err(400, `Only ${line.stock} left in stock`);
      line.quantity = quantity ?? line.quantity;
    }
    return ok(cartTotals(res.user.id));
  }
  if (a === 'cart' && b === 'items' && method === 'DELETE') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    db.carts[res.user.id] = [];
    return ok(cartTotals(res.user.id));
  }

  // ---- wishlist ----
  if (a === 'wishlist' && !b && method === 'GET') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    return ok({ productIds: db.wishlists[res.user.id] ?? [] });
  }
  if (a === 'wishlist' && !b && method === 'DELETE') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    db.wishlists[res.user.id] = [];
    return ok({ productIds: [] });
  }
  if (a === 'wishlist' && b && method === 'POST') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    const list = (db.wishlists[res.user.id] ??= []);
    if (!list.includes(b) && list.length < 200) list.push(b);
    return ok({ productIds: list }, 201);
  }
  if (a === 'wishlist' && b && method === 'DELETE') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    db.wishlists[res.user.id] = (db.wishlists[res.user.id] ?? []).filter((id) => id !== b);
    return ok({ productIds: db.wishlists[res.user.id] });
  }

  // ---- orders ----
  if (a === 'orders' && method === 'POST') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    const { addressId, notes } = ctx.body as { addressId?: string; notes?: string };
    const address = db.addresses.find((x) => x.id === addressId && x.userId === res.user.id);
    if (!address) return err(400, 'Address not found');
    const totals = cartTotals(res.user.id);
    if (!totals.items.length) return err(400, 'Cart is empty');
    for (const line of totals.items) {
      const product = findProduct(line.productId);
      if (!product || product.stock < line.quantity) return err(400, `${line.name} is out of stock`);
    }
    for (const line of totals.items) {
      const product = findProduct(line.productId);
      if (product) product.stock -= line.quantity;
    }
    const tax = Math.round(totals.itemsTotal * 0.05 * 100) / 100;
    const order: ApiOrder = {
      id: newId('ord'),
      userId: res.user.id,
      status: 'pending',
      itemsTotal: totals.itemsTotal,
      deliveryFee: totals.deliveryFee,
      tax,
      grandTotal: Math.round((totals.itemsTotal + totals.deliveryFee + tax) * 100) / 100,
      address: { ...address },
      notes,
      items: totals.items.map((i) => ({ ...i })),
      createdAt: new Date().toISOString(),
    };
    db.orders.push(order);
    db.carts[res.user.id] = [];
    return ok(order, 201);
  }
  if (a === 'orders' && b === 'admin' && c === 'all' && method === 'GET') {
    const res = await requireAdmin(ctx);
    if ('status' in res) return res;
    return ok([...db.orders].sort((x, y) => y.createdAt.localeCompare(x.createdAt)).slice(0, 100));
  }
  if (a === 'orders' && method === 'GET') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    return ok([...db.orders].filter((o) => o.userId === res.user.id).sort((x, y) => y.createdAt.localeCompare(x.createdAt)));
  }
  if (a === 'orders' && b === 'admin' && c && d === 'status' && method === 'PATCH') {
    const res = await requireAdmin(ctx);
    if ('status' in res) return res;
    const order = db.orders.find((o) => o.id === c);
    if (!order) return err(404, 'Order not found');
    const status = String((ctx.body as { status?: string }).status ?? '');
    const allowed = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) return err(400, `Invalid status. Allowed: ${allowed.join(', ')}`);
    order.status = status;
    return ok(order);
  }
  if (a === 'orders' && b && method === 'GET') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    const order = db.orders.find((o) => o.id === b && o.userId === res.user.id);
    return order ? ok(order) : err(404, 'Order not found');
  }
  if (a === 'orders' && b && c === 'cancel' && method === 'POST') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    const order = db.orders.find((o) => o.id === b && o.userId === res.user.id);
    if (!order) return err(404, 'Order not found');
    if (!['pending', 'confirmed'].includes(order.status)) return err(400, 'Order can no longer be cancelled');
    order.status = 'cancelled';
    return ok(order);
  }

  // ---- assistant ----
  if (a === 'assistant' && b === 'chat' && c === 'history' && method === 'GET') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    return ok(db.chatSessions[res.user.id] ?? []);
  }
  if (a === 'assistant' && b === 'chat' && c === 'history' && method === 'DELETE') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    delete db.chatSessions[res.user.id];
    return ok({ cleared: true });
  }
  if (a === 'assistant' && b === 'chat' && method === 'POST') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    const message = String((ctx.body as { message?: string }).message ?? '').trim();
    if (!message) return err(400, 'message required');
    const { reply, recommendations } = await chatReply(message);
    const session = (db.chatSessions[res.user.id] ??= []);
    session.push({ role: 'user', content: message, createdAt: new Date().toISOString() });
    session.push({ role: 'assistant', content: reply, recommendedProductIds: recommendations.map((p) => p._id), createdAt: new Date().toISOString() });
    return ok({ reply, recommendedProductIds: recommendations.map((p) => p._id), recommendations });
  }

  // ---- recommendations ----
  if (a === 'recommendations' && b === 'popular' && method === 'GET') {
    return ok(popularProducts(Number(ctx.params.get('limit') ?? 10) || 10));
  }
  if (a === 'recommendations' && b === 'similar' && c && method === 'GET') {
    const base = findProduct(c);
    if (!base) return err(400, 'Product not found');
    return ok(similarProducts(base, Number(ctx.params.get('limit') ?? 6) || 6));
  }
  if (a === 'recommendations' && b === 'for-you' && method === 'GET') {
    const limit = Number(ctx.params.get('limit') ?? 10) || 10;
    const res = await requireUser(ctx);
    if ('status' in res) return ok(popularProducts(limit));
    const myOrders = db.orders.filter((o) => o.userId === res.user.id);
    const catCount = new Map<string, number>();
    myOrders.flatMap((o) => o.items).forEach((i) => catCount.set(lower(i.category), (catCount.get(lower(i.category)) ?? 0) + i.quantity));
    if (!catCount.size) return ok(popularProducts(limit));
    const boosted = db.products
      .filter((p) => p.isActive && p.stock > 0)
      .sort((x, y) => (catCount.get(lower(y.category)) ?? 0) - (catCount.get(lower(x.category)) ?? 0) || y.popularity - x.popularity)
      .slice(0, limit);
    return ok(boosted);
  }

  // ---- inventory / payments ----
  if (a === 'inventory' && b === 'check-availability' && method === 'POST') {
    const ids = (ctx.body as { productIds?: string[] }).productIds ?? [];
    return ok({ results: ids.slice(0, 100).map((id) => {
      const p = findProduct(id);
      return { productId: id, available: !!p && p.stock > 0, stock: p?.stock ?? 0 };
    }) });
  }
  if (a === 'payments' && b === 'create-payment' && method === 'POST') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    const { orderId } = ctx.body as { orderId?: string };
    const order = db.orders.find((o) => o.id === orderId && o.userId === res.user.id);
    if (!order) return err(400, 'Order not found');
    return ok({ paymentId: `mock_${order.id}`, orderId: order.id, amount: order.grandTotal, provider: 'mock', razorpayConfigured: false });
  }
  if (a === 'payments' && b === 'verify' && method === 'POST') {
    const res = await requireUser(ctx);
    if ('status' in res) return res;
    const { orderId, success } = ctx.body as { orderId?: string; success?: boolean };
    const order = db.orders.find((o) => o.id === orderId && o.userId === res.user.id);
    if (!order) return err(400, 'Order not found');
    if (success) order.status = 'confirmed';
    return ok({ verified: !!success, status: success ? 'paid' : 'failed' });
  }

  return err(404, `Unknown route: ${method} /${segments.join('/')}`);
}
