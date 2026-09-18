import mongoose from 'mongoose';
import { PrismaClient } from '@prisma/client';

interface ProductSeed {
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
}

const img = (slug: string): string => `https://placehold.co/600x800/1a1a1e/f5d892?text=${encodeURIComponent(slug)}`;

const u = (
  name: string,
  category: string,
  subCategory: string,
  brand: string,
  origin: string,
  abv: number,
  volumeMl: number,
  price: number,
  flavorTags: string[],
  tastingNotes: string,
  foodPairings: string[],
  description: string,
  popcorn = 50,
  rating = 4.0,
  stock = 24,
  compareAtPrice?: number,
  occasionTags: string[] = [],
): ProductSeed => ({
  name, category, subCategory, brand, origin, abv, volumeMl, price, compareAtPrice,
  flavorTags, tastingNotes, foodPairings, stock, popularity: popcorn, rating,
  image: img(name), description, occasionTags,
});

export const CATEGORY_SEED = [
  { name: 'Beer', subCategories: ['Lager', 'IPA', 'Wheat', 'Stout', 'Pale Ale'] },
  { name: 'Wine', subCategories: ['Red', 'White', 'Rose', 'Sparkling', 'Dessert'] },
  { name: 'Whisky', subCategories: ['Single Malt', 'Blended', 'Bourbon', 'Scotch', 'Irish'] },
  { name: 'Rum', subCategories: ['White Rum', 'Dark Rum', 'Spiced Rum', 'Aged Rum'] },
  { name: 'Gin', subCategories: ['London Dry', 'Flavored', 'Craft Gin'] },
  { name: 'Vodka', subCategories: ['Plain', 'Flavored', 'Premium'] },
  { name: 'Tequila', subCategories: ['Blanco', 'Reposado', 'Anejo'] },
  { name: 'RTD', subCategories: ['Canned Cocktail', 'Hard Seltzer', 'Fruit Punch'] },
];

export const PRODUCT_SEED: ProductSeed[] = [
  // ---- Beer (10) ----
  u('King of Lagers Premium', 'Beer', 'Lager', 'Kraken Brew', 'India', 5, 650, 110, ['crisp', 'grain', 'sweet'],
    'Clean, malty grain with a crisp dry finish and light bitterness.',
    ['Tandoori chicken', 'Burgers', 'Biryani'],
    'A dependable Indian lager built for hot evenings — refreshing, light and smooth.', 98, 4.1, 60, 130),
  u('Hopus Maximus IPA', 'Beer', 'IPA', 'Hop Republic', 'USA', 6.5, 330, 320, ['hoppy', 'citrus', 'bitter', 'piney'],
    'Explosive grapefruit, mango and pine with a firm bitter backbone.',
    ['Spicy chicken wings', 'Blue cheese', 'Tacos'],
    'A West Coast style IPA for hop heads — pungent citrus and resinous pine throughout.', 85, 4.5),
  u('Hazy Sunrise NEIPA', 'Beer', 'IPA', 'Hop Republic', 'USA', 6.8, 330, 340, ['hoppy', 'tropical', 'citrus', 'smooth'],
    'Juicy mango, passionfruit and orange with a silky oat body.',
    ['Thai curry', 'Grilled prawns', 'Nachos'],
    'Low-bitterness, ultra-juicy New England IPA bursting with tropical fruit.', 76, 4.6),
  u('Weiss Ritual Wheat', 'Beer', 'Wheat', 'Pour Ritual', 'Germany', 5.4, 500, 260, ['banana', 'clove', 'smooth', 'spicy'],
    'Classic Bavarian banana esters, clove spice and a pillowy wheat body.',
    ['Bratwurst', 'Pretzels', 'Salad'],
    'Traditional German hefeweizen with beguiling banana-clovey aromatics.', 60, 4.3),
  u('Midnight Cacao Stout', 'Beer', 'Stout', 'Hop Republic', 'India', 6.2, 330, 300, ['roasty', 'chocolate', 'coffee', 'creamy'],
    'Dark chocolate, roasted coffee and a lush oat-creamed body.',
    ['Chocolate desserts', 'Grilled steak', 'Aged cheddar'],
    'Full-bodied stout Alternately brewed with real cacao nibs for dessert-level richness.', 52, 4.4),
  u('Sierra Mist Pale Ale', 'Beer', 'Pale Ale', 'BrewCaravan', 'India', 5.2, 330, 240, ['hoppy', 'citrus', 'biscuity'],
    'Balanced malts with stonefruit and a hint of pine bitterness.',
    ['Pizza', 'Burgers', 'Roast chicken'],
    'An easy-going American pale ale — the everyday craft choice.', 65, 4.2),
  u('Alpine Bock Gold', 'Beer', 'Lager', 'Pour Ritual', 'Austria', 6.7, 500, 290, ['malty', 'toffee', 'smooth'],
    'Rich Munich malt, warm toffee and a clean chance of noble hops.',
    ['Pork chops', 'Alpine cheese', 'Sausages'],
    'A stronger, warming lager brewed in the Bavarian bock tradition.', 40, 4.0),
  u('Bira White', 'Beer', 'Wheat', 'Bira 91', 'India', 4.7, 330, 160, ['citrus', 'coriander', 'smooth'],
    'Fresh coriander zest and orange peel India favorite.',
    ['Seafood', 'Salads', 'Light snacks'],
    'India go-to white beer — citrusy, soft and endlessly crushable.', 95, 4.2, 80, 190),
  u('Guinness Fire Dragon', 'Beer', 'Stout', 'Guinness', 'Ireland', 4.2, 330, 280, ['roasty', 'coffee', 'dry', 'creamy'],
    'Burnt toast bitterness, roasted coffee and a smooth nitro cascade.',
    ['Oysters', 'Steak-and-ale pie', 'Irish stew'],
    'The Dublin classic — silky dark stout with UNESCO heritage character.', 80, 4.7),
  u('Coconut Beach Ale', 'Beer', 'Pale Ale', 'BrewCaravan', 'India', 4.9, 330, 250, ['nutty', 'tropical', 'smooth'],
    'Toasted coconut over a light caramel malt body.',
    ['Grilled fish', 'Coconut curry', 'Fish tacos'],
    'A beachy pale ale with real toasted coconut — an instant vacation.', 45, 4.1),
  // ---- Wine (10) ----
  u('Stonehill Cabernet Sauvignon', 'Wine', 'Red', 'Stonehill Estates', 'Chile', 13.5, 750, 1250, ['oaky', 'black fruit', 'dry', 'tannic'],
    'Cassis, black cherry and cedar with structured tannins.',
    ['Grilled lamb', 'Roast beef', 'Hard cheeses'],
    'Full-bodied Chilean cabernet over French oak for confident red warmth.', 70, 4.3, 30, 1400),
  u('Terrace Merlot Reserve', 'Wine', 'Red', 'Terrace Wines', 'India', 12.5, 750, 890, ['plum', 'soft tannins', 'fruity'],
    'Ripe plum, blackberry and cocoa with a gentle finish.',
    ['Pasta bolognese', 'Mushroom dishes', 'Pizza'],
    'An approachable Indian red for pizza nights and casual dinners.', 75, 4.1),
  u('Ruisseau Sauvignon Blanc', 'Wine', 'White', 'Ruisseau', 'New Zealand', 12.5, 750, 1490, ['citrus', 'grassy', 'dry', 'tropical'],
    'Passionfruit, lime zest and cut grass with electric acidity.',
    ['Goat cheese', 'Oysters', 'Grilled fish'],
    'Marlborough Abbey-crisp sauvignon blanc bursting with grapefruit.', 68, 4.5),
  u('Sunvale Chardonnay', 'Wine', 'White', 'Sunvale Cellars', 'Australia', 12.5, 750, 950, ['buttery', 'oaky', 'citrus'],
    'Golden apple, warm butter and toasted oak sweetness.',
    ['Roast chicken', 'Butter prawns', 'Creamy pasta'],
    'A crowd-friendly oaked chardonnay with roundness and richness.', 58, 4.2),
  u('Blush Sunset Rose', 'Wine', 'Rose', 'Stonehill Estates', 'France', 12, 750, 1100, ['strawberry', 'dry', 'floral'],
    'Crushed strawberry, rose petal and a whisper of citrus.',
    ['Salads', 'Seafood', 'Summer BBQ'],
    'Pale Mediterranean style rosé made for daytime sunshine sipping.', 62, 4.2),
  u('Solitaire Sparkling Cuvee', 'Wine', 'Sparkling', 'Solitaire', 'Italy', 11.5, 750, 1350, ['crisp', 'pear', 'biscuit'],
    'Green apple and pear over fine persistent bubbles.',
    ['Canapes', 'Fried food', 'Celebration cake'],
    'Special-day bubbles: a fresh and toasty Italian sparkling cuvee.', 55, 4.4, 25),
  u('Velvet Merlot Box 1L', 'Wine', 'Red', 'Terrace Wines', 'India', 12.5, 1000, 750, ['plum', 'easy', 'soft'],
    'Juicy plummy fruit in a bigger, better-value format.',
    ['Weeknight curries', 'Burgers', 'Pizza'],
    'The same friendly merlot in a family-size 1L box — best value on the shelf.', 80, 3.9, 40, 950),
  u('Late Harvest Dessert Wine', 'Wine', 'Dessert', 'Sunvale Cellars', 'India', 11, 375, 620, ['honey', 'apricot', 'sweet'],
    'Apricot, honey and orange blossom with a silky sweetness.',
    ['Blue cheese', 'Fruit tart', 'Crème brûlée'],
    'A delicate late-harvest sweet — dessert in a glass.', 35, 4.2, 18),
  u('Pinot Embers Pinot Noir', 'Wine', 'Red', 'Ruisseau', 'France', 13, 750, 1690, ['cherry', 'earthy', 'silky'],
    'Bright red cherry, forest floor and silky, gentle tannins.',
    ['Salmon', 'Mushroom risotto', 'Duck'],
    'A graceful pinot noir with Burgundy-ish elegance and soft spice.', 48, 4.5, 20),
  u('Nero d Avola Classico', 'Wine', 'Red', 'Terrace Wines', 'Italy', 13.2, 750, 1020, ['dark fruit', 'spicy', 'dry'],
    'Sicilian black plum, dried herbs and warming spice.',
    ['Pasta arrabbiata', 'Char-grilled vegetables', 'Cheesy pizza'],
    'A rustic Sicilian red with generous dark fruit and real Italian character.', 50, 4.3),
  // ---- Whisky (10) ----
  u('Glenmara Highland 10', 'Whisky', 'Single Malt', 'Glenmara Distillery', 'Scotland', 40, 700, 5900, ['fruity', 'honey', 'oaky', 'smooth'],
    'Orchard fruit, gentle honey and soft vanilla oak. The no-smoke gateway malt.',
    ['Smoked salmon', 'Salted chocolate', 'Cheese boards'],
    'A friendly 10-year Highland single malt — approachable and elegant.', 65, 4.6, 22, 6500,
    ['celebration', 'evening']),
  u('Peat Ember Ardbeg Style', 'Whisky', 'Scotch', 'Ileach Distillers', 'Scotland', 46, 700, 7400, ['smoky', 'peaty', 'medicinal', 'oaky'],
    'In-sweet-tit bonfire peat, seaweed and a citrus lift. An island monster.',
    ['Oysters', 'Strong cheese', 'Charred meat'],
    'For peatheads: heavy guise smoke and ash queues that begin great fascinations.', 45, 4.7, 15,
    undefined, ['evening']),
  u('Bourbon Bandito Barrel Proof', 'Whisky', 'Bourbon', 'Ropadero Distillery', 'USA', 55, 750, 4350, ['caramel', 'vanilla', 'oaky', 'spicy'],
    'Sticky caramel corn, vanilla frosting and a rye-kick of cinnamon.',
    ['BBQ ribs', 'Cigar room', 'Dark chocolate'],
    'A bold cask-strength Kentucky bourbon for big flavor evenings.', 55, 4.5, 18),
  u('Casa Swift Irish Whiskey', 'Whisky', 'Irish', 'Swift & Sons', 'Ireland', 40, 700, 3200, ['honey', 'fruity', 'smooth', 'light'],
    'Apple, honey and toasted grain with an exceptionally soft finish.',
    ['Irish coffee', 'Dessert pairing', 'Light snacks'],
    'Triple-distilled Irish smoothness — famously easy to sip.', 70, 4.4, 28),
  u('Copper Shield Blended 12', 'Whisky', 'Blended', 'Copper Shield', 'India', 40, 750, 2600, ['honey', 'smoky', 'rounded', 'dry'],
    'Malted bread, orchard fruit, wisps of smoke and oiled oak.',
    ['Chicken tikka', 'Steak', 'Crackers'],
    'A well-built 12-year blended scotch with layers and great value.', 78, 4.3, 35, 2900),
  u('Jasmine Peak Peaty Dram', 'Whisky', 'Single Malt', 'Peak Distillers', 'Scotland', 43, 700, 8900, ['peaty', 'maritime', 'spicy', 'sherry'],
    'Rich sherry sweetness soaked in bonfire coal and sea salt.',
    ['Dark chocolate', 'Smoked duck', 'Walnuts'],
    'A sherried, peated Highland malt for the adventurous palate.', 40, 4.6, 12,
    undefined, ['celebration']),
  u('Ropadero Rum Cask 14', 'Whisky', 'Single Malt', 'Glenmara Distillery', 'Scotland', 46, 700, 12500, ['sherry', 'dried fruit', 'chocolate', 'oaky'],
    'Dark sherry, raisins, orange peel and warming oak spice.',
    ['Chocolate', 'Cigars', 'Stilton'],
    'A prestige rum-cask single malt for truly special evenings.', 30, 4.8, 8,
    undefined, ['celebration']),
  u('Monsoon Malt Whisky 750', 'Whisky', 'Blended', 'Raag Distillers', 'India', 42.8, 750, 1500, ['grain', 'mild', 'smooth', 'vanilla'],
    'Light grain sweetness, faint vanilla and everyday drinkability.',
    ['Tandoori', 'Masala peanuts', 'Desi snacks'],
    'An honest, dependable Indian blended whisky at a friendly price.', 92, 3.9, 50),
  u('Golden Barrel Rye Whiskey', 'Whisky', 'Bourbon', 'Ropadero Distillery', 'USA', 50, 750, 3800, ['spicy', 'rye', 'caramel', 'bold'],
    'Wheat-rye spice, caramel and dry toasted oak in a bold frame.',
    ['Manhattan cocktails', 'Smoked brisket'],
    'A high-rye American whiskey — a backbone for Manhattan and Old Fashioned.', 42, 4.4, 16),
  u('Amber Corral Scotch 750', 'Whisky', 'Scotch', 'Copper Shield', 'Scotland', 40, 750, 1950, ['honey', 'citrus', 'light'],
    'Breakfast-y citrus and honeyed malt with barely-there smoke.',
    ['Morning pastries', 'Light salads', 'Canapes'],
    'A gentle everyday scotch — light-bodied and easy on the wallet.', 85, 3.9, 42),
  // ---- Rum (8) ----
  u('Caribbean Pearl White Rum', 'Rum', 'White Rum', 'Pearl Caribbean', 'Barbados', 42, 750, 1250, ['sweet', 'sugarcane', 'clean'],
    'Bright cane juice sweetness with a clean, dry finish.',
    ['Mojitos', 'Fish tacos', 'Tropical food'],
    'The mojito essential — light, clear and mixable.', 88, 4.1, 45),
  u('Old Clipper Dark Rum', 'Rum', 'Dark Rum', 'Clipper & Sons', 'Jamaica', 40, 750, 1800, ['caramel', 'molasses', 'oaky'],
    'Molasses, caramel and baked banana from Jamaican pot stills.',
    ['Cola-cubes', 'Rich desserts', 'Barbecued pork'],
    'A pot-still dark rum with old trade-route character.', 72, 4.3, 30),
  u('Port Vanguard Spiced Rum', 'Rum', 'Spiced Rum', 'Vanguard Rum Co', 'Guyana', 38, 750, 1650, ['spiced', 'vanilla', 'caramel', 'warm'],
    'Vanilla, cinnamon, nutmeg over a caramel-sweet base.',
    ['Ginger beer', 'Cola', 'Spiced desserts'],
    'Ready for rum-and-ginger weekends with a warming spice profile.', 80, 4.2, 38),
  u('Solera Aged Rum 12', 'Rum', 'Aged Rum', 'Solera Barrel Co', 'Nicaragua', 40, 700, 4200, ['dried fruit', 'chocolate', 'oaky', 'smooth'],
    'Orchard of dried fruit, coffee and cacao from solera ageing.',
    ['Cigars', 'Dark chocolate', 'Aged cheese'],
    'A 12-year solera rum built to sip like a fine brandy.', 40, 4.6, 14),
  u('Coco Tempo Coconut Rum', 'Rum', 'Flavored', 'Pearl Caribbean', 'Trinidad', 30, 750, 1350, ['coconut', 'tropical', 'sweet', 'fruity'],
    'Fresh coconut and pineapple on a beach-ready body.',
    ['Pina colada', 'Tropical juice', 'Beach bbq'],
    'Coconut-forward flavored rum — a straight-to-colada shortcut.', 66, 4.0, 30),
  u('Havana Club 7 Style', 'Rum', 'Aged Rum', 'Cubano Heritage', 'Cuba', 40, 700, 2400, ['caramel', 'tobacco', 'vanilla'],
    'Cuban charred oak, caramel sweetness and tobacco-ish depth.',
    ['Cuban cigars', 'Coffee desserts'],
    'Seven-year Cuban-style rum — refined and complexity-laden.', 60, 4.5, 22),
  u('Sugar Cartel Overproof', 'Rum', 'White Rum', 'Clipper & Sons', 'Jamaica', 63, 750, 1950, ['intense', 'sugarcane', 'grassy'],
    'Full-throttle cane, blue cheese funk, designed for punch.',
    ['Punch', 'Prohibition cocktails'],
    'An overproof built for cocktails with serious backbone — sip with respect.', 50, 4.0, 20),
  u('Monkey Dial Banana Rum', 'Rum', 'Flavored', 'Vanguard Rum Co', 'Caribbean', 40, 700, 2800, ['banana', 'sweet', 'tropical'],
    'Perfectly intense banana loaf notes layered over oak spices.',
    ['Pancakes', 'Banana desserts', 'Tiki drinks'],
    'The cult banana rum — massive flavor in daiquiris and desserts.', 58, 4.4, 24),
  // ---- Gin (8) ----
  u('Lighthouse London Dry Gin', 'Gin', 'London Dry', 'Admiralty Spirits', 'UK', 43, 750, 2200, ['juniper', 'citrus', 'botanical', 'dry'],
    'Assertive juniper, bright citrus peel and coriander with a crisp finish.',
    ['Tonic water', 'Salty snacks', 'Seafood'],
    'A classic, no-nonsense London dry built for martinis and G&Ts.', 82, 4.4, 34),
  u('Bindi Botanicals Craft Gin', 'Gin', 'Craft Gin', 'Bindi Distillery', 'India', 42, 700, 3200, ['botanical', 'citrus', 'spicy', 'cardamom'],
    'Indian cardamom, coriander seed and jubilant lime peel.',
    ['Tonic', 'Spiced curries', 'Papad science'],
    'An Indian craft gin distilled with regional botanicals including Himalayan juniper.', 60, 4.5, 20),
  u('Rose Window Pink Gin', 'Gin', 'Flavored', 'Admiralty Spirits', 'UK', 40, 700, 2600, ['floral', 'fruity', 'rose', 'soft'],
    'Rose petals, pomegranate and a soft, comfortable finish.',
    ['Lemonade', 'Strawberries', 'Light desserts'],
    'A romantic pink gin built for spritzes and sunshine sipping.', 64, 4.2, 26),
  u('Old assured Navy Strength', 'Gin', 'London Dry', 'Admiralty Spirits', 'UK', 57, 700, 3400, ['juniper', 'bold', 'citrus'],
    'Concentrated juniper and coriander — naval-proof intensity.',
    ['Cocktails', 'Bold tonics'],
    'Historical 57% navy-strength gin — built to extra-bold drinks.', 44, 4.5, 18),
  u('Citrus Circuit Grape Gin', 'Gin', 'Flavored', 'Bindi Distillery', 'India', 41, 700, 2950, ['citrus', 'grape', 'fresh'],
    'Grape must, lemon blossom and a soft juniper spine.',
    ['Prosecco', 'tonic', 'Mediterranean food'],
    'A fruit-forward grape gin — a modern, glossy, summer-driven style.', 52, 4.1, 24),
  u('Fern & Fog Cucumber Gin', 'Gin', 'Flavored', 'Fern & Fog Distillery', 'UK', 43, 700, 3050, ['fresh', 'cucumber', 'herbal'],
    'Cool cucumber, mint and a whisper of angelica.',
    ['Cucumber garnish', 'Sushi', 'Salads'],
    'Summer-type garden gin — cooling, tender and relentlessly smooth.', 55, 4.3, 22),
  u('Ferment Daisy Sloe Gin', 'Gin', 'Flavored', 'Bindi Distillery', 'India', 30, 700, 2700, ['fruity', 'sour', 'berry', 'sweet'],
    'Brambled sloe berry and plum-crumbs over juniper.',
    ['Mulled wine nights', 'Autumn evening'],
    'Sweet sloe-berry gin — lovely autumn sipper or Bramble base.', 48, 4.3, 20),
  u('Yeti Gin Alpin', 'Gin', 'Craft Gin', 'Fern & Fog Distillery', 'India', 44, 700, 3500, ['juniper', 'alpine', 'spicy'],
    'Juniper plus montane pine and chamomile honey accents.',
    ['Winter tonics', 'Rich hot chocolate'],
    'A high-altitude inspired craft gin — alpine in spirit and frame.', 38, 4.4, 16),
  // ---- Vodka (8) ----
  u('Polar Pure Classic Vodka', 'Vodka', 'Plain', 'North Grain', 'Poland', 40, 750, 1500, ['clean', 'grain', 'dry'],
    'Neutral grain sweetness with a crisp, palate-watering finish.',
    ['Bloody mary', 'Citrus wedges', 'Polish pickles'],
    'The reliable all-season raw Polish plain — drinks cold and true.', 90, 4.0, 48),
  u('Berry Pixie Infused Vodka', 'Vodka', 'Flavored', 'North Grain', 'Poland', 37.5, 700, 1650, ['berry', 'fruity', 'sweet'],
    'Raspberry, strawberry and cranberry on a light grain base.',
    ['Cranberry juice', 'Fruit punch', 'Spritzes'],
    'A fruit-drenched vodka perfect for berry cocktails.', 70, 4.1, 32),
  u('Highland Frost Premium Vodka', 'Vodka', 'Premium', 'Baltic Reserve', 'Sweden', 40, 750, 2900, ['clean', 'smooth', 'luxury'],
    'Silk-smooth and cooling with a subtle daytime purity.',
    ['Chilled rocks', 'Caviar', 'Sushi'],
    'A luxury seven-times distilled vodka — famously cool and clean.', 62, 4.5, 24),
  u('Citrus Zephyr Lemon Vodka', 'Vodka', 'Flavored', 'North Grain', 'Poland', 40, 700, 1700, ['citrus', 'lemon', 'fresh'],
    'Lively lemon zest over a light, crisp base.',
    ['Lemon drops', 'Alfresco'],
    'A bright lemon-infused spirit built for hot-day highballs.', 60, 4.0, 26),
  u('Ghost Orange Vodka', 'Vodka', 'Flavored', 'Baltic Reserve', 'Sweden', 38, 700, 1550, ['orange', 'citrus', 'fresh'],
    'Orange-peel freshness with a soft creamed middle.',
    ['Screwdrivers', 'Sparkling mixers'],
    'Sunny orange peel vodka for working-bulk cocktails.', 55, 3.9, 30),
  u('Winter Wolf Chilli Vodka', 'Vodka', 'Flavored', 'North Grain', 'Ukraine', 40, 700, 1800, ['spicy', 'warm', 'pepper'],
    'Black pepper and chilli warmth over a grain backbone.',
    ['Bloody mary', 'Salty food'],
    'A pepper-kicked vodka for those who like a little chiaroscuro heat.', 40, 4.0, 20),
  u('Reserve Bottle Pressed Vodka', 'Vodka', 'Plain', 'Baltic Reserve', 'Finland', 45, 700, 2500, ['clean', 'dry', 'cold'],
    'Barley-neutral, lake-water filtered with a crisp cold finish.',
    ['Vodka martini', 'Raw oysters'],
    'Higher-proof Finnish vodka for the purist martini.', 48, 4.3, 22),
  u('Golden Glimmer Gold Leaf Vodka', 'Vodka', 'Premium', 'Golden Lounge Co', 'France', 40, 750, 4800, ['luxury', 'smooth', 'clean'],
    'Impossibly smooth with 24k gold flakes suspended for show.',
    ['Celebration party', 'Nightlife'],
    'A show-stopping luxury gift vodka — literally golden.', 30, 4.2, 12, 5500, ['celebration']),
  // ---- Tequila (5) ----
  u('Agave Fete Blanco', 'Tequila', 'Blanco', 'Agavero Co', 'Mexico', 40, 750, 3900, ['agave', 'citrus', 'fresh', 'peppery'],
    'Fresh-cut agave, lime and cracked pepper for margarita magic.',
    ['Margaritas', 'Tacos', 'Guacamole'],
    'A 100% blue agave Blanco — citrusy, expressive and clean.', 45, 4.4, 24),
  u('Agave Fete Reposado', 'Tequila', 'Reposado', 'Agavero Co', 'Mexico', 40, 750, 4600, ['agave', 'vanilla', 'oaky', 'sweet'],
    'Four months in oak for warm vanilla beside the agave.',
    ['Neat sipping', 'Mexican bowl'],
    'Six months rest in oak keeps the agave bright but adds vanilla warmth.', 38, 4.4, 18),
  u('Agave Fete Anejo', 'Tequila', 'Anejo', 'Agavero Co', 'Mexico', 40, 750, 6800, ['caramel', 'oaky', 'agave', 'smooth'],
    'Caramel, toffee and vanilla wrapped around baked agave.',
    ['Cigars', 'Mexican chocolate'],
    'A sipping ajejo rivaling good single malts in warm complexity.', 30, 4.6, 10),
  u('Lizard Lounge Blanco', 'Tequila', 'Blanco', 'Lizard Lounge', 'Mexico', 38, 700, 2900, ['agave', 'citrus', 'dry'],
    'Bright cantaloupe-agave with lime zest finish.',
    ['Paloma', 'Grilled corn'],
    'Value-priced Blanco that punches above its tag for mixing.', 52, 4.0, 26),
  u('Old Pepe Extra Anejo', 'Tequila', 'Anejo', 'Agavero Co', 'Mexico', 40, 700, 9800, ['oaky', 'caramel', 'chocolate', 'luxury'],
    'Old oak, caramel and toasted coconut in a sipping-grade extra anejo.',
    ['Neat snifter', 'Dessert courses'],
    'Five-plus years in barrel — the cognac-lover’s tequila.', 22, 4.7, 8, 11000, ['celebration']),
  // ---- RTD (8) ----
  u('Sunset Mojito RTD', 'RTD', 'Canned Cocktail', 'Sunset Social', 'India', 6.5, 250, 220, ['mint', 'citrus', 'sweet', 'refreshing'],
    'Mint-lime mojito with a gentle rum backbone.',
    ['Chill by the pool', 'House parties'],
    'A ready-to-drink mojito in a chilled can — perfect for picnics.', 100, 4.0, 80),
  u('Cloud Nine Seltzer Citrus', 'RTD', 'Hard Seltzer', 'Cloud Nine', 'USA', 5, 330, 200, ['citrus', 'dry', 'light', 'refreshing'],
    'Zero sugar, citrus-lime and a sparkling-exercise of flavor.',
    ['Fitness low-cal', 'Post-work hangout'],
    'A clean 30-cal hard seltzer with genuine citrus pop.', 95, 3.9, 75, 240),
  u('Berry Bloom Seltzer', 'RTD', 'Hard Seltzer', 'Cloud Nine', 'USA', 5, 330, 200, ['berry', 'light', 'refreshing', 'dry'],
    'Raspberries and blackcurrant lift in a no-sugar sparkling base.',
    ['Pool days', 'Netflix', 'Dates'],
    'The berry variety seltzer for fruit-forward hydration with a kick.', 80, 3.8, 65),
  u('Mango Punch RTD', 'RTD', 'Fruit Punch', 'Sunset Social', 'India', 5.9, 330, 190, ['mango', 'tropical', 'sweet', 'fruity'],
    'Alphonso mango, coconut undertone and a splash of rum.',
    ['Bollywood binge', 'Street BBQ', 'Birthday party'],
    'India-born tropical punch — mango-forward and picnic perfect.', 110, 4.1, 90, 210),
  u('Classic Lavender Mule RTD', 'RTD', 'Canned Cocktail', 'Sunset Social', 'India', 7, 250, 260, ['spicy', 'ginger', 'refreshing'],
    'Vodka-ginger mule with a bright and zippy lavender nod.',
    ['Aperitivo hour', 'Sunday brunch'],
    'A premium canned mule — copper-mug vibes without the copper mug.', 70, 4.2, 55),
  u('Aperitivo Channel Spritz', 'RTD', 'Canned Cocktail', 'Solitaire', 'Italy', 8, 250, 320, ['citrus', 'bitter', 'floral', 'fresh'],
    'Aperol-style bitterness, orange zest, and floral sparkle.',
    ['Terrace aperitif', 'Palm court party'],
    'The Italian aperitif hour in a can — spritz on the go.', 60, 4.3, 40),
  u('Tropical Wave Paloma', 'RTD', 'Canned Cocktail', 'Sunset Social', 'Mexico', 6, 250, 240, ['citrus', 'grapefruit', 'refreshing'],
    'Grapefruit, lime, and salt-kissed tequila in effervescent harmony.',
    ['Hot afternoons', 'Taco Tuesday'],
    'Salt-rim favorite Paloma, canned and travel ready.', 68, 4.2, 46),
  u('Beach Berry Spritzer', 'RTD', 'Hard Seltzer', 'Cloud Nine', 'USA', 4.5, 330, 190, ['berry', 'sweet', 'floral'],
    'Strawberry-cranberry kiss over gentle bubbles.',
    ['Beach days', 'Casual catch-ups'],
    'Low-ABV berry spritzer for easy, endless sipping.', 85, 3.7, 60),
];

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

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/drinkit';

async function main(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  const prisma = new PrismaClient();

  try {
    const db = mongoose.connection.getClient().db('drinkit');

    await db.dropCollection('products').catch(() => undefined);
    await db.dropCollection('cocktail_recipes').catch(() => undefined);

    const ProductModel = mongoose.model('Product', new mongoose.Schema({
      name: String, category: String, subCategory: String, brand: String, origin: String,
      abv: Number, volumeMl: Number, price: Number, compareAtPrice: Number,
      image: String, description: String, flavorTags: [String],
      tastingNotes: String, foodPairings: [String], occasionTags: [String],
      cocktailUses: [String], stock: Number, popularity: Number, rating: Number, isActive: Boolean,
    }, { collection: 'products' }));

    const CocktailModel = mongoose.model('CocktailRecipe', new mongoose.Schema({
      name: String, baseSpirit: String, ingredients: [String],
      instructions: String, flavorTags: [String],
    }, { collection: 'cocktail_recipes' }));

    const products = PRODUCT_SEED.map((p) => ({
      ...p,
      cocktailUses: COCKTAIL_SEED.filter((c) => c.baseSpirit.toLowerCase().startsWith(p.category.toLowerCase().slice(0, 3))).map((c) => c.name),
      isActive: true,
    }));

    await ProductModel.insertMany(products);
    await CocktailModel.insertMany(COCKTAIL_SEED);
    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.address.deleteMany();
    await prisma.user.deleteMany();

    const admin = await prisma.user.create({
      data: {
        email: 'admin@drinkit.dev',
        passwordHash: await (await import('bcryptjs')).hash('Admin@123', 10),
        name: 'DRINKit Admin',
        role: 'admin',
      },
    });

    const demo = await prisma.user.create({
      data: {
        email: 'demo@drinkit.dev',
        passwordHash: await (await import('bcryptjs')).hash('Demo@123', 10),
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

    console.log(`Seeded ${products.length} products, ${COCKTAIL_SEED.length} cocktail recipes, ${KNOWLEDGE_SEED.length} knowledge docs.`);
    console.log('Admin: admin@drinkit.dev / Admin@123 — Demo: demo@drinkit.dev / Demo@123');
  } finally {
    await prisma.$disconnect();
    await mongoose.disconnect();
  }
}

void main();
