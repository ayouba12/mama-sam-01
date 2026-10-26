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
  hasServiceRoleKey: boolean;
  url: string;
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
      hasServiceRoleKey: Boolean(serviceRoleKey),
      url: supabaseUrl ? supabaseUrl.replace(/https:\/\/[^.]+\./, 'https://***.') : 'Not configured'
    };
  }

  try {
    const [prodRes, catRes, ordRes, rolesRes, bucketRes] = await Promise.all([
      supabaseServer.from('products').select('id', { count: 'exact', head: true }),
      supabaseServer.from('categories').select('id', { count: 'exact', head: true }),
      supabaseServer.from('orders').select('id', { count: 'exact', head: true }),
      supabaseServer.from('user_roles').select('id', { count: 'exact', head: true }),
      supabaseServer.storage.getBucket('product-images').catch(() => ({ data: null, error: null }))
    ]);

    const isConnected = !prodRes.error || prodRes.error.code !== 'PGRST301';

    return {
      configured: true,
      connected: isConnected,
      hasServiceRoleKey: Boolean(serviceRoleKey),
      url: supabaseUrl.replace(/https:\/\/([^.]+)\./, (_, id) => `https://${id.substring(0, 4)}***.`),
      tables: {
        products: prodRes.count ?? 0,
        categories: catRes.count ?? 0,
        orders: ordRes.count ?? 0,
        settings: true,
        userRoles: !rolesRes.error
      },
      storageBucket: {
        name: 'product-images',
        exists: Boolean(bucketRes && bucketRes.data)
      },
      error: prodRes.error ? prodRes.error.message : undefined
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      hasServiceRoleKey: Boolean(serviceRoleKey),
      url: supabaseUrl.replace(/https:\/\/([^.]+)\./, (_, id) => `https://${id.substring(0, 4)}***.`),
      error: err.message || 'Failed to ping Supabase backend.'
    };
  }
}

export function toFrontendProduct(row: any): any {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    origin: row.origin || 'Importato',
    subCategory: row.sub_category,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    packageSize: row.package_size || '1 pz',
    image: row.image,
    imageStatus: row.image_status || 'verified',
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    description: row.description || '',
    stock: Number(row.stock ?? 0),
    isAvailable: Boolean(row.is_available),
    featured: Boolean(row.featured),
    salesRank: Number(row.sales_rank ?? 0),
    ingredients: row.ingredients || '',
    allergenInfo: row.allergen_info || '',
    dietaryInfo: row.dietary_info || {},
    sku: row.sku || '',
    isNewArrival: Boolean(row.is_new_arrival),
    isDiscounted: Boolean(row.is_discounted),
    discountActive: row.discount_active !== false,
    discountStartDate: row.discount_start_date || undefined,
    discountEndDate: row.discount_end_date || undefined,
    createdAt: row.created_at
  };
}

export function toDbProduct(p: any): any {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    origin: p.origin || 'Importato',
    sub_category: p.subCategory,
    price: Number(p.price),
    original_price: p.originalPrice != null && p.originalPrice !== '' ? Number(p.originalPrice) : null,
    package_size: p.packageSize || '1 pz',
    image: p.image,
    image_status: p.imageStatus || 'verified',
    gallery: Array.isArray(p.gallery) ? p.gallery : [],
    description: p.description || '',
    stock: Number(p.stock ?? 0),
    is_available: p.isAvailable !== undefined ? Boolean(p.isAvailable) : true,
    featured: Boolean(p.featured),
    sales_rank: Number(p.salesRank ?? 0),
    ingredients: p.ingredients || '',
    allergen_info: p.allergenInfo || '',
    dietary_info: p.dietaryInfo || {},
    sku: p.sku || '',
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

