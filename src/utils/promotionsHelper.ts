import { Product } from '../types';

/**
 * Validates whether a product currently has an active, valid discount.
 * Ensures:
 * - Product is available and in stock
 * - Promotion is explicitly active (discountActive !== false)
 * - Has a valid originalPrice greater than selling price (or isDiscounted is true)
 * - If discountStartDate is set, current time must be >= start date
 * - If discountEndDate is set, current time must be <= end of that day/date
 */
export function isProductDiscountActive(product: Partial<Product>, now: Date = new Date()): boolean {
  if (product.isAvailable === false || (product.stock !== undefined && product.stock <= 0)) {
    return false;
  }

  // Deactivated manually
  if (product.discountActive === false) {
    return false;
  }

  const price = typeof product.price === 'number' ? product.price : 0;
  const originalPrice = typeof product.originalPrice === 'number' ? product.originalPrice : undefined;

  // Must have a genuine discount (originalPrice > price) or explicit discount flag
  const hasPriceDiscount = originalPrice !== undefined && originalPrice > price;
  if (!hasPriceDiscount && !product.isDiscounted) {
    return false;
  }

  // Check start date (if specified)
  if (product.discountStartDate) {
    const startDate = new Date(product.discountStartDate);
    if (!isNaN(startDate.getTime()) && now < startDate) {
      return false; // Scheduled for the future
    }
  }

  // Check end date (if specified)
  if (product.discountEndDate) {
    let endDateStr = product.discountEndDate;
    // If format is YYYY-MM-DD, set to 23:59:59 of that day
    if (/^\d{4}-\d{2}-\d{2}$/.test(endDateStr)) {
      endDateStr = `${endDateStr}T23:59:59.999`;
    }
    const endDate = new Date(endDateStr);
    if (!isNaN(endDate.getTime()) && now > endDate) {
      return false; // Expired
    }
  }

  return true;
}

/**
 * Validates whether a product is marked as New Arrival and is available.
 */
export function isProductNewArrival(product: Partial<Product>): boolean {
  if (product.isAvailable === false || (product.stock !== undefined && product.stock <= 0)) {
    return false;
  }
  return Boolean(product.isNewArrival);
}

/**
 * Computes discount percentage accurately (e.g. 15 for 15%).
 */
export function calculateDiscountPercentage(originalPrice?: number, currentPrice?: number): number {
  if (!originalPrice || !currentPrice || originalPrice <= currentPrice) {
    return 0;
  }
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Returns human-readable promotion schedule status for admin & badges.
 */
export function getPromotionScheduleStatus(product: Partial<Product>, now: Date = new Date()): {
  status: 'active' | 'scheduled' | 'expired' | 'disabled' | 'none';
  label: string;
  badgeClass: string;
} {
  if (!product.isDiscounted && !product.originalPrice) {
    return { status: 'none', label: 'Nessun Sconto', badgeClass: 'bg-stone-100 text-stone-600' };
  }

  if (product.discountActive === false) {
    return { status: 'disabled', label: 'Disattivato', badgeClass: 'bg-stone-200 text-stone-700' };
  }

  if (product.discountStartDate) {
    const start = new Date(product.discountStartDate);
    if (!isNaN(start.getTime()) && now < start) {
      return { 
        status: 'scheduled', 
        label: `Inizia il ${formatDateToItalian(product.discountStartDate)}`, 
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' 
      };
    }
  }

  if (product.discountEndDate) {
    let endDateStr = product.discountEndDate;
    if (/^\d{4}-\d{2}-\d{2}$/.test(endDateStr)) {
      endDateStr = `${endDateStr}T23:59:59.999`;
    }
    const end = new Date(endDateStr);
    if (!isNaN(end.getTime()) && now > end) {
      return { 
        status: 'expired', 
        label: `Scaduto il ${formatDateToItalian(product.discountEndDate)}`, 
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' 
      };
    }
  }

  if (isProductDiscountActive(product, now)) {
    return { 
      status: 'active', 
      label: 'Sconto Attivo', 
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' 
    };
  }

  return { status: 'none', label: 'Nessun Sconto', badgeClass: 'bg-stone-100 text-stone-600' };
}

/**
 * Formats ISO or YYYY-MM-DD date into Italian locale (e.g., 20 Ottobre 2026).
 */
export function formatDateToItalian(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}
