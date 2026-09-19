export const OCCASIONS = [
  'Dinner',
  'Party',
  'Celebration',
  'Unwind',
  'Movie Night',
  'Gifting',
  'Cocktail Night',
  'Weekend',
] as const;

export type Occasion = (typeof OCCASIONS)[number];
