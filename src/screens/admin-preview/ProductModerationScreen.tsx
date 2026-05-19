import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppTheme } from '@/theme';
import { useGetProductModerationQuery, useReviewProductMutation } from '@/store/api/adminApi';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { useAppDispatch } from '@/store/hooks';
import { executeWithOfflineQueue } from '@/services/offlineQueue';

function productStatusLabel(status: string) {
  if (status === 'PENDING_REVIEW') return 'Waiting for review';
  if (status === 'DRAFT') return 'Draft';
  if (status === 'ARCHIVED') return 'Archived';
  if (status === 'OUT_OF_STOCK') return 'Out of stock';
  return 'Active';
}

function productStatusTone(status: string) {
  if (status === 'PENDING_REVIEW') return AppTheme.colors.info;
  if (status === 'DRAFT') return AppTheme.colors.textSoft;
  if (status === 'ARCHIVED') return AppTheme.colors.danger;
  return AppTheme.colors.success;
}

export function ProductModerationScreen() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isFetching, refetch } = useGetProductModerationQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true
  });
  const [reviewProduct, { isLoading: saving }] = useReviewProductMutation();

  const products = data?.data ?? data ?? [];

  const decide = (id: string, status: string) => {
    void executeWithOfflineQueue({
      type: 'admin.reviewProduct',
      payload: { id, body: { status } },
      action: () => reviewProduct({ id, status }).unwrap()
    })
      .then((result) => dispatch(showFeedback({
        type: result.queued ? 'info' : 'success',
        title: 'Catalog updated',
        message: result.queued ? 'Saved offline. It will sync automatically.' : 'Moderation action saved.'
      })))
      .catch((error: any) => dispatch(showFeedback({ type: 'error', title: 'Moderation failed', message: error?.data?.message ?? 'Try again.' })));
  };

  return (
    <Screen>
      <FlatList
        data={products}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.content}
        refreshing={isLoading || isFetching}
        onRefresh={refetch}
        ListHeaderComponent={<PageHeader title="Product Review" subtitle="Review seller products before they appear to shoppers." />}
        ListEmptyComponent={
          <SectionCard style={styles.emptyCard}>
            <Ionicons name="shield-checkmark-outline" size={30} color={AppTheme.colors.primary} />
            <AppText variant="headline" style={{ marginTop: 12 }}>No products waiting for review</AppText>
          </SectionCard>
        }
        renderItem={({ item }: any) => (
          <SectionCard style={styles.card}>
            <View style={styles.row}>
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <View style={styles.metaRow}>
                  <AppText variant="title">{item.title}</AppText>
                  <View style={[styles.statusPill, { backgroundColor: productStatusTone(item.status) }]}>
                    <AppText variant="small" tone="white">{productStatusLabel(item.status)}</AppText>
                  </View>
                </View>
                <AppText variant="body" tone="soft">{item.category?.name ?? item.category?.slug ?? 'Catalog item'}</AppText>
                <AppText variant="small" tone="soft">Store: {item.store?.name ?? 'Unassigned store'}</AppText>
                <AppText variant="small" tone="soft">Owner: {item.store?.owner?.name ?? item.creator?.name ?? 'Unknown seller'}</AppText>
                <AppText variant="small" tone="soft">Type: {item.brand ?? item.category?.slug ?? 'Standard product'}</AppText>
                <AppText variant="small" tone="soft">Stock: {item.stock ?? 0} | Price: {item.price ?? 0}</AppText>
                <AppText variant="small" tone="soft">Updated: {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'N/A'}</AppText>
              </View>
            </View>
            <View style={styles.actionRow}>
              <AppButton title="Approve" onPress={() => decide(item.id, 'ACTIVE')} loading={saving} />
              <AppButton title="Reject" variant="secondary" onPress={() => decide(item.id, 'ARCHIVED')} loading={saving} />
            </View>
          </SectionCard>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: AppTheme.spacing.xl
  },
  card: {
    gap: AppTheme.spacing.md
  },
  row: {
    flexDirection: 'row',
    gap: AppTheme.spacing.md
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: AppTheme.spacing.sm
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.primary
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm
  }
});
