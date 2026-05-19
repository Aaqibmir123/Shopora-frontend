import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';
import { useAdminSupportThreadsQuery } from '@/store/api/supportApi';

const statusTone = {
  OPEN: AppTheme.colors.success,
  PENDING: AppTheme.colors.info,
  RESOLVED: AppTheme.colors.primaryStrong,
  CLOSED: AppTheme.colors.danger
} as const;

const formatTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

export function AdminSupportInboxScreen({ navigation }: any) {
  const { data: threads = [], isFetching, refetch } = useAdminSupportThreadsQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  React.useEffect(() => {
    console.log('[support-ui][admin-inbox] threads', {
      count: threads.length,
      items: threads.map((item: any) => ({
        id: item.id,
        customerLabel: item.customerLabel,
        messageCount: Array.isArray(item.messages) ? item.messages.length : 0,
        latestMessage: item.latestMessage?.message ?? null,
        status: item.status
      }))
    });
  }, [threads]);

  const stats = threads.reduce(
    (acc: any, thread: any) => {
      acc.total += 1;
      acc[thread.status] = (acc[thread.status] ?? 0) + 1;
      return acc;
    },
    { total: 0, OPEN: 0, PENDING: 0, RESOLVED: 0, CLOSED: 0 }
  );

  return (
    <Screen>
      <PageHeader title="Support Inbox" subtitle="Reply to users and keep every support conversation in one place." rightLabel="Refresh" onRightPress={() => void refetch()} />
      <View style={styles.container}>
        <SectionCard style={styles.statsCard}>
          <View style={styles.statsGrid}>
            {[
              { label: 'Threads', value: stats.total, icon: 'chatbubble-outline' },
              { label: 'Open', value: stats.OPEN, icon: 'ellipse-outline' },
              { label: 'Pending', value: stats.PENDING, icon: 'time-outline' }
            ].map((item) => (
              <View key={item.label} style={styles.statChip}>
                <Ionicons name={item.icon as any} size={18} color={AppTheme.colors.primary} />
                <View style={{ flex: 1 }}>
                  <AppText variant="small" tone="soft">
                    {item.label}
                  </AppText>
                  <AppText variant="title">{item.value}</AppText>
                </View>
              </View>
            ))}
          </View>
        </SectionCard>

        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          refreshing={isFetching}
          onRefresh={() => void refetch()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const lastMessage = item.latestMessage ?? item.messages?.[0] ?? null;
            const customerLabel = item.customerLabel ?? item.user?.name ?? item.user?.phone ?? 'Customer';
            const customerPhone = item.customerPhone ?? item.user?.phone ?? 'No phone';
            return (
              <Pressable
                style={styles.threadCard}
                onPress={() => navigation.navigate(ROUTES.AdminSupportThread, { threadId: item.id })}
              >
                <View style={styles.threadTop}>
                  <View style={styles.threadAvatar}>
                    <MaterialCommunityIcons name="face-agent" size={20} color={AppTheme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="title">{customerLabel}</AppText>
                    <AppText variant="small" tone="soft">
                      {item.subject}
                    </AppText>
                    {item.orderNumberSnapshot ? (
                      <AppText variant="small" tone="soft">
                        {`Order #${item.orderNumberSnapshot}${item.orderItemTitleSnapshot ? ` • ${item.orderItemTitleSnapshot}` : ''}`}
                      </AppText>
                    ) : null}
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: statusTone[item.status as keyof typeof statusTone] ?? AppTheme.colors.primary }]}>
                    <AppText variant="small" tone="white">
                      {item.status}
                    </AppText>
                  </View>
                </View>
                <AppText variant="body" tone="soft" numberOfLines={2}>
                  {lastMessage?.message ?? 'No messages yet'}
                </AppText>
                <View style={styles.metaRow}>
                  <AppText variant="small" tone="soft">
                    {customerPhone}
                  </AppText>
                  <AppText variant="small" tone="soft">
                    {formatTime(item.lastMessageAt)}
                  </AppText>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <SectionCard style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={28} color={AppTheme.colors.primary} />
              <AppText variant="title">No support threads yet</AppText>
              <AppText variant="body" tone="soft" style={{ textAlign: 'center' }}>
                New user messages will appear here automatically.
              </AppText>
            </SectionCard>
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: AppTheme.spacing.md,
    gap: AppTheme.spacing.md
  },
  statsCard: {
    gap: AppTheme.spacing.sm
  },
  statsGrid: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm
  },
  statChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  listContent: {
    gap: AppTheme.spacing.sm,
    paddingBottom: AppTheme.spacing.xl + 72
  },
  threadCard: {
    gap: AppTheme.spacing.sm,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.lg,
    backgroundColor: AppTheme.colors.surface,
    ...AppTheme.shadow.card
  },
  threadTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm
  },
  threadAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: AppTheme.radius.pill
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  emptyState: {
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
    paddingVertical: AppTheme.spacing.xl
  }
});
