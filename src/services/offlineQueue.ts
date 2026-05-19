import AsyncStorage from '@react-native-async-storage/async-storage';

import { requestJson } from '@/services/apiClient';
import { store } from '@/store/store';
import { clearCart } from '@/store/slices/uiSlice';

const QUEUE_KEY = 'shopora.offline.queue';
const MAX_RETRIES = 5;

export type OfflineActionType =
  | 'seller.apply'
  | 'seller.createProduct'
  | 'seller.updateProduct'
  | 'seller.deleteProduct'
  | 'seller.updateStore'
  | 'seller.updateOrderStatus'
  | 'cart.upsert'
  | 'cart.remove'
  | 'cart.clear'
  | 'favorite.toggle'
  | 'address.create'
  | 'address.update'
  | 'address.delete'
  | 'return.create'
  | 'admin.reviewReturnRequest'
  | 'admin.reviewSellerApproval'
  | 'admin.reviewProduct'
  | 'order.checkout';

export type OfflineAction = {
  id: string;
  type: OfflineActionType;
  payload: any;
  createdAt: string;
  retries: number;
  lastError?: string | null;
};

type Handler = (payload: any) => Promise<unknown>;

const handlers = new Map<OfflineActionType, Handler>();
let queueCache: OfflineAction[] | null = null;
let syncRunning = false;

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const loadQueue = async () => {
  if (queueCache) return queueCache;
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) {
    queueCache = [];
    return queueCache;
  }

  try {
    const parsed = JSON.parse(raw) as OfflineAction[];
    queueCache = Array.isArray(parsed) ? parsed : [];
  } catch {
    queueCache = [];
  }

  return queueCache;
};

const saveQueue = async (queue: OfflineAction[]) => {
  queueCache = queue;
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const registerOfflineHandler = (type: OfflineActionType, handler: Handler) => {
  handlers.set(type, handler);
};

export const isOfflineError = (error: any) => {
  const status = error?.status;
  const message = String(error?.error ?? error?.message ?? '');
  return (
    status === 'FETCH_ERROR' ||
    status === 'TIMEOUT_ERROR' ||
    /Network request failed|Failed to fetch|fetch failed|network request failed|TypeError: Network request failed/i.test(message)
  );
};

export const enqueueOfflineAction = async (action: Omit<OfflineAction, 'id' | 'createdAt' | 'retries' | 'lastError'>) => {
  const queue = await loadQueue();
  const item: OfflineAction = {
    ...action,
    id: uid(),
    createdAt: new Date().toISOString(),
    retries: 0,
    lastError: null
  };
  queue.push(item);
  await saveQueue(queue);
  return item;
};

export const getOfflineQueueCount = async () => {
  const queue = await loadQueue();
  return queue.length;
};

export const clearOfflineQueue = async () => {
  queueCache = [];
  await AsyncStorage.removeItem(QUEUE_KEY);
};

export const processOfflineQueue = async () => {
  if (syncRunning) return { processed: 0, remaining: await getOfflineQueueCount() };
  syncRunning = true;

  try {
    const queue = await loadQueue();
    if (!queue.length) {
      return { processed: 0, remaining: 0 };
    }

    const remaining: OfflineAction[] = [];
    let processed = 0;

    for (const action of queue) {
      const handler = handlers.get(action.type);
      if (!handler) {
        continue;
      }

      try {
        await handler(action.payload);
        processed += 1;
      } catch (error: any) {
        if (isOfflineError(error)) {
          remaining.push({
            ...action,
            retries: action.retries + 1,
            lastError: error?.message ?? error?.error ?? 'Network error'
          });
          remaining.push(...queue.slice(queue.indexOf(action) + 1));
          break;
        }

        if ((action.retries ?? 0) + 1 < MAX_RETRIES) {
          remaining.push({
            ...action,
            retries: action.retries + 1,
            lastError: error?.data?.message ?? error?.message ?? 'Request failed'
          });
        }
      }
    }

    await saveQueue(remaining);
    return { processed, remaining: remaining.length };
  } finally {
    syncRunning = false;
  }
};

export const executeWithOfflineQueue = async <T>(params: {
  type: OfflineActionType;
  payload: any;
  action: () => Promise<T>;
}) => {
  try {
    const result = await params.action();
    void processOfflineQueue();
    return { queued: false as const, result };
  } catch (error: any) {
    if (isOfflineError(error)) {
      await enqueueOfflineAction({
        type: params.type,
        payload: params.payload
      });
      return { queued: true as const };
    }
    throw error;
  }
};

export const registerDefaultOfflineHandlers = () => {
  registerOfflineHandler('seller.apply', (payload) =>
    requestJson('/seller/apply', { method: 'POST', body: payload })
  );
  registerOfflineHandler('seller.createProduct', (payload) =>
    requestJson('/seller/products', { method: 'POST', body: payload })
  );
  registerOfflineHandler('seller.updateProduct', (payload) =>
    requestJson(`/seller/products/${payload.id}`, { method: 'PATCH', body: payload.body })
  );
  registerOfflineHandler('seller.deleteProduct', (payload) =>
    requestJson(`/seller/products/${payload.id}`, { method: 'DELETE' })
  );
  registerOfflineHandler('seller.updateStore', (payload) =>
    requestJson('/seller/store', { method: 'PATCH', body: payload })
  );
  registerOfflineHandler('seller.updateOrderStatus', (payload) =>
    requestJson(`/seller/orders/${payload.id}`, { method: 'PATCH', body: payload.body })
  );
  registerOfflineHandler('address.create', (payload) =>
    requestJson('/addresses', { method: 'POST', body: payload })
  );
  registerOfflineHandler('address.update', (payload) =>
    requestJson(`/addresses/${payload.id}`, { method: 'PATCH', body: payload.body })
  );
  registerOfflineHandler('address.delete', (payload) =>
    requestJson(`/addresses/${payload.id}`, { method: 'DELETE' })
  );
  registerOfflineHandler('cart.upsert', (payload) =>
    requestJson(`/cart/items/${payload.productId}`, {
      method: 'PATCH',
      body: {
        productId: payload.productId,
        quantity: payload.quantity,
        selectedSize: payload.selectedSize,
        selectedColor: payload.selectedColor
      }
    })
  );
  registerOfflineHandler('cart.remove', (payload) =>
    requestJson(`/cart/items/${payload.productId}`, { method: 'DELETE' })
  );
  registerOfflineHandler('cart.clear', () =>
    requestJson('/cart/clear', { method: 'DELETE' })
  );
  registerOfflineHandler('favorite.toggle', (payload) =>
    requestJson(`/favorites/${payload.productId}`, {
      method: payload.favorited ? 'POST' : 'DELETE'
    })
  );
  registerOfflineHandler('return.create', (payload) =>
    requestJson('/returns', { method: 'POST', body: payload })
  );
  registerOfflineHandler('admin.reviewReturnRequest', (payload) =>
    requestJson(`/returns/${payload.id}`, { method: 'PATCH', body: payload.body })
  );
  registerOfflineHandler('admin.reviewSellerApproval', (payload) =>
    requestJson(`/admin/seller-approvals/${payload.id}`, { method: 'PATCH', body: payload.body })
  );
  registerOfflineHandler('admin.reviewProduct', (payload) =>
    requestJson(`/admin/products/${payload.id}`, { method: 'PATCH', body: payload.body })
  );
  registerOfflineHandler('order.checkout', (payload) =>
    requestJson('/orders/checkout', { method: 'POST', body: payload }).then((response) => {
      store.dispatch(clearCart());
      return response;
    })
  );
};
