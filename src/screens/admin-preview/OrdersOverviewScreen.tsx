import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { useGetOrdersOverviewQuery } from '@/store/api/adminApi';
import { formatCurrency } from '@/utils/format';

export function OrdersOverviewScreen() {
  const { data, isLoading, isFetching, refetch } = useGetOrdersOverviewQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true
  });
  const orders = data?.data ?? data ?? [];

  return (
    <Screen>
      <FlatList
        data={orders}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.content}
        refreshing={isLoading || isFetching}
        onRefresh={refetch}
        ListHeaderComponent={<PageHeader title="Orders Overview" subtitle="Monitor order flow, fulfillment health, and issue alerts." />}
        ListEmptyComponent={
          <SectionCard style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={30} color={AppTheme.colors.primary} />
            <AppText variant="headline" style={{ marginTop: 12 }}>No orders found</AppText>
          </SectionCard>
        }
        renderItem={({ item }: any) => (
          <SectionCard style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Ionicons name="bag-check-outline" size={20} color={AppTheme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.metaRow}>
                  <AppText variant="title">{item.number ?? item.id}</AppText>
                  <View style={styles.statusPill}>
                    <AppText variant="small" tone="white">{item.status}</AppText>
                  </View>
                </View>
                <AppText variant="body" tone="soft">{item.user?.name ?? item.user?.phone ?? 'Customer'}</AppText>
                <AppText variant="small" tone="soft">{item.items?.length ?? 0} items | {item.addressCity ?? item.addressLabel ?? 'Address'}</AppText>
                <AppText variant="small" tone="soft">Placed: {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}</AppText>
                <AppText variant="small" tone="soft">Store: {(item.items ?? []).map((line: any) => line.product?.store?.name).filter(Boolean).slice(0, 2).join(' / ') || 'Mixed stores'}</AppText>
                <AppText variant="small" tone="soft">Note: {item.trackingNote ?? 'No special handling note'}</AppText>
              </View>
            </View>
            <View style={styles.amountRow}>
              <AppText variant="title" tone="primary">{formatCurrency(item.total ?? 0)}</AppText>
              <AppText variant="small" tone="soft">Method: {item.paymentMethod ?? 'N/A'}</AppText>
            </View>
            <View style={styles.itemList}>
              {(item.items ?? []).slice(0, 3).map((line: any) => (
                <View key={line.id} style={styles.itemChip}>
                  <AppText variant="small" tone="soft" numberOfLines={1}>
                    {line.titleSnapshot} x{line.quantity}
                  </AppText>
                </View>
              ))}
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
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
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
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: AppTheme.spacing.sm
  },
  itemList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm
  },
  itemChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.surfaceSoft
  }
});
