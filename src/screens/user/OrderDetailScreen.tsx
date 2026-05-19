// @ts-nocheck
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppButton } from '@/components/common/AppButton';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { formatCurrency } from '@/utils/format';
import { ROUTES } from '@/constants/navigation';
import { useGetOrderQuery } from '@/store/api/orderApi';
import { useAppSelector } from '@/store/hooks';
import { selectAuthToken } from '@/store/slices/authSlice';

const timeline = [
  { key: 'PLACED', label: 'Placed', icon: 'checkmark-circle-outline', tone: 'primary' as const },
  { key: 'PACKED', label: 'Packed', icon: 'cube-outline', tone: 'info' as const },
  { key: 'SHIPPED', label: 'Shipped', icon: 'truck-outline', tone: 'info' as const },
  { key: 'DELIVERED', label: 'Delivered', icon: 'happy-outline', tone: 'success' as const },
  { key: 'CANCELLED', label: 'Rejected / Cancelled', icon: 'close-circle-outline', tone: 'danger' as const }
];

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const RETURN_WINDOW_DAYS = 2;

const resolveDeliveredAt = (order: any) => {
  if (order?.deliveredAt) {
    const deliveredAt = new Date(order.deliveredAt);
    if (!Number.isNaN(deliveredAt.getTime())) return deliveredAt;
  }

  const deliveredEvent = Array.isArray(order?.events)
    ? [...order.events].reverse().find((event: any) => String(event.status ?? '').toUpperCase() === 'DELIVERED')
    : null;
  if (deliveredEvent?.createdAt) {
    const deliveredAt = new Date(deliveredEvent.createdAt);
    if (!Number.isNaN(deliveredAt.getTime())) return deliveredAt;
  }

  return null;
};

const isReturnEligible = (order: any) => {
  if (String(order?.status ?? '').toUpperCase() !== 'DELIVERED') return false;
  const deliveredAt = resolveDeliveredAt(order);
  if (!deliveredAt) return false;
  const windowMs = RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - deliveredAt.getTime() <= windowMs;
};

export function OrderDetailScreen({ navigation, route }: any) {
  const token = useAppSelector(selectAuthToken);
  const orderId = route?.params?.orderId;
  const { data, isLoading, isFetching, refetch } = useGetOrderQuery(orderId, { skip: !token || !orderId, refetchOnFocus: true, refetchOnReconnect: true });
  const order = data ?? null;

  const events = order?.events ?? [];
  const latestStatus = String(order?.status ?? 'PLACED').toUpperCase();
  const eligible = isReturnEligible(order);
  const cancelled = latestStatus === 'CANCELLED';

  const statusIndex = useMemo(() => {
    switch (latestStatus) {
      case 'PLACED':
        return 0;
      case 'PACKED':
        return 1;
      case 'SHIPPED':
        return 2;
      case 'DELIVERED':
        return 3;
      case 'CANCELLED':
        return 4;
      default:
        return 0;
    }
  }, [latestStatus]);

  const returnRequestsByItem = useMemo(() => {
    const map = new Map<string, any>();
    (order?.returnRequests ?? []).forEach((request: any) => {
      if (request.orderItemId) {
        map.set(request.orderItemId, request);
      }
    });
    return map;
  }, [order?.returnRequests]);

  return (
    <Screen>
      <PageHeader title="Order Details" subtitle="Receipt, shipment steps, and return options in one view." />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshing={isLoading || isFetching} onRefresh={refetch}>
        <SectionCard style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.heroIcon}>
              <Ionicons name="receipt-outline" size={22} color={AppTheme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="small" tone="soft">Order number</AppText>
              <AppText variant="headline">{order?.number ?? 'SHP-00000000'}</AppText>
              <AppText variant="body" tone="soft">{formatDateTime(order?.createdAt)}</AppText>
            </View>
            <View style={[styles.statusPill, latestStatus === 'DELIVERED' && styles.statusSuccess, latestStatus === 'CANCELLED' && styles.statusDanger]}>
              <AppText variant="small" tone="white">{latestStatus.replace('_', ' ')}</AppText>
            </View>
          </View>
          <View style={styles.heroGrid}>
            <View style={styles.heroStat}>
              <AppText variant="small" tone="soft">Total</AppText>
              <AppText variant="headline" tone="primary">{formatCurrency(Number(order?.total ?? 0))}</AppText>
            </View>
            <View style={styles.heroStat}>
              <AppText variant="small" tone="soft">Payment</AppText>
              <AppText variant="label">{order?.paymentMethod ?? 'UPI'}</AppText>
            </View>
            <View style={styles.heroStat}>
              <AppText variant="small" tone="soft">Items</AppText>
              <AppText variant="label">{order?.items?.length ?? 0}</AppText>
            </View>
          </View>
        </SectionCard>

        <SectionCard style={styles.timelineCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={18} color={AppTheme.colors.primary} />
            <AppText variant="title">Tracking timeline</AppText>
          </View>
          <View style={styles.timelineList}>
            {timeline.map((step, index) => {
              const event = events.find((entry: any) => String(entry.status).toUpperCase() === step.key);
              const reached = cancelled
                ? Boolean(event) || step.key === 'PLACED' || step.key === 'CANCELLED'
                : index <= statusIndex && statusIndex >= 0;
              return (
                <View key={step.key} style={styles.timelineRow}>
                  <View style={[styles.timelineDot, reached && styles.timelineDotActive, step.tone === 'success' && reached && styles.timelineSuccess, step.tone === 'danger' && reached && styles.timelineDanger]}>
                    <Ionicons name={step.icon as any} size={16} color={reached ? AppTheme.colors.white : AppTheme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.timelineTopRow}>
                      <AppText variant="label">{step.label}</AppText>
                      <AppText variant="small" tone="soft">{event?.createdAt ? formatDateTime(event.createdAt) : reached ? 'Completed' : 'Pending'}</AppText>
                    </View>
                    <AppText variant="small" tone="soft">
                      {event?.note ?? (reached ? `Order is ${step.label.toLowerCase()}` : 'Waiting for update')}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={18} color={AppTheme.colors.primary} />
            <AppText variant="title">Delivery address</AppText>
          </View>
          <AppText variant="label">{order?.addressName ?? 'Address'}</AppText>
          <AppText variant="body" tone="soft">{order?.addressLabel ?? 'Delivery'}</AppText>
          <AppText variant="body" tone="soft">{[order?.addressLine1, order?.addressLine2, order?.addressCity, order?.addressState, order?.addressPostalCode].filter(Boolean).join(', ')}</AppText>
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Ionicons name="bag-outline" size={18} color={AppTheme.colors.primary} />
            <AppText variant="title">Items</AppText>
          </View>
          <View style={styles.itemList}>
            {order?.items?.map((item: any) => {
              const returnRequest = returnRequestsByItem.get(item.id);
              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemThumbWrap}>
                    <Ionicons name="image-outline" size={16} color={AppTheme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="label" numberOfLines={1}>{item.titleSnapshot}</AppText>
                    <AppText variant="small" tone="soft">
                      Qty {item.quantity} • {formatCurrency(item.priceSnapshot)}
                    </AppText>
                    <AppText variant="small" tone="soft">
                      {item.size ? `Size ${item.size}` : 'Size not set'}{item.color ? ` • ${item.color}` : ''}
                    </AppText>
                    {returnRequest ? (
                      <View style={styles.returnPill}>
                        <AppText variant="small" tone="white">{String(returnRequest.status).replace('_', ' ')}</AppText>
                      </View>
                    ) : null}
                  </View>
                  {eligible && !returnRequest ? (
                    <View style={styles.itemActions}>
                      <AppButton
                        title="Return"
                        variant="secondary"
                        style={styles.itemButton}
                        onPress={() => navigation.navigate(ROUTES.ReturnRequest, { orderId: order.id, orderItemId: item.id, mode: 'RETURN' })}
                      />
                      <AppButton
                        title="Replace"
                        style={styles.itemButton}
                        onPress={() => navigation.navigate(ROUTES.ReturnRequest, { orderId: order.id, orderItemId: item.id, mode: 'REPLACEMENT' })}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color={AppTheme.colors.primary} />
            <AppText variant="title">Payment summary</AppText>
          </View>
          <View style={styles.billRow}>
            <AppText variant="body" tone="soft">Subtotal</AppText>
            <AppText variant="label">{formatCurrency(Number(order?.subtotal ?? 0))}</AppText>
          </View>
          <View style={styles.billRow}>
            <AppText variant="body" tone="soft">Discount</AppText>
            <AppText variant="label" tone="primary">- {formatCurrency(Number(order?.discountAmount ?? 0))}</AppText>
          </View>
          <View style={styles.billRow}>
            <AppText variant="body" tone="soft">Shipping</AppText>
            <AppText variant="label">{Number(order?.shippingFee ?? 0) ? formatCurrency(Number(order.shippingFee)) : 'FREE'}</AppText>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <AppText variant="headline">Grand total</AppText>
            <AppText variant="headline" tone="primary">{formatCurrency(Number(order?.total ?? 0))}</AppText>
          </View>
        </SectionCard>

        {order?.returnRequests?.length ? (
          <SectionCard>
            <View style={styles.sectionHeader}>
              <Ionicons name="refresh-outline" size={18} color={AppTheme.colors.primary} />
              <AppText variant="title">Return & replacement requests</AppText>
            </View>
            <View style={styles.requestList}>
              {order.returnRequests.map((request: any) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestTop}>
                    <AppText variant="label">{String(request.type).replace('_', ' ')}</AppText>
                    <View style={styles.requestStatus}><AppText variant="small" tone="white">{String(request.status).replace('_', ' ')}</AppText></View>
                  </View>
                  <AppText variant="small" tone="soft">{request.itemTitleSnapshot}</AppText>
                  <AppText variant="small" tone="soft">{request.reason}</AppText>
                  <AppButton
                    title="Continue Chat"
                    variant="secondary"
                    style={{ marginTop: AppTheme.spacing.sm }}
                    onPress={() => navigation.navigate(ROUTES.SupportChat, {
                      composeOnly: false,
                      threadId: request.supportThreadId,
                      orderId: order?.id,
                      orderNumber: order?.number,
                      orderItemId: request.orderItemId,
                      orderItemTitle: request.itemTitleSnapshot
                    })}
                  />
                </View>
              ))}
            </View>
          </SectionCard>
        ) : null}

        <View style={styles.actionRow}>
          <AppButton title="Track Order" style={styles.flex} onPress={() => navigation.navigate(ROUTES.OrderTracking, { orderId: order?.id })} />
          <AppButton title="Back to Orders" variant="secondary" style={styles.flex} onPress={() => navigation.navigate(ROUTES.MyOrders)} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl + 80
  },
  hero: {
    gap: AppTheme.spacing.md
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.md
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.primary
  },
  statusSuccess: {
    backgroundColor: AppTheme.colors.success
  },
  statusDanger: {
    backgroundColor: AppTheme.colors.danger
  },
  heroGrid: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm
  },
  heroStat: {
    flex: 1,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  timelineCard: {
    gap: AppTheme.spacing.sm
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm
  },
  timelineList: {
    gap: AppTheme.spacing.md
  },
  timelineRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.md
  },
  timelineDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  timelineDotActive: {
    backgroundColor: AppTheme.colors.primary
  },
  timelineSuccess: {
    backgroundColor: AppTheme.colors.success
  },
  timelineDanger: {
    backgroundColor: AppTheme.colors.danger
  },
  timelineTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: AppTheme.spacing.sm
  },
  itemList: {
    gap: AppTheme.spacing.sm
  },
  itemCard: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  itemThumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surface
  },
  itemActions: {
    gap: AppTheme.spacing.sm
  },
  itemButton: {
    minHeight: 38
  },
  returnPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.primaryStrong
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: AppTheme.spacing.sm
  },
  billDivider: {
    height: 1,
    backgroundColor: AppTheme.colors.borderSoft,
    marginVertical: AppTheme.spacing.sm
  },
  requestList: {
    gap: AppTheme.spacing.sm
  },
  requestCard: {
    gap: 4,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  requestTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  requestStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.primary
  },
  actionRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm
  },
  flex: {
    flex: 1
  }
});
