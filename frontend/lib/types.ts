export interface CategoryInfo {
  name: string;
  subCategories: string[];
  productCount: number;
}

export interface Product {
  _id: string;
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
  description: string;
  flavorTags: string[];
  tastingNotes: string;
  foodPairings: string[];
  occasionTags: string[];
  stock: number;
  popularity: number;
  rating: number;
  sweetness?: string;
  body?: string;
  moods?: string[];
  servingSuggestions?: string[];
  cocktailUses?: string[];
  externalId?: string;
  imageFilename?: string;
}

export interface CartLine {
  productId: string;
  name: string;
  image: string;
  price: number;
  category: string;
  quantity: number;
  stock: number;
}

export interface CartTotals {
  items: CartLine[];
  itemsTotal: number;
  deliveryFee: number;
  grandTotal: number;
}

export interface AuthTokens {
  accessToken: string;
  user: { id: string; email: string; name: string; role: string };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  recommendedProductIds?: string[];
  createdAt?: string;
}

export interface ChatReply {
  reply: string;
  recommendedProductIds: string[];
  recommendations: Product[];
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  category: string;
}

export interface Order {
  id: string;
  status: string;
  itemsTotal: number;
  deliveryFee: number;
  tax: number;
  grandTotal: number;
  address: Record<string, string>;
  etaMinutes?: number;
  createdAt: string;
  items: OrderItem[];
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';
