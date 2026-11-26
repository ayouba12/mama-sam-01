import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ override: true });

function normalizeSupabaseUrl(raw?: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const dashboardMatch = trimmed.match(/project\/([a-z0-9_-]+)/i);
  if (dashboardMatch) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }
  return trimmed.replace(/\/+$/, '');
}

const rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = normalizeSupabaseUrl(rawUrl);
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const isServerSupabaseConfigured = (): boolean => {
  const hasUrl = Boolean(supabaseUrl && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('your-project'));
  const hasKey = Boolean((serviceRoleKey && serviceRoleKey.length > 20) || (anonKey && anonKey.length > 20));
  return hasUrl && hasKey;
};

// Initialize server-side Supabase client
// Prefers serviceRoleKey for privileged backend transactions and RLS bypass where appropriate
const activeKey = serviceRoleKey || anonKey;

export const supabaseServer: SupabaseClient | null = isServerSupabaseConfigured()
  ? createClient(supabaseUrl, activeKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

export interface SupabaseHealthStatus {
  configured: boolean;
  connected: boolean;
  apiReachable?: boolean;
  schemaReady?: boolean;
  hasServiceRoleKey: boolean;
  url: string;
  reason?: string;
  tables?: {
    products: number;
    categories: number;
    orders: number;
    settings: boolean;
    userRoles: boolean;
  };
  storageBucket?: {
    name: string;
    exists: boolean;
  };
  error?: string;
}

export async function testSupabaseConnection(): Promise<SupabaseHealthStatus> {
  if (!isServerSupabaseConfigured() || !supabaseServer) {
    return {
      configured: false,
      connected: false,
      apiReachable: false,
      schemaReady: false,
      hasServiceRoleKey: Boolean(serviceRoleKey),
      url: supabaseUrl ? supabaseUrl.replace(/https:\/\/[^.]+\./, 'https://***.') : 'Not configured',
      reason: 'Variabili SUPABASE_URL e chiavi API non ancora configurate nell’ambiente.'
    };
  }

  try {
    const [prodRes, catRes, ordRes, setRes, rolesRes, bucketRes] = await Promise.all([
      supabaseServer.from('products').select('id', { count: 'exact', head: true }),
      supabaseServer.from('categories').select('id', { count: 'exact', head: true }),
      supabaseServer.from('orders').select('id', { count: 'exact', head: true }),
      supabaseServer.from('store_settings').select('id').limit(1),
      supabaseServer.from('user_roles').select('id', { count: 'exact', head: true }),
      supabaseServer.storage.getBucket('product-images').catch(() => ({ data: null, error: null }))
    ]);

    const schemaReady =
      !prodRes.error &&
      !catRes.error &&
      !ordRes.error &&
      !setRes.error &&
      !rolesRes.error;

    const networkError =
      prodRes.error?.message?.toLowerCase().includes('fetch failed') ||
      prodRes.error?.code === 'PGRST301';
    const apiReachable = !networkError;
    const isConnected = apiReachable && schemaReady;

    const firstTableError =
      prodRes.error?.message ||
      catRes.error?.message ||
      ordRes.error?.message ||
      setRes.error?.message ||
      rolesRes.error?.message;

    let reason: string | undefined;
    if (!apiReachable) {
      reason = 'Impossibile raggiungere l’URL del progetto Supabase configurato.';
    } else if (!schemaReady) {
      reason =
        'Progetto Supabase collegato via API, ma le tabelle PostgreSQL non esistono ancora. Esegui lo script SQL di migrazione qui sotto nell’SQL Editor del nuovo progetto.';
    }

    return {
      configured: true,
      connected: isConnected,
      apiReachable,
      schemaReady,
      hasServiceRoleKey: Boolean(serviceRoleKey),
      url: supabaseUrl.replace(/https:\/\/([^.]+)\./, (_, id) => `https://${id.substring(0, 4)}***.`),
      reason,
      tables: {
        products: !prodRes.error ? (prodRes.count ?? 0) : 0,
        categories: !catRes.error ? (catRes.count ?? 0) : 0,
        orders: !ordRes.error ? (ordRes.count ?? 0) : 0,
        settings: !setRes.error,
        userRoles: !rolesRes.error
      },
      storageBucket: {
        name: 'product-images',
        exists: Boolean(bucketRes && bucketRes.data)
      },
      error: firstTableError
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      apiReachable: false,
      schemaReady: false,
      hasServiceRoleKey: Boolean(serviceRoleKey),
      url: supabaseUrl.replace(/https:\/\/([^.]+)\./, (_, id) => `https://${id.substring(0, 4)}***.`),
      reason: 'Errore di connessione verso il progetto Supabase.',
      error: err.message || 'Failed to ping Supabase backend.'
    };
  }
}

export function toFrontendProduct(row: any): any {
  if (!row) return row;
  return {
    id: row.id,
    itemNumber: row.item_number != null ? Number(row.item_number) : undefined,
    name: row.name,
    brand: row.brand || 'Non identificata',
    category: row.category,
    origin: row.origin || 'Importato',
    subCategory: row.sub_category,
    price: row.price != null ? Number(row.price) : null,
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    observedPrice: row.observed_price || null,
    priceStatus: row.price_status || (row.price != null ? 'confirmed' : 'unreadable'),
    purchasePrice: row.purchase_price != null ? Number(row.purchase_price) : null,
    verificationStatus: row.verification_status || 'da_verificare',
    packageSize: row.package_size || 'Formato da verificare',
    image:
      (!row.image_status || row.image_status === 'missing') &&
      typeof row.image === 'string' &&
      row.image.startsWith('cat')
        ? ''
        : (row.image ?? ''),
    imageStatus: row.image_status || 'missing',
    imageStoragePath: row.image_storage_path || null,
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    description: row.description || '',
    stock: row.stock != null ? Number(row.stock) : null,
    isAvailable: Boolean(row.is_available),
    featured: Boolean(row.featured),
    salesRank: Number(row.sales_rank ?? 0),
    ingredients: row.ingredients || row.expected_ingredients || '',
    expectedIngredients: row.expected_ingredients || row.ingredients || '',
    allergenInfo: row.allergen_info || row.allergens_alert || '',
    allergensAlert: row.allergens_alert || row.allergen_info || '',
    dietaryInfo: row.dietary_info || {},
    barcode: row.barcode || null,
    sku: row.sku || '',
    notes: row.notes || '',
    isNewArrival: Boolean(row.is_new_arrival),
    isDiscounted: Boolean(row.is_discounted),
    discountActive: row.discount_active !== false,
    discountStartDate: row.discount_start_date || undefined,
    discountEndDate: row.discount_end_date || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function toDbProduct(p: any): any {
  return {
    id: p.id,
    item_number: p.itemNumber != null ? Number(p.itemNumber) : null,
    name: p.name,
    brand: p.brand || 'Non identificata',
    category: p.category,
    origin: p.origin || 'Importato',
    sub_category: p.subCategory,
    price: p.price != null && p.price !== '' ? Number(p.price) : null,
    original_price: p.originalPrice != null && p.originalPrice !== '' ? Number(p.originalPrice) : null,
    observed_price: p.observedPrice || null,
    price_status: p.priceStatus || (p.price != null ? 'confirmed' : 'unreadable'),
    purchase_price: p.purchasePrice != null && p.purchasePrice !== '' ? Number(p.purchasePrice) : null,
    verification_status: p.verificationStatus || 'da_verificare',
    package_size: p.packageSize || 'Formato da verificare',
    image: typeof p.image === 'string' ? p.image : '',
    image_status: p.imageStatus || 'missing',
    image_storage_path: p.imageStoragePath || null,
    gallery: Array.isArray(p.gallery) ? p.gallery : [],
    description: p.description || '',
    stock: p.stock != null && p.stock !== '' ? Number(p.stock) : null,
    is_available: p.isAvailable !== undefined ? Boolean(p.isAvailable) : true,
    featured: Boolean(p.featured),
    sales_rank: Number(p.salesRank ?? 0),
    ingredients: p.ingredients || p.expectedIngredients || '',
    expected_ingredients: p.expectedIngredients || p.ingredients || '',
    allergen_info: p.allergenInfo || p.allergensAlert || '',
    allergens_alert: p.allergensAlert || p.allergenInfo || '',
    dietary_info: p.dietaryInfo || {},
    barcode: p.barcode || null,
    sku: p.sku || '',
    notes: p.notes || '',
    is_new_arrival: Boolean(p.isNewArrival),
    is_discounted: Boolean(p.isDiscounted),
    discount_active: p.discountActive !== false,
    discount_start_date: p.discountStartDate || null,
    discount_end_date: p.discountEndDate || null,
    updated_at: new Date().toISOString()
  };
}

export function toFrontendOrder(row: any, items: any[] = []): any {
  if (!row) return row;
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email || '',
    pickupTimePreference: row.pickup_time_preference,
    customerNote: row.customer_note || '',
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    paymentMethod: row.payment_method || 'Pay at Store (Cash / Card / Satispay)',
    staffNotes: row.staff_notes || '',
    statusUpdatedAt: row.status_updated_at,
    createdAt: row.created_at,
    items: items.map(it => ({
      productId: it.product_id,
      productName: it.product_name,
      packageSize: it.package_size,
      unitPrice: Number(it.unit_price),
      quantity: Number(it.quantity),
      lineTotal: Number(it.line_total),
      image: it.image || ''
    }))
  };
}

