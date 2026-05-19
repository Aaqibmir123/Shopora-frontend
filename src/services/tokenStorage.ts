import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'shopora.auth.token';
const REFRESH_TOKEN_KEY = 'shopora.auth.refreshToken';
const SESSION_KEY = 'shopora.auth.session';

let memoryToken: string | null = null;
let memorySession: AuthSession | null = null;

export type AuthRole = 'shopper' | 'seller' | 'admin';

export type AuthSession = {
  token: string;
  refreshToken?: string | null;
  phone?: string | null;
  role?: AuthRole | null;
};

const normalizeSession = (value: Partial<AuthSession> | null | undefined): AuthSession | null => {
  if (!value?.token) return null;
  return {
    token: value.token,
    refreshToken: value.refreshToken ?? null,
    phone: value.phone ?? null,
    role: value.role ?? null
  };
};

export const setAuthSession = async (session: AuthSession) => {
  const nextSession = normalizeSession(session);
  if (!nextSession) return;

  memorySession = nextSession;
  memoryToken = nextSession.token;
  await SecureStore.setItemAsync(TOKEN_KEY, nextSession.token);
  if (nextSession.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, nextSession.refreshToken);
  } else {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(nextSession));
};

export const setAuthToken = async (token: string) => {
  await setAuthSession({ token });
};

export const hydrateAuthSession = async (): Promise<AuthSession | null> => {
  const rawSession = await SecureStore.getItemAsync(SESSION_KEY);
  if (rawSession) {
    try {
      const parsed = JSON.parse(rawSession) as AuthSession;
      const nextSession = normalizeSession(parsed);
      if (nextSession) {
        const legacyRefreshToken = nextSession.refreshToken ?? (await SecureStore.getItemAsync(REFRESH_TOKEN_KEY));
        const hydratedSession: AuthSession = {
          ...nextSession,
          refreshToken: legacyRefreshToken ?? null
        };
        memorySession = hydratedSession;
        memoryToken = hydratedSession.token;
        return hydratedSession;
      }
    } catch {
      // fall back to legacy token-only storage
    }
  }

  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) {
    memorySession = null;
    memoryToken = null;
    return null;
  }

  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  memoryToken = token;
  memorySession = { token, refreshToken: refreshToken ?? null };
  return memorySession;
};

export const hydrateAuthToken = async () => {
  const session = await hydrateAuthSession();
  return session?.token ?? null;
};

export const clearAuthToken = async () => {
  memoryToken = null;
  memorySession = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(SESSION_KEY);
};

export const getAuthToken = () => memoryToken;

export const getAuthSession = () => memorySession;

export const getAuthRefreshToken = () => memorySession?.refreshToken ?? null;
