import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAuthHydrated, setHydrated, setSession } from '@/store/slices/authSlice';
import { setRole, setCartState, setWishlist } from '@/store/slices/uiSlice';
import { getAuthSession, hydrateAuthSession, setAuthSession } from '@/services/tokenStorage';
import { refreshAuthSession } from '@/services/authRefresh';
import { normalizeAuthRole } from '@/utils/auth';
import { requestJson } from '@/services/apiClient';

type AuthContextValue = {
  hydrated: boolean;
  restoring: boolean;
  sessionReady: boolean;
  refreshStoredSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const mapAuthSession = (session: Awaited<ReturnType<typeof hydrateAuthSession>>) => {
  if (!session?.token) return null;
  return {
    token: session.token,
    refreshToken: session.refreshToken ?? null,
    phone: session.phone ?? null,
    role: session.role ?? 'shopper'
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector(selectAuthHydrated);
  const [restoring, setRestoring] = useState(true);

  const refreshStoredSession = useCallback(async () => {
    let session = getAuthSession();
    if (!session?.token || !session?.refreshToken) {
      const hydrated = await hydrateAuthSession();
      session = hydrated ?? session;
    }
    if (!session?.token) return;

    try {
      const response = await requestJson<{ ok: boolean; data: any }>('/auth/me', {
        headers: { authorization: `Bearer ${session.token}` }
      });
      const user = response?.data ?? {};
      const role = normalizeAuthRole(user.role);
      const nextSession = {
        token: session.token,
        refreshToken: session.refreshToken ?? null,
        phone: user.phone ?? session.phone ?? null,
        role
      };
      await setAuthSession(nextSession);
      dispatch(setSession(nextSession));
      dispatch(setRole(role));
      return;
    } catch {
      const refreshed = await refreshAuthSession();
      if (!refreshed?.token) {
        return;
      }
      const nextSession = {
        token: refreshed.token,
        refreshToken: refreshed.refreshToken ?? session.refreshToken,
        phone: refreshed.phone ?? session.phone ?? null,
        role: normalizeAuthRole(refreshed.role ?? session.role ?? 'shopper')
      };
      await setAuthSession(nextSession);
      dispatch(setSession(nextSession));
      dispatch(setRole(nextSession.role ?? 'shopper'));
    }
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const session = await hydrateAuthSession();
      if (cancelled) return;

      if (!session?.token) {
        dispatch(setHydrated(true));
        setRestoring(false);
        return;
      }

      const nextSession = mapAuthSession(session);
      if (nextSession) {
        dispatch(setSession(nextSession));
        dispatch(setRole(nextSession.role ?? 'shopper'));
      }
      dispatch(setHydrated(true));
      await refreshStoredSession();
      setRestoring(false);

      try {
        const [favoritesResponse, cartResponse] = await Promise.all([
          requestJson<{ ok: boolean; data: any[] }>('/favorites'),
          requestJson<{ ok: boolean; data: any[] }>('/cart')
        ]);
        const favoriteIds = (favoritesResponse?.data ?? []).map((item: any) => item.productId);
        const cartState = (cartResponse?.data ?? []).reduce((acc: Record<string, number>, item: any) => {
          acc[item.productId] = item.quantity;
          return acc;
        }, {});
        dispatch(setWishlist(favoriteIds));
        dispatch(setCartState(cartState));
      } catch {
        // Keep local state if hydration is unavailable.
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const value = useMemo<AuthContextValue>(() => ({
    hydrated,
    restoring,
    sessionReady: hydrated && !restoring,
    refreshStoredSession
  }), [hydrated, restoring, refreshStoredSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return value;
};
