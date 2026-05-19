import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getAuthSession, getAuthToken, hydrateAuthSession } from '@/services/tokenStorage';
import { refreshAuthSession } from '@/services/authRefresh';
import { setSession } from '@/store/slices/authSlice';
import { setRole } from '@/store/slices/uiSlice';
import { normalizeAuthRole } from '@/utils/auth';

const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.204.178.173:4000/api';
const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers: any) => {
    headers.set('accept', 'application/json');
    const token = getAuthToken() ?? getAuthSession()?.token ?? null;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  }
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  const currentSession = getAuthSession();
  if (!getAuthToken() || !currentSession?.refreshToken) {
    const hydrated = await hydrateAuthSession();
    if (hydrated?.token) {
      api.dispatch(setSession(hydrated));
      api.dispatch(setRole(normalizeAuthRole(hydrated.role ?? 'shopper')));
    }
  }

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    const session = getAuthSession();
    const refreshed = await refreshAuthSession();
    if (refreshed?.token && session?.token) {
      api.dispatch(setSession(refreshed));
      api.dispatch(setRole(refreshed.role ?? 'shopper'));
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  keepUnusedDataFor: 120,
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Product', 'Category', 'Cart', 'Order', 'Seller', 'Admin', 'Address', 'Support', 'Return', 'Banner'],
  endpoints: () => ({})
});
