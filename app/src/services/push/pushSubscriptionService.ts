import { getAuthHeaders } from '@/features/auth/api/authClient';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';

export interface PushSubscriptionContext {
  linhaId: string;
  paradaId: string;
}

interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  context: PushSubscriptionContext | null;
}

function decodeVapidPublicKey(base64Value: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64Value.length % 4)) % 4);
  const normalized = `${base64Value}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(normalized);
  const output = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }

  return output.buffer;
}

function resolvePushSubscriptionEndpoint(): string {
  return resolveApiEndpoint('/v1/push/subscriptions');
}

function extractSubscriptionKeys(subscription: PushSubscription): {
  p256dh: string;
  auth: string;
} | null {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!p256dh || !auth) {
    return null;
  }

  return { p256dh, auth };
}

export async function syncPushSubscription(context: PushSubscriptionContext): Promise<void> {
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    return;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidPublicKey(vapidPublicKey),
      });
    }

    const keys = extractSubscriptionKeys(subscription);
    if (!keys) {
      return;
    }

    const payload: PushSubscriptionPayload = {
      endpoint: subscription.endpoint,
      keys,
      context,
    };

    const response = await fetch(resolvePushSubscriptionEndpoint(), {
      method: 'POST',
      headers: withTenantHeaders({
        'Content-Type': 'application/json',
        ...(getAuthHeaders() ?? {}),
      }),
      body: JSON.stringify(payload),
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error(`Falha ao sincronizar subscription de push: status ${response.status}`);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      // biome-ignore lint/suspicious/noConsole: log de desenvolvimento para diagnóstico de push
      console.warn('[push] Falha ao sincronizar subscription.', error);
    }
  }
}
