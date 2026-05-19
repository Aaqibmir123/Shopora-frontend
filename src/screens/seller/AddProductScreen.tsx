// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions
} from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { AppTheme } from '@/theme';
import { useAppDispatch } from '@/store/hooks';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { useGetCategoriesQuery } from '@/store/api/categoryApi';
import {
  useGetSellerProductsQuery,
  useCreateSellerProductMutation,
  useUpdateSellerProductMutation
} from '@/store/api/sellerApi';
import { executeWithOfflineQueue } from '@/services/offlineQueue';
import { pickAndUploadImage } from '@/services/imageUpload';

const schema = z.object({
  title: z.string().min(3, 'Enter product title'),
  price: z.string().min(1, 'Enter selling price'),
  mrp: z.string().optional(),
  stock: z.string().min(1, 'Enter total items'),
  description: z.string().min(10, 'Add a better product description'),
  imageUrl: z.string().url('Enter a valid image URL')
});

type FormValues = z.infer<typeof schema>;

type CategoryOption = {
  slug: string;
  name: string;
};

const fallbackCategories: CategoryOption[] = [
  { slug: 'fashion', name: 'Fashion' },
  { slug: 'women', name: 'Women / Ladies' },
  { slug: 'men', name: 'Men / Gents' },
  { slug: 'kids', name: 'Kids' },
  { slug: 'shoes', name: 'Shoes' },
  { slug: 'bags', name: 'Bags' },
  { slug: 'beauty', name: 'Beauty' },
  { slug: 'home', name: 'Home' },
  { slug: 'tech', name: 'Tech' },
  { slug: 'sports', name: 'Sports' }
];

const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free size', '28', '30', '32', '34', '36', '38', '40', '42'];
const colorOptions = ['Black', 'White', 'Blue', 'Navy', 'Red', 'Green', 'Pink', 'Brown', 'Grey', 'Beige', 'Yellow', 'Purple'];

function parseVariantSummary(text?: string | null) {
  const source = String(text ?? '');
  const sizeMatch = source.match(/sizes?\s*:\s*([^|]+)/i);
  const colorMatch = source.match(/colors?\s*:\s*([^|]+)/i);

  return {
    sizes: sizeMatch?.[1]?.split(',').map((item) => item.trim()).filter(Boolean) ?? [],
    colors: colorMatch?.[1]?.split(',').map((item) => item.trim()).filter(Boolean) ?? []
  };
}

function buildVariantSummary(sizes: string[], colors: string[]) {
  const parts: string[] = [];
  if (sizes.length) parts.push(`Sizes: ${sizes.join(', ')}`);
  if (colors.length) parts.push(`Colors: ${colors.join(', ')}`);
  return parts.join(' | ');
}

function mergeCategoryOptions(source: any): CategoryOption[] {
  const categories = (source?.data ?? source ?? []) as Array<{ slug?: string; name?: string }>;
  const mapped = categories
    .filter((item) => item?.slug && item?.name)
    .map((item) => ({ slug: String(item.slug), name: String(item.name) }));

  if (!mapped.length) {
    return fallbackCategories;
  }

  const seen = new Set<string>();
  return [...mapped, ...fallbackCategories].filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

function Chip({
  label,
  active,
  onPress
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <AppText variant="small" tone={active ? 'white' : 'soft'} style={styles.chipLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function AddProductScreen({ navigation, route }: any) {
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();
  const productId = route?.params?.productId as string | undefined;
  const { data: sellerProductsData } = useGetSellerProductsQuery(undefined, { refetchOnFocus: true });
  const { data: categoriesData } = useGetCategoriesQuery(undefined, { refetchOnFocus: true });
  const [createSellerProduct, { isLoading: creating }] = useCreateSellerProductMutation();
  const [updateSellerProduct, { isLoading: updating }] = useUpdateSellerProductMutation();
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const { control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      title: '',
      price: '',
      mrp: '',
      stock: '',
      description: '',
      imageUrl: ''
    }
  });

  const products = sellerProductsData?.data ?? sellerProductsData ?? [];
  const existingProduct = products.find((item: any) => item.id === productId) ?? null;
  const categories = useMemo(() => mergeCategoryOptions(categoriesData), [categoriesData]);
  const isEditing = Boolean(existingProduct);
  const isWideRow = width >= 420;
  const imageUrl = watch('imageUrl');
  const variantSummary = buildVariantSummary(selectedSizes, selectedColors);

  useEffect(() => {
    const nextValues = {
      title: existingProduct?.title ?? '',
      price: existingProduct ? String(existingProduct.price) : '',
      mrp: existingProduct?.mrp ? String(existingProduct.mrp) : '',
      stock: existingProduct ? String(existingProduct.stock) : '',
      description: existingProduct?.description ?? '',
      imageUrl: existingProduct?.imageUrl ?? ''
    };
    reset(nextValues);

    const parsedVariants = parseVariantSummary(existingProduct?.subtitle);
    setSelectedSizes(parsedVariants.sizes);
    setSelectedColors(parsedVariants.colors);
    setSelectedCategory(existingProduct?.category?.slug ?? categories[0]?.slug ?? fallbackCategories[0].slug);
  }, [categories, existingProduct, reset]);

  const toggleValue = (value: string, values: string[], setValues: React.Dispatch<React.SetStateAction<string[]>>) => {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const onSubmit = handleSubmit((values: FormValues) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      dispatch(showFeedback({
        type: 'error',
        title: 'Validation failed',
        message: parsed.error.issues[0]?.message ?? 'Please check the form'
      }));
      return;
    }

    const subtitle = variantSummary || existingProduct?.subtitle?.trim() || undefined;
    const payload = {
      title: parsed.data.title.trim(),
      subtitle,
      price: Number(parsed.data.price),
      mrp: parsed.data.mrp ? Number(parsed.data.mrp) : undefined,
      stock: Number(parsed.data.stock),
      description: parsed.data.description.trim(),
      imageUrl: parsed.data.imageUrl.trim(),
      categorySlug: selectedCategory
    };

    setSaving(true);
    const request = existingProduct
      ? executeWithOfflineQueue({
          type: 'seller.updateProduct',
          payload: { id: existingProduct.id, body: payload },
          action: () => updateSellerProduct({ id: existingProduct.id, ...payload }).unwrap()
        })
      : executeWithOfflineQueue({
          type: 'seller.createProduct',
          payload,
          action: () => createSellerProduct(payload).unwrap()
        });

    request
      .then(() => {
        dispatch(showFeedback({
          type: 'success',
          title: isEditing ? 'Product saved' : 'Product saved',
          message: isEditing ? 'Your changes are saved in the seller catalog.' : 'Your listing has been saved.'
        }));
        navigation.goBack?.();
      })
      .catch((error: any) => {
        dispatch(showFeedback({
          type: 'error',
          title: 'Could not save product',
          message: error?.data?.message ?? 'Please try again.'
        }));
      })
      .finally(() => setSaving(false));
  });

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <PageHeader
          title={isEditing ? 'Edit Product' : 'Add Product'}
            subtitle="Compact listing form. Save it to update the catalog."
          />

          <SectionCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="title">Basic details</AppText>
              <AppText variant="small" tone="soft">
                Keep the title clear, then pick category, sizes, colors, and stock.
              </AppText>
            </View>

            <View style={styles.form}>
              <AppInput
                control={control}
                name="title"
                label="Product title"
                placeholder="Premium cotton T-shirt"
                required
              />

              <View style={[styles.row, !isWideRow && styles.stack]}>
                <View style={styles.flexField}>
                  <AppInput
                    control={control}
                    name="price"
                    label="Selling price"
                    placeholder="999"
                    keyboardType="number-pad"
                    prefix="Rs"
                    required
                  />
                </View>
                <View style={styles.flexField}>
                  <AppInput
                    control={control}
                    name="mrp"
                    label="MRP"
                    placeholder="1299"
                    keyboardType="number-pad"
                    prefix="Rs"
                  />
                </View>
              </View>

              <View style={[styles.row, !isWideRow && styles.stack]}>
                <View style={styles.flexField}>
                  <AppInput
                    control={control}
                    name="stock"
                    label="Total items"
                    placeholder="50"
                    keyboardType="number-pad"
                    required
                    helperText="This is the total available quantity."
                  />
                </View>
                <View style={styles.flexField}>
                  <SectionCard style={styles.summaryCard}>
                    <AppText variant="label">Variant summary</AppText>
                    <AppText variant="body" tone="soft" numberOfLines={2}>
                      {variantSummary || 'Sizes and colors are optional. Leave them empty for simple products.'}
                    </AppText>
                  </SectionCard>
                </View>
              </View>

              <View style={styles.sectionBlock}>
                <AppText variant="label">Category</AppText>
                <AppText variant="small" tone="soft">
                  Choose the closest catalog family like fashion, ladies, gents, shoes, bags, or home.
                </AppText>
                <View style={styles.chipGrid}>
                  {categories.map((item) => (
                    <Chip
                      key={item.slug}
                      label={item.name}
                      active={selectedCategory === item.slug}
                      onPress={() => setSelectedCategory(item.slug)}
                    />
                  ))}
                </View>
              </View>

              <View style={[styles.row, !isWideRow && styles.stack]}>
                <View style={styles.flexField}>
                  <View style={styles.sectionBlock}>
                    <AppText variant="label">Size</AppText>
                    <AppText variant="small" tone="soft">
                      Optional for apparel and footwear. Leave blank for bags, home, or beauty.
                    </AppText>
                    <View style={styles.chipGrid}>
                      {sizeOptions.map((item) => (
                        <Chip
                          key={item}
                          label={item}
                          active={selectedSizes.includes(item)}
                          onPress={() => toggleValue(item, selectedSizes, setSelectedSizes)}
                        />
                      ))}
                    </View>
                  </View>
                </View>
                <View style={styles.flexField}>
                  <View style={styles.sectionBlock}>
                    <AppText variant="label">Color</AppText>
                    <AppText variant="small" tone="soft">
                      Select all colors you want to sell for this product.
                    </AppText>
                    <View style={styles.chipGrid}>
                      {colorOptions.map((item) => (
                        <Chip
                          key={item}
                          label={item}
                          active={selectedColors.includes(item)}
                          onPress={() => toggleValue(item, selectedColors, setSelectedColors)}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              <AppInput
                control={control}
                name="description"
                label="Description"
                placeholder="Tell shoppers what makes this product special"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={styles.multiline}
              />

              <View style={styles.sectionBlock}>
                <AppText variant="label">Product image</AppText>
                <AppText variant="small" tone="soft">
                  Upload one clear photo. You can replace or remove it before saving.
                </AppText>

                {imageUrl ? (
                  <SectionCard style={styles.previewCard}>
                    <View style={styles.previewWrap}>
                      <Image source={{ uri: imageUrl }} style={styles.previewImage} contentFit="cover" />
                      <Pressable
                        style={styles.previewRemove}
                        onPress={() => setValue('imageUrl', '', { shouldDirty: true, shouldValidate: true })}
                      >
                        <Ionicons name="close" size={16} color={AppTheme.colors.white} />
                      </Pressable>
                    </View>
                  </SectionCard>
                ) : (
                  <SectionCard style={styles.placeholderCard}>
                    <Ionicons name="image-outline" size={24} color={AppTheme.colors.primary} />
                    <AppText variant="small" tone="soft" style={{ textAlign: 'center' }}>
                      No image selected yet
                    </AppText>
                  </SectionCard>
                )}

                <AppButton
                  title="Upload Product Image"
                  variant="secondary"
                  onPress={() =>
                    void pickAndUploadImage()
                      .then((url) => {
                        if (!url) return;
                        setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true });
                        dispatch(showFeedback({
                          type: 'success',
                          title: 'Image uploaded',
                          message: 'The uploaded image is ready to use.'
                        }));
                      })
                      .catch((error: any) => {
                        dispatch(showFeedback({
                          type: 'error',
                          title: 'Upload failed',
                          message: error?.message ?? 'Please try again.'
                        }));
                      })
                  }
                />
              </View>
            </View>
          </SectionCard>

          <View style={styles.actions}>
            <AppButton title="Save Product" onPress={onSubmit} loading={saving || creating || updating} />
            <AppButton title="Cancel" variant="secondary" onPress={() => navigation.goBack?.()} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl + 24
  },
  section: {
    gap: AppTheme.spacing.md
  },
  sectionHeader: {
    gap: 4
  },
  form: {
    gap: AppTheme.spacing.md
  },
  row: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm
  },
  stack: {
    flexDirection: 'column'
  },
  flexField: {
    flex: 1
  },
  sectionBlock: {
    gap: 8
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm
  },
  chip: {
    paddingHorizontal: AppTheme.spacing.md,
    paddingVertical: AppTheme.spacing.sm,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  chipActive: {
    backgroundColor: AppTheme.colors.primary,
    borderColor: AppTheme.colors.primary
  },
  chipLabel: {
    fontWeight: '700'
  },
  summaryCard: {
    gap: 4,
    minHeight: 76,
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  multiline: {
    minHeight: 132,
    paddingTop: AppTheme.spacing.md
  },
  previewCard: {
    padding: AppTheme.spacing.sm,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  previewWrap: {
    position: 'relative',
    borderRadius: AppTheme.radius.md,
    overflow: 'hidden',
    aspectRatio: 1.5,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  previewImage: {
    width: '100%',
    height: '100%'
  },
  previewRemove: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)'
  },
  placeholderCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 120,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  actions: {
    gap: AppTheme.spacing.md
  }
});
