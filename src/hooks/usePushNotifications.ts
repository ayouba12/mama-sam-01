import { useState, useEffect, useCallback } from 'react';
import { registerSW } from 'virtual:pwa-register';

export interface PushTopics {
  newArrivals: boolean;
  storeHours: boolean;
}

const TOPICS_STORAGE_KEY = 'mamasam_push_topics';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function readStoredTopics(): PushTopics {
  try {
    const raw = localStorage.getItem(TOPICS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        newArrivals: parsed.newArrivals !== false,
        storeHours: parsed.storeHours !== false
      };
    }
  } catch {
    // ignore storage errors
  }
  return { newArrivals: true, storeHours: true };
}

export function usePushNotifications() {
  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<PushTopics>(readStoredTopics);

  // Register Service Worker once and inspect current subscription
  useEffect(() => {
    if (!isSupported) return;

    let cancelled = false;
    registerSW({
      immediate: true,
      onRegisterError(err) {
        console.warn('Service worker registration note:', err);
      }
    });

    navigator.serviceWorker.ready
      .then(async (registration) => {
        if (cancelled) return;
        const sub = await registration.pushManager.getSubscription();
        if (!cancelled) {
          setIsSubscribed(Boolean(sub));
          setPermission(Notification.permission);
        }
      })
      .catch(() => {
        // SW may fail silently in unsupported preview frames
      });

    return () => {
      cancelled = true;
    };
  }, [isSupported]);

  const syncSubscriptionWithServer = useCallback(
    async (sub: PushSubscription, nextTopics: PushTopics) => {
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          topics: nextTopics
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Impossibile salvare le preferenze di notifica.');
      }
      try {
        localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(nextTopics));
      } catch {
        // ignore storage errors
      }
      setTopics(nextTopics);
    },
    []
  );

  const subscribe = useCallback(
    async (selectedTopics: PushTopics = topics) => {
      if (!isSupported) {
        setError('Le notifiche push non sono supportate da questo browser.');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const permResult = await Notification.requestPermission();
        setPermission(permResult);

        if (permResult !== 'granted') {
          setError(
            permResult === 'denied'
              ? 'Notifiche bloccate dal browser. Abilitale dalle impostazioni del sito.'
              : 'Autorizzazione alle notifiche non concessa.'
          );
          return false;
        }

        const keyRes = await fetch('/api/push/vapid-public-key');
        if (!keyRes.ok) {
          throw new Error('Servizio notifiche temporaneamente non disponibile.');
        }
        const { publicKey } = await keyRes.json();
        if (!publicKey) {
          throw new Error('Chiave push del server non configurata.');
        }

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          const applicationServerKey = urlBase64ToUint8Array(publicKey);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as unknown as BufferSource
          });
        }

        await syncSubscriptionWithServer(subscription, selectedTopics);
        setIsSubscribed(true);
        return true;
      } catch (err: any) {
        setError(err?.message || 'Errore durante l’attivazione delle notifiche.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported, topics, syncSubscriptionWithServer]
  );

  const updateTopics = useCallback(
    async (nextTopics: PushTopics) => {
      setTopics(nextTopics);
      try {
        localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(nextTopics));
      } catch {
        // ignore
      }

      if (!isSupported || !isSubscribed) return;

      setIsLoading(true);
      setError(null);
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await syncSubscriptionWithServer(subscription, nextTopics);
        }
      } catch (err: any) {
        setError(err?.message || 'Errore aggiornamento preferenze.');
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported, isSubscribed, syncSubscriptionWithServer]
  );

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        }).catch(() => {});
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err: any) {
      setError(err?.message || 'Errore durante la disattivazione.');
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    topics,
    subscribe,
    updateTopics,
    unsubscribe
  };
}
