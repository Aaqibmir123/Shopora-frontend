import { Category, Product } from '@/types/models';

const CATEGORY_PRESETS: Record<string, { name: string; icon: string; tint: string }> = {
  fashion: { name: 'Fashion', icon: 'shirt-outline', tint: '#F6A623' },
  women: { name: 'Women / Ladies', icon: 'female-outline', tint: '#F28DB2' },
  men: { name: 'Men / Gents', icon: 'male-outline', tint: '#7B8CDE' },
  kids: { name: 'Kids', icon: 'happy-outline', tint: '#7ED957' },
  shoes: { name: 'Shoes', icon: 'walk-outline', tint: '#C084FC' },
  bags: { name: 'Bags', icon: 'briefcase-outline', tint: '#D97706' },
  beauty: { name: 'Beauty', icon: 'sparkles-outline', tint: '#F472B6' },
  home: { name: 'Home', icon: 'home-outline', tint: '#60A5FA' },
  tech: { name: 'Tech', icon: 'phone-portrait-outline', tint: '#22C55E' },
  sports: { name: 'Sports', icon: 'basketball-outline', tint: '#F97316' },
  accessories: { name: 'Accessories', icon: 'watch-outline', tint: '#8B5CF6' },
  jewellery: { name: 'Jewellery', icon: 'diamond-outline', tint: '#F59E0B' },
  jewelry: { name: 'Jewellery', icon: 'diamond-outline', tint: '#F59E0B' },
  kidswear: { name: 'Kidswear', icon: 'shirt-outline', tint: '#34D399' }
};

const COLOR_PALETTE = [
  '#111827',
  '#F9FAFB',
  '#2563EB',
  '#1E3A8A',
  '#EF4444',
  '#22C55E',
  '#EC4899',
  '#8B5E34',
  '#6B7280',
  '#E7D7C9',
  '#FACC15',
  '#A855F7',
  '#FB923C',
  '#0F766E'
];

const COLOR_HEX_MAP: Record<string, string> = {
  black: '#111827',
  white: '#F9FAFB',
  blue: '#2563EB',
  navy: '#1E3A8A',
  red: '#EF4444',
  green: '#22C55E',
  pink: '#EC4899',
  brown: '#8B5E34',
  grey: '#6B7280',
  gray: '#6B7280',
  beige: '#E7D7C9',
  yellow: '#FACC15',
  purple: '#A855F7',
  orange: '#FB923C',
  teal: '#0F766E'
};

export function parseVariantSummary(text?: string | null) {
  const source = String(text ?? '');
  const sizeMatch = source.match(/sizes?\s*:\s*([^|]+)/i);
  const colorMatch = source.match(/colors?\s*:\s*([^|]+)/i);

  return {
    sizes: sizeMatch?.[1]?.split(',').map((item) => item.trim()).filter(Boolean) ?? [],
    colors: colorMatch?.[1]?.split(',').map((item) => item.trim()).filter(Boolean) ?? []
  };
}

export function colorHexFromName(name: string, index = 0) {
  const key = name.trim().toLowerCase();
  return COLOR_HEX_MAP[key] ?? COLOR_PALETTE[index % COLOR_PALETTE.length];
}

export function mapBackendCategory(item: any): Category {
  const slug = String(item?.slug ?? item?.id ?? 'category').toLowerCase();
  const preset = CATEGORY_PRESETS[slug] ?? {
    name: String(item?.name ?? slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())),
    icon: 'grid-outline',
    tint: '#94A3B8'
  };

  return {
    id: String(item?.id ?? item?.slug ?? preset.name),
    name: String(item?.name ?? preset.name),
    icon: String(item?.icon ?? preset.icon),
    tint: String(item?.tint ?? preset.tint)
  };
}

export function mapBackendProduct(item: any): Product & {
  slug?: string;
  description?: string;
} {
  const price = Number(item?.price ?? 0);
  const mrp = item?.mrp ? Number(item.mrp) : undefined;
  const variants = parseVariantSummary(item?.subtitle);
  const discount = mrp && mrp > price
    ? `${Math.max(1, Math.round(((mrp - price) / mrp) * 100))}% OFF`
    : undefined;

  return {
    id: String(item?.id ?? ''),
    slug: item?.slug ? String(item.slug) : undefined,
    title: String(item?.title ?? ''),
    subtitle: item?.subtitle ?? item?.description ?? item?.brand ?? '',
    description: item?.description ?? undefined,
    category: item?.category?.name ?? item?.category?.slug ?? 'Category',
    price,
    mrp,
    image: String(item?.imageUrl ?? ''),
    badge: item?.status === 'PENDING_REVIEW' ? 'Waiting for review' : item?.status === 'ACTIVE' ? 'Live' : item?.status,
    discount,
    vendor: item?.store?.name ?? item?.brand ?? undefined,
    stock: item?.stock ?? 0,
    rating: Number(item?.rating ?? 0),
    reviews: Number(item?.reviewsCount ?? 0),
    sizes: variants.sizes,
    colors: variants.colors.map((color: string, index: number) => ({
      name: color,
      hex: colorHexFromName(color, index)
    }))
  };
}
