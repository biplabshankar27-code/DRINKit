export interface ShopFilters {
  q: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  abvMin: string;
  abvMax: string;
  flavors: string[];
  sort: string;
  occasion: string;
  sweetness: string;
  body: string;
  intensity: string;
  availability: string;
}

export const SORT_OPTIONS = [
  { value: 'popular', label: 'Recommended' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'new', label: 'Newest' },
] as const;

export const FLAVOR_OPTIONS = ['Citrus', 'Fruity', 'Smoky', 'Spicy', 'Woody', 'Vanilla', 'Floral', 'Caramel', 'Earthy'];

export const OCCASION_OPTIONS = ['Dinner', 'Party', 'Gift', 'Celebration'];

export const ABV_RANGES = [
  { label: '0–20%', abvMin: '', abvMax: '20' },
  { label: '20–40%', abvMin: '20', abvMax: '40' },
  { label: '40%+', abvMin: '40', abvMax: '' },
];

export const EMPTY_FILTERS: ShopFilters = {
  q: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  abvMin: '',
  abvMax: '',
  flavors: [],
  sort: 'popular',
  occasion: '',
  sweetness: '',
  body: '',
  intensity: '',
  availability: '',
};

export function parseShopFilters(params: URLSearchParams): ShopFilters {
  return {
    ...EMPTY_FILTERS,
    ...Object.fromEntries(
      Object.entries({
        q: params.get('q') ?? '',
        category: params.get('category') ?? '',
        minPrice: params.get('minPrice') ?? '',
        maxPrice: params.get('maxPrice') ?? '',
        abvMin: params.get('abvMin') ?? '',
        abvMax: params.get('abvMax') ?? '',
        flavors: (params.get('flavors') ?? '').split(',').filter(Boolean),
        occasion: params.get('occasion') ?? '',
        sweetness: params.get('sweetness') ?? '',
        body: params.get('body') ?? '',
        intensity: params.get('intensity') ?? '',
        availability: params.get('availability') ?? '',
      }).filter(([, v]) => v !== ''),
    ),
  } as ShopFilters;
}

export function buildShopQuery(f: ShopFilters): string {
  const params = new URLSearchParams();
  if (f.q.trim()) params.set('q', f.q.trim());
  if (f.category) params.set('category', f.category);
  if (f.minPrice) params.set('minPrice', f.minPrice);
  if (f.maxPrice) params.set('maxPrice', f.maxPrice);
  if (f.abvMin) params.set('abvMin', f.abvMin);
  if (f.abvMax) params.set('abvMax', f.abvMax);
  if (f.flavors.length) params.set('flavors', f.flavors.join(','));
  if (f.sort && f.sort !== 'popular') params.set('sort', f.sort);
  if (f.occasion) params.set('occasion', f.occasion);
  if (f.sweetness) params.set('sweetness', f.sweetness);
  if (f.body) params.set('body', f.body);
  if (f.intensity) params.set('intensity', f.intensity);
  if (f.availability) params.set('availability', f.availability);
  const s = params.toString();
  return s;
}
