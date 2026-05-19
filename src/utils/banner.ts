import { Banner } from '@/types/models';

const DEFAULT_ACCENT = '#FF6B00';

const normalizeTargetType = (value?: string | null): Banner['targetType'] => {
  const next = String(value ?? 'NONE').trim().toUpperCase();
  if (next === 'SEARCH' || next === 'CATEGORY' || next === 'PRODUCT') return next;
  return 'NONE';
};

const normalizeText = (value?: string | null) => {
  const text = String(value ?? '').trim();
  return text.length ? text : null;
};

export function mapBackendBanner(item: any): Banner {
  return {
    id: String(item?.id ?? item?._id ?? ''),
    createdAt: item?.createdAt ? String(item.createdAt) : undefined,
    updatedAt: item?.updatedAt ? String(item.updatedAt) : undefined,
    title: String(item?.title ?? ''),
    subtitle: normalizeText(item?.subtitle),
    badge: normalizeText(item?.badge),
    imageUrl: normalizeText(item?.imageUrl),
    ctaLabel: normalizeText(item?.ctaLabel),
    targetType: normalizeTargetType(item?.targetType),
    targetValue: normalizeText(item?.targetValue),
    accentColor: normalizeText(item?.accentColor) ?? DEFAULT_ACCENT,
    isActive: Boolean(item?.isActive),
    sortOrder: Number(item?.sortOrder ?? 0)
  };
}
