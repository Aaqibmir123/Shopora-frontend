import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppButton } from '@/components/common/AppButton';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';
import { useAppSelector } from '@/store/hooks';
import { selectAuthToken } from '@/store/slices/authSlice';
import { useGetOrderQuery } from '@/store/api/orderApi';

const timeline = [
  { key: 'PLACED', label: 'Order Placed', description: 'Seller received the order and started preparing it.', icon: 'checkmark-circle-outline' as const },
  { key: 'PACKED', label: 'Packed', description: 'Items were packed and quality checked.', icon: 'cube-outline' as const },
  { key: 'SHIPPED', label: 'Shipped', description: 'The parcel has left the seller warehouse.', icon: 'truck-outline' as const },
  { key: 'DELIVERED', label: 'Delivered', description: 'Delivered successfully to the delivery address.', icon: 'happy-outline' as const },
  { key: 'CANCELLED', label: 'Rejected / Cancelled', description: 'Order was cancelled by seller or support.', icon: 'close-circle-outline' as const }
];

const formatTime = (value?: string | Date | null) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

export function OrderTrackingScreen({ navigation, route }: any) {
  const token = useAppSelector(selectAuthToken);
  const orderId = route?.params?.orderId;
  const { data } = useGetOrderQuery(orderId, { skip: !token || !orderId, refetchOnFocus: true, refetchOnReconnect: true });
  const order = data ?? null;
  const currentIndex = useMemo(() => {
    switch (String(order?.status ?? 'PLACED').toUpperCase()) {
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
  }, [order?.status]);
  const events = order?.events ?? [];
  const cancelled = String(order?.status ?? '').toUpperCase() === 'CANCELLED';

  return (
    <Screen>
      <PageHeader title="Order Tracking" subtitle="Seller updates appear here. No live location is needed." />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionCard style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name="time-outline" size={22} color={AppTheme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="small" tone="soft">Tracking order</AppText>
              <AppText variant="headline">{order?.number ?? 'SHP-00000000'}</AppText>
              <AppText variant="body" tone="soft">{order?.trackingNote ?? 'Status updates from the seller will appear below.'}</AppText>
            </View>
          </View>
        </SectionCard>

        <SectionCard style={styles.timelineCard}>
          <AppText variant="title">Progress</AppText>
          <View style={styles.timelineList}>
            {timeline.map((step, index) => {
              const event = events.find((entry: any) => String(entry.status).toUpperCase() === step.key);
              const reached = cancelled
                ? Boolean(event) || step.key === 'PLACED' || step.key === 'CANCELLED'
                : index <= currentIndex && currentIndex >= 0;
              return (
                <View key={step.key} style={styles.row}>
                  <View style={[styles.dot, reached && styles.dotActive, step.key === 'DELIVERED' && reached && styles.dotSuccess, step.key === 'CANCELLED' && reached && styles.dotDanger]}>
                    <Ionicons name={step.icon} size={15} color={reached ? AppTheme.colors.white : AppTheme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowTop}>
                      <AppText variant="label">{step.label}</AppText>
                      <AppText variant="small" tone="soft">{event?.createdAt ? formatTime(event.createdAt) : reached ? 'Completed' : 'Pending'}</AppText>
                    </View>
                    <AppText variant="small" tone="soft">
                      {event?.note ?? step.description}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard>
          <AppText variant="title">What this means</AppText>
          <AppText variant="body" tone="soft">
            The seller manually updates the order from Placed to Packed, Shipped, and Delivered. If the seller cancels the order, it will show as Rejected / Cancelled.
          </AppText>
        </SectionCard>

        {order?.events?.length ? (
          <SectionCard>
            <AppText variant="title">Update log</AppText>
            <View style={styles.logList}>
              {order.events.map((event: any) => (
                <View key={event.id} style={styles.logRow}>
                  <View style={styles.logBullet} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowTop}>
                      <AppText variant="label">{String(event.status).replace('_', ' ')}</AppText>
                      <AppText variant="small" tone="soft">{formatTime(event.createdAt)}</AppText>
                    </View>
                    <AppText variant="small" tone="soft">{event.note ?? 'Status updated'}</AppText>
                  </View>
                </View>
              ))}
            </View>
          </SectionCard>
        ) : null}
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
  heroTop: {
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
  timelineCard: {
    gap: AppTheme.spacing.md
  },
  timelineList: {
    gap: AppTheme.spacing.md
  },
  row: {
    flexDirection: 'row',
    gap: AppTheme.spacing.md
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  dotActive: {
    backgroundColor: AppTheme.colors.primary
  },
  dotSuccess: {
    backgroundColor: AppTheme.colors.success
  },
  dotDanger: {
    backgroundColor: AppTheme.colors.danger
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: AppTheme.spacing.sm
  },
  logList: {
    gap: AppTheme.spacing.sm
  },
  logRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm
  },
  logBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    backgroundColor: AppTheme.colors.primary
  }
});
