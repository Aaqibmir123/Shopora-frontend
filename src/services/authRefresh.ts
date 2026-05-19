// @ts-nocheck
import { getAuthSession, setAuthSession, hydrateAuthSession } from '@/services/tokenStorage';
import { normalizeAuthRole } from '@/utils/auth';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.204.178.173:4000/api';

let refreshInFlight: Promise<SessionShape | null> | null = null;

type RefreshResponse = {
  ok?: boolean;
  data?: {
    token?: string;
    refreshToken?: string;
    user?: {
      phone?: string | null;
      role?: string | null;
    };
  };
};

type SessionShape = {
  token: string;
  refreshToken?: string | null;
  phone?: string | null;
  role?: string | null;
};

const buildNextSession = (data: NonNullable<RefreshResponse['data']>, fallback: SessionShape): SessionShape => ({
  token: data.token ?? fallback.token,
  refreshToken: data.refreshToken ?? fallback.refreshToken ?? null,
  phone: data.user?.phone ?? fallback.phone ?? null,
  role: normalizeAuthRole(data.user?.role ?? fallback.role ?? 'shopper')
});

const buildUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

export const refreshAuthSession = async () => {
  const session = getAuthSession() ?? (await hydrateAuthSession());
  if (!session?.refreshToken) return null;

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const response = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ refreshToken: session.refreshToken })
    });

    const text = await response.text();
    let data: RefreshResponse | null = null;
    if (text) {
      try {
        data = JSON.parse(text) as RefreshResponse;
      } catch {
        data = null;
      }
    }

    if (!response.ok || !data?.data?.token) return null;

    const nextSession = buildNextSession(data.data, session);
    await setAuthSession(nextSession);
    return nextSession;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
};
