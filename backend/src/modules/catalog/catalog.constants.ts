export const CATEGORIES = [
  { name: 'Beer', subCategories: ['Lager', 'IPA', 'Wheat', 'Stout', 'Pale Ale'] },
  { name: 'Wine', subCategories: ['Red', 'White', 'Rose', 'Sparkling', 'Dessert'] },
  { name: 'Whisky', subCategories: ['Single Malt', 'Blended', 'Bourbon', 'Scotch', 'Irish'] },
  { name: 'Rum', subCategories: ['White Rum', 'Dark Rum', 'Spiced Rum', 'Aged Rum'] },
  { name: 'Gin', subCategories: ['London Dry', 'Flavored', 'Craft Gin'] },
  { name: 'Vodka', subCategories: ['Plain', 'Flavored', 'Premium'] },
  { name: 'Tequila', subCategories: ['Blanco', 'Reposado', 'Anejo'] },
  { name: 'RTD', subCategories: ['Canned Cocktail', 'Hard Seltzer', 'Fruit Punch'] },
];

export interface CategoryDto {
  name: string;
  subCategories: string[];
}
