import { IMAGES } from '../assets/images';

function escapeXml(str: string): string {
  return str.replace(/[<>&"']/g, '');
}

function wrapTitle(text: string, maxCharsPerLine = 26): [string, string] {
  const clean = text.trim();
  if (clean.length <= maxCharsPerLine) return [clean, ''];
  const words = clean.split(/\s+/);
  let line1 = '';
  let line2 = '';
  for (const word of words) {
    if ((line1 + ' ' + word).trim().length <= maxCharsPerLine && !line2) {
      line1 = (line1 + ' ' + word).trim();
    } else {
      line2 = (line2 + ' ' + word).trim();
    }
  }
  if (!line1) {
    line1 = clean.slice(0, maxCharsPerLine);
    line2 = clean.slice(maxCharsPerLine);
  }
  if (line2.length > maxCharsPerLine) {
    line2 = line2.slice(0, maxCharsPerLine - 1).trimEnd() + '…';
  }
  return [line1, line2];
}

export function createNeutralPlaceholderSvg(
  categoryName: string,
  productName: string = '',
  brand: string = '',
  itemNumber?: number,
  packageSize?: string
): string {
  const safeBrand = (brand && brand !== 'Non identificata' && brand !== 'Non leggibile' ? brand : '').trim();
  const safeCategory = escapeXml((categoryName || 'Mama Sam').trim().substring(0, 30));
  const [rawLine1, rawLine2] = wrapTitle(productName || 'Articolo Mama Sam', 26);
  const line1 = escapeXml(rawLine1);
  const line2 = escapeXml(rawLine2);
  const safeBrandXml = escapeXml(safeBrand.substring(0, 26));
  const safeSize = packageSize && !packageSize.toLowerCase().includes('da verificare')
    ? escapeXml(packageSize.substring(0, 26))
    : '';
  const itemBadge = itemNumber != null ? `#${String(itemNumber).padStart(2, '0')}` : '';

  // Subtle deterministic accent per product so each placeholder feels distinct while cohesive
  const seedStr = `${itemNumber ?? ''}-${productName}-${categoryName}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash + seedStr.charCodeAt(i)) | 0;
  }
  const tints = [
    ['#f6f5f0', '#ece8dd', '#124b2e'],
    ['#f4f6f3', '#e7ede8', '#14532d'],
    ['#f7f4ef', '#eee6da', '#1b4332'],
    ['#f5f5f2', '#e9eae3', '#0f4c3a']
  ];
  const [bgStart, bgEnd, accent] = tints[Math.abs(hash) % tints.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}"/>
        <stop offset="100%" stop-color="${bgEnd}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#bg)"/>
    <rect x="18" y="18" width="364" height="364" rx="22" fill="#ffffff" fill-opacity="0.55" stroke="#d6d3c9" stroke-width="1.25"/>
    ${itemBadge ? `<rect x="34" y="34" width="48" height="24" rx="8" fill="${accent}" fill-opacity="0.1"/>
    <text x="58" y="50" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="${accent}" text-anchor="middle">${escapeXml(itemBadge)}</text>` : ''}
    <g transform="translate(164, 78)">
      <circle cx="36" cy="36" r="34" fill="${accent}" fill-opacity="0.07"/>
      <circle cx="36" cy="36" r="26" fill="#ffffff" stroke="${accent}" stroke-opacity="0.35" stroke-width="1.5"/>
      <path d="M26 31 L30 27 L42 27 L46 31 L49 31 A2.5 2.5 0 0 1 51.5 33.5 L51.5 45.5 A2.5 2.5 0 0 1 49 48 L23 48 A2.5 2.5 0 0 1 20.5 45.5 L20.5 33.5 A2.5 2.5 0 0 1 23 31 Z" fill="none" stroke="${accent}" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="36" cy="39" r="5.5" fill="none" stroke="${accent}" stroke-width="1.8"/>
    </g>
    <g transform="translate(200, 178)">
      <rect x="-105" y="-12" width="210" height="23" rx="11.5" fill="${accent}" fill-opacity="0.09"/>
      <text x="0" y="3.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="${accent}" text-anchor="middle" letter-spacing="0.4">${safeCategory.toUpperCase()}</text>
    </g>
    ${safeBrandXml ? `<text x="200" y="216" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#57534e" text-anchor="middle">${safeBrandXml}</text>` : ''}
    <text x="200" y="${safeBrandXml ? 242 : 226}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" fill="#1c1917" text-anchor="middle">${line1}</text>
    ${line2 ? `<text x="200" y="${safeBrandXml ? 263 : 247}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" fill="#1c1917" text-anchor="middle">${line2}</text>` : ''}
    ${safeSize ? `<text x="200" y="${line2 ? 290 : 272}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="600" fill="#78716c" text-anchor="middle">${safeSize}</text>` : ''}
    <g transform="translate(200, 342)">
      <rect x="-98" y="-13" width="196" height="24" rx="12" fill="#f5f5f4" stroke="#e7e5e4" stroke-width="1"/>
      <text x="0" y="3" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600" fill="#57534e" text-anchor="middle">Foto autentica in aggiornamento</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Checks whether an image reference represents an authentic product photo
 * rather than a shared category banner key or empty value.
 */
export function isGenuineProductImage(imageKey?: string | null, imageStatus?: string): boolean {
  if (!imageKey || typeof imageKey !== 'string') return false;
  const trimmed = imageKey.trim();
  if (!trimmed || trimmed.startsWith('cat')) return false;

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/api/uploads/')
  ) {
    return true;
  }

  if (trimmed.startsWith('data:image/') && !trimmed.startsWith('data:image/svg+xml')) {
    return true;
  }

  if (imageStatus === 'missing') return false;

  return trimmed in IMAGES.products;
}

/**
 * Resolves a single product's unique image.
 * Never maps unrelated products onto shared category banner photos.
 */
export function resolveProductImage(product: {
  image?: string | null;
  imageStatus?: string;
  category?: string;
  name?: string;
  brand?: string;
  itemNumber?: number;
  packageSize?: string;
}): string {
  const key = product.image?.trim() || '';

  if (isGenuineProductImage(key, product.imageStatus)) {
    if (key in IMAGES.products) {
      return IMAGES.products[key as keyof typeof IMAGES.products];
    }
    return key;
  }

  return createNeutralPlaceholderSvg(
    product.category || 'Mama Sam',
    product.name || '',
    product.brand || '',
    product.itemNumber,
    product.packageSize
  );
}

/**
 * Resolves storefront banners, categories, recipes, or uploaded image URLs.
 */
export function resolveImage(
  imageKey: string,
  category?: string,
  name?: string,
  brand?: string
): string {
  if (!imageKey) {
    return createNeutralPlaceholderSvg(category || 'Mama Sam', name, brand);
  }

  if (imageKey.startsWith('http') || imageKey.startsWith('/api/uploads/') || imageKey.startsWith('data:')) {
    return imageKey;
  }

  // General storefront & category banners
  if (imageKey === 'heroShopkeeper') return IMAGES.heroShopkeeper;
  if (imageKey === 'storefrontShop') return IMAGES.storefrontShop;
  if (imageKey === 'catTubers') return IMAGES.categories.tubers;
  if (imageKey === 'catGrains') return IMAGES.categories.grains;
  if (imageKey === 'catFishMeats') return IMAGES.categories.fishMeats;
  if (imageKey === 'catSpicesOil') return IMAGES.categories.spicesOil;
  if (imageKey === 'catMaltDrinks') return IMAGES.categories.maltDrinks;
  if (imageKey === 'catSnacks') return IMAGES.categories.snacks;
  if (imageKey === 'catCosmetics') return IMAGES.categories.cosmetics;
  if (imageKey in IMAGES.categories) {
    return IMAGES.categories[imageKey as keyof typeof IMAGES.categories];
  }

  // Recipe images
  if (imageKey === 'jollofRice') return IMAGES.jollofRice;
  if (imageKey === 'egusiSoup') return IMAGES.egusiSoup;
  if (imageKey === 'pepperSoup') return IMAGES.pepperSoup;
  if (imageKey === 'okraSoup') return IMAGES.okraSoup;

  // Dedicated product keys (for recipe ingredient thumbnails)
  if (imageKey in IMAGES.products) {
    return IMAGES.products[imageKey as keyof typeof IMAGES.products];
  }

  return createNeutralPlaceholderSvg(category || 'Mama Sam', name, brand);
}
