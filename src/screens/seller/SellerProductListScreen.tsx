import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { ROUTES } from '@/constants/navigation';
import { AppTheme } from '@/theme';
import { useAppDispatch } from '@/store/hooks';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { formatCurrency } from '@/utils/format';
import { useDeleteSellerProductMutation, useGetSellerProductsQuery } from '@/store/api/sellerApi';
import { executeWithOfflineQueue } from '@/services/offlineQueue';

function productStatusLabel(item: any) {
  if (item.status === 'PENDING_REVIEW') return 'WAITING REVIEW';
  if (item.status === 'DRAFT') return 'DRAFT';
  if (item.status === 'ARCHIVED') return 'ARCHIVED';
  if (item.stock <= 0) return 'OUT OF STOCK';
  if (item.stock <= 5) return 'LOW STOCK';
  return 'APPROVED';
}

function parseVariantSummary(text?: string | null) {
  const source = String(text ?? '');
  const sizeMatch = source.match(/sizes?\s*:\s*([^|]+)/i);
  const colorMatch = source.match(/colors?\s*:\s*([^|]+)/i);
  return {
    sizes: sizeMatch?.[1]?.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3) ?? [],
    colors: colorMatch?.[1]?.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3) ?? []
  };
}

function ProductRow({ item, onEdit, onDelete }: { item: any; onEdit: () => void; onDelete: () => void }) {
  const variants = parseVariantSummary(item.subtitle);
  const lowStock = item.stock > 0 && item.stock <= 5;
  const outOfStock = item.stock <= 0;

  return (
    <SectionCard style={styles.productCard}>
      <View style={styles.rowTop}>
        <View style={styles.thumbWrap}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Ionicons name="image-outline" size={22} color={AppTheme.colors.primary} />
            </View>
          )}
          {lowStock ? (
            <View style={styles.stockRibbon}>
              <AppText variant="small" tone="white">Low stock</AppText>
            </View>
          ) : null}
          {outOfStock ? (
            <View style={[styles.stockRibbon, styles.outRibbon]}>
              <AppText variant="small" tone="white">Out</AppText>
            </View>
          ) : null}
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusPill, item.status === 'PENDING_REVIEW' && styles.statusPillWaiting, item.status === 'DRAFT' && styles.statusPillDraft, item.status === 'ARCHIVED' && styles.statusPillArchived]}>
              <AppText variant="small" tone="white">{productStatusLabel(item)}</AppText>
            </View>
            <View style={styles.metaPill}>
              <AppText variant="small" tone="soft">{item.category?.name ?? item.category?.slug ?? 'Category'}</AppText>
            </View>
          </View>
          <AppText variant="title" numberOfLines={2}>{item.title}</AppText>
          <AppText variant="body" tone="soft" numberOfLines={2}>{item.description}</AppText>
          {item.subtitle ? <AppText variant="small" tone="soft" numberOfLines={2}>{item.subtitle}</AppText> : null}
          <View style={styles.variantRow}>
            <View style={[styles.variantChip, styles.variantBlue]}>
              <AppText variant="small" tone="soft">Size</AppText>
              <AppText variant="label">{variants.sizes.length ? variants.sizes.join(' / ') : 'Free size'}</AppText>
            </View>
            <View style={[styles.variantChip, styles.variantWarm]}>
              <AppText variant="small" tone="soft">Color</AppText>
              <AppText variant="label">{variants.colors.length ? variants.colors.join(' / ') : 'Default'}</AppText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.priceRow}>
        <View>
          <AppText variant="small" tone="soft">Selling price</AppText>
          <AppText variant="title" tone="primary">{formatCurrency(item.price)}</AppText>
        </View>
        <View>
          <AppText variant="small" tone="soft">Stock</AppText>
          <AppText variant="title">{item.stock}</AppText>
        </View>
        <View>
          <AppText variant="small" tone="soft">Sold</AppText>
          <AppText variant="title">{item.sold ?? item.reviewsCount ?? 0}</AppText>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.iconButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={18} color={AppTheme.colors.primary} />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color={AppTheme.colors.danger} />
        </Pressable>
      </View>
    </SectionCard>
  );
}

type SellerProductListProps = {
  navigation: any;
  route?: any;
  showAddButton?: boolean;
};

export function SellerProductListScreen({ navigation, route, showAddButton = true }: SellerProductListProps) {
  const dispatch = useAppDispatch();
  const { data, isLoading, isFetching, refetch } = useGetSellerProductsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true
  });
  const [deleteSellerProduct] = useDeleteSellerProductMutation();

  const products = data?.data ?? data ?? [];
  const headerTitle = route?.params?.title ?? 'Product Catalog';
  const headerSubtitle = route?.params?.subtitle ?? 'Add, edit, and delete products from one place.';

  const openAddProduct = (params?: any) => {
    const sellerStackNavigation = navigation.getParent?.('SellerStack') ?? navigation.getParent?.();
    if (sellerStackNavigation?.navigate) {
      sellerStackNavigation.navigate(ROUTES.AddProduct, params);
      return;
    }
    navigation.navigate(ROUTES.SellerStack, {
      screen: ROUTES.AddProduct,
      params
    });
  };

  const onDelete = (product: any) => {
    void executeWithOfflineQueue({
      type: 'seller.deleteProduct',
      payload: { id: product.id },
      action: () => deleteSellerProduct(product.id).unwrap()
    })
      .then((result) =>
        dispatch(showFeedback({
          type: result.queued ? 'info' : 'info',
          title: 'Product deleted',
          message: result.queued ? 'Saved offline. It will sync automatically.' : `${product.title} was removed from the catalog.`
        }))
      )
      .catch((error: any) => dispatch(showFeedback({ type: 'error', title: 'Delete failed', message: error?.data?.message ?? 'Please try again.' })));
  };

  return (
    <Screen>
      <FlatList
        data={products}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading || isFetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader
              title={headerTitle}
              subtitle={headerSubtitle}
              rightLabel={showAddButton ? 'Add Product' : undefined}
              onRightPress={showAddButton ? () => openAddProduct() : undefined}
            />
          </View>
        }
        ListEmptyComponent={
          <SectionCard style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={28} color={AppTheme.colors.primary} />
            <AppText variant="headline" style={{ marginTop: 12 }}>Start your catalog</AppText>
            <AppText variant="body" tone="soft" style={styles.centerText}>
              Add your first product to show it here, then edit or delete it anytime.
            </AppText>
          </SectionCard>
        }
        renderItem={({ item }: any) => (
          <ProductRow item={item} onEdit={() => openAddProduct({ productId: item.id })} onDelete={() => onDelete(item)} />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: AppTheme.spacing.md, gap: AppTheme.spacing.md, paddingBottom: AppTheme.spacing.xl },
  header: { gap: AppTheme.spacing.md },
  productCard: { gap: AppTheme.spacing.md },
  rowTop: { flexDirection: 'row', gap: AppTheme.spacing.md },
  thumbWrap: {
    width: 92,
    height: 92,
    borderRadius: AppTheme.radius.md,
    overflow: 'hidden',
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  thumb: { width: '100%', height: '100%', backgroundColor: AppTheme.colors.surfaceSoft },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  stockRibbon: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.danger
  },
  outRibbon: {
    backgroundColor: AppTheme.colors.text
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: AppTheme.spacing.sm, marginBottom: AppTheme.spacing.sm },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: AppTheme.radius.pill, backgroundColor: AppTheme.colors.primary },
  statusPillWaiting: { backgroundColor: AppTheme.colors.info },
  statusPillDraft: { backgroundColor: AppTheme.colors.textSoft },
  statusPillArchived: { backgroundColor: AppTheme.colors.danger },
  metaPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: AppTheme.radius.pill, backgroundColor: AppTheme.colors.surfaceSoft },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: AppTheme.spacing.sm },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: AppTheme.spacing.sm },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: AppTheme.colors.surfaceSoft },
  emptyCard: { alignItems: 'center', paddingVertical: AppTheme.spacing.xl },
  centerText: { textAlign: 'center', marginTop: 8 },
  variantRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm,
    flexWrap: 'wrap',
    marginTop: AppTheme.spacing.xs
  },
  variantChip: {
    flex: 1,
    minWidth: 120,
    padding: AppTheme.spacing.sm,
    borderRadius: AppTheme.radius.md,
    gap: 2
  },
  variantWarm: {
    backgroundColor: '#FFF3EC'
  },
  variantBlue: {
    backgroundColor: '#EEF6FF'
  }
});
