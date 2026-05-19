import type { AuthRole } from '@/services/tokenStorage';

export const normalizeAuthRole = (value: string | null | undefined): AuthRole => {
  const role = String(value ?? '').trim().toLowerCase();
  if (role === 'seller') return 'seller';
  if (role === 'admin') return 'admin';
  return 'shopper';
};

export const isSellerOrAdmin = (role: AuthRole | null | undefined) => role === 'seller' || role === 'admin';
