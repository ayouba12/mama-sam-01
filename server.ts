import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import sharp from 'sharp';
import compression from 'compression';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
const webpush = require('web-push') as typeof import('web-push');
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
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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

// Enable gzip compression for fast mobile & desktop API/asset delivery
app.use(compression({ threshold: 1024 }));

// Request body limits to prevent resource exhaustion attacks
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Paths & Storage Directories
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const IMG_CACHE_DIR = path.join(os.tmpdir(), 'mamasam-img-cache');
const SRC_IMAGES_DIR = path.resolve(__dirname, 'src', 'assets', 'images');
const PUBLIC_ASSETS_DIR = path.resolve(__dirname, 'public', 'assets');
const DIST_ASSETS_DIR = path.resolve(__dirname, 'dist', 'assets');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(IMG_CACHE_DIR)) {
  fs.mkdirSync(IMG_CACHE_DIR, { recursive: true });
}

// Serve uploaded product images securely with immutable long-lived cache headers
app.use('/api/uploads', express.static(UPLOADS_DIR, {
  maxAge: '30d',
  immutable: true,
  dotfiles: 'ignore',
  index: false
}));

// ----------------- OPTIMIZED AVIF / WEBP IMAGE DELIVERY & RESIZING -----------------
const ALLOWED_IMAGE_WIDTHS = [80, 160, 240, 400, 640, 800, 1200, 1600];

function snapImageWidth(rawWidth: unknown): number {
  const num = Number(rawWidth);
  if (!Number.isFinite(num) || num <= 0) return 400;
  const clamped = Math.min(1600, Math.max(48, Math.round(num)));
  for (const w of ALLOWED_IMAGE_WIDTHS) {
    if (w >= clamped) return w;
  }
  return 1600;
}

function isConfinedWithin(candidate: string, allowedRoot: string): boolean {
  const resolvedCandidate = path.resolve(candidate);
  const resolvedRoot = path.resolve(allowedRoot);
  return resolvedCandidate.startsWith(resolvedRoot + path.sep);
}

async function resolveImageSourceBuffer(rawSrc: string): Promise<{ buffer?: Buffer; filePath?: string; cacheKeyPart: string } | null> {
  const cleanSrc = rawSrc.split('?')[0].split('#')[0].trim();
  if (!cleanSrc || cleanSrc.includes('\0') || cleanSrc.includes('..')) {
    return null;
  }

  // 1. Local uploaded images (/api/uploads/...)
  if (cleanSrc.startsWith('/api/uploads/')) {
    const rel = cleanSrc.slice('/api/uploads/'.length);
    const candidate = path.resolve(UPLOADS_DIR, rel);
    if (isConfinedWithin(candidate, UPLOADS_DIR) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const mtime = Math.floor(fs.statSync(candidate).mtimeMs);
      return { filePath: candidate, cacheKeyPart: `${candidate}:${mtime}` };
    }
    return null;
  }

  // 2. Vite dev asset path (/src/assets/images/...)
  if (cleanSrc.startsWith('/src/assets/images/')) {
    const rel = cleanSrc.slice('/src/assets/images/'.length);
    const candidate = path.resolve(SRC_IMAGES_DIR, rel);
    if (isConfinedWithin(candidate, SRC_IMAGES_DIR) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const mtime = Math.floor(fs.statSync(candidate).mtimeMs);
      return { filePath: candidate, cacheKeyPart: `${candidate}:${mtime}` };
    }
    return null;
  }

  // 3. Public or built static assets (/assets/...)
  if (cleanSrc.startsWith('/assets/')) {
    const rel = cleanSrc.slice('/assets/'.length);
    for (const root of [PUBLIC_ASSETS_DIR, DIST_ASSETS_DIR]) {
      if (!fs.existsSync(root)) continue;
      const candidate = path.resolve(root, rel);
      if (isConfinedWithin(candidate, root) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        const mtime = Math.floor(fs.statSync(candidate).mtimeMs);
        return { filePath: candidate, cacheKeyPart: `${candidate}:${mtime}` };
      }
    }
    return null;
  }

  // 4. Configured Supabase Storage product-images URL only (no arbitrary SSRF)
  if (cleanSrc.startsWith('https://')) {
    const supabaseBase = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    if (!supabaseBase) return null;
    try {
      const parsedSrc = new URL(cleanSrc);
      const parsedBase = new URL(supabaseBase);
      if (
        parsedSrc.hostname === parsedBase.hostname &&
        parsedSrc.pathname.startsWith('/storage/v1/object/public/product-images/')
      ) {
        const filename = path.basename(parsedSrc.pathname);
        if (filename) {
          const localBackup = path.resolve(UPLOADS_DIR, filename);
          if (isConfinedWithin(localBackup, UPLOADS_DIR) && fs.existsSync(localBackup) && fs.statSync(localBackup).isFile()) {
            const mtime = Math.floor(fs.statSync(localBackup).mtimeMs);
            return { filePath: localBackup, cacheKeyPart: `${localBackup}:${mtime}` };
          }
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const upstream = await fetch(parsedSrc.toString(), { signal: controller.signal });
          if (!upstream.ok) return null;
          const contentLen = Number(upstream.headers.get('content-length') || 0);
          if (contentLen > 8 * 1024 * 1024) return null;
          const arrayBuf = await upstream.arrayBuffer();
          if (arrayBuf.byteLength > 8 * 1024 * 1024) return null;
          return { buffer: Buffer.from(arrayBuf), cacheKeyPart: cleanSrc };
        } finally {
          clearTimeout(timeout);
        }
      }
    } catch {
      return null;
    }
  }

  return null;
}

const imgInFlight = new Map<string, Promise<Buffer>>();
let activeSharpJobs = 0;
const sharpWaitQueue: Array<() => void> = [];

async function runWithSharpLimit<T>(fn: () => Promise<T>): Promise<T> {
  if (activeSharpJobs >= 4) {
    await new Promise<void>(resolve => sharpWaitQueue.push(resolve));
  }
  activeSharpJobs += 1;
  try {
    return await fn();
  } finally {
    activeSharpJobs -= 1;
    const next = sharpWaitQueue.shift();
    if (next) next();
  }
}

app.get('/api/image', async (req: Request, res: Response) => {
  try {
    const rawSrc = typeof req.query.src === 'string' ? req.query.src : '';
    if (!rawSrc) {
      return res.status(400).json({ error: 'Missing src parameter' });
    }

    const fmtRaw = typeof req.query.fmt === 'string' ? req.query.fmt.toLowerCase() : 'webp';
    const fmt: 'avif' | 'webp' | 'jpeg' = fmtRaw === 'avif' ? 'avif' : fmtRaw === 'jpeg' ? 'jpeg' : 'webp';
    const width = snapImageWidth(req.query.w);
    const defaultQ = fmt === 'avif' ? 58 : fmt === 'webp' ? 80 : 82;
    const rawQ = Number(req.query.q);
    const quality = Number.isFinite(rawQ) ? Math.min(92, Math.max(40, Math.round(rawQ))) : defaultQ;

    const source = await resolveImageSourceBuffer(rawSrc);
    if (!source) {
      return res.status(404).json({ error: 'Image source not found or not permitted' });
    }

    const cacheHash = crypto
      .createHash('sha256')
      .update(`${source.cacheKeyPart}|w=${width}|fmt=${fmt}|q=${quality}`)
      .digest('hex');
    const cachedFile = path.join(IMG_CACHE_DIR, `${cacheHash}.${fmt}`);

    if (fs.existsSync(cachedFile)) {
      res.setHeader('Content-Type', `image/${fmt}`);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Vary', 'Accept');
      return res.sendFile(cachedFile);
    }

    let pending = imgInFlight.get(cacheHash);
    if (!pending) {
      pending = runWithSharpLimit(async () => {
        const inputData = source.filePath ? fs.readFileSync(source.filePath) : source.buffer!;
        const pipeline = sharp(inputData).rotate().resize({
          width,
          withoutEnlargement: true,
          fit: 'inside'
        });

        let outputBuffer: Buffer;
        if (fmt === 'avif') {
          outputBuffer = await pipeline.avif({ quality, effort: 1 }).toBuffer();
        } else if (fmt === 'jpeg') {
          outputBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
        } else {
          outputBuffer = await pipeline.webp({ quality, effort: 2 }).toBuffer();
        }

        try {
          const tempCache = `${cachedFile}.${process.pid}.${Date.now()}.tmp`;
          fs.writeFileSync(tempCache, outputBuffer);
          fs.renameSync(tempCache, cachedFile);
        } catch {
          // Non-fatal cache write failure
        }

        return outputBuffer;
      });
      imgInFlight.set(cacheHash, pending);
      pending.finally(() => imgInFlight.delete(cacheHash));
    }

    const outputBuffer = await pending;

    res.setHeader('Content-Type', `image/${fmt}`);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Vary', 'Accept');
    return res.send(outputBuffer);
  } catch (err: any) {
    console.warn('Image optimize endpoint warning:', err?.message || err);
    return res.status(500).json({ error: 'Failed to optimize image' });
  }
});

async function deleteOrphanedUploadedImage(imageUrl: string | null | undefined, remainingProducts: any[]): Promise<void> {
  if (!imageUrl || typeof imageUrl !== 'string') return;
  const isLocalUpload = imageUrl.startsWith('/api/uploads/');
  const isSupabaseProductUpload = imageUrl.includes('/storage/v1/object/public/product-images/');
  if (!isLocalUpload && !isSupabaseProductUpload) return;

  const cleanUrl = imageUrl.split('?')[0];
  const filename = path.basename(cleanUrl);
  if (!filename || !filename.startsWith('prod_')) return;

  const isReferencedElsewhere = remainingProducts.some(p =>
    p.image === imageUrl ||
    (Array.isArray(p.gallery) && p.gallery.includes(imageUrl))
  );
  if (isReferencedElsewhere) return;

  const localPath = path.join(UPLOADS_DIR, filename);
  if (localPath.startsWith(UPLOADS_DIR) && fs.existsSync(localPath)) {
    try {
      fs.unlinkSync(localPath);
    } catch (err) {
      console.warn(`Failed to unlink local orphaned image ${localPath}:`, err);
    }
  }

  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      await supabaseServer.storage.from('product-images').remove([filename]);
    } catch (err) {
      console.warn(`Failed to remove orphaned image ${filename} from Supabase Storage:`, err);
    }
  }
}

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
  eventType: 'failed_login' | 'lockout' | 'rate_limit_exceeded' | 'password_changed';
  ip: string;
  userAgent: string;
  details: string;
}

function logSecurityEvent(
  eventType: 'failed_login' | 'lockout' | 'rate_limit_exceeded' | 'password_changed',
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

// ----------------- SINGLE-ADMINISTRATOR AUTHENTICATION & PASSWORD MANAGEMENT -----------------
interface AdminSession {
  email: string;
  role: 'admin';
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

const SINGLE_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'limnalione39@gmail.com').trim().toLowerCase();

const FORBIDDEN_WEAK_PASSWORDS = new Set([
  'admin',
  'admin123',
  'administrator',
  'mamasam',
  'password',
  'password123',
  '123456',
  '12345678',
  'qwerty',
  'root',
  'user',
  'changeme'
]);

const FORBIDDEN_WEAK_PASSWORD_DIGESTS = new Set([
  'b79cf6fb02b855b3ab04ed070bf4a4670e9799dcdca00dfcf6cf57541e344af2',
  '9faa4cac0ea465262fbaac2263ea6207cc03cc354affcda4d642aa32f0fd75b3'
]);

interface StoredAdminCredential {
  email: string;
  salt: string;
  hash: string;
  hashAlgorithm?: 'scrypt' | 'pbkdf2';
  role: 'admin';
  setupPending?: boolean;
  createdAt: string;
  updatedAt?: string;
  passwordChangedAt?: string | null;
  envSeedDigest?: string | null;
}

function getStoredAdminCredentials(): Record<string, StoredAdminCredential> {
  return readData<Record<string, StoredAdminCredential>>('admin_credentials.json', {});
}

function saveStoredAdminCredentials(creds: Record<string, StoredAdminCredential>): void {
  writeData('admin_credentials.json', creds);
}

function hashPasswordScrypt(password: string): { salt: string; hash: string; hashAlgorithm: 'scrypt' } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash, hashAlgorithm: 'scrypt' };
}

function verifyStoredCredentialHash(candidate: string, entry: StoredAdminCredential): boolean {
  if (!candidate || !entry?.salt || !entry?.hash) return false;
  try {
    const computed =
      entry.hashAlgorithm === 'scrypt'
        ? crypto.scryptSync(candidate, entry.salt, 64).toString('hex')
        : crypto.pbkdf2Sync(candidate, entry.salt, 100000, 64, 'sha256').toString('hex');
    const candBuf = Buffer.from(computed, 'hex');
    const expBuf = Buffer.from(entry.hash, 'hex');
    return candBuf.length === expBuf.length && crypto.timingSafeEqual(candBuf, expBuf);
  } catch {
    return false;
  }
}

function validateStrongPassword(password: string): string | null {
  if (typeof password !== 'string') {
    return 'Inserisci una password valida.';
  }
  if (password.length < 10 || password.length > 128) {
    return 'La password deve contenere tra 10 e 128 caratteri.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'La password deve includere almeno una lettera maiuscola.';
  }
  if (!/[a-z]/.test(password)) {
    return 'La password deve includere almeno una lettera minuscola.';
  }
  if (!/[0-9]/.test(password)) {
    return 'La password deve includere almeno un numero.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'La password deve includere almeno un carattere speciale (es. ! @ # $ % & *).';
  }
  const normalizedCandidate = password.trim().toLowerCase();
  const candidateDigest = crypto.createHash('sha256').update(normalizedCandidate).digest('hex');
  if (FORBIDDEN_WEAK_PASSWORDS.has(normalizedCandidate) || FORBIDDEN_WEAK_PASSWORD_DIGESTS.has(candidateDigest)) {
    return 'Password troppo comune o non sicura. Scegline una diversa.';
  }
  const emailLocal = SINGLE_ADMIN_EMAIL.split('@')[0];
  if (emailLocal && emailLocal.length >= 3 && password.toLowerCase().includes(emailLocal)) {
    return 'La password non può contenere il nome dell’account email.';
  }
  return null;
}

function getSingleAdminCredential(): StoredAdminCredential | null {
  const creds = getStoredAdminCredentials();
  return creds[SINGLE_ADMIN_EMAIL] || null;
}

function isAdminSetupRequired(): boolean {
  const existing = getSingleAdminCredential();
  if (existing?.setupPending) return true;
  if (existing?.hash && existing?.salt) return false;
  const envPass = process.env.ADMIN_PASSWORD?.trim();
  const envHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  return !envPass && !(envHash && envHash.includes(':'));
}

/**
 * Enforces a single administrator credential record using scrypt hashing.
 * Removes any secondary or legacy admin entries and never uses hardcoded fallback passwords.
 */
async function ensureBackendAdminAccounts(): Promise<void> {
  const creds = getStoredAdminCredentials();
  let updated = false;

  // Enforce single administrator account: purge any secondary/stale admin keys
  for (const existingKey of Object.keys(creds)) {
    if (existingKey.toLowerCase() !== SINGLE_ADMIN_EMAIL) {
      delete creds[existingKey];
      updated = true;
    }
  }

  const envPassword = process.env.ADMIN_PASSWORD?.trim() || '';
  const envHash = process.env.ADMIN_PASSWORD_HASH?.trim() || '';
  const envDigest = envPassword ? crypto.createHash('sha256').update(envPassword).digest('hex') : null;

  const currentEntry = creds[SINGLE_ADMIN_EMAIL];

  if (!currentEntry) {
    if (envHash && envHash.includes(':')) {
      const [salt, hash] = envHash.split(':');
      creds[SINGLE_ADMIN_EMAIL] = {
        email: SINGLE_ADMIN_EMAIL,
        salt,
        hash,
        hashAlgorithm: 'pbkdf2',
        role: 'admin',
        createdAt: new Date().toISOString(),
        passwordChangedAt: null,
        envSeedDigest: null
      };
      updated = true;
    } else if (envPassword) {
      const hashed = hashPasswordScrypt(envPassword);
      creds[SINGLE_ADMIN_EMAIL] = {
        email: SINGLE_ADMIN_EMAIL,
        ...hashed,
        role: 'admin',
        createdAt: new Date().toISOString(),
        passwordChangedAt: null,
        envSeedDigest: envDigest
      };
      updated = true;
    }
  } else if (
    !currentEntry.setupPending &&
    !currentEntry.passwordChangedAt &&
    envPassword &&
    envDigest &&
    (currentEntry.envSeedDigest !== envDigest || currentEntry.hashAlgorithm !== 'scrypt')
  ) {
    // Environment password seeded/rotated before any dashboard password change (or upgrading legacy record)
    const hashed = hashPasswordScrypt(envPassword);
    creds[SINGLE_ADMIN_EMAIL] = {
      ...currentEntry,
      ...hashed,
      updatedAt: new Date().toISOString(),
      envSeedDigest: envDigest
    };
    updated = true;
  }

  if (updated) {
    saveStoredAdminCredentials(creds);
  }

  // Optional Supabase Auth sync ONLY for the single admin email when explicitly seeded via env
  if (isServerSupabaseConfigured() && supabaseServer && envPassword && !creds[SINGLE_ADMIN_EMAIL]?.passwordChangedAt) {
    try {
      const { data: userList } = await supabaseServer.auth.admin.listUsers();
      const existingUser = (userList?.users || []).find(
        u => u.email?.toLowerCase() === SINGLE_ADMIN_EMAIL
      );
      if (!existingUser) {
        await supabaseServer.auth.admin.createUser({
          email: SINGLE_ADMIN_EMAIL,
          password: envPassword,
          email_confirm: true,
          user_metadata: { role: 'admin', full_name: 'Mama Sam Administrator' }
        });
      }
    } catch (e: any) {
      console.warn('[Supabase Auth] Single admin sync note:', e.message);
    }
  }
}

function verifySingleAdminPassword(candidate: string): { valid: boolean; matchedEntry: StoredAdminCredential | null } {
  if (typeof candidate !== 'string' || candidate.length === 0) {
    return { valid: false, matchedEntry: null };
  }

  const creds = getStoredAdminCredentials();
  const entry = creds[SINGLE_ADMIN_EMAIL] || null;

  if (entry?.setupPending) {
    return { valid: false, matchedEntry: entry };
  }

  if (entry && verifyStoredCredentialHash(candidate, entry)) {
    // Automatically upgrade legacy PBKDF2 hash to scrypt on verification
    if (entry.hashAlgorithm !== 'scrypt') {
      const upgraded = hashPasswordScrypt(candidate);
      creds[SINGLE_ADMIN_EMAIL] = {
        ...entry,
        ...upgraded,
        updatedAt: new Date().toISOString()
      };
      saveStoredAdminCredentials(creds);
    }
    return { valid: true, matchedEntry: creds[SINGLE_ADMIN_EMAIL] };
  }

  // Only allow process.env password fallback if no password change has occurred in backend store
  if (!entry?.passwordChangedAt && !entry?.setupPending) {
    const envHash = process.env.ADMIN_PASSWORD_HASH?.trim() || '';
    if (envHash && envHash.includes(':')) {
      const [salt, expectedHash] = envHash.split(':');
      const computedHash = crypto.pbkdf2Sync(candidate, salt, 100000, 64, 'sha256').toString('hex');
      const candBuf = Buffer.from(computedHash);
      const expBuf = Buffer.from(expectedHash);
      if (candBuf.length === expBuf.length && crypto.timingSafeEqual(candBuf, expBuf)) {
        return { valid: true, matchedEntry: entry };
      }
    }

    const envPassword = process.env.ADMIN_PASSWORD?.trim() || '';
    if (envPassword) {
      const candBuf = Buffer.from(candidate);
      const expBuf = Buffer.from(envPassword);
      if (candBuf.length === expBuf.length && crypto.timingSafeEqual(candBuf, expBuf)) {
        const upgraded = hashPasswordScrypt(candidate);
        creds[SINGLE_ADMIN_EMAIL] = {
          email: SINGLE_ADMIN_EMAIL,
          ...upgraded,
          role: 'admin',
          createdAt: entry?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          passwordChangedAt: null,
          envSeedDigest: crypto.createHash('sha256').update(envPassword).digest('hex')
        };
        saveStoredAdminCredentials(creds);
        return { valid: true, matchedEntry: creds[SINGLE_ADMIN_EMAIL] };
      }
    }
  }

  return { valid: false, matchedEntry: entry };
}

// Session auth middleware for protected admin APIs (single administrator enforcement)
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
  }

  const token = authHeader.substring(7).trim();
  const session = activeSessions.get(token);

  if (!session || session.role !== 'admin' || session.email !== SINGLE_ADMIN_EMAIL) {
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

// 0. Supabase Backend Health Status Endpoint (Admin only)
app.get('/api/admin/supabase-status', requireAdminAuth, async (_req: Request, res: Response) => {
  const status = await testSupabaseConnection();
  res.json(status);
});

// 0b. SQL Migration script content endpoint (Admin only)
app.get('/api/admin/schema-sql', requireAdminAuth, (_req: Request, res: Response) => {
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

// 0c. Sync local catalog, categories, and settings into connected Supabase database (Admin only)
app.post('/api/admin/supabase/sync', requireAdminAuth, async (_req: Request, res: Response) => {
  if (!isServerSupabaseConfigured() || !supabaseServer) {
    return res.status(400).json({ error: 'Variabili Supabase non configurate sul server.' });
  }

  try {
    const health = await testSupabaseConnection();
    if (!health.schemaReady) {
      return res.status(400).json({
        error: 'Le tabelle Supabase non esistono ancora. Esegui prima lo script SQL nell’SQL Editor del tuo progetto Supabase.'
      });
    }

    const settings = readData<any>('settings.json', {});
    const categories = readData<any[]>('categories.json', []);
    const products = readData<any[]>('products.json', []);

    if (settings && Object.keys(settings).length > 0) {
      const { error: setErr } = await supabaseServer.from('store_settings').upsert({
        id: 'primary',
        announcement: settings.announcement || '',
        announcement_active: settings.announcementActive !== false,
        store_name: settings.storeName || 'Mama Sam Supermercato Africano & Caraibico',
        address: settings.address || '',
        google_maps_url: settings.googleMapsUrl || '',
        phone1: settings.phone1 || '',
        phone2: settings.phone2 || '',
        whatsapp_number: settings.whatsappNumber || '',
        email: settings.email || '',
        hours_mon_sat: settings.hoursMonSat || '',
        hours_sun: settings.hoursSun || '',
        pickup_estimated_minutes: Number(settings.pickupEstimatedMinutes || 30),
        updated_at: new Date().toISOString()
      });
      if (setErr) {
        return res.status(500).json({ error: `Errore sync impostazioni: ${setErr.message}` });
      }
    }

    if (categories.length > 0) {
      const catRows = categories.map(c => ({
        id: c.id,
        name: c.name,
        summary: c.summary || '',
        image: c.image || '',
        item_count: Number(c.itemCount || 0)
      }));
      const { error: catErr } = await supabaseServer
        .from('categories')
        .upsert(catRows, { onConflict: 'id' });
      if (catErr) {
        return res.status(500).json({ error: `Errore sync categorie: ${catErr.message}` });
      }
    }

    if (products.length > 0) {
      const prodRows = products.map(toDbProduct);
      const { error: prodErr } = await supabaseServer
        .from('products')
        .upsert(prodRows, { onConflict: 'id' });
      if (prodErr) {
        return res.status(500).json({ error: `Errore sync prodotti: ${prodErr.message}` });
      }
    }

    const updatedHealth = await testSupabaseConnection();
    return res.json({
      success: true,
      synced: {
        settings: true,
        categories: categories.length,
        products: products.length
      },
      status: updatedHealth
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Errore sincronizzazione Supabase: ${err?.message || 'Unknown'}` });
  }
});

// 1. Settings (Public read, Admin update)
app.get('/api/settings', async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
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

  // Notify subscribed customers automatically if store opening hours changed
  const hoursChanged =
    (sanitized.hoursMonSat !== undefined && sanitized.hoursMonSat !== current.hoursMonSat) ||
    (sanitized.hoursSun !== undefined && sanitized.hoursSun !== current.hoursSun);

  if (hoursChanged && req.body.notifySubscribers !== false) {
    dispatchPushNotifications({
      topic: 'storeHours',
      title: 'Aggiornamento Orari · Mama Sam Messina',
      body: `Nuovi orari negozio: Lun–Sab ${updated.hoursMonSat || ''} · Dom ${updated.hoursSun || ''}`.trim(),
      url: '/#location-section'
    }).catch(err => console.warn('Push dispatch error on settings update:', err));
  }

  res.json(updated);
});

// 2. Categories (Public read, Admin create/update)
app.get('/api/categories', async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
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
    image: image || 'catFarineAmidi',
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
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  const recipes = readData('recipes.json', []);
  res.json(recipes);
});

// 4. Reviews
app.get('/api/reviews', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  const reviews = readData('reviews.json', []);
  res.json(reviews);
});

// 5. Products (Public read with query filters & admin-only purchasePrice)
app.get('/api/products', async (req: Request, res: Response) => {
  let products: any[] = [];
  const category = req.query.category as string;
  const search = req.query.search as string;
  const verificationStatus = req.query.verificationStatus as string;
  const brand = req.query.brand as string;

  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('products')
        .select('*')
        .order('item_number', { ascending: true, nullsFirst: false });

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

  if (verificationStatus && verificationStatus !== 'all') {
    products = products.filter(p => p.verificationStatus === verificationStatus);
  }

  if (brand && brand !== 'all') {
    products = products.filter(p => p.brand === brand);
  }

  if (search) {
    const q = search.toLowerCase().trim();
    products = products.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.origin && p.origin.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  }

  // Check admin authorization: Only authenticated admins see purchasePrice
  const authHeader = req.headers.authorization;
  let isAdmin = false;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const session = activeSessions.get(token);
    if (session && Date.now() <= session.expiresAt) {
      isAdmin = true;
    }
  }

  const sanitizedProducts = products.map(p => {
    if (!isAdmin) {
      const { purchasePrice, ...rest } = p;
      return rest;
    }
    return p;
  });

  if (isAdmin) {
    res.setHeader('Cache-Control', 'private, no-store');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
  }
  res.json(sanitizedProducts);
});

// Create product (Protected admin action)
app.post('/api/products', requireAdminAuth, async (req: Request, res: Response) => {
  const products = readData<any[]>('products.json', []);
  const body = req.body;

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return res.status(400).json({ error: 'Nome del prodotto obbligatorio.' });
  }

  let price: number | null = null;
  if (body.price !== undefined && body.price !== null && body.price !== '') {
    const parsedPrice = Number(body.price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Il prezzo deve essere un numero valido maggiore o uguale a zero.' });
    }
    price = Number(parsedPrice.toFixed(2));
  }

  let stock: number | null = null;
  if (body.stock !== undefined && body.stock !== null && body.stock !== '') {
    const parsedStock = Number(body.stock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ error: 'La giacenza deve essere 0 o maggiore.' });
    }
    stock = Math.floor(parsedStock);
  }

  let purchasePrice: number | null = null;
  if (body.purchasePrice !== undefined && body.purchasePrice !== null && body.purchasePrice !== '') {
    const parsedPP = Number(body.purchasePrice);
    if (!isNaN(parsedPP) && parsedPP >= 0) {
      purchasePrice = Number(parsedPP.toFixed(2));
    }
  }

  let originalPrice: number | undefined = undefined;
  if (body.originalPrice !== undefined && body.originalPrice !== null && body.originalPrice !== '') {
    const parsedOriginal = Number(body.originalPrice);
    if (!isNaN(parsedOriginal) && parsedOriginal > 0) {
      originalPrice = Number(parsedOriginal.toFixed(2));
    }
  }

  const isDiscounted = Boolean(body.isDiscounted);
  if (isDiscounted && price !== null && originalPrice !== undefined && originalPrice <= price) {
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

  const itemNumber = body.itemNumber ? Number(body.itemNumber) : (products.length + 1);
  const verificationStatus = ['da_verificare', 'in_revisione', 'verificato_etichetta', 'da_identificare'].includes(body.verificationStatus)
    ? body.verificationStatus
    : 'da_verificare';

  const newProduct = {
    id: body.id || `prod-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    itemNumber,
    name: body.name.trim(),
    brand: (body.brand || 'Non identificata').trim(),
    category: body.category || 'Farine e amidi',
    origin: (body.origin || 'Importazione etnica').trim(),
    subCategory: (body.subCategory || body.brand || '').trim(),
    price,
    originalPrice: originalPrice || null,
    observedPrice: body.observedPrice ? String(body.observedPrice).trim() : null,
    priceStatus: body.priceStatus || (price !== null ? 'confirmed' : 'unreadable'),
    purchasePrice,
    verificationStatus,
    packageSize: (body.packageSize || 'Formato da verificare').trim(),
    image: typeof body.image === 'string' ? body.image : '',
    imageStatus: body.imageStatus || 'missing',
    imageStoragePath: body.imageStoragePath || null,
    gallery: Array.isArray(body.gallery) ? body.gallery : [],
    description: (body.description || '').trim(),
    stock,
    isAvailable: body.isAvailable !== false,
    ingredients: (body.ingredients || body.expectedIngredients || '').trim(),
    expectedIngredients: (body.expectedIngredients || body.ingredients || '').trim(),
    allergenInfo: (body.allergenInfo || body.allergensAlert || '').trim(),
    allergensAlert: (body.allergensAlert || body.allergenInfo || '').trim(),
    dietaryInfo: body.dietaryInfo || undefined,
    barcode: body.barcode ? String(body.barcode).trim() : null,
    sku: (body.sku || `MS-CAT-${String(itemNumber).padStart(2, '0')}`).trim(),
    notes: (body.notes || '').trim(),
    salesRank: itemNumber,
    isNewArrival: Boolean(body.isNewArrival),
    isDiscounted,
    discountActive: body.discountActive !== false,
    discountStartDate,
    discountEndDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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

  products.push(newProduct);
  writeData('products.json', products);

  if (newProduct.isNewArrival && req.body.notifySubscribers !== false) {
    dispatchPushNotifications({
      topic: 'newArrivals',
      title: 'Nuovo Arrivo da Mama Sam!',
      body: `${newProduct.name}${newProduct.packageSize ? ` (${newProduct.packageSize})` : ''} è ora disponibile in negozio.`,
      url: '/#new-arrivals-section'
    }).catch(err => console.warn('Push dispatch error on new product:', err));
  }

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

  let updatedPrice = current.price;
  if (body.price !== undefined) {
    if (body.price === null || body.price === '') {
      updatedPrice = null;
    } else {
      const parsed = Number(body.price);
      if (isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ error: 'Il prezzo deve essere un numero valido maggiore o uguale a zero.' });
      }
      updatedPrice = Number(parsed.toFixed(2));
    }
  }

  let updatedStock = current.stock;
  if (body.stock !== undefined) {
    if (body.stock === null || body.stock === '') {
      updatedStock = null;
    } else {
      const parsedStock = Number(body.stock);
      if (isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ error: 'La giacenza deve essere un numero intero non negativo.' });
      }
      updatedStock = Math.floor(parsedStock);
    }
  }

  let purchasePrice = current.purchasePrice;
  if (body.purchasePrice !== undefined) {
    if (body.purchasePrice === null || body.purchasePrice === '') {
      purchasePrice = null;
    } else {
      const parsedPP = Number(body.purchasePrice);
      if (!isNaN(parsedPP) && parsedPP >= 0) {
        purchasePrice = Number(parsedPP.toFixed(2));
      }
    }
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
  if (isDiscounted && updatedPrice !== null && originalPrice !== undefined && originalPrice <= updatedPrice) {
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

  const verificationStatus = body.verificationStatus !== undefined
    ? body.verificationStatus
    : current.verificationStatus;

  // Track if image or gallery changed to clean up obsolete uploaded files safely
  const oldImage = current.image;
  const oldGallery: string[] = Array.isArray(current.gallery) ? current.gallery : [];
  const newImage = body.image !== undefined ? body.image : current.image;
  const newGallery: string[] = Array.isArray(body.gallery) ? body.gallery : oldGallery;

  products[index] = {
    ...current,
    name: body.name !== undefined ? String(body.name).trim() : current.name,
    brand: body.brand !== undefined ? String(body.brand).trim() : current.brand,
    category: body.category || current.category,
    origin: body.origin !== undefined ? String(body.origin).trim() : current.origin,
    subCategory: body.subCategory !== undefined ? String(body.subCategory).trim() : current.subCategory,
    price: updatedPrice,
    originalPrice,
    observedPrice: body.observedPrice !== undefined ? (body.observedPrice ? String(body.observedPrice).trim() : null) : current.observedPrice,
    priceStatus: body.priceStatus || current.priceStatus,
    purchasePrice,
    verificationStatus,
    packageSize: body.packageSize !== undefined ? String(body.packageSize).trim() : current.packageSize,
    image: newImage,
    imageStatus: body.imageStatus || current.imageStatus || 'missing',
    imageStoragePath: body.imageStoragePath !== undefined ? body.imageStoragePath : current.imageStoragePath,
    gallery: newGallery,
    description: body.description !== undefined ? String(body.description).trim() : current.description,
    stock: updatedStock,
    isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : current.isAvailable,
    ingredients: body.ingredients !== undefined ? String(body.ingredients).trim() : current.ingredients,
    expectedIngredients: body.expectedIngredients !== undefined ? String(body.expectedIngredients).trim() : current.expectedIngredients,
    allergenInfo: body.allergenInfo !== undefined ? String(body.allergenInfo).trim() : current.allergenInfo,
    allergensAlert: body.allergensAlert !== undefined ? String(body.allergensAlert).trim() : current.allergensAlert,
    dietaryInfo: body.dietaryInfo !== undefined ? body.dietaryInfo : current.dietaryInfo,
    barcode: body.barcode !== undefined ? (body.barcode ? String(body.barcode).trim() : null) : current.barcode,
    sku: body.sku !== undefined ? String(body.sku).trim() : current.sku,
    notes: body.notes !== undefined ? String(body.notes).trim() : current.notes,
    isNewArrival: body.isNewArrival !== undefined ? Boolean(body.isNewArrival) : current.isNewArrival,
    isDiscounted: Boolean(isDiscounted),
    discountActive: body.discountActive !== undefined ? Boolean(body.discountActive) : (current.discountActive !== false),
    discountStartDate,
    discountEndDate,
    updatedAt: new Date().toISOString()
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

  if (oldImage && oldImage !== newImage) {
    await deleteOrphanedUploadedImage(oldImage, products);
  }
  for (const prevGalleryImg of oldGallery) {
    if (!newGallery.includes(prevGalleryImg)) {
      await deleteOrphanedUploadedImage(prevGalleryImg, products);
    }
  }

  if (!current.isNewArrival && products[index].isNewArrival && req.body.notifySubscribers !== false) {
    dispatchPushNotifications({
      topic: 'newArrivals',
      title: 'Nuovo Arrivo da Mama Sam!',
      body: `${products[index].name}${products[index].packageSize ? ` (${products[index].packageSize})` : ''} è appena arrivato in Via Ugo Bassi 104.`,
      url: '/#new-arrivals-section'
    }).catch(err => console.warn('Push dispatch error on product arrival toggle:', err));
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

  await deleteOrphanedUploadedImage(productToDelete.image, products);
  if (Array.isArray(productToDelete.gallery)) {
    for (const galleryImg of productToDelete.gallery) {
      await deleteOrphanedUploadedImage(galleryImg, products);
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

    // Security Check 2: Actual Magic Byte validation (JPEG, PNG, WebP, AVIF)
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    const isWebp = buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP';
    const ftypBrand = buffer.slice(4, 12).toString();
    const isAvif = ftypBrand.startsWith('ftypavif') || ftypBrand.startsWith('ftypavis');

    if (!isJpeg && !isPng && !isWebp && !isAvif) {
      return res.status(400).json({
        error: 'Invalid file format. Only authentic raster images (JPEG, PNG, WebP, AVIF) are accepted. SVG, HTML, and executables are rejected.'
      });
    }

    // Security Check 3: Re-encode with Sharp to strip EXIF, metadata, GPS, and malicious payloads
    const imagePipeline = sharp(buffer);
    const metadata = await imagePipeline.metadata();

    if (!metadata.width || !metadata.height) {
      return res.status(400).json({ error: 'Could not decode image dimensions.' });
    }

    if (metadata.width > 4096 || metadata.height > 4096) {
      return res.status(400).json({ error: 'Image dimensions exceed maximum allowed resolution (4096x4096px).' });
    }

    const secureFilename = `prod_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.webp`;
    const targetFilePath = path.join(UPLOADS_DIR, secureFilename);

    if (!targetFilePath.startsWith(UPLOADS_DIR)) {
      return res.status(400).json({ error: 'Invalid file destination path.' });
    }

    const processedBuffer = await imagePipeline
      .rotate()
      .resize({
        width: 1200,
        height: 1200,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 84, effort: 4 })
      .toBuffer();

    const outMeta = await sharp(processedBuffer).metadata();

    // 1. If Supabase Storage is configured, upload directly to 'product-images' bucket
    if (isServerSupabaseConfigured() && supabaseServer) {
      try {
        const { error: sbStorageErr } = await supabaseServer.storage
          .from('product-images')
          .upload(secureFilename, processedBuffer, {
            contentType: 'image/webp',
            cacheControl: '31536000',
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
            width: outMeta.width,
            height: outMeta.height,
            sizeBytes: processedBuffer.length,
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
      width: outMeta.width,
      height: outMeta.height,
      sizeBytes: processedBuffer.length,
      originalName: typeof filename === 'string' ? path.basename(filename).substring(0, 50) : 'upload.webp'
    });
  } catch (err: any) {
    console.error('Image processing failure:', err);
    res.status(500).json({ error: `Image processing error: ${err.message || 'Validation failed'}` });
  }
});

// Delete specific uploaded image (Protected admin action)
app.delete('/api/upload/image/:filename', requireAdminAuth, async (req: Request, res: Response) => {
  const safeFilename = path.basename(req.params.filename);
  const targetPath = path.join(UPLOADS_DIR, safeFilename);

  if (!targetPath.startsWith(UPLOADS_DIR)) {
    return res.status(400).json({ error: 'Invalid path.' });
  }

  const products = readData<any[]>('products.json', []);
  const publicUrl = `/api/uploads/${safeFilename}`;
  const isReferenced = products.some(p =>
    p.image === publicUrl ||
    (typeof p.image === 'string' && p.image.endsWith(`/${safeFilename}`)) ||
    (Array.isArray(p.gallery) && p.gallery.some((g: string) => g === publicUrl || g.endsWith(`/${safeFilename}`)))
  );

  if (isReferenced) {
    return res.status(400).json({ error: 'Cannot delete image: it is currently set as the image for an active product.' });
  }

  let deleted = false;
  if (fs.existsSync(targetPath)) {
    try {
      fs.unlinkSync(targetPath);
      deleted = true;
    } catch {
      return res.status(500).json({ error: 'Failed to delete file from disk.' });
    }
  }

  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      await supabaseServer.storage.from('product-images').remove([safeFilename]);
      deleted = true;
    } catch (err) {
      console.warn('Supabase storage delete warning:', err);
    }
  }

  if (deleted) {
    return res.json({ success: true, message: 'Image deleted from storage.' });
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

      if (!error && Array.isArray(data)) {
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
      if (product.verificationStatus === 'verificato_etichetta' && product.stock != null && product.stock < requestedQty) {
        return res.status(400).json({
          error: `Giacenza insufficiente per ${product.name}. Solo ${product.stock} unità disponibili.`
        });
      }

      // Authoritative promotional price calculation (reverts to originalPrice if discount expired or disabled)
      const { effectivePrice } = resolveServerProductPrice(product, new Date());
      const unitPrice = Number((effectivePrice || 0).toFixed(2));
      const lineTotal = Number((unitPrice * requestedQty).toFixed(2));
      calculatedSubtotal += lineTotal;

      // Decrement stock safely
      if (product.stock != null && product.stock > 0) {
        product.stock = Math.max(0, product.stock - requestedQty);
      }

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

// ----------------- ADMIN AUTHENTICATION, SESSIONS & PASSWORD MANAGEMENT -----------------
// Returns only whether initial admin setup is still required (never exposes emails or credentials)
app.get('/api/admin/auth-status', (_req: Request, res: Response) => {
  res.json({
    setupRequired: isAdminSetupRequired()
  });
});

// One-time first-run setup when no env password or stored credential exists (locks permanently once claimed)
app.post('/api/admin/claim', async (req: Request, res: Response) => {
  if (!isAdminSetupRequired()) {
    return res.status(403).json({ error: 'Setup amministratore già completato.' });
  }

  const { password, confirmPassword } = req.body || {};
  if (typeof password !== 'string' || typeof confirmPassword !== 'string') {
    return res.status(400).json({ error: 'Inserisci e conferma la password.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Le password non coincidono.' });
  }

  const policyError = validateStrongPassword(password);
  if (policyError) {
    return res.status(400).json({ error: policyError });
  }

  const hashed = hashPasswordScrypt(password);
  const creds: Record<string, StoredAdminCredential> = {
    [SINGLE_ADMIN_EMAIL]: {
      email: SINGLE_ADMIN_EMAIL,
      ...hashed,
      role: 'admin',
      createdAt: new Date().toISOString(),
      passwordChangedAt: new Date().toISOString(),
      envSeedDigest: null
    }
  };
  saveStoredAdminCredentials(creds);

  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      const { data: userList } = await supabaseServer.auth.admin.listUsers();
      const adminUser = (userList?.users || []).find(
        u => u.email?.toLowerCase() === SINGLE_ADMIN_EMAIL
      );
      if (adminUser) {
        await supabaseServer.auth.admin.updateUserById(adminUser.id, { password });
      } else {
        await supabaseServer.auth.admin.createUser({
          email: SINGLE_ADMIN_EMAIL,
          password,
          email_confirm: true,
          user_metadata: { role: 'admin', full_name: 'Mama Sam Administrator' }
        });
      }
    } catch (sbErr: any) {
      console.warn('[Supabase Auth] Claim sync note:', sbErr?.message || sbErr);
    }
  }

  activeSessions.clear();

  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + 8 * 60 * 60 * 1000;
  activeSessions.set(token, {
    email: SINGLE_ADMIN_EMAIL,
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
      email: SINGLE_ADMIN_EMAIL,
      userId: 'primary-admin',
      store: 'Mama Sam Messina',
      supabaseAuth: isServerSupabaseConfigured(),
      authorizedAt: new Date().toISOString()
    }
  });
});

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

  const { email, password } = req.body || {};
  const inputEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const inputPassword = typeof password === 'string' ? password : '';

  const emailMatchesSingleAdmin = Boolean(inputEmail && inputEmail === SINGLE_ADMIN_EMAIL);
  let authSucceeded = false;

  // Constant-time password verification strictly tied to the single administrator account
  if (emailMatchesSingleAdmin && inputPassword) {
    const localCheck = verifySingleAdminPassword(inputPassword);
    if (localCheck.valid) {
      authSucceeded = true;
    } else if (
      !isAdminSetupRequired() &&
      !localCheck.matchedEntry?.passwordChangedAt &&
      isServerSupabaseConfigured() &&
      supabaseServer
    ) {
      // Allow Supabase Auth verification for the single administrator if local password was not overridden
      try {
        const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
          email: SINGLE_ADMIN_EMAIL,
          password: inputPassword
        });
        if (!authError && authData?.user?.email?.toLowerCase() === SINGLE_ADMIN_EMAIL) {
          let hasAdminRole = authData.user.user_metadata?.role === 'admin';
          if (!hasAdminRole) {
            try {
              const { data: roleRow } = await supabaseServer
                .from('user_roles')
                .select('role')
                .eq('user_id', authData.user.id)
                .single();
              hasAdminRole = roleRow?.role === 'admin';
            } catch {
              // Table may not be migrated yet
            }
          }
          if (hasAdminRole) {
            authSucceeded = true;
          }
        }
      } catch {
        // Ignore upstream errors and fall through to generic auth error
      }
    }
  } else {
    // Burn comparable scrypt time so response latency does not leak whether the email matched
    crypto.scryptSync(inputPassword || 'dummy', 'anti-enumeration-salt', 64);
  }

  if (authSucceeded) {
    delete lockoutMap[clientIp];
    saveLockoutMap(lockoutMap);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = now + 8 * 60 * 60 * 1000;

    activeSessions.set(token, {
      email: SINGLE_ADMIN_EMAIL,
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
        email: SINGLE_ADMIN_EMAIL,
        userId: 'primary-admin',
        store: 'Mama Sam Messina',
        supabaseAuth: isServerSupabaseConfigured(),
        authorizedAt: new Date().toISOString()
      }
    });
  }

  // Generic authentication error: never reveal whether email or password was incorrect
  rateRecord.attempts = (rateRecord.attempts || 0) + 1;
  rateRecord.lastAttempt = now;

  logSecurityEvent('failed_login', req, `Tentativo di accesso fallito da ${clientIp} (${rateRecord.attempts}/5)`);

  if (rateRecord.attempts >= 5) {
    rateRecord.lockedUntil = now + 15 * 60 * 1000;
    lockoutMap[clientIp] = rateRecord;
    saveLockoutMap(lockoutMap);

    logSecurityEvent('lockout', req, `IP bloccato per 15 minuti dopo 5 tentativi consecutivi falliti`);

    return res.status(429).json({
      error: 'Troppi tentativi falliti. Riprova tra qualche minuto.'
    });
  }

  lockoutMap[clientIp] = rateRecord;
  saveLockoutMap(lockoutMap);

  return res.status(401).json({
    error: 'Credenziali non valide. Verifica i dati inseriti e riprova.'
  });
});

// Change single administrator password (requires current password, enforces strength, invalidates all sessions)
app.post('/api/admin/change-password', requireAdminAuth, async (req: Request, res: Response) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};

  if (
    typeof currentPassword !== 'string' ||
    typeof newPassword !== 'string' ||
    typeof confirmPassword !== 'string' ||
    !currentPassword ||
    !newPassword ||
    !confirmPassword
  ) {
    return res.status(400).json({ error: 'Compila tutti i campi richiesti.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'La nuova password e la conferma non coincidono.' });
  }

  const currentCheck = verifySingleAdminPassword(currentPassword);
  if (!currentCheck.valid) {
    return res.status(401).json({ error: 'La password attuale non è corretta.' });
  }

  if (newPassword === currentPassword) {
    return res.status(400).json({ error: 'La nuova password deve essere diversa da quella attuale.' });
  }

  const strengthError = validateStrongPassword(newPassword);
  if (strengthError) {
    return res.status(400).json({ error: strengthError });
  }

  const hashed = hashPasswordScrypt(newPassword);
  const existing = getSingleAdminCredential();
  const updatedCreds: Record<string, StoredAdminCredential> = {
    [SINGLE_ADMIN_EMAIL]: {
      email: SINGLE_ADMIN_EMAIL,
      ...hashed,
      role: 'admin',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      passwordChangedAt: new Date().toISOString(),
      envSeedDigest: existing?.envSeedDigest || null
    }
  };
  saveStoredAdminCredentials(updatedCreds);

  // Synchronize updated password with Supabase Auth if configured
  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      const { data: userList } = await supabaseServer.auth.admin.listUsers();
      const adminUser = (userList?.users || []).find(
        u => u.email?.toLowerCase() === SINGLE_ADMIN_EMAIL
      );
      if (adminUser) {
        await supabaseServer.auth.admin.updateUserById(adminUser.id, {
          password: newPassword
        });
      }
    } catch (sbErr: any) {
      console.warn('[Supabase Auth] Password sync note:', sbErr?.message || sbErr);
    }
  }

  // Invalidate all existing admin sessions across every browser/device
  activeSessions.clear();

  logSecurityEvent('password_changed', req, 'Password amministratore aggiornata e sessioni invalidate');

  return res.json({
    success: true,
    sessionsInvalidated: true,
    message: 'Password aggiornata con successo. Effettua nuovamente l’accesso con la nuova password.'
  });
});

// Admin session verification endpoint
app.get('/api/admin/verify', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ authenticated: true, role: 'admin', email: SINGLE_ADMIN_EMAIL, store: 'Mama Sam Messina' });
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
  let ordersLoadedFromSupabase = false;

  if (isServerSupabaseConfigured() && supabaseServer) {
    try {
      const [ordRes, prodRes] = await Promise.all([
        supabaseServer.from('orders').select('*').order('created_at', { ascending: false }),
        supabaseServer.from('products').select('*')
      ]);
      if (!ordRes.error && Array.isArray(ordRes.data)) {
        orders = ordRes.data.map(o => toFrontendOrder(o, []));
        ordersLoadedFromSupabase = true;
      }
      if (!prodRes.error && Array.isArray(prodRes.data) && prodRes.data.length > 0) {
        products = prodRes.data.map(toFrontendProduct);
      }
    } catch (e) {
      console.warn('Supabase stats query error, using local fallback:', e);
    }
  }

  if (!ordersLoadedFromSupabase) orders = readData<any[]>('orders.json', []);
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

// ----------------- WEB PUSH NOTIFICATIONS (VAPID & SUBSCRIPTIONS) -----------------
interface VapidKeyPair {
  publicKey: string;
  privateKey: string;
  subject: string;
}

interface StoredPushSubscription {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  topics: {
    newArrivals: boolean;
    storeHours: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface PushDispatchLog {
  id: string;
  title: string;
  body: string;
  topic: 'newArrivals' | 'storeHours' | 'all';
  sentCount: number;
  failedCount: number;
  removedCount: number;
  createdAt: string;
}

let cachedVapidKeys: VapidKeyPair | null = null;

function getVapidKeys(): VapidKeyPair {
  if (cachedVapidKeys) return cachedVapidKeys;

  const envPub = process.env.VAPID_PUBLIC_KEY?.trim();
  const envPriv = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:mamasamafrican@gmail.com';

  if (envPub && envPriv) {
    cachedVapidKeys = { publicKey: envPub, privateKey: envPriv, subject };
    webpush.setVapidDetails(subject, envPub, envPriv);
    return cachedVapidKeys;
  }

  const keyFile = path.join(DATA_DIR, '.vapid_keys.json');
  if (fs.existsSync(keyFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
      if (parsed?.publicKey && parsed?.privateKey) {
        cachedVapidKeys = {
          publicKey: parsed.publicKey,
          privateKey: parsed.privateKey,
          subject: parsed.subject || subject
        };
        webpush.setVapidDetails(cachedVapidKeys.subject, cachedVapidKeys.publicKey, cachedVapidKeys.privateKey);
        return cachedVapidKeys;
      }
    } catch {
      // Regenerate below if corrupted
    }
  }

  const generated = webpush.generateVAPIDKeys();
  cachedVapidKeys = {
    publicKey: generated.publicKey,
    privateKey: generated.privateKey,
    subject
  };
  try {
    fs.writeFileSync(keyFile, JSON.stringify(cachedVapidKeys, null, 2), { encoding: 'utf-8', mode: 0o600 });
  } catch (err) {
    console.warn('Could not persist VAPID keys to disk:', err);
  }
  webpush.setVapidDetails(cachedVapidKeys.subject, cachedVapidKeys.publicKey, cachedVapidKeys.privateKey);
  return cachedVapidKeys;
}

function isValidPushEndpoint(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'https:') return true;
    if (parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function dispatchPushNotifications(opts: {
  topic: 'newArrivals' | 'storeHours' | 'all';
  title: string;
  body: string;
  url?: string;
}): Promise<{ sentCount: number; failedCount: number; removedCount: number; totalTargeted: number }> {
  const keys = getVapidKeys();
  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);

  const subscriptions = readData<StoredPushSubscription[]>('push_subscriptions.json', []);
  const targets = subscriptions.filter(sub => {
    if (opts.topic === 'all') return sub.topics.newArrivals || sub.topics.storeHours;
    if (opts.topic === 'newArrivals') return Boolean(sub.topics.newArrivals);
    if (opts.topic === 'storeHours') return Boolean(sub.topics.storeHours);
    return false;
  });

  if (targets.length === 0) {
    return { sentCount: 0, failedCount: 0, removedCount: 0, totalTargeted: 0 };
  }

  const payload = JSON.stringify({
    title: opts.title.substring(0, 120),
    body: opts.body.substring(0, 260),
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: opts.url && opts.url.startsWith('/') ? opts.url : '/',
    topic: opts.topic,
    tag: `mamasam-${opts.topic}-${Date.now()}`
  });

  let sentCount = 0;
  let failedCount = 0;
  const expiredEndpoints = new Set<string>();

  await Promise.all(
    targets.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys
          },
          payload,
          { TTL: 86400 }
        );
        sentCount += 1;
      } catch (err: any) {
        const statusCode = err?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          expiredEndpoints.add(sub.endpoint);
        } else {
          failedCount += 1;
        }
      }
    })
  );

  if (expiredEndpoints.size > 0) {
    const remaining = subscriptions.filter(s => !expiredEndpoints.has(s.endpoint));
    writeData('push_subscriptions.json', remaining);
  }

  const history = readData<PushDispatchLog[]>('push_history.json', []);
  history.unshift({
    id: `push-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    title: opts.title.substring(0, 120),
    body: opts.body.substring(0, 260),
    topic: opts.topic,
    sentCount,
    failedCount,
    removedCount: expiredEndpoints.size,
    createdAt: new Date().toISOString()
  });
  if (history.length > 50) history.length = 50;
  writeData('push_history.json', history);

  return {
    sentCount,
    failedCount,
    removedCount: expiredEndpoints.size,
    totalTargeted: targets.length
  };
}

// Public VAPID public key endpoint
app.get('/api/push/vapid-public-key', (_req: Request, res: Response) => {
  try {
    const { publicKey } = getVapidKeys();
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({ publicKey, enabled: true });
  } catch (err: any) {
    res.status(500).json({ error: 'VAPID initialization error', enabled: false });
  }
});

// Subscribe / update browser push notification preferences
app.post('/api/push/subscribe', (req: Request, res: Response) => {
  const { subscription, topics } = req.body || {};

  if (
    !subscription ||
    typeof subscription.endpoint !== 'string' ||
    !isValidPushEndpoint(subscription.endpoint) ||
    !subscription.keys ||
    typeof subscription.keys.p256dh !== 'string' ||
    typeof subscription.keys.auth !== 'string' ||
    subscription.keys.p256dh.length < 10 ||
    subscription.keys.p256dh.length > 512 ||
    subscription.keys.auth.length < 10 ||
    subscription.keys.auth.length > 512
  ) {
    return res.status(400).json({ error: 'Sottoscrizione push non valida.' });
  }

  const newArrivals = topics?.newArrivals !== false;
  const storeHours = topics?.storeHours !== false;

  const list = readData<StoredPushSubscription[]>('push_subscriptions.json', []);
  const nowIso = new Date().toISOString();
  const existingIdx = list.findIndex(item => item.endpoint === subscription.endpoint);

  if (existingIdx !== -1) {
    list[existingIdx] = {
      ...list[existingIdx],
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      topics: { newArrivals, storeHours },
      updatedAt: nowIso
    };
  } else {
    if (list.length >= 5000) {
      list.shift();
    }
    list.push({
      id: `sub-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      topics: { newArrivals, storeHours },
      createdAt: nowIso,
      updatedAt: nowIso
    });
  }

  writeData('push_subscriptions.json', list);
  res.status(201).json({
    success: true,
    topics: { newArrivals, storeHours }
  });
});

// Unsubscribe browser push notifications
app.post('/api/push/unsubscribe', (req: Request, res: Response) => {
  const { endpoint } = req.body || {};
  if (!endpoint || typeof endpoint !== 'string') {
    return res.status(400).json({ error: 'Endpoint obbligatorio.' });
  }

  const list = readData<StoredPushSubscription[]>('push_subscriptions.json', []);
  const filtered = list.filter(item => item.endpoint !== endpoint);
  writeData('push_subscriptions.json', filtered);

  res.json({ success: true, removed: list.length - filtered.length });
});

// Admin Push Stats & Recent History
app.get('/api/push/stats', requireAdminAuth, (_req: Request, res: Response) => {
  const list = readData<StoredPushSubscription[]>('push_subscriptions.json', []);
  const history = readData<PushDispatchLog[]>('push_history.json', []);

  res.json({
    totalSubscribers: list.length,
    newArrivalsSubscribers: list.filter(s => s.topics.newArrivals).length,
    storeHoursSubscribers: list.filter(s => s.topics.storeHours).length,
    recentHistory: history.slice(0, 15)
  });
});

// Admin Manual Broadcast Push Notification
app.post('/api/push/send', requireAdminAuth, async (req: Request, res: Response) => {
  const { title, body, topic, url } = req.body || {};
  if (!title || typeof title !== 'string' || !body || typeof body !== 'string') {
    return res.status(400).json({ error: 'Titolo e messaggio della notifica sono obbligatori.' });
  }

  const safeTopic: 'newArrivals' | 'storeHours' | 'all' =
    topic === 'newArrivals' || topic === 'storeHours' ? topic : 'all';

  try {
    const result = await dispatchPushNotifications({
      topic: safeTopic,
      title: title.trim(),
      body: body.trim(),
      url: typeof url === 'string' && url.startsWith('/') ? url : '/'
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: `Errore invio notifiche push: ${err.message || 'Unknown'}` });
  }
});

// Prevent unmatched /api/* requests from returning SPA HTML
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// ----------------- VITE / STATIC SERVING -----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { 
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null
      },
      appType: 'spa'
    });

    // Prevent /@vite/client from dialing an unavailable :24678 HMR WebSocket
    // in middlewareMode while keeping CSS style injection and Vite exports intact.
    app.get('/@vite/client', async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await vite.transformRequest('/@vite/client');
        if (!result?.code) return next();
        const safeCode = result.code
          .replace(
            'transport.connect(createHMRHandler(handleMessage));',
            '/* HMR WebSocket disabled */'
          )
          .replace(
            /else throw new SendBeforeConnectError\(["']send was called before connect["']\);?/,
            'else return;'
          );
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        return res.send(safeCode);
      } catch {
        return next();
      }
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      maxAge: '365d',
      immutable: true
    }));
    app.use(express.static(distPath, {
      maxAge: '7d'
    }));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mama Sam Supermarket server running on http://0.0.0.0:${PORT}`);
    
    // Background provisioning of admin accounts without blocking the HTTP listener
    ensureBackendAdminAccounts().catch((err: any) => {
      console.warn('Backend admin account provisioning note:', err.message);
    });
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
    } else {
      console.error('Server listen error:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
