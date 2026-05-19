import React, { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { useGetSellerEarningsQuery, useGetSellerOrdersQuery } from '@/store/api/sellerApi';
import { formatCompactNumber, formatCurrency } from '@/utils/format';

function RevenueBar({ label, value, total }: { label: string; value: number; total: number }) {
  const width = total > 0 ? Math.max(8, Math.round((value / total) * 100)) : 0;
  return (
    <View style={styles.barRow}>
      <View style={styles.barLabelRow}>
        <AppText variant="small" tone="soft">{label}</AppText>
        <AppText variant="small" tone="primary">{formatCurrency(value)}</AppText>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${width}%` }]} />
      </View>
    </View>
  );
}

export function EarningsScreen() {
  const { data: earningsData, isLoading, isFetching, refetch } = useGetSellerEarningsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true
  });
  const { data: ordersData } = useGetSellerOrdersQuery(undefined, { refetchOnFocus: true });

  const earnings = earningsData?.data ?? earningsData ?? {};
  const orders = ordersData?.data ?? ordersData ?? [];

  const breakdown = useMemo(() => {
    const delivered = orders.filter((item: any) => item.status === 'DELIVERED');
    const pending = orders.filter((item: any) => ['PLACED', 'PACKED', 'SHIPPED'].includes(item.status));
    const cancelled = orders.filter((item: any) => item.status === 'CANCELLED');
    return {
      deliveredRevenue: delivered.reduce((sum: number, item: any) => sum + (item.total ?? 0), 0),
      pendingRevenue: pending.reduce((sum: number, item: any) => sum + (item.total ?? 0), 0),
      cancelledRevenue: cancelled.reduce((sum: number, item: any) => sum + (item.total ?? 0), 0)
    };
  }, [orders]);

  const items = [
    { label: 'Delivered orders', value: orders.filter((item: any) => item.status === 'DELIVERED').length },
    { label: 'Pending orders', value: orders.filter((item: any) => ['PLACED', 'PACKED', 'SHIPPED'].includes(item.status)).length },
    { label: 'Gross revenue', value: earnings.grossRevenue ?? 0 }
  ];

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.label}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading || isFetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader title="Earnings" subtitle="Revenue, payouts, and order performance in one glance." />
            <SectionCard style={styles.heroCard}>
              <AppText variant="small" tone="soft">This month</AppText>
              <AppText variant="display" style={styles.heroValue}>{formatCurrency(earnings.grossRevenue ?? 0)}</AppText>
              <AppText variant="body" tone="soft">Revenue from marketplace orders and completed deliveries.</AppText>
              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <AppText variant="small" tone="soft">Orders</AppText>
                  <AppText variant="title">{earnings.orderCount ?? 0}</AppText>
                </View>
                <View style={styles.metric}>
                  <AppText variant="small" tone="soft">Delivered revenue</AppText>
                  <AppText variant="title">{formatCurrency(breakdown.deliveredRevenue)}</AppText>
                </View>
                <View style={styles.metric}>
                  <AppText variant="small" tone="soft">Pending revenue</AppText>
                  <AppText variant="title">{formatCurrency(breakdown.pendingRevenue)}</AppText>
                </View>
              </View>
            </SectionCard>
          </View>
        }
        renderItem={({ item }) => (
          <SectionCard style={styles.metricCard}>
            <AppText variant="small" tone="soft">{item.label}</AppText>
            <AppText variant="headline">{typeof item.value === 'number' ? formatCompactNumber(item.value) : String(item.value)}</AppText>
          </SectionCard>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <SectionCard style={styles.chartCard}>
              <AppText variant="title">Revenue split</AppText>
              <RevenueBar label="Delivered" value={breakdown.deliveredRevenue} total={Math.max(earnings.grossRevenue ?? 0, 1)} />
              <RevenueBar label="Pending" value={breakdown.pendingRevenue} total={Math.max(earnings.grossRevenue ?? 0, 1)} />
              <RevenueBar label="Cancelled" value={breakdown.cancelledRevenue} total={Math.max(earnings.grossRevenue ?? 0, 1)} />
            </SectionCard>

            <SectionCard style={styles.payoutCard}>
              <AppText variant="title">Next payout</AppText>
              <AppText variant="body" tone="soft" style={{ marginTop: 4 }}>
                Estimated settlement for delivered orders is queued for the upcoming payout cycle.
              </AppText>
              <View style={styles.payoutRow}>
                <View style={styles.payoutItem}>
                  <AppText variant="small" tone="soft">Payout ready</AppText>
                  <AppText variant="title">{formatCurrency(breakdown.deliveredRevenue)}</AppText>
                </View>
                <View style={styles.payoutItem}>
                  <AppText variant="small" tone="soft">Cycle</AppText>
                  <AppText variant="title">Weekly</AppText>
                </View>
              </View>
            </SectionCard>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: AppTheme.spacing.md, gap: AppTheme.spacing.md, paddingBottom: AppTheme.spacing.xl },
  header: { gap: AppTheme.spacing.md },
  heroCard: { gap: AppTheme.spacing.md },
  heroValue: { color: AppTheme.colors.primary, marginTop: -4 },
  metricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: AppTheme.spacing.sm },
  metric: { flex: 1, minWidth: 100, padding: AppTheme.spacing.md, borderRadius: AppTheme.radius.md, backgroundColor: AppTheme.colors.surfaceSoft },
  metricCard: { alignItems: 'center', gap: 6 },
  footer: { gap: AppTheme.spacing.md },
  chartCard: { gap: AppTheme.spacing.md },
  barRow: { gap: 8 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', gap: AppTheme.spacing.sm },
  barTrack: { height: 10, borderRadius: AppTheme.radius.pill, backgroundColor: AppTheme.colors.surfaceSoft, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: AppTheme.radius.pill, backgroundColor: AppTheme.colors.primaryStrong },
  payoutCard: { gap: AppTheme.spacing.md },
  payoutRow: { flexDirection: 'row', gap: AppTheme.spacing.sm },
  payoutItem: { flex: 1, padding: AppTheme.spacing.md, borderRadius: AppTheme.radius.md, backgroundColor: AppTheme.colors.surfaceSoft }
});
