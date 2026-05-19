import { getAuthSession, getAuthToken, hydrateAuthSession, setAuthSession } from '@/services/tokenStorage';
import { refreshAuthSession } from '@/services/authRefresh';
import { store } from '@/store/store';
import { setSession } from '@/store/slices/authSlice';
import { setRole } from '@/store/slices/uiSlice';

export const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.204.178.173:4000/api';

export class ApiRequestError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

type JsonRequestInit = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

const isFormData = (value: unknown): value is FormData =>
  Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as any).append === 'function' &&
    (typeof FormData === 'undefined' || value instanceof FormData || Object.prototype.toString.call(value) === '[object FormData]')
  );

const buildUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

export const requestJson = async <T>(path: string, options: JsonRequestInit = {}): Promise<T> => {
  const headers = new Headers(options.headers ?? {});
  headers.set('accept', 'application/json');

  let session = getAuthSession();
  if (!session?.token || !session?.refreshToken) {
    const hydrated = await hydrateAuthSession();
    session = hydrated ?? session;
  }
  let token = getAuthToken() ?? session?.token ?? null;
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  const hasBody = options.body !== undefined && options.body !== null;
  const body = hasBody && !isFormData(options.body)
    ? JSON.stringify(options.body)
    : options.body;

  if (hasBody && !isFormData(options.body) && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const url = buildUrl(path);
  const response = await fetch(url, {
    ...options,
    headers,
    body: body as BodyInit | null | undefined
  });

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !/\/auth\/refresh$/i.test(path)) {
      const refreshed = await refreshAuthSession();
      if (refreshed?.token) {
        store.dispatch(setSession(refreshed));
        store.dispatch(setRole(refreshed.role ?? 'shopper'));
        return requestJson<T>(path, options);
      }
    }

    throw new ApiRequestError(
      data?.message ?? `Request failed with status ${response.status}`,
      response.status,
      data
    );
  }

  return data as T;
};

export const resolveUploadUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiBaseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
};
