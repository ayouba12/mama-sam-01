import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

interface SwPushEvent extends Event {
  data?: {
    json: () => any;
    text: () => string;
  } | null;
  waitUntil: (promise: Promise<any>) => void;
}

interface SwNotificationEvent extends Event {
  notification: Notification & { data?: { url?: string } };
  waitUntil: (promise: Promise<any>) => void;
}

interface SwWindowClient {
  url: string;
  focus: () => Promise<SwWindowClient>;
  navigate?: (url: string) => Promise<SwWindowClient | null>;
}

interface SwGlobalScope {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
  skipWaiting: () => Promise<void>;
  registration: ServiceWorkerRegistration;
  clients: {
    matchAll: (options?: { type?: string; includeUncontrolled?: boolean }) => Promise<SwWindowClient[]>;
    openWindow: (url: string) => Promise<SwWindowClient | null>;
  };
  location: Location;
  addEventListener: (type: string, listener: (event: any) => void) => void;
}

const sw = globalThis as unknown as SwGlobalScope;

sw.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

// Precache Vite bundle assets injected by vite-plugin-pwa
precacheAndRoute((self as unknown as SwGlobalScope).__WB_MANIFEST || []);

// Cache optimized AVIF/WebP resized images aggressively for fast mobile repeat visits
registerRoute(
  ({ url }) => url.pathname === '/api/image' || url.pathname.startsWith('/api/uploads/'),
  new CacheFirst({
    cacheName: 'mamasam-optimized-images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 250,
        maxAgeSeconds: 30 * 24 * 60 * 60
      })
    ]
  })
);

// Stale-while-revalidate for public catalog, categories, recipes, and settings
registerRoute(
  ({ url, request }) =>
    request.method === 'GET' &&
    (url.pathname === '/api/products' ||
      url.pathname === '/api/categories' ||
      url.pathname === '/api/recipes' ||
      url.pathname === '/api/settings'),
  new StaleWhileRevalidate({
    cacheName: 'mamasam-storefront-data',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 24 * 60 * 60
      })
    ]
  })
);

// Handle incoming Web Push notifications (new product arrivals & store hour updates)
sw.addEventListener('push', (event: SwPushEvent) => {
  let payload: {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    url?: string;
    tag?: string;
    topic?: string;
  } = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || 'Mama Sam Supermercato';
  const options: NotificationOptions = {
    body: payload.body || 'Nuovi aggiornamenti disponibili dal negozio a Messina.',
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-192x192.png',
    tag: payload.tag || `mamasam-${payload.topic || 'update'}`,
    data: {
      url: payload.url || '/'
    }
  };

  event.waitUntil(sw.registration.showNotification(title, options));
});

// Focus existing store tab or open the target section when notification is clicked
sw.addEventListener('notificationclick', (event: SwNotificationEvent) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/';
  const absoluteTarget = new URL(targetUrl, sw.location.origin).href;

  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if ('focus' in client && client.url.startsWith(sw.location.origin)) {
          await client.focus();
          if (client.navigate) {
            return client.navigate(absoluteTarget);
          }
          return client;
        }
      }
      return sw.clients.openWindow(absoluteTarget);
    })
  );
});
