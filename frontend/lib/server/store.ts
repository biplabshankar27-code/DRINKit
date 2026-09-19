import { scryptSync, randomBytes, timingSafeEqual, randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import catalogJson from '@/data/catalog.json';

export interface ApiProduct {
  _id: string;
  externalId?: string;
  name: string;
  category: string;
  subCategory: string;
  brand: string;
  origin: string;
  abv: number;
  volumeMl: number;
  price: number;
  compareAtPrice?: number;
  image: string;
  imageFilename?: string;
  description: string;
  flavorTags: string[];
  tastingNotes: string;
  foodPairings: string[];
  occasionTags: string[];
  cocktailUses: string[];
  stock: number;
  popularity: number;
  rating: number;
  isActive: boolean;
  sweetness?: string;
  body?: string;
  moods?: string[];
  servingSuggestions?: string[];
}

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string;
  createdAt: string;
}

export interface ApiAddress {
  id: string;
  userId: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export interface ApiLineItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  category: string;
  stock: number;
}

export interface ApiOrder {
  id: string;
  userId: string;
  status: string;
  itemsTotal: number;
  deliveryFee: number;
  tax: number;
  grandTotal: number;
  address: Record<string, unknown>;
  notes?: string;
  items: ApiLineItem[];
  createdAt: string;
}

export interface ApiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  recommendedProductIds?: string[];
  createdAt: string;
}

interface ApiState {
  users: ApiUser[];
  addresses: ApiAddress[];
  products: ApiProduct[];
  carts: Record<string, ApiLineItem[]>;
  wishlists: Record<string, string[]>;
  orders: ApiOrder[];
  chatSessions: Record<string, ApiChatMessage[]>;
}

const globalScope = globalThis as unknown as { __drinkitState?: ApiState };

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function seedState(): ApiState {
  const products = (catalogJson.products as ApiProduct[]).map((p) => ({ ...p, cocktailUses: p.cocktailUses ?? [] }));
  const now = new Date().toISOString();
  const users: ApiUser[] = [
    { id: 'usr_admin', email: 'admin@drinkit.dev', name: 'DRINKit Admin', role: 'admin', passwordHash: hashPassword('Admin@123'), createdAt: now },
    { id: 'usr_demo', email: 'demo@drinkit.dev', name: 'Demo User', role: 'user', passwordHash: hashPassword('Demo@123'), createdAt: now },
  ];
  const addresses: ApiAddress[] = [
    { id: 'addr_demo', userId: 'usr_demo', label: 'Home', line1: '12 Palm Grove', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', isDefault: true },
    { id: 'addr_admin', userId: 'usr_admin', label: 'Office', line1: '45 Tech Park', city: 'Bengaluru', state: 'Karnataka', postalCode: '560103', isDefault: true },
  ];
  return { users, addresses, products, carts: {}, wishlists: {}, orders: [], chatSessions: {} };
}

export function state(): ApiState {
  if (!globalScope.__drinkitState) globalScope.__drinkitState = seedState();
  return globalScope.__drinkitState;
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'drinkit-vercel-demo-secret');

export async function signToken(user: ApiUser): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

export async function readToken(header: string | null): Promise<TokenPayload | null> {
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(header.slice(7), JWT_SECRET);
    return { sub: String(payload.sub), email: String(payload.email), role: String(payload.role) };
  } catch {
    return null;
  }
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().slice(0, 18)}`;
}
