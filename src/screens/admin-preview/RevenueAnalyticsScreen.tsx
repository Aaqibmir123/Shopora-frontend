import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { useGetRevenueAnalyticsQuery } from '@/store/api/adminApi';
import { formatCurrency } from '@/utils/format';

export function RevenueAnalyticsScreen() {
  const { data, isLoading, isFetching, refetch } = useGetRevenueAnalyticsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  const analytics = data?.data ?? data ?? {};
  const recentOrders = analytics.recentOrders ?? [];

  return (
    <Screen>
      <FlatList
        data={recentOrders}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.content}
        refreshing={isLoading || isFetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader title="Revenue Analytics" subtitle="Platform growth, category revenue, and settlement trends." />
            <SectionCard style={styles.heroCard}>
              <AppText variant="small" tone="soft">Total revenue</AppText>
              <AppText variant="display" style={styles.heroValue}>{formatCurrency(analytics.totalRevenue ?? 0)}</AppText>
              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <AppText variant="small" tone="soft">Orders</AppText>
                  <AppText variant="headline">{analytics.totalOrders ?? 0}</AppText>
                </View>
                <View style={styles.metric}>
                  <AppText variant="small" tone="soft">Recent orders</AppText>
                  <AppText variant="headline">{recentOrders.length}</AppText>
                </View>
              </View>
            </SectionCard>
          </View>
        }
        ListFooterComponent={
          <SectionCard style={styles.footerCard}>
            <AppText variant="title">Latest order activity</AppText>
            <AppText variant="body" tone="soft" style={{ marginTop: 4 }}>
              Revenue analytics pulls from the order dataset with server-side aggregation.
            </AppText>
          </SectionCard>
        }
        ListEmptyComponent={<View />}
        renderItem={({ item }: any) => (
          <SectionCard style={styles.card}>
            <View style={styles.row}>
              <View style={styles.dot} />
              <View style={{ flex: 1 }}>
                <AppText variant="title">{item.number ?? item.id}</AppText>
                <AppText variant="body" tone="soft">{item.status}</AppText>
                <AppText variant="small" tone="soft">Date: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</AppText>
                <AppText variant="small" tone="soft">Store: {(item.items ?? []).map((line: any) => line.product?.store?.name).filter(Boolean).slice(0, 2).join(' / ') || 'Mixed stores'}</AppText>
              </View>
              <AppText variant="title" tone="primary">{formatCurrency(item.total ?? 0)}</AppText>
            </View>
            <View style={styles.itemRow}>
              {(item.items ?? []).slice(0, 3).map((line: any) => (
                <View key={line.id} style={styles.itemPill}>
                  <AppText variant="small" tone="soft" numberOfLines={1}>{line.titleSnapshot}</AppText>
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
  header: {
    gap: AppTheme.spacing.md
  },
  heroCard: {
    gap: AppTheme.spacing.sm
  },
  heroValue: {
    color: AppTheme.colors.primary
  },
  metricRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm,
    marginTop: AppTheme.spacing.sm
  },
  metric: {
    flex: 1,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  card: {
    gap: AppTheme.spacing.md
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.md
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppTheme.colors.primary
  },
  footerCard: {
    gap: AppTheme.spacing.md
  },
  itemRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm
  },
  itemPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.surfaceSoft
  }
});
