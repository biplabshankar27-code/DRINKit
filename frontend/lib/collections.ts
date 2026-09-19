import type { Product } from './types';

export interface Collection {
  slug: string;
  title: string;
  subtitle: string;
  /** /shop query string this collection maps to (documented contract: q, category, occasion, minPrice, maxPrice, abvMin, abvMax, flavors, sort) */
  href: string;
  /** Client-side matcher so editorial pages can curate without extra backend support. */
  match: (p: Product) => boolean;
}

export const COLLECTIONS: Collection[] = [
  {
    slug: 'weekend',
    title: 'The Weekend Edit',
    subtitle: 'Bottles for slow evenings and easy company.',
    href: '/shop?occasion=Weekend',
    match: (p) => (p.occasionTags ?? []).includes('Weekend'),
  },
  {
    slug: 'under-2000',
    title: 'The ₹2,000 Edit',
    subtitle: 'Great picks without going over budget.',
    href: '/shop?maxPrice=2000&sort=popular',
    match: (p) => p.price <= 2000,
  },
  {
    slug: 'beginners',
    title: "The Beginner's Edit",
    subtitle: 'Approachable, lower-ABV bottles to start exploring.',
    href: '/shop?abvMax=20&sort=popular',
    match: (p) => Number(p.abv) < 20 && p.rating >= 4,
  },
  {
    slug: 'indian-craft',
    title: 'The Indian Craft Edit',
    subtitle: "India's modern craft spirits scene, bottled.",
    href: '/shop?category=Gin',
    match: (p) => typeof p.origin === 'string' && p.origin.includes('India'),
  },
  {
    slug: 'cocktail-night',
    title: 'The Cocktail Night Edit',
    subtitle: 'Bottles made for mixing and shaking.',
    href: '/shop?occasion=Cocktail%20Night',
    match: (p) =>
      (p.cocktailUses?.length ?? 0) > 0 || (p.occasionTags ?? []).includes('Cocktail Night'),
  },
  {
    slug: 'dinner',
    title: 'The Dinner Edit',
    subtitle: 'Drinks that work beautifully with food.',
    href: '/shop?occasion=Dinner',
    match: (p) => (p.occasionTags ?? []).includes('Dinner'),
  },
];
