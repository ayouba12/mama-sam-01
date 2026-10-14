import { IMAGES } from '../assets/images';

export function resolveImage(imageKey: string): string {
  if (!imageKey) return IMAGES.categories.tubers;

  // General & Storefront
  if (imageKey === 'heroShopkeeper') return IMAGES.heroShopkeeper;
  if (imageKey === 'storefrontShop') return IMAGES.storefrontShop;

  // Recipes
  if (imageKey === 'jollofRice') return IMAGES.jollofRice;
  if (imageKey === 'egusiSoup') return IMAGES.egusiSoup;
  if (imageKey === 'pepperSoup') return IMAGES.pepperSoup;
  if (imageKey === 'okraSoup') return IMAGES.okraSoup;

  // Category Banners
  if (imageKey === 'catTubers') return IMAGES.categories.tubers;
  if (imageKey === 'catGrains') return IMAGES.categories.grains;
  if (imageKey === 'catFishMeats') return IMAGES.categories.fishMeats;
  if (imageKey === 'catSpicesOil') return IMAGES.categories.spicesOil;
  if (imageKey === 'catMaltDrinks') return IMAGES.categories.maltDrinks;
  if (imageKey === 'catSnacks') return IMAGES.categories.snacks;
  if (imageKey === 'catCosmetics') return IMAGES.categories.cosmetics;

  // Dedicated Authentic Product Keys
  const productKeyMap: Record<string, string> = {
    sheaButter: IMAGES.products.sheaButter,
    yamFlour: IMAGES.products.yamFlour,
    punaYam: IMAGES.products.punaYam,
    ijebuGarri: IMAGES.products.ijebuGarri,
    maggiCubes: IMAGES.products.maggiCubes,
    maltaGuinness: IMAGES.products.maltaGuinness,
    chinChin: IMAGES.products.chinChin,
    palmOil1L: IMAGES.products.palmOil1L,
    yellowPlantains: IMAGES.products.yellowPlantains,
    smokedCatfish: IMAGES.products.smokedCatfish,
    longGrainRice: IMAGES.products.longGrainRice,
    stockfishCuts: IMAGES.products.stockfishCuts,
    jamaicanPatty: IMAGES.products.jamaicanPatty,
    plantainChips: IMAGES.products.plantainChips,
    zoboHibiscus: IMAGES.products.zoboHibiscus,
    blackSoap: IMAGES.products.blackSoap,
    scotchBonnets: IMAGES.products.scotchBonnets,
    freshOkra: IMAGES.products.freshOkra,
    cassavaRoots: IMAGES.products.cassavaRoots,
    greenPlantains: IMAGES.products.greenPlantains,
    honeyBeans: IMAGES.products.honeyBeans,
    yellowGarri: IMAGES.products.yellowGarri,
    palmOil5L: IMAGES.products.palmOil5L,
    crayfish: IMAGES.products.crayfish,
    supermalt: IMAGES.products.supermalt,
    goatMeat: IMAGES.products.goatMeat,
    palmWine: IMAGES.products.palmWine,
    ogbonoSeeds: IMAGES.products.ogbonoSeeds,
    braidingHair: IMAGES.products.braidingHair,
    suyaSpice: IMAGES.products.suyaSpice,
  };

  if (productKeyMap[imageKey]) {
    return productKeyMap[imageKey];
  }

  // Fallback if URL or already resolved
  if (imageKey.startsWith('http') || imageKey.startsWith('/') || imageKey.startsWith('data:')) {
    return imageKey;
  }

  return IMAGES.categories.tubers;
}
