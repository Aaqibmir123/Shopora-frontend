import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { useAppDispatch } from '@/store/hooks';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { useGetSellerInventoryQuery, useUpdateSellerProductMutation } from '@/store/api/sellerApi';
import { executeWithOfflineQueue } from '@/services/offlineQueue';

function parseVariantSummary(text?: string | null) {
  const source = String(text ?? '');
  const sizeMatch = source.match(/sizes?\s*:\s*([^|]+)/i);
  const colorMatch = source.match(/colors?\s*:\s*([^|]+)/i);
  return {
    sizes: sizeMatch?.[1]?.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3) ?? [],
    colors: colorMatch?.[1]?.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3) ?? []
  };
}

function StockBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0;
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${width}%` }]} />
    </View>
  );
}

function InventoryItem({ item, onChange }: { item: any; onChange: (stock: number) => void }) {
  const statusLabel = item.stock <= 0 ? 'Out of stock' : item.stock <= 5 ? 'Low stock' : 'Healthy stock';
  const variants = parseVariantSummary(item.subtitle);

  return (
    <SectionCard style={styles.itemCard}>
      <View style={styles.rowTop}>
        <View style={styles.thumbWrap}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Ionicons name="image-outline" size={22} color={AppTheme.colors.primary} />
            </View>
          )}
          {statusLabel === 'Low stock' ? (
            <View style={styles.statusRibbon}>
              <AppText variant="small" tone="white">Low</AppText>
            </View>
          ) : null}
          {statusLabel === 'Out of stock' ? (
            <View style={[styles.statusRibbon, styles.statusRibbonDark]}>
              <AppText variant="small" tone="white">Out</AppText>
            </View>
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="title" numberOfLines={2}>{item.title}</AppText>
          <AppText variant="body" tone="soft">{item.category?.name ?? item.category?.slug ?? 'Category'}</AppText>
          {item.subtitle ? <AppText variant="small" tone="soft" numberOfLines={2}>{item.subtitle}</AppText> : null}
          <View style={styles.variantRow}>
            <View style={[styles.variantChip, styles.variantBlue]}>
              <AppText variant="small" tone="soft">Size</AppText>
              <AppText variant="label">{variants.sizes.length ? variants.sizes.join(' · ') : 'Free'}</AppText>
            </View>
            <View style={[styles.variantChip, styles.variantWarm]}>
              <AppText variant="small" tone="soft">Color</AppText>
              <AppText variant="label">{variants.colors.length ? variants.colors.join(' · ') : 'Default'}</AppText>
            </View>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusPill}>
              <AppText variant="small" tone="white">{statusLabel}</AppText>
            </View>
            <AppText variant="small" tone="soft">Sold {item.reviewsCount ?? 0}</AppText>
          </View>
        </View>
      </View>

      <View style={styles.stockHeader}>
        <AppText variant="label" tone="soft">Stock level</AppText>
        <AppText variant="label" tone="primary">{item.stock} units</AppText>
      </View>
      <StockBar value={item.stock} max={40} />

      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={() => onChange(Math.max(0, item.stock - 1))}>
          <Ionicons name="remove" size={18} color={AppTheme.colors.primary} />
        </Pressable>
        <Pressable style={styles.controlButton} onPress={() => onChange(item.stock + 1)}>
          <Ionicons name="add" size={18} color={AppTheme.colors.primary} />
        </Pressable>
        <Pressable style={styles.restockButton} onPress={() => onChange(item.stock + 5)}>
          <Ionicons name="flash" size={16} color={AppTheme.colors.white} />
          <AppText variant="small" tone="white">+5 Restock</AppText>
        </Pressable>
      </View>
    </SectionCard>
  );
}

export function InventoryScreen() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isFetching, refetch } = useGetSellerInventoryQuery(undefined, { refetchOnFocus: true, refetchOnReconnect: true });
  const [updateSellerProduct] = useUpdateSellerProductMutation();

  const products = data?.data ?? data ?? [];
  const maxStock = useMemo(() => Math.max(...products.map((item: any) => item.stock), 1), [products]);
  const stats = useMemo(() => ({
    lowStock: products.filter((item: any) => item.stock > 0 && item.stock <= 5).length,
    outOfStock: products.filter((item: any) => item.stock === 0).length,
    liveProducts: products.filter((item: any) => item.stock > 0).length
  }), [products]);

  const handleStockChange = (item: any, stock: number) => {
    void executeWithOfflineQueue({
      type: 'seller.updateProduct',
      payload: { id: item.id, body: { stock } },
      action: () => updateSellerProduct({ id: item.id, stock }).unwrap()
    })
      .then((result) =>
        dispatch(showFeedback({
          type: result.queued ? 'info' : 'success',
          title: 'Inventory updated',
          message: result.queued ? 'Saved offline. It will sync automatically.' : `${item.title} stock is now ${stock}.`
        }))
      )
      .catch((error: any) => dispatch(showFeedback({ type: 'error', title: 'Update failed', message: error?.data?.message ?? 'Please try again.' })));
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
            <PageHeader title="Inventory" subtitle="Track stock levels, low inventory, and quick restocks." />
            <SectionCard style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}><AppText variant="small" tone="soft">Low stock</AppText><AppText variant="headline">{stats.lowStock}</AppText></View>
                <View style={styles.summaryItem}><AppText variant="small" tone="soft">Out of stock</AppText><AppText variant="headline">{stats.outOfStock}</AppText></View>
                <View style={styles.summaryItem}><AppText variant="small" tone="soft">Live</AppText><AppText variant="headline">{stats.liveProducts}</AppText></View>
              </View>
            </SectionCard>
          </View>
        }
        renderItem={({ item }: any) => <InventoryItem item={item} onChange={(stock) => handleStockChange(item, stock)} />}
        ListEmptyComponent={
          <SectionCard style={styles.emptyCard}>
            <AppText variant="headline">No products to manage</AppText>
            <AppText variant="body" tone="soft" style={styles.centerText}>Add products first and inventory controls will appear here.</AppText>
          </SectionCard>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: AppTheme.spacing.md, gap: AppTheme.spacing.md, paddingBottom: AppTheme.spacing.xl },
  header: { gap: AppTheme.spacing.md },
  summaryCard: { gap: AppTheme.spacing.sm },
  summaryRow: { flexDirection: 'row', gap: AppTheme.spacing.sm },
  summaryItem: { flex: 1, minWidth: 92, padding: AppTheme.spacing.md, borderRadius: AppTheme.radius.md, backgroundColor: AppTheme.colors.surfaceSoft },
  itemCard: { gap: AppTheme.spacing.md },
  rowTop: { flexDirection: 'row', gap: AppTheme.spacing.md },
  thumbWrap: {
    width: 84,
    height: 84,
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
  statusRibbon: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.danger
  },
  statusRibbonDark: {
    backgroundColor: AppTheme.colors.text
  },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: AppTheme.spacing.sm, marginTop: 6 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: AppTheme.radius.pill, backgroundColor: AppTheme.colors.primary },
  stockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  barTrack: { height: 10, borderRadius: AppTheme.radius.pill, backgroundColor: AppTheme.colors.surfaceSoft, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: AppTheme.radius.pill, backgroundColor: AppTheme.colors.primaryStrong },
  controls: { flexDirection: 'row', alignItems: 'center', gap: AppTheme.spacing.sm, justifyContent: 'flex-end' },
  controlButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: AppTheme.colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  restockButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: AppTheme.spacing.md, height: 42, borderRadius: AppTheme.radius.pill, backgroundColor: AppTheme.colors.primary },
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
    minWidth: 110,
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
