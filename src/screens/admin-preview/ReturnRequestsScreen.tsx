// @ts-nocheck
import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { useGetReturnRequestsOverviewQuery } from '@/store/api/adminApi';
import { formatCurrency } from '@/utils/format';
import { ROUTES } from '@/constants/navigation';

const statusLabel = (status: string) => String(status ?? '').replace(/_/g, ' ');

const statusTone = (status: string) => {
  switch (String(status ?? '').toUpperCase()) {
    case 'REQUESTED':
      return AppTheme.colors.info;
    case 'APPROVED':
    case 'PICKUP_SCHEDULED':
    case 'REFUND_PENDING':
      return AppTheme.colors.primary;
    case 'REJECTED':
    case 'DENIED':
      return AppTheme.colors.danger;
    case 'PICKED_UP':
    case 'REPLACEMENT_SHIPPED':
      return AppTheme.colors.success;
    default:
      return AppTheme.colors.textSoft;
  }
};

const formatTime = (value?: string | Date | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  });
};

export function ReturnRequestsScreen() {
  const navigation = useNavigation<any>();
  const { data, isLoading, isFetching, refetch } = useGetReturnRequestsOverviewQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true
  });
  const requests = data?.data ?? data ?? [];

  return (
    <Screen>
      <FlatList
        data={requests}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.content}
        refreshing={isLoading || isFetching}
        onRefresh={refetch}
        ListHeaderComponent={<PageHeader title="Return Requests" subtitle="Admin review queue for return and replacement requests." />}
        ListEmptyComponent={
          <SectionCard style={styles.emptyCard}>
            <Ionicons name="return-up-back-outline" size={30} color={AppTheme.colors.primary} />
            <AppText variant="headline" style={{ marginTop: 12 }}>No return requests yet</AppText>
          </SectionCard>
        }
        renderItem={({ item }: any) => {
          const imageUrl = item?.itemImageSnapshot ?? item?.orderItem?.imageSnapshot ?? item?.product?.imageUrl ?? null;
          const status = String(item.status ?? 'REQUESTED');
          return (
            <SectionCard style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.thumbWrap}>
                  {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.thumb} contentFit="cover" /> : <Ionicons name="refresh-outline" size={20} color={AppTheme.colors.primary} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.metaRow}>
                    <AppText variant="title">{item.orderNumberSnapshot ?? item.order?.number ?? 'Order request'}</AppText>
                    <View style={[styles.statusPill, { backgroundColor: statusTone(status) }]}>
                      <AppText variant="small" tone="white">{statusLabel(status)}</AppText>
                    </View>
                  </View>
                  <AppText variant="body" tone="soft">{item.user?.name ?? item.user?.phone ?? 'Customer'}</AppText>
                  <AppText variant="small" tone="soft">{item.type ?? 'RETURN'} • {item.itemTitleSnapshot ?? item.orderItem?.titleSnapshot ?? 'Item'}</AppText>
                  <AppText variant="small" tone="soft">{item.reason ?? 'No reason provided'}</AppText>
                </View>
              </View>

              <View style={styles.metaBlock}>
                <AppText variant="small" tone="soft">Delivered: {formatTime(item.order?.deliveredAt ?? item.order?.updatedAt)}</AppText>
                <AppText variant="small" tone="soft">Requested: {formatTime(item.createdAt)}</AppText>
                <AppText variant="small" tone="soft">Amount: {formatCurrency(Number(item.order?.total ?? 0))}</AppText>
              </View>

              {item.comments ? (
                <SectionCard style={styles.commentCard}>
                  <AppText variant="small" tone="soft">Customer note</AppText>
                  <AppText variant="body">{item.comments}</AppText>
                </SectionCard>
              ) : null}

              {item.supportThread ? (
                <SectionCard style={styles.messageCard}>
                  <AppText variant="small" tone="soft">Linked conversation</AppText>
                  <AppText variant="body" numberOfLines={3}>
                    {item.supportThread.latestMessage?.message ?? 'No conversation message yet'}
                  </AppText>
                  <AppText variant="small" tone="soft">
                    {item.supportThread.latestMessage?.senderName ?? item.supportThread.customerLabel ?? 'Customer'}
                  </AppText>
                </SectionCard>
              ) : null}

              {item.supportThreadId ? (
                <Pressable
                  onPress={() => navigation.navigate(ROUTES.AdminSupportThread, { threadId: item.supportThreadId })}
                  style={styles.chatLink}
                >
                  <View style={styles.chatLinkIcon}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={AppTheme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="label">Open Linked Chat</AppText>
                    <AppText variant="small" tone="soft">View the conversation attached to this return request.</AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={AppTheme.colors.textSoft} />
                </Pressable>
              ) : (
                <AppText variant="small" tone="soft">Linked chat will appear here after the request is created.</AppText>
              )}

              {Array.isArray(item.photoUrls) && item.photoUrls.length ? (
                <View style={styles.photoRow}>
                  {item.photoUrls.slice(0, 3).map((url: string) => (
                    <Image key={url} source={{ uri: url }} style={styles.photo} contentFit="cover" />
                  ))}
                </View>
              ) : null}
            </SectionCard>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl + 24
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: AppTheme.spacing.xl
  },
  card: {
    gap: AppTheme.spacing.md
  },
  topRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.md
  },
  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: AppTheme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surfaceSoft,
    overflow: 'hidden'
  },
  thumb: {
    width: '100%',
    height: '100%'
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: AppTheme.spacing.sm
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AppTheme.radius.pill
  },
  metaBlock: {
    gap: 4,
    padding: AppTheme.spacing.sm,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  commentCard: {
    gap: 6,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  messageCard: {
    gap: 6,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  chatLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  chatLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
  },
  photoRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm
  },
  photo: {
    width: 74,
    height: 74,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  }
});
