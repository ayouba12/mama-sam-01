import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Security Headers Middleware (Compatible with iframe preview in AI Studio)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
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

// ----------------- AUTHENTICATION & SECURITY SESSIONS -----------------
// Cryptographically secure active tokens map: token -> { role: string, expiresAt: number }
interface AdminSession {
  role: string;
  createdAt: number;
  expiresAt: number;
}
const activeSessions = new Map<string, AdminSession>();

// Rate limiting for login attempts (IP -> { count, lockedUntil })
interface RateLimitRecord {
  attempts: number;
  lockedUntil?: number;
}
const loginRateLimiter = new Map<string, RateLimitRecord>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
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
  const { customerName, customerPhone, customerEmail, pickupTimePreference, customerNote, items } = req.body;

  if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing customer details or empty cart items.' });
  }

  // Sanitize input lengths
  const sanitizedName = String(customerName).trim().substring(0, 100);
  const sanitizedPhone = String(customerPhone).trim().substring(0, 30);
  const sanitizedEmail = String(customerEmail || '').trim().substring(0, 100);
  const sanitizedNote = String(customerNote || '').trim().substring(0, 500);

  if (sanitizedName.length < 2 || sanitizedPhone.length < 5) {
    return res.status(400).json({ error: 'Please provide a valid name and phone number.' });
  }

  const products = readData<any[]>('products.json', []);
  const orderItems: any[] = [];
  let calculatedSubtotal = 0;

  // Validate every product and re-compute authoritative price and stock
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ error: `Product not found: ${item.productId}` });
    }
    if (!product.isAvailable) {
      return res.status(400).json({ error: `Item is currently unavailable: ${product.name}` });
    }
    const requestedQty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    if (product.stock < requestedQty) {
      return res.status(400).json({
        error: `Insufficient stock for ${product.name}. Only ${product.stock} available.`
      });
    }

    const unitPrice = Number(product.price);
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
    pickupTimePreference: pickupTimePreference || 'In ~30 mins',
    customerNote: sanitizedNote,
    items: orderItems,
    subtotal: calculatedSubtotal,
    total: calculatedSubtotal,
    paymentMethod: 'Pay at Store (Cash / Card / Satispay)',
    staffNotes: ''
  };

  const orders = readData<any[]>('orders.json', []);
  orders.unshift(newOrder);

  // Write changes safely
  writeData('products.json', products);
  writeData('orders.json', orders);

  res.status(201).json({ success: true, order: newOrder });
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
    return res.status(400).json({ error: 'Invalid order status transition.' });
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

// ----------------- ADMIN AUTHENTICATION & SESSIONS -----------------
app.post('/api/admin/login', (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  const now = Date.now();
  const rateRecord = loginRateLimiter.get(clientIp) || { attempts: 0 };

  // Check rate limit lock
  if (rateRecord.lockedUntil && now < rateRecord.lockedUntil) {
    const remainingSecs = Math.ceil((rateRecord.lockedUntil - now) / 1000);
    return res.status(429).json({
      error: `Too many failed attempts. Temporary lockout active. Try again in ${remainingSecs} seconds.`
    });
  }

  const { password } = req.body;
  const validPasswords = ['mamasam2026', 'admin', 'mamasam'];

  if (typeof password === 'string' && validPasswords.includes(password.trim())) {
    // Reset rate limiter on success
    loginRateLimiter.delete(clientIp);

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

  // Handle failure & apply progressive rate limit throttling
  rateRecord.attempts += 1;
  if (rateRecord.attempts >= 5) {
    rateRecord.lockedUntil = now + 15 * 60 * 1000; // 15 min lock
    loginRateLimiter.set(clientIp, rateRecord);
    return res.status(429).json({
      error: 'Security alert: 5 consecutive failed login attempts. Locked out for 15 minutes.'
    });
  }

  loginRateLimiter.set(clientIp, rateRecord);
  return res.status(401).json({
    error: `Incorrect administrative password. ${5 - rateRecord.attempts} attempt(s) remaining.`
  });
});

// Admin session verification endpoint
app.get('/api/admin/verify', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ authenticated: true, role: 'admin', store: 'Mama Sam Messina' });
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
