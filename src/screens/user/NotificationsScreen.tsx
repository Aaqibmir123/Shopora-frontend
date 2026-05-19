import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { useAppSelector } from '@/store/hooks';
import { selectAuthToken } from '@/store/slices/authSlice';
import { useGetOrdersQuery } from '@/store/api/orderApi';
import { useMySupportThreadQuery } from '@/store/api/supportApi';
import { EmptyState } from '@/components/layout/EmptyState';

type FeedItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  tone: 'primary' | 'info' | 'success' | 'danger';
};

const formatTime = (value?: string | Date | null) => {
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

const statusTone = (status?: string): FeedItem['tone'] => {
  switch (String(status ?? '').toUpperCase()) {
    case 'DELIVERED':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    case 'SHIPPED':
      return 'info';
    case 'PACKED':
      return 'primary';
    default:
      return 'primary';
  }
};

export function NotificationsScreen() {
  const token = useAppSelector(selectAuthToken);
  const { data: ordersData } = useGetOrdersQuery(undefined, { skip: !token });
  const { data: supportThread } = useMySupportThreadQuery(undefined, { skip: !token });

  const feed = useMemo<FeedItem[]>(() => {
    if (!token) return [];

    const orderItems = (Array.isArray(ordersData) ? ordersData : ordersData?.data ?? []).slice(0, 4).map((order: any) => ({
      id: `order-${order.id}`,
      title: `Order ${order.number ?? order.id}`,
      message: `${order.status ?? 'Placed'} for ${order.items?.length ?? 0} item(s) • ${order.paymentMethod ?? 'Payment pending'}`,
      time: formatTime(order.createdAt),
      tone: statusTone(order.status)
    }));

    const supportItems = supportThread
      ? [
          {
            id: `support-${supportThread.id}`,
            title: `Support: ${supportThread.subject}`,
            message: `Status: ${supportThread.status}. Latest update from support is ready in chat.`,
            time: formatTime(supportThread.updatedAt),
            tone: supportThread.status === 'RESOLVED' ? ('success' as const) : ('info' as const)
          }
        ]
      : [];

    return [...supportItems, ...orderItems];
  }, [ordersData, supportThread, token]);

  return (
    <Screen>
      <PageHeader title="Notifications" subtitle="Orders, offers, support replies, and reminders." />
      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.dot, item.tone === 'success' && styles.success, item.tone === 'info' && styles.info, item.tone === 'danger' && styles.danger]} />
            <View style={{ flex: 1 }}>
              <AppText variant="title">{item.title}</AppText>
              <AppText variant="body" tone="soft">{item.message}</AppText>
              <AppText variant="small" tone="soft">{item.time}</AppText>
            </View>
            <Ionicons name={item.tone === 'success' ? 'checkmark-circle' : item.tone === 'danger' ? 'warning-outline' : 'notifications-outline'} size={18} color={AppTheme.colors.primary} />
          </View>
        )}
        ListEmptyComponent={(
          <EmptyState
            title="No notifications yet"
            description="Order updates and support replies will appear here."
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md
  },
  card: {
    flexDirection: 'row',
    gap: AppTheme.spacing.md,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.lg,
    backgroundColor: AppTheme.colors.surface,
    ...AppTheme.shadow.card
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppTheme.colors.primary,
    marginTop: 8
  },
  success: {
    backgroundColor: AppTheme.colors.success
  },
  info: {
    backgroundColor: AppTheme.colors.info
  },
  danger: {
    backgroundColor: AppTheme.colors.danger
  }
});
