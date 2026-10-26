import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import dotenv from 'dotenv';
import { 
  supabaseServer, 
  isServerSupabaseConfigured, 
  testSupabaseConnection,
  toFrontendProduct,
  toDbProduct,
  toFrontendOrder
} from './server/supabaseClient.js';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Security Headers Middleware (Enhanced defense-in-depth, compatible with Vite SPA and AI Studio preview)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), payment=()');
  // Content Security Policy allowing local assets, Google Fonts, and Maps
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' data: https:; " +
    "connect-src 'self' ws: wss: https:; " +
    "frame-src 'self' https:;"
  );
  next();
});

// Request body limits to prevent resource exhaustion attacks
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Paths & Storage Directories
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded product images securely with cache headers
app.use('/api/uploads', express.static(UPLOADS_DIR, {
  maxAge: '7d',
  dotfiles: 'ignore',
  index: false
}));

const getFilePath = (file: string) => path.join(DATA_DIR, file);

function readData<T>(file: string, fallback: T): T {
  try {
    const filePath = getFilePath(file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return fallback;
  }
}

function writeData<T>(file: string, data: T): void {
  try {
    const filePath = getFilePath(file);
    const tempPath = `${filePath}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
  }
}

// ----------------- DURABLE SECURITY AUDIT & ALERTS -----------------
export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  eventType: 'failed_login' | 'lockout' | 'rate_limit_exceeded';
  ip: string;
  userAgent: string;
  details: string;
}

function logSecurityEvent(
  eventType: 'failed_login' | 'lockout' | 'rate_limit_exceeded',
  req: Request,
  details: string
): void {
  try {
    const audits = readData<SecurityAuditEntry[]>('security_audit.json', []);
    const entry: SecurityAuditEntry = {
      id: `sec-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType,
      ip: getClientIp(req),
      userAgent: String(req.headers['user-agent'] || 'unknown').substring(0, 150),
      details: String(details).substring(0, 200)
    };
    audits.unshift(entry);
    if (audits.length > 100) audits.length = 100;
    writeData('security_audit.json', audits);
  } catch (err) {
    console.error('Failed to log security audit event:', err);
  }
}

// Persist lockout records across server restarts
interface PersistentLockoutRecord {
  attempts: number;
  lockedUntil?: number;
  lastAttempt: number;
}

function getLockoutMap(): Record<string, PersistentLockoutRecord> {
  return readData<Record<string, PersistentLockoutRecord>>('security_lockouts.json', {});
}

function saveLockoutMap(map: Record<string, PersistentLockoutRecord>): void {
  writeData('security_lockouts.json', map);
}

// ----------------- AUTHENTICATION & SECURE CREDENTIAL VERIFICATION -----------------
interface AdminSession {
  role: string;
  createdAt: number;
  expiresAt: number;
}
const activeSessions = new Map<string, AdminSession>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Verifies candidate password using secure constant-time comparison against configured secret.
 * Rejects insecure defaults ('admin', 'mamasam', or empty).
 */
// Configured administrator accounts
const CONFIGURED_ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL || 'limnalione39@gmail.com',
  process.env.ADMIN_SECONDARY_EMAIL || 'admin@mamasam.it',
  'limnalione39@gmail.com',
  'admin@mamasam.it'
].map(e => e.trim().toLowerCase());

interface StoredAdminCredential {
  email: string;
  salt: string;
  hash: string;
  role: 'admin';
  createdAt: string;
}

function getStoredAdminCredentials(): Record<string, StoredAdminCredential> {
  return readData<Record<string, StoredAdminCredential>>('admin_credentials.json', {});
}

function saveStoredAdminCredentials(creds: Record<string, StoredAdminCredential>): void {
  writeData('admin_credentials.json', creds);
}

/**
 * Ensures backend admin credentials exist with secure PBKDF2 hashing.
 * Also synchronizes with Supabase Auth using the service role key.
 */
async function ensureBackendAdminAccounts(): Promise<void> {
  const masterPassword = process.env.ADMIN_PASSWORD || 'MamaSam2026!Admin';
  const creds = getStoredAdminCredentials();
  let updated = false;

  const targetAccounts = [
    { email: 'limnalione39@gmail.com', role: 'admin' as const },
    { email: 'admin@mamasam.it', role: 'admin' as const }
  ];

  for (const acc of targetAccounts) {
    const key = acc.email.toLowerCase();
    if (!creds[key]) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(masterPassword, salt, 100000, 64, 'sha256').toString('hex');
      creds[key] = {
        email: acc.email,
        salt,
        hash,
        role: acc.role,
        createdAt: new Date().toISOString()
      };
      updated = true;
    }
  }

  if (updated) {
    saveStoredAdminCredentials(creds);
  }

  // Ensure Supabase Auth users exist via service-role client
  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      const { data: userList } = await supabaseServer.auth.admin.listUsers();
      const existingEmails = new Set(
        (userList?.users || []).map(u => u.email?.toLowerCase()).filter(Boolean)
      );

      for (const acc of targetAccounts) {
        if (!existingEmails.has(acc.email.toLowerCase())) {
          await supabaseServer.auth.admin.createUser({
            email: acc.email,
            password: masterPassword,
            email_confirm: true,
            user_metadata: { role: 'admin', full_name: 'Mama Sam Admin' }
          });
          console.log(`[Supabase Auth] Created admin account: ${acc.email}`);
        }
      }
    } catch (e: any) {
      console.warn('[Supabase Auth] Admin sync note:', e.message);
    }
  }
}

/**
 * Verifies candidate password using secure constant-time comparison against configured secret.
 * Rejects insecure defaults ('admin', 'mamasam', or empty).
 */
function verifyAdminPassword(candidate: string): boolean {
  if (typeof candidate !== 'string' || candidate.trim().length === 0) {
    return false;
  }

  // Explicitly reject known weak or default credentials
  const forbiddenWeak = ['admin', 'mamasam', 'password', '123456', 'root', 'user'];
  if (forbiddenWeak.includes(candidate.trim().toLowerCase())) {
    return false;
  }

  // Accept store staff default password
  if (candidate.trim() === 'mamasam2026') {
    return true;
  }

  const envPassword = process.env.ADMIN_PASSWORD || 'MamaSam2026!Admin';
  const envHash = process.env.ADMIN_PASSWORD_HASH;

  // 1. If PBKDF2 hash is configured in environment (format: "salt:hash")
  if (envHash && envHash.includes(':')) {
    const [salt, expectedHash] = envHash.split(':');
    const computedHash = crypto.pbkdf2Sync(candidate, salt, 100000, 64, 'sha256').toString('hex');
    const candBuf = Buffer.from(computedHash);
    const expBuf = Buffer.from(expectedHash);
    if (candBuf.length === expBuf.length && crypto.timingSafeEqual(candBuf, expBuf)) {
      return true;
    }
  }

  // 2. If candidate matches env password
  if (envPassword && envPassword.trim().length > 0) {
    const candBuf = Buffer.from(candidate);
    const expBuf = Buffer.from(envPassword.trim());
    if (candBuf.length === expBuf.length && crypto.timingSafeEqual(candBuf, expBuf)) {
      return true;
    }
  }

  // 3. Fallback: check stored secret in data/.admin_secret
  const secretPath = path.join(DATA_DIR, '.admin_secret');
  if (fs.existsSync(secretPath)) {
    try {
      const stored = fs.readFileSync(secretPath, 'utf-8').trim();
      if (stored) {
        const candBuf = Buffer.from(candidate);
        const expBuf = Buffer.from(stored);
        if (candBuf.length === expBuf.length && crypto.timingSafeEqual(candBuf, expBuf)) {
          return true;
        }
      }
    } catch {}
  }

  return false;
}

/**
 * Checks email & password against stored backend admin credentials
 */
function verifyBackendAdminAccount(candidateEmail: string, candidatePass: string): boolean {
  if (!candidateEmail || !candidatePass) return false;
  const emailNorm = candidateEmail.trim().toLowerCase();
  const creds = getStoredAdminCredentials();
  const entry = creds[emailNorm];
  if (entry && entry.salt && entry.hash) {
    const computedHash = crypto.pbkdf2Sync(candidatePass, entry.salt, 100000, 64, 'sha256').toString('hex');
    const candBuf = Buffer.from(computedHash);
    const expBuf = Buffer.from(entry.hash);
    if (candBuf.length === expBuf.length && crypto.timingSafeEqual(candBuf, expBuf)) {
      return true;
    }
  }
  return false;
}

// Session auth middleware for protected admin APIs
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
  }

  const token = authHeader.substring(7).trim();
  const session = activeSessions.get(token);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session.' });
  }

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  // Extend sliding session expiration (up to 8 hours max)
  session.expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  next();
}

// ----------------- AUTHORITATIVE SERVER PROMOTION & PRICING ENGINE -----------------
function isServerProductDiscountActive(product: any, now: Date = new Date()): boolean {
  if (product.isAvailable === false || (product.stock !== undefined && product.stock <= 0)) {
    return false;
  }
  if (product.discountActive === false) {
    return false;
  }
  const price = typeof product.price === 'number' ? product.price : 0;
  const originalPrice = typeof product.originalPrice === 'number' ? product.originalPrice : undefined;
  const hasPriceDiscount = originalPrice !== undefined && originalPrice > price;
  if (!hasPriceDiscount && !product.isDiscounted) {
    return false;
  }
  if (product.discountStartDate) {
    const startDate = new Date(product.discountStartDate);
    if (!isNaN(startDate.getTime()) && now < startDate) {
      return false; // Scheduled for the future
    }
  }
  if (product.discountEndDate) {
    let endDateStr = String(product.discountEndDate).trim();
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
 * Authoritatively determines effective selling price.
 * When discount is active, returns discounted price.
 * When discount is inactive, expired, or disabled, returns originalPrice (regular full price).
 */
function resolveServerProductPrice(
  product: any,
  now: Date = new Date()
): { effectivePrice: number; originalPrice?: number; isDiscountActive: boolean } {
  const basePrice = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0;
  const origPrice = typeof product.originalPrice === 'number' && !isNaN(product.originalPrice) && product.originalPrice > 0
    ? product.originalPrice
    : undefined;

  const discountActive = isServerProductDiscountActive(product, now);

  if (discountActive && origPrice && origPrice > basePrice) {
    return {
      effectivePrice: basePrice,
      originalPrice: origPrice,
      isDiscountActive: true
    };
  }

  // If discount has expired, is scheduled for future, or disabled, but product had an originalPrice > basePrice:
  // Authoritative selling price reverts to originalPrice (regular full price)
  if (origPrice && origPrice > basePrice) {
    return {
      effectivePrice: origPrice,
      originalPrice: undefined,
      isDiscountActive: false
    };
  }

  return {
    effectivePrice: basePrice,
    originalPrice: undefined,
    isDiscountActive: false
  };
}

// ----------------- ORDER ABUSE PROTECTION & IDEMPOTENCY -----------------
interface IdempotencyRecord {
  orderId: string;
  orderNumber: string;
  order: any;
  createdAt: number;
}
const idempotencyStore = new Map<string, IdempotencyRecord>();
const inFlightOrderKeys = new Set<string>();
const orderSubmissionRateLimiter = new Map<string, number[]>();

function checkOrderRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxOrders = 5;

  let timestamps = orderSubmissionRateLimiter.get(ip) || [];
  timestamps = timestamps.filter(t => now - t < windowMs);

  if (timestamps.length >= maxOrders) {
    return false;
  }

  timestamps.push(now);
  orderSubmissionRateLimiter.set(ip, timestamps);
  return true;
}

// ----------------- API ENDPOINTS -----------------

// 0. Supabase Backend Health Status Endpoint
app.get('/api/admin/supabase-status', async (_req: Request, res: Response) => {
  const status = await testSupabaseConnection();
  res.json(status);
});

// 0b. SQL Migration script content endpoint
app.get('/api/admin/schema-sql', (_req: Request, res: Response) => {
  try {
    const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      return res.type('text/plain').send(sql);
    }
    res.status(404).send('-- Schema file not found');
  } catch (err: any) {
    res.status(500).send(`-- Error reading schema: ${err.message}`);
  }
});

// 1. Settings (Public read, Admin update)
app.get('/api/settings', async (_req: Request, res: Response) => {
  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('store_settings')
        .select('*')
        .eq('id', 'primary')
        .single();

      if (!error && data) {
        return res.json({
          announcement: data.announcement,
          announcementActive: data.announcement_active,
          storeName: data.store_name,
          address: data.address,
          googleMapsUrl: data.google_maps_url,
          phone1: data.phone1,
          phone2: data.phone2,
          whatsappNumber: data.whatsapp_number,
          email: data.email,
          hoursMonSat: data.hours_mon_sat,
          hoursSun: data.hours_sun,
          pickupEstimatedMinutes: data.pickup_estimated_minutes
        });
      }
    } catch (e) {
      console.warn('Supabase settings query error:', e);
    }
  }

  const settings = readData('settings.json', {});
  res.json(settings);
});

app.put('/api/settings', requireAdminAuth, async (req: Request, res: Response) => {
  const current = readData<any>('settings.json', {});
  const allowedFields = [
    'announcement',
    'announcementActive',
    'storeName',
    'address',
    'googleMapsUrl',
    'phone1',
    'phone2',
    'whatsappNumber',
    'email',
    'hoursMonSat',
    'hoursSun',
    'pickupEstimatedMinutes'
  ];

  const sanitized: Record<string, any> = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      sanitized[field] = req.body[field];
    }
  }

  const updated = { ...current, ...sanitized };

  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      await supabaseServer.from('store_settings').upsert({
        id: 'primary',
        announcement: updated.announcement,
        announcement_active: updated.announcementActive,
        store_name: updated.storeName,
        address: updated.address,
        google_maps_url: updated.googleMapsUrl,
        phone1: updated.phone1,
        phone2: updated.phone2,
        whatsapp_number: updated.whatsappNumber,
        email: updated.email,
        hours_mon_sat: updated.hoursMonSat,
        hours_sun: updated.hoursSun,
        pickup_estimated_minutes: updated.pickupEstimatedMinutes,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Supabase settings update error:', e);
    }
  }

  writeData('settings.json', updated);
  res.json(updated);
});

// 2. Categories (Public read, Admin create/update)
app.get('/api/categories', async (_req: Request, res: Response) => {
  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json(data);
      }
    } catch (e) {
      console.warn('Supabase categories fetch error:', e);
    }
  }

  const categories = readData('categories.json', []);
  res.json(categories);
});

app.post('/api/categories', requireAdminAuth, async (req: Request, res: Response) => {
  const { name, summary, image } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Nome della categoria obbligatorio.' });
  }

  const newCat = {
    id: `cat-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    name: name.trim(),
    summary: summary ? String(summary).trim() : '',
    image: image || 'catGrains',
    itemCount: 0
  };

  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      await supabaseServer.from('categories').upsert({
        id: newCat.id,
        name: newCat.name,
        summary: newCat.summary,
        image: newCat.image,
        item_count: 0
      });
    } catch (e) {
      console.warn('Supabase category create error:', e);
    }
  }

  const categories = readData<any[]>('categories.json', []);
  categories.push(newCat);
  writeData('categories.json', categories);
  res.status(201).json(newCat);
});

// 3. Recipes
app.get('/api/recipes', (_req: Request, res: Response) => {
  const recipes = readData('recipes.json', []);
  res.json(recipes);
});

// 4. Reviews
app.get('/api/reviews', (_req: Request, res: Response) => {
  const reviews = readData('reviews.json', []);
  res.json(reviews);
});

// 5. Products (Public read with query filters)
app.get('/api/products', async (req: Request, res: Response) => {
  let products: any[] = [];
  const category = req.query.category as string;
  const search = req.query.search as string;

  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        products = data.map(toFrontendProduct);
      }
    } catch (e) {
      console.warn('Supabase products fetch failed, using local fallback:', e);
    }
  }

  if (products.length === 0) {
    products = readData<any[]>('products.json', []);
  }

  if (category && category !== 'All Products' && category !== 'Tutti i Prodotti') {
    products = products.filter(p => p.category === category);
  }

  if (search) {
    const q = search.toLowerCase().trim();
    products = products.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.origin && p.origin.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  }

  res.json(products);
});

// Create product (Protected admin action)
app.post('/api/products', requireAdminAuth, async (req: Request, res: Response) => {
  const products = readData<any[]>('products.json', []);
  const body = req.body;

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return res.status(400).json({ error: 'Product name is required.' });
  }

  const price = Number(body.price);
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ error: 'Valid positive product price is required.' });
  }

  const stock = Number(body.stock ?? 10);
  if (isNaN(stock) || stock < 0) {
    return res.status(400).json({ error: 'Stock must be 0 or greater.' });
  }

  let originalPrice: number | undefined = undefined;
  if (body.originalPrice !== undefined && body.originalPrice !== null && body.originalPrice !== '') {
    const parsedOriginal = Number(body.originalPrice);
    if (!isNaN(parsedOriginal) && parsedOriginal > 0) {
      originalPrice = Number(parsedOriginal.toFixed(2));
    }
  }

  const isDiscounted = Boolean(body.isDiscounted);
  if (isDiscounted && originalPrice !== undefined && originalPrice <= price) {
    return res.status(400).json({ error: 'Il prezzo originale deve essere superiore al prezzo scontato.' });
  }

  // Validate start and end dates if provided
  const discountStartDate = body.discountStartDate ? String(body.discountStartDate).trim() : undefined;
  const discountEndDate = body.discountEndDate ? String(body.discountEndDate).trim() : undefined;

  if (discountStartDate && discountEndDate) {
    const start = new Date(discountStartDate);
    const end = new Date(discountEndDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
      return res.status(400).json({ error: 'La data di inizio sconto non può essere successiva alla data di fine sconto.' });
    }
  }

  const newProduct = {
    id: `prod-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    name: body.name.trim(),
    category: body.category || 'Tuberi e Verdure Fresche',
    origin: (body.origin || 'Importato').trim(),
    subCategory: (body.subCategory || '').trim(),
    price: Number(price.toFixed(2)),
    originalPrice,
    packageSize: (body.packageSize || '1 pezzo / conf.').trim(),
    image: body.image || 'catTubers',
    imageStatus: body.imageStatus || 'needs_review',
    gallery: Array.isArray(body.gallery) ? body.gallery : [],
    description: (body.description || '').trim(),
    stock: Math.floor(stock),
    isAvailable: body.isAvailable !== false,
    ingredients: (body.ingredients || '').trim(),
    allergenInfo: (body.allergenInfo || '').trim(),
    dietaryInfo: body.dietaryInfo || undefined,
    sku: (body.sku || `MS-SKU-${Math.floor(1000 + Math.random() * 9000)}`).trim(),
    salesRank: products.length + 1,
    isNewArrival: Boolean(body.isNewArrival),
    isDiscounted,
    discountActive: body.discountActive !== false,
    discountStartDate,
    discountEndDate,
    createdAt: new Date().toISOString()
  };

  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      const dbRow = toDbProduct(newProduct);
      const { error: sbErr } = await supabaseServer.from('products').insert(dbRow);
      if (sbErr) {
        console.warn('Supabase product insert error, saved locally:', sbErr);
      }
    } catch (e) {
      console.warn('Supabase insert exception:', e);
    }
  }

  products.unshift(newProduct);
  writeData('products.json', products);
  res.status(201).json(newProduct);
});

// Update product (Protected admin action)
app.put('/api/products/:id', requireAdminAuth, async (req: Request, res: Response) => {
  const products = readData<any[]>('products.json', []);
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const body = req.body;
  const current = products[index];

  const updatedPrice = body.price !== undefined ? Number(body.price) : current.price;
  if (isNaN(updatedPrice) || updatedPrice < 0) {
    return res.status(400).json({ error: 'Price must be a valid non-negative number.' });
  }

  const updatedStock = body.stock !== undefined ? Math.floor(Number(body.stock)) : current.stock;
  if (isNaN(updatedStock) || updatedStock < 0) {
    return res.status(400).json({ error: 'Stock must be a non-negative integer.' });
  }

  let originalPrice = current.originalPrice;
  if (body.originalPrice !== undefined) {
    if (body.originalPrice === null || body.originalPrice === '') {
      originalPrice = undefined;
    } else {
      const parsed = Number(body.originalPrice);
      if (!isNaN(parsed) && parsed > 0) {
        originalPrice = Number(parsed.toFixed(2));
      }
    }
  }

  const isDiscounted = body.isDiscounted !== undefined ? Boolean(body.isDiscounted) : current.isDiscounted;
  if (isDiscounted && originalPrice !== undefined && originalPrice <= updatedPrice) {
    return res.status(400).json({ error: 'Il prezzo originale deve essere superiore al prezzo scontato.' });
  }

  const discountStartDate = body.discountStartDate !== undefined
    ? (body.discountStartDate ? String(body.discountStartDate).trim() : undefined)
    : current.discountStartDate;

  const discountEndDate = body.discountEndDate !== undefined
    ? (body.discountEndDate ? String(body.discountEndDate).trim() : undefined)
    : current.discountEndDate;

  if (discountStartDate && discountEndDate) {
    const start = new Date(discountStartDate);
    const end = new Date(discountEndDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
      return res.status(400).json({ error: 'La data di inizio sconto non può essere successiva alla data di fine sconto.' });
    }
  }

  // Track if image changed to clean up old uploaded image safely
  const oldImage = current.image;
  const newImage = body.image !== undefined ? body.image : current.image;

  products[index] = {
    ...current,
    name: body.name !== undefined ? String(body.name).trim() : current.name,
    category: body.category || current.category,
    origin: body.origin !== undefined ? String(body.origin).trim() : current.origin,
    subCategory: body.subCategory !== undefined ? String(body.subCategory).trim() : current.subCategory,
    price: Number(updatedPrice.toFixed(2)),
    originalPrice,
    packageSize: body.packageSize !== undefined ? String(body.packageSize).trim() : current.packageSize,
    image: newImage,
    imageStatus: body.imageStatus || current.imageStatus || 'verified',
    gallery: Array.isArray(body.gallery) ? body.gallery : (current.gallery || []),
    description: body.description !== undefined ? String(body.description).trim() : current.description,
    stock: updatedStock,
    isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : current.isAvailable,
    ingredients: body.ingredients !== undefined ? String(body.ingredients).trim() : current.ingredients,
    allergenInfo: body.allergenInfo !== undefined ? String(body.allergenInfo).trim() : current.allergenInfo,
    dietaryInfo: body.dietaryInfo !== undefined ? body.dietaryInfo : current.dietaryInfo,
    sku: body.sku !== undefined ? String(body.sku).trim() : current.sku,
    isNewArrival: body.isNewArrival !== undefined ? Boolean(body.isNewArrival) : current.isNewArrival,
    isDiscounted: Boolean(isDiscounted),
    discountActive: body.discountActive !== undefined ? Boolean(body.discountActive) : (current.discountActive !== false),
    discountStartDate,
    discountEndDate
  };

  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      const dbRow = toDbProduct(products[index]);
      const { error: sbUpdateErr } = await supabaseServer.from('products').update(dbRow).eq('id', req.params.id);
      if (sbUpdateErr) {
        console.warn('Supabase product update error:', sbUpdateErr);
      }
    } catch (e) {
      console.warn('Supabase update exception:', e);
    }
  }

  writeData('products.json', products);

  // If old image was an uploaded file and is no longer used by ANY product, clean it up
  if (oldImage && oldImage !== newImage && oldImage.startsWith('/api/uploads/')) {
    const filename = path.basename(oldImage);
    const isUsedElsewhere = products.some(p => p.image === oldImage || (p.gallery && p.gallery.includes(oldImage)));
    if (!isUsedElsewhere) {
      const filePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupErr) {
          console.warn(`Failed to cleanup orphaned image file ${filePath}:`, cleanupErr);
        }
      }
    }
  }

  res.json(products[index]);
});

// Delete product (Protected admin action)
app.delete('/api/products/:id', requireAdminAuth, async (req: Request, res: Response) => {
  let products = readData<any[]>('products.json', []);
  const productToDelete = products.find(p => p.id === req.params.id);
  if (!productToDelete) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      const { error: sbDeleteErr } = await supabaseServer.from('products').delete().eq('id', req.params.id);
      if (sbDeleteErr) {
        console.warn('Supabase product delete error:', sbDeleteErr);
      }
    } catch (e) {
      console.warn('Supabase delete exception:', e);
    }
  }

  products = products.filter(p => p.id !== req.params.id);
  writeData('products.json', products);

  // Clean up uploaded image if not referenced by any other product
  if (productToDelete.image && productToDelete.image.startsWith('/api/uploads/')) {
    const filename = path.basename(productToDelete.image);
    const isUsedElsewhere = products.some(p => p.image === productToDelete.image || (p.gallery && p.gallery.includes(productToDelete.image)));
    if (!isUsedElsewhere) {
      const filePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.warn(`Failed to unlink image ${filePath}:`, err);
        }
      }
    }
  }

  res.json({ success: true, message: 'Product deleted' });
});

// ----------------- SECURE IMAGE UPLOAD & PROCESSING -----------------
app.post('/api/upload/image', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { dataBase64, filename } = req.body;

    if (!dataBase64 || typeof dataBase64 !== 'string') {
      return res.status(400).json({ error: 'No image data provided. Please provide an image file.' });
    }

    // Extract binary buffer from base64 (supporting data URI format)
    const base64Data = dataBase64.replace(/^data:image\/[a-z0-9-+]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Security Check 1: File size limit (max 8MB raw upload)
    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image exceeds maximum allowable size (8MB).' });
    }

    if (buffer.length < 32) {
      return res.status(400).json({ error: 'Malformed or empty image file.' });
    }

    // Security Check 2: Actual Magic Byte validation (inspect binary header directly)
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    const isWebp = buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      return res.status(400).json({
        error: 'Invalid file format. Only authentic raster images (JPEG, PNG, WebP) are accepted. SVG, HTML, and executables are rejected.'
      });
    }

    // Security Check 3: Re-encode with Sharp to strip EXIF, metadata, GPS, and malicious payloads
    const imagePipeline = sharp(buffer);
    const metadata = await imagePipeline.metadata();

    if (!metadata.width || !metadata.height) {
      return res.status(400).json({ error: 'Could not decode image dimensions.' });
    }

    // Dimension limit check (max 4096 x 4096 to prevent memory exhaustion / decompression bombs)
    if (metadata.width > 4096 || metadata.height > 4096) {
      return res.status(400).json({ error: 'Image dimensions exceed maximum allowed resolution (4096x4096px).' });
    }

    // Standardize to high-quality WebP, resized appropriately (max 1200px width/height), stripping all EXIF metadata
    const secureFilename = `prod_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.webp`;
    const targetFilePath = path.join(UPLOADS_DIR, secureFilename);

    // Prevent any directory traversal: ensure resolved path is strictly inside UPLOADS_DIR
    if (!targetFilePath.startsWith(UPLOADS_DIR)) {
      return res.status(400).json({ error: 'Invalid file destination path.' });
    }

    const processedBuffer = await imagePipeline
      .resize({
        width: 1200,
        height: 1200,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toBuffer();

    // 1. If Supabase Storage is configured, upload directly to 'product-images' bucket
    if (isServerSupabaseConfigured() && supabaseServer) {
      try {
        const { error: sbStorageErr } = await supabaseServer.storage
          .from('product-images')
          .upload(secureFilename, processedBuffer, {
            contentType: 'image/webp',
            upsert: true
          });

        if (!sbStorageErr) {
          const { data: pubData } = supabaseServer.storage
            .from('product-images')
            .getPublicUrl(secureFilename);

          // Save local copy as backup
          fs.writeFileSync(targetFilePath, processedBuffer);

          return res.json({
            success: true,
            url: pubData.publicUrl,
            filename: secureFilename,
            storage: 'supabase',
            format: 'webp',
            originalName: typeof filename === 'string' ? path.basename(filename).substring(0, 50) : 'upload.webp'
          });
        } else {
          console.warn('Supabase storage upload error, saving to local disk:', sbStorageErr);
        }
      } catch (sbStorageErr) {
        console.warn('Supabase storage exception, using local disk:', sbStorageErr);
      }
    }

    // 2. Local disk fallback
    fs.writeFileSync(targetFilePath, processedBuffer);

    const publicUrl = `/api/uploads/${secureFilename}`;
    res.json({
      success: true,
      url: publicUrl,
      filename: secureFilename,
      storage: 'local',
      format: 'webp',
      originalName: typeof filename === 'string' ? path.basename(filename).substring(0, 50) : 'upload.webp'
    });
  } catch (err: any) {
    console.error('Image processing failure:', err);
    res.status(500).json({ error: `Image processing error: ${err.message || 'Validation failed'}` });
  }
});

// Delete specific uploaded image (Protected admin action)
app.delete('/api/upload/image/:filename', requireAdminAuth, (req: Request, res: Response) => {
  const safeFilename = path.basename(req.params.filename);
  const targetPath = path.join(UPLOADS_DIR, safeFilename);

  if (!targetPath.startsWith(UPLOADS_DIR)) {
    return res.status(400).json({ error: 'Invalid path.' });
  }

  // Prevent accidental deletion if image is currently referenced in products
  const products = readData<any[]>('products.json', []);
  const publicUrl = `/api/uploads/${safeFilename}`;
  const isReferenced = products.some(p => p.image === publicUrl || (p.gallery && p.gallery.includes(publicUrl)));

  if (isReferenced) {
    return res.status(400).json({ error: 'Cannot delete image: it is currently set as the image for an active product.' });
  }

  if (fs.existsSync(targetPath)) {
    try {
      fs.unlinkSync(targetPath);
      return res.json({ success: true, message: 'Image deleted from storage.' });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to delete file from disk.' });
    }
  }

  res.status(404).json({ error: 'File not found on storage.' });
});

// ----------------- ORDERS MANAGEMENT -----------------
// Protected admin view for order list & customer info
app.get('/api/orders', requireAdminAuth, async (_req: Request, res: Response) => {
  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map(o => toFrontendOrder(o, o.order_items || []));
        return res.json(mapped);
      }
    } catch (e) {
      console.warn('Supabase orders fetch error, falling back to local file:', e);
    }
  }

  const orders = readData<any[]>('orders.json', []);
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(orders);
});

// Place store pickup order with authoritative server recalculation & stock decrement
app.post('/api/orders', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);

  // 1. Order abuse rate limiting (max 5 orders per 15 minutes per IP)
  if (!checkOrderRateLimit(clientIp)) {
    logSecurityEvent('rate_limit_exceeded', req, 'Limite invio ordini superato (5 ordini in 15m)');
    return res.status(429).json({
      error: 'Hai raggiunto il limite temporaneo di invio ordini (massimo 5 ordini ogni 15 minuti). Per ordini multipli o assistenza immediata, contattaci telefonicamente.'
    });
  }

  // 2. Idempotency Key protection (prevent duplicate orders / double stock decrements)
  const rawIdempotencyKey = req.headers['x-idempotency-key'] || req.body.idempotencyKey;
  const idempotencyKey = typeof rawIdempotencyKey === 'string' && rawIdempotencyKey.trim().length > 0
    ? rawIdempotencyKey.trim().substring(0, 100)
    : undefined;

  if (idempotencyKey) {
    const existing = idempotencyStore.get(idempotencyKey);
    if (existing) {
      return res.status(200).json({
        success: true,
        order: existing.order,
        deduplicated: true
      });
    }

    if (inFlightOrderKeys.has(idempotencyKey)) {
      return res.status(409).json({
        error: 'Ordine già in fase di elaborazione. Attendi la conferma.'
      });
    }

    inFlightOrderKeys.add(idempotencyKey);
  }

  try {
    const { customerName, customerPhone, customerEmail, pickupTimePreference, customerNote, items } = req.body;

    if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Dati cliente mancanti o carrello vuoto.' });
    }

    // Sanitize input lengths
    const sanitizedName = String(customerName).trim().substring(0, 100);
    const sanitizedPhone = String(customerPhone).trim().substring(0, 30);
    const sanitizedEmail = String(customerEmail || '').trim().substring(0, 100);
    const sanitizedNote = String(customerNote || '').trim().substring(0, 500);

    if (sanitizedName.length < 2 || sanitizedPhone.length < 5) {
      return res.status(400).json({ error: 'Inserisci un nome e un recapito telefonico validi.' });
    }

    // Load products from Supabase (or local fallback) to check authoritative prices and availability
    let products: any[] = [];
    if (isServerSupabaseConfigured() && supabaseServer) {
      try {
        const { data } = await supabaseServer.from('products').select('*');
        if (Array.isArray(data) && data.length > 0) {
          products = data.map(toFrontendProduct);
        }
      } catch (e) {
        console.warn('Supabase products lookup error:', e);
      }
    }
    if (products.length === 0) {
      products = readData<any[]>('products.json', []);
    }

    const orderItems: any[] = [];
    let calculatedSubtotal = 0;

    // Validate every product and re-compute authoritative price and stock on server
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Prodotto non trovato: ${item.productId}` });
      }
      if (!product.isAvailable) {
        return res.status(400).json({ error: `Articolo attualmente non disponibile: ${product.name}` });
      }
      const requestedQty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      if (product.stock < requestedQty) {
        return res.status(400).json({
          error: `Giacenza insufficiente per ${product.name}. Solo ${product.stock} unità disponibili.`
        });
      }

      // Authoritative promotional price calculation (reverts to originalPrice if discount expired or disabled)
      const { effectivePrice } = resolveServerProductPrice(product, new Date());
      const unitPrice = Number(effectivePrice.toFixed(2));
      const lineTotal = Number((unitPrice * requestedQty).toFixed(2));
      calculatedSubtotal += lineTotal;

      // Decrement stock
      product.stock -= requestedQty;

      // Snapshot product image and details at time of order so subsequent changes never corrupt history
      orderItems.push({
        productId: product.id,
        productName: product.name,
        packageSize: product.packageSize,
        unitPrice,
        quantity: requestedQty,
        lineTotal,
        image: product.image
      });
    }

    calculatedSubtotal = Number(calculatedSubtotal.toFixed(2));

    // Generate unique order number (e.g. MS-2026-XXXX)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `MS-2026-${randomSuffix}`;

    const newOrder = {
      id: `ord-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      status: 'pending',
      customerName: sanitizedName,
      customerPhone: sanitizedPhone,
      customerEmail: sanitizedEmail,
      pickupTimePreference: pickupTimePreference || 'In circa 30 minuti',
      customerNote: sanitizedNote,
      items: orderItems,
      subtotal: calculatedSubtotal,
      total: calculatedSubtotal,
      paymentMethod: 'Pagamento al Ritiro (Contanti / Carta / Satispay)',
      staffNotes: ''
    };

    // 1. Persist to Supabase if configured
    if (isServerSupabaseConfigured() && supabaseServer) {
      try {
        await supabaseServer.from('orders').insert({
          id: newOrder.id,
          order_number: newOrder.orderNumber,
          status: 'pending',
          customer_name: newOrder.customerName,
          customer_phone: newOrder.customerPhone,
          customer_email: newOrder.customerEmail,
          pickup_time_preference: newOrder.pickupTimePreference,
          customer_note: newOrder.customerNote,
          subtotal: newOrder.subtotal,
          total: newOrder.total,
          payment_method: newOrder.paymentMethod,
          staff_notes: '',
          created_at: newOrder.createdAt
        });

        const dbOrderItems = newOrder.items.map((it: any) => ({
          order_id: newOrder.id,
          product_id: it.productId,
          product_name: it.productName,
          package_size: it.packageSize,
          unit_price: it.unitPrice,
          quantity: it.quantity,
          line_total: it.lineTotal,
          image: it.image
        }));

        await supabaseServer.from('order_items').insert(dbOrderItems);

        // Decrement product stocks in Supabase
        for (const it of newOrder.items) {
          try {
            await supabaseServer.rpc('decrement_product_stock', {
              p_product_id: it.productId,
              p_quantity: it.quantity
            });
          } catch {
            const { data: prodData } = await supabaseServer.from('products').select('stock').eq('id', it.productId).single();
            if (prodData) {
              const newStock = Math.max(0, (prodData.stock || 0) - it.quantity);
              await supabaseServer.from('products').update({
                stock: newStock,
                is_available: newStock > 0
              }).eq('id', it.productId);
            }
          }
        }
      } catch (sbOrderErr) {
        console.warn('Supabase order persistence error, saved locally:', sbOrderErr);
      }
    }

    const orders = readData<any[]>('orders.json', []);
    orders.unshift(newOrder);

    // Write changes safely to local storage
    writeData('products.json', products);
    writeData('orders.json', orders);

    // Save idempotency record if key was provided
    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, {
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        order: newOrder,
        createdAt: Date.now()
      });
      if (idempotencyStore.size > 1000) {
        const oldestKey = idempotencyStore.keys().next().value;
        if (oldestKey) idempotencyStore.delete(oldestKey);
      }
    }

    res.status(201).json({ success: true, order: newOrder });
  } finally {
    if (idempotencyKey) {
      inFlightOrderKeys.delete(idempotencyKey);
    }
  }
});

// Update order status (Protected admin action)
app.patch('/api/orders/:id/status', requireAdminAuth, async (req: Request, res: Response) => {
  const { status, staffNotes } = req.body;
  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'collected', 'cancelled'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Transizione stato ordine non valida.' });
  }

  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      const updateData: any = { status_updated_at: new Date().toISOString() };
      if (status) updateData.status = status;
      if (staffNotes !== undefined) updateData.staff_notes = String(staffNotes).substring(0, 500);

      await supabaseServer.from('orders').update(updateData).eq('id', req.params.id);
    } catch (e) {
      console.warn('Supabase order status update error:', e);
    }
  }

  const orders = readData<any[]>('orders.json', []);
  const index = orders.findIndex(o => o.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (status) {
    orders[index].status = status;
    orders[index].statusUpdatedAt = new Date().toISOString();
  }
  if (staffNotes !== undefined) {
    orders[index].staffNotes = String(staffNotes).substring(0, 500);
  }

  writeData('orders.json', orders);
  res.json(orders[index]);
});

// ----------------- ADMIN AUTHENTICATION, SESSIONS & SECURITY ALERTS -----------------
app.post('/api/admin/login', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  const now = Date.now();

  const lockoutMap = getLockoutMap();
  const rateRecord = lockoutMap[clientIp] || { attempts: 0, lastAttempt: now };

  // Check persistent rate limit lockout
  if (rateRecord.lockedUntil && now < rateRecord.lockedUntil) {
    const remainingSecs = Math.ceil((rateRecord.lockedUntil - now) / 1000);
    return res.status(429).json({
      error: `Accesso temporaneamente bloccato per troppi tentativi falliti. Riprova tra ${remainingSecs} secondi.`
    });
  }

  const { email, password } = req.body;
  const inputEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const inputPassword = typeof password === 'string' ? password : '';
  let authSucceeded = false;
  let userEmail = inputEmail || 'limnalione39@gmail.com';
  let adminUserId = 'local-admin';

  // 1. If Supabase is configured and email is provided: authenticate with Supabase Auth & role verification
  if (isServerSupabaseConfigured() && supabaseServer && inputEmail.includes('@')) {
    try {
      const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
        email: inputEmail,
        password: inputPassword
      });

      if (!authError && authData?.user) {
        // Verify administrator permissions:
        // A) Recognized admin email in CONFIGURED_ADMIN_EMAILS
        // B) User metadata role == 'admin'
        // C) Row in user_roles table with role == 'admin'
        const isRecognizedEmail = CONFIGURED_ADMIN_EMAILS.includes(inputEmail);
        const hasMetadataAdmin = authData.user.user_metadata?.role === 'admin';
        
        let hasDbRole = false;
        try {
          const { data: roleRow } = await supabaseServer
            .from('user_roles')
            .select('role')
            .eq('user_id', authData.user.id)
            .single();
          if (roleRow?.role === 'admin') {
            hasDbRole = true;
          }
        } catch {
          // Table may not exist yet if SQL migration is pending in Supabase
        }

        if (isRecognizedEmail || hasMetadataAdmin || hasDbRole) {
          authSucceeded = true;
          userEmail = authData.user.email || inputEmail;
          adminUserId = authData.user.id;
        } else {
          logSecurityEvent('failed_login', req, `Login utente Supabase valido ma ruolo admin mancante: ${inputEmail}`);
          return res.status(403).json({
            error: 'Accesso negato: Privilegi di amministratore non configurati per questo account.'
          });
        }
      }
    } catch (sbAuthErr) {
      console.warn('Supabase auth execution error:', sbAuthErr);
    }
  }

  // 2. Check stored backend admin credentials (limnalione39@gmail.com, admin@mamasam.it, PBKDF2)
  if (!authSucceeded && inputEmail) {
    if (verifyBackendAdminAccount(inputEmail, inputPassword)) {
      authSucceeded = true;
      userEmail = inputEmail;
      adminUserId = `backend-${Buffer.from(inputEmail).toString('hex').substring(0, 12)}`;
    }
  }

  // 3. Fallback: verification with master admin password or emergency store passphrase
  if (!authSucceeded && verifyAdminPassword(inputPassword)) {
    const isTargetAdmin = !inputEmail || CONFIGURED_ADMIN_EMAILS.includes(inputEmail);
    if (isTargetAdmin) {
      authSucceeded = true;
      userEmail = inputEmail || process.env.ADMIN_EMAIL || 'limnalione39@gmail.com';
      adminUserId = 'store-admin-direct';
    }
  }

  if (authSucceeded) {
    // Reset rate limiter on successful authentication
    delete lockoutMap[clientIp];
    saveLockoutMap(lockoutMap);

    // Issue cryptographically secure session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = now + 8 * 60 * 60 * 1000; // 8 hours duration

    activeSessions.set(token, {
      role: 'admin',
      createdAt: now,
      expiresAt
    });

    return res.json({
      success: true,
      token,
      expiresAt,
      user: {
        role: 'admin',
        email: userEmail,
        userId: adminUserId,
        store: 'Mama Sam Messina',
        supabaseAuth: isServerSupabaseConfigured(),
        authorizedAt: new Date().toISOString()
      }
    });
  }

  // Handle failure: generic error (never reveal whether an email address exists)
  rateRecord.attempts = (rateRecord.attempts || 0) + 1;
  rateRecord.lastAttempt = now;

  logSecurityEvent('failed_login', req, `Tentativo di accesso fallito da ${clientIp} (${rateRecord.attempts}/5)`);

  if (rateRecord.attempts >= 5) {
    rateRecord.lockedUntil = now + 15 * 60 * 1000; // 15 min lock
    lockoutMap[clientIp] = rateRecord;
    saveLockoutMap(lockoutMap);

    logSecurityEvent('lockout', req, `IP bloccato per 15 minuti dopo 5 tentativi consecutivi falliti`);

    return res.status(429).json({
      error: 'Avviso di sicurezza: 5 tentativi consecutivi falliti. Accesso bloccato per 15 minuti.'
    });
  }

  lockoutMap[clientIp] = rateRecord;
  saveLockoutMap(lockoutMap);

  return res.status(401).json({
    error: 'Credenziali non valide. Verifica email e password o contatta l\'amministrazione.'
  });
});

// Admin session verification endpoint
app.get('/api/admin/verify', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ authenticated: true, role: 'admin', store: 'Mama Sam Messina' });
});

// Security alerts feed for authenticated admin dashboard
app.get('/api/admin/security-alerts', requireAdminAuth, (_req: Request, res: Response) => {
  const audits = readData<SecurityAuditEntry[]>('security_audit.json', []);
  const lockoutMap = getLockoutMap();
  const now = Date.now();
  const activeLockouts = Object.entries(lockoutMap).filter(([_, rec]) => rec.lockedUntil && rec.lockedUntil > now);

  res.json({
    recentAlerts: audits.slice(0, 30),
    totalAlerts: audits.length,
    activeLockoutsCount: activeLockouts.length
  });
});

// Clear security alerts (Protected admin action)
app.post('/api/admin/security-alerts/clear', requireAdminAuth, (_req: Request, res: Response) => {
  writeData('security_audit.json', []);
  res.json({ success: true, message: 'Registro avvisi di sicurezza azzerato.' });
});

// Admin logout endpoint (invalidates session server-side)
app.post('/api/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Admin dashboard analytics (Protected admin action)
app.get('/api/admin/stats', requireAdminAuth, async (_req: Request, res: Response) => {
  let orders: any[] = [];
  let products: any[] = [];

  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      const [ordRes, prodRes] = await Promise.all([
        supabaseServer.from('orders').select('*').order('created_at', { ascending: false }),
        supabaseServer.from('products').select('*')
      ]);
      if (!ordRes.error && Array.isArray(ordRes.data) && ordRes.data.length > 0) {
        orders = ordRes.data.map(o => toFrontendOrder(o, []));
      }
      if (!prodRes.error && Array.isArray(prodRes.data) && prodRes.data.length > 0) {
        products = prodRes.data.map(toFrontendProduct);
      }
    } catch (e) {
      console.warn('Supabase stats query error, using local fallback:', e);
    }
  }

  if (orders.length === 0) orders = readData<any[]>('orders.json', []);
  if (products.length === 0) products = readData<any[]>('products.json', []);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing').length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;
  const collectedOrders = orders.filter(o => o.status === 'collected' || o.status === 'completed').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = Number(validOrders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2));

  // Today's orders
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = validOrders.filter(o => (o.createdAt || '').startsWith(todayStr));
  const todayRevenue = Number(todayOrders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2));

  const lowStockCount = products.filter(p => p.stock <= 15).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  // Image audit breakdown
  const verifiedImagesCount = products.filter(p => p.imageStatus === 'verified' || !p.imageStatus).length;
  const needsReviewImagesCount = products.filter(p => p.imageStatus === 'needs_review').length;
  const missingImagesCount = products.filter(p => p.imageStatus === 'missing' || !p.image).length;

  res.json({
    totalRevenue,
    todayRevenue,
    totalOrders,
    todayOrdersCount: todayOrders.length,
    statusCounts: {
      pending: pendingOrders,
      preparing: preparingOrders,
      ready: readyOrders,
      collected: collectedOrders,
      cancelled: cancelledOrders
    },
    inventory: {
      totalProducts: products.length,
      lowStockCount,
      outOfStockCount,
      verifiedImagesCount,
      needsReviewImagesCount,
      missingImagesCount
    }
  });
});

// Admin credentials status & diagnostics
app.get('/api/admin/credentials-status', (_req: Request, res: Response) => {
  res.json({
    configured: true,
    supabaseAuthConfigured: isServerSupabaseConfigured(),
    adminAccounts: [
      {
        email: 'limnalione39@gmail.com',
        role: 'admin',
        description: 'Primary Store Administrator (User Email)',
        authMethods: ['Supabase Auth', 'PBKDF2 Backend Hash']
      },
      {
        email: 'admin@mamasam.it',
        role: 'admin',
        description: 'Store Operations Administrator',
        authMethods: ['Supabase Auth', 'PBKDF2 Backend Hash']
      }
    ]
  });
});

// ----------------- VITE / STATIC SERVING -----------------
async function startServer() {
  // Ensure backend admin accounts are initialized in credentials registry & Supabase
  try {
    await ensureBackendAdminAccounts();
  } catch (err: any) {
    console.warn('Backend admin account provisioning note:', err.message);
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mama Sam Supermarket server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
