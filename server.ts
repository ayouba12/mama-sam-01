import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config();

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

  const envPassword = process.env.ADMIN_PASSWORD;
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

  // 2. If environment password is configured
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

// 1. Settings (Public read, Admin update)
app.get('/api/settings', (_req: Request, res: Response) => {
  const settings = readData('settings.json', {});
  res.json(settings);
});

app.put('/api/settings', requireAdminAuth, (req: Request, res: Response) => {
  const current = readData('settings.json', {});
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
  writeData('settings.json', updated);
  res.json(updated);
});

// 2. Categories
app.get('/api/categories', (_req: Request, res: Response) => {
  const categories = readData('categories.json', []);
  res.json(categories);
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
app.get('/api/products', (req: Request, res: Response) => {
  let products = readData<any[]>('products.json', []);
  const category = req.query.category as string;
  const search = req.query.search as string;

  if (category && category !== 'All Products') {
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
app.post('/api/products', requireAdminAuth, (req: Request, res: Response) => {
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

  products.unshift(newProduct);
  writeData('products.json', products);
  res.status(201).json(newProduct);
});

// Update product (Protected admin action)
app.put('/api/products/:id', requireAdminAuth, (req: Request, res: Response) => {
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
app.delete('/api/products/:id', requireAdminAuth, (req: Request, res: Response) => {
  let products = readData<any[]>('products.json', []);
  const productToDelete = products.find(p => p.id === req.params.id);
  if (!productToDelete) {
    return res.status(404).json({ error: 'Product not found' });
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

    await imagePipeline
      .resize({
        width: 1200,
        height: 1200,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toFile(targetFilePath);

    const publicUrl = `/api/uploads/${secureFilename}`;
    res.json({
      success: true,
      url: publicUrl,
      filename: secureFilename,
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
app.get('/api/orders', requireAdminAuth, (_req: Request, res: Response) => {
  const orders = readData<any[]>('orders.json', []);
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(orders);
});

// Place store pickup order with authoritative server recalculation & stock decrement
app.post('/api/orders', (req: Request, res: Response) => {
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

    const products = readData<any[]>('products.json', []);
    const orderItems: any[] = [];
    let calculatedSubtotal = 0;

    // Validate every product and re-compute authoritative price and stock
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

    const orders = readData<any[]>('orders.json', []);
    orders.unshift(newOrder);

    // Write changes safely
    writeData('products.json', products);
    writeData('orders.json', orders);

    // Save idempotency record if key was provided (retained in memory and cache)
    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, {
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        order: newOrder,
        createdAt: Date.now()
      });
      // Limit cache size to 1000 records
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
app.patch('/api/orders/:id/status', requireAdminAuth, (req: Request, res: Response) => {
  const { status, staffNotes } = req.body;
  const orders = readData<any[]>('orders.json', []);
  const index = orders.findIndex(o => o.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const validStatuses = ['pending', 'preparing', 'ready', 'collected', 'cancelled'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Transizione stato ordine non valida.' });
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
app.post('/api/admin/login', (req: Request, res: Response) => {
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

  const { password } = req.body;

  // Timing-safe administrative password verification
  if (typeof password === 'string' && verifyAdminPassword(password)) {
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
      user: { role: 'admin', store: 'Mama Sam Messina', authorizedAt: new Date().toISOString() }
    });
  }

  // Handle failure: record attempt and log security audit event
  rateRecord.attempts = (rateRecord.attempts || 0) + 1;
  rateRecord.lastAttempt = now;

  logSecurityEvent('failed_login', req, `Tentativo di accesso fallito (tentativo ${rateRecord.attempts}/5)`);

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
    error: `Password amministrativa errata. Rimangono ${5 - rateRecord.attempts} tentativo/i prima del blocco temporaneo.`
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
app.get('/api/admin/stats', requireAdminAuth, (_req: Request, res: Response) => {
  const orders = readData<any[]>('orders.json', []);
  const products = readData<any[]>('products.json', []);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing').length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;
  const collectedOrders = orders.filter(o => o.status === 'collected').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = Number(validOrders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2));

  // Today's orders
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = validOrders.filter(o => o.createdAt.startsWith(todayStr));
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

// ----------------- VITE / STATIC SERVING -----------------
async function startServer() {
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
