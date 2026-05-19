import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { useAppDispatch } from '@/store/hooks';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { useGetSellerOrdersQuery, useUpdateSellerOrderStatusMutation } from '@/store/api/sellerApi';
import { formatCurrency } from '@/utils/format';
import { executeWithOfflineQueue } from '@/services/offlineQueue';

const tabs = [
  { key: 'ALL', label: 'All' },
  { key: 'PLACED', label: 'Placed' },
  { key: 'PACKED', label: 'Packed' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' }
] as const;

const nextStatus: Record<string, string | null> = {
  PLACED: 'PACKED',
  PACKED: 'SHIPPED',
  SHIPPED: 'DELIVERED',
  DELIVERED: null,
  CANCELLED: null
};

function OrderCard({ item, onAdvance, onCancel }: { item: any; onAdvance: () => void; onCancel: () => void }) {
  return (
    <SectionCard style={styles.card}>
      <View style={styles.rowTop}>
        <View style={styles.avatar}>
          <Ionicons name="receipt-outline" size={22} color={AppTheme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.metaRow}>
            <AppText variant="title">{item.user?.name ?? item.addressName ?? 'Customer'}</AppText>
            <View style={styles.statusPill}>
              <AppText variant="small" tone="white">{item.status}</AppText>
            </View>
          </View>
          <AppText variant="body" tone="soft">{item.addressCity ?? 'City'}</AppText>
          <AppText variant="small" tone="soft">Items: {item.items?.length ?? 0} | ETA: {item.trackingNote ?? 'Pending'}</AppText>
        </View>
      </View>

      <View style={styles.amountRow}>
        <View>
          <AppText variant="small" tone="soft">Order amount</AppText>
          <AppText variant="title" tone="primary">{formatCurrency(item.total ?? 0)}</AppText>
        </View>
        <View>
          <AppText variant="small" tone="soft">Order ID</AppText>
          <AppText variant="label">{item.number ?? item.id}</AppText>
        </View>
      </View>

      <View style={styles.actionRow}>
        {nextStatus[item.status] ? (
          <Pressable style={styles.primaryAction} onPress={onAdvance}>
            <AppText variant="small" tone="white">Mark {nextStatus[item.status]}</AppText>
          </Pressable>
        ) : null}
        {item.status !== 'DELIVERED' && item.status !== 'CANCELLED' ? (
          <Pressable style={styles.secondaryAction} onPress={onCancel}>
            <AppText variant="small" tone="primary">Cancel</AppText>
          </Pressable>
        ) : null}
      </View>
    </SectionCard>
  );
}

export function SellerOrdersScreen() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isFetching, refetch } = useGetSellerOrdersQuery(undefined, { refetchOnFocus: true, refetchOnReconnect: true });
  const [updateSellerOrderStatus] = useUpdateSellerOrderStatusMutation();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['key']>('ALL');

  const orders = data?.data ?? data ?? [];
  const filtered = useMemo(() => activeTab === 'ALL' ? orders : orders.filter((item: any) => item.status === activeTab), [activeTab, orders]);
  const summary = useMemo(() => ({
    active: orders.filter((item: any) => ['PLACED', 'PACKED', 'SHIPPED'].includes(item.status)).length,
    delivered: orders.filter((item: any) => item.status === 'DELIVERED').length,
    revenue: orders.reduce((sum: number, item: any) => sum + (item.total ?? 0), 0)
  }), [orders]);

  const changeStatus = (item: any, status: string) => {
    void executeWithOfflineQueue({
      type: 'seller.updateOrderStatus',
      payload: { id: item.id, body: { status } },
      action: () => updateSellerOrderStatus({ id: item.id, status }).unwrap()
    })
      .then((result) =>
        dispatch(showFeedback({
          type: result.queued ? 'info' : 'success',
          title: 'Order updated',
          message: result.queued ? 'Saved offline. It will sync automatically.' : `${item.number ?? item.id} moved to ${status}.`
        }))
      )
      .catch((error: any) => dispatch(showFeedback({ type: 'error', title: 'Update failed', message: error?.data?.message ?? 'Please try again.' })));
  };

  return (
    <Screen>
      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading || isFetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader title="Orders" subtitle="Track packing, shipping, cancellations, and delivery progress." />
            <SectionCard style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}><AppText variant="small" tone="soft">Pending</AppText><AppText variant="headline">{summary.active}</AppText></View>
                <View style={styles.summaryItem}><AppText variant="small" tone="soft">Delivered</AppText><AppText variant="headline">{summary.delivered}</AppText></View>
                <View style={styles.summaryItem}><AppText variant="small" tone="soft">Revenue</AppText><AppText variant="headline">{formatCurrency(summary.revenue)}</AppText></View>
              </View>
              <View style={styles.tabRow}>
                {tabs.map((item) => {
                  const active = item.key === activeTab;
                  return (
                    <Pressable key={item.key} onPress={() => setActiveTab(item.key)} style={[styles.tabChip, active && styles.tabChipActive]}>
                      <AppText variant="small" tone={active ? 'white' : 'soft'}>{item.label}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            </SectionCard>
          </View>
        }
        renderItem={({ item }: any) => (
          <OrderCard item={item} onAdvance={() => nextStatus[item.status] && changeStatus(item, nextStatus[item.status]!)} onCancel={() => changeStatus(item, 'CANCELLED')} />
        )}
        ListEmptyComponent={
          <SectionCard style={styles.emptyCard}>
            <AppText variant="headline">No orders here</AppText>
            <AppText variant="body" tone="soft" style={styles.centerText}>Switch to another order tab to see a different status bucket.</AppText>
          </SectionCard>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: AppTheme.spacing.md, gap: AppTheme.spacing.md, paddingBottom: AppTheme.spacing.xl },
  header: { gap: AppTheme.spacing.md },
  summaryCard: { gap: AppTheme.spacing.md },
  summaryRow: { flexDirection: 'row', gap: AppTheme.spacing.sm },
  summaryItem: { flex: 1, minWidth: 96, padding: AppTheme.spacing.md, borderRadius: AppTheme.radius.md, backgroundColor: AppTheme.colors.surfaceSoft },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: AppTheme.spacing.sm },
  tabChip: { paddingHorizontal: AppTheme.spacing.md, paddingVertical: AppTheme.spacing.sm, borderRadius: AppTheme.radius.pill, backgroundColor: AppTheme.colors.surfaceSoft },
  tabChipActive: { backgroundColor: AppTheme.colors.primary },
  card: { gap: AppTheme.spacing.md },
  rowTop: { flexDirection: 'row', gap: AppTheme.spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: AppTheme.colors.primaryContainer },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: AppTheme.spacing.sm },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: AppTheme.radius.pill, backgroundColor: AppTheme.colors.primary },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', gap: AppTheme.spacing.sm },
  actionRow: { flexDirection: 'row', gap: AppTheme.spacing.sm, justifyContent: 'flex-end' },
  primaryAction: { minHeight: 42, paddingHorizontal: AppTheme.spacing.md, borderRadius: AppTheme.radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: AppTheme.colors.primary },
  secondaryAction: { minHeight: 42, paddingHorizontal: AppTheme.spacing.md, borderRadius: AppTheme.radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: AppTheme.colors.surfaceSoft },
  emptyCard: { alignItems: 'center', paddingVertical: AppTheme.spacing.xl },
  centerText: { textAlign: 'center', marginTop: 8 }
});
