import { createSlice } from '@reduxjs/toolkit';
import type { AuthRole } from '@/services/tokenStorage';

type AuthState = {
  token: string | null;
  phone: string | null;
  role: AuthRole | null;
  hydrated: boolean;
};

const initialState: AuthState = {
  token: null,
  phone: null,
  role: null,
  hydrated: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state: AuthState, action: any) {
      state.token = action.payload?.token ?? null;
      state.phone = action.payload?.phone ?? null;
      state.role = action.payload?.role ?? state.role ?? null;
      state.hydrated = true;
    },
    setHydrated(state: AuthState, action: { payload?: boolean }) {
      state.hydrated = action.payload ?? true;
    },
    clearSession(state: AuthState) {
      state.token = null;
      state.phone = null;
      state.role = null;
      state.hydrated = true;
    }
  }
});

export const { setSession, setHydrated, clearSession } = authSlice.actions;
export const authReducer = authSlice.reducer;
export const selectAuthToken = (state: { auth: AuthState }) => state.auth.token;
export const selectAuthRole = (state: { auth: AuthState }) => state.auth.role;
export const selectAuthHydrated = (state: { auth: AuthState }) => state.auth.hydrated;
