import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppText } from '@/components/common/AppText';
import { StatCard } from '@/components/common/StatCard';
import { AppTheme } from '@/theme';
import { AppButton } from '@/components/common/AppButton';
import { SectionCard } from '@/components/layout/SectionCard';
import { useGetAdminDashboardQuery, useGetSellerApprovalsQuery } from '@/store/api/adminApi';
import { formatCurrency } from '@/utils/format';
import { ROUTES } from '@/constants/navigation';

const actions = [
  { label: 'Seller Approvals', route: 'SellerApprovals', icon: 'storefront-outline' },
  { label: 'User Management', route: 'UserManagement', icon: 'people-outline' },
  { label: 'Orders Overview', route: 'OrdersOverview', icon: 'receipt-outline' },
  { label: 'Moderation', route: 'ProductModeration', icon: 'shield-checkmark-outline' },
  { label: 'Return Requests', route: 'AdminReturns', icon: 'backup-restore-outline' },
  { label: 'Home Banners', route: ROUTES.AdminBanners, icon: 'image-outline' }
] as const;

export function AdminDashboardPreviewScreen({ navigation }: any) {
  const { data, isLoading, isFetching, refetch } = useGetAdminDashboardQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true
  });
  const { data: approvalsData } = useGetSellerApprovalsQuery(undefined, { refetchOnFocus: true });

  const dashboard = data?.data ?? data ?? {};
  const approvals = approvalsData?.data ?? approvalsData ?? [];
  const pendingApprovals = approvals.filter((item: any) => item.status === 'PENDING');

  const navigateTo = (route: string, parentRoute = false) => {
    if (parentRoute) {
      const parent = navigation.getParent?.();
      if (parent?.navigate) {
        parent.navigate(route as never);
        return;
      }
    }
    navigation.navigate(route as never);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Admin Panel" />

        <LinearGradient colors={['#FFFFFF', '#EAF5FF']} style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="shield-crown-outline" size={24} color={AppTheme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="small" tone="soft">Command Center</AppText>
              <AppText variant="headline">Marketplace control room</AppText>
              <AppText variant="body" tone="soft">Live admin metrics with secure review queues and moderation tools.</AppText>
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <AppText variant="small" tone="soft">Users</AppText>
              <AppText variant="title">{dashboard.users ?? '-'}</AppText>
            </View>
            <View style={styles.heroStat}>
              <AppText variant="small" tone="soft">Sellers</AppText>
              <AppText variant="title">{dashboard.sellers ?? '-'}</AppText>
            </View>
            <View style={styles.heroStat}>
              <AppText variant="small" tone="soft">Revenue</AppText>
              <AppText variant="title">{dashboard.revenue != null ? formatCurrency(dashboard.revenue) : '-'}</AppText>
            </View>
          </View>
          <AppButton title={isLoading || isFetching ? 'Refreshing...' : 'Refresh'} variant="secondary" onPress={refetch} />
        </LinearGradient>

        <Pressable style={styles.bannerShortcut} onPress={() => navigateTo(ROUTES.AdminBanners, true)}>
          <View style={styles.bannerShortcutIcon}>
            <MaterialCommunityIcons name="image-outline" size={24} color={AppTheme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="small" tone="soft">Home promo banners</AppText>
            <AppText variant="title">Add sale, offer, or featured collection banners</AppText>
            <AppText variant="body" tone="soft">This opens the banner manager used to show promos on the user home screen.</AppText>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={AppTheme.colors.primary} />
        </Pressable>

        <View style={styles.stats}>
          <StatCard label="Orders" value={String(dashboard.orders ?? 0)} />
          <StatCard label="Pending Approvals" value={String(dashboard.approvals ?? pendingApprovals.length ?? 0)} />
          <StatCard label="Products" value={String(dashboard.products?.total ?? dashboard.products?.active ?? 0)} />
          <StatCard label="Revenue" value={dashboard.revenue != null ? formatCurrency(dashboard.revenue) : '-'} />
        </View>

        <SectionCard style={styles.sectionCard}>
          <AppText variant="title">Status snapshot</AppText>
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotChip}>
              <AppText variant="small" tone="soft">Placed</AppText>
              <AppText variant="title">{dashboard.orderStatuses?.PLACED ?? 0}</AppText>
            </View>
            <View style={styles.snapshotChip}>
              <AppText variant="small" tone="soft">Packed</AppText>
              <AppText variant="title">{dashboard.orderStatuses?.PACKED ?? 0}</AppText>
            </View>
            <View style={styles.snapshotChip}>
              <AppText variant="small" tone="soft">Shipped</AppText>
              <AppText variant="title">{dashboard.orderStatuses?.SHIPPED ?? 0}</AppText>
            </View>
            <View style={styles.snapshotChip}>
              <AppText variant="small" tone="soft">Pending approvals</AppText>
              <AppText variant="title">{dashboard.approvalStatuses?.PENDING ?? 0}</AppText>
            </View>
          </View>
        </SectionCard>

        <SectionCard style={styles.sectionCard}>
          <AppText variant="title">Quick actions</AppText>
          <View style={styles.actionGrid}>
            {actions.map((item) => (
              <AppButton
                key={item.label}
                title={item.label}
                variant="secondary"
                onPress={() => navigateTo(item.route, item.route === 'UserManagement' || item.route === 'ProductModeration' || item.route === ROUTES.AdminBanners)}
                style={styles.actionButton}
              />
            ))}
          </View>
        </SectionCard>

        <View style={styles.split}>
          <SectionCard style={styles.card}>
            <AppText variant="title">Pending seller approvals</AppText>
            <AppText variant="body" tone="soft">Queue pulled from the backend review list.</AppText>
            <View style={styles.approvalList}>
              {pendingApprovals.slice(0, 3).map((item: any) => (
                <View key={item.id} style={styles.approvalItem}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="body">{item.storeName}</AppText>
                    <AppText variant="small" tone="soft">{item.category}</AppText>
                  </View>
                  <AppButton title="Review" variant="secondary" onPress={() => navigateTo('SellerApprovals')} />
                </View>
              ))}
            </View>
          </SectionCard>

          <LinearGradient colors={['#FFF9F4', '#FFFFFF']} style={styles.card}>
            <AppText variant="title">Revenue snapshot</AppText>
            <AppText variant="body" tone="soft">Platform growth, settlements, and marketplace health.</AppText>
            <View style={styles.chartRow}>
              {[70, 100, 120, 82, 140, 170, 120].map((height, index) => (
                <View key={String(index)} style={[styles.bar, { height }]} />
              ))}
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.lg
  },
  hero: {
    gap: AppTheme.spacing.md,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.lg,
    ...AppTheme.shadow.card
  },
  heroTop: {
    flexDirection: 'row',
    gap: AppTheme.spacing.md,
    alignItems: 'flex-start'
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surface
  },
  heroStats: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm
  },
  bannerShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.md,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.lg,
    backgroundColor: AppTheme.colors.surface,
    ...AppTheme.shadow.card
  },
  bannerShortcutIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
  },
  heroStat: {
    flex: 1,
    padding: AppTheme.spacing.sm,
    borderRadius: AppTheme.radius.md,
    backgroundColor: 'rgba(255,255,255,0.78)'
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.md
  },
  sectionCard: {
    gap: AppTheme.spacing.md
  },
  snapshotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm
  },
  snapshotChip: {
    minWidth: '48%',
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm
  },
  actionButton: {
    width: '48%'
  },
  split: {
    gap: AppTheme.spacing.md
  },
  card: {
    borderRadius: AppTheme.radius.lg,
    backgroundColor: AppTheme.colors.surface,
    padding: AppTheme.spacing.md,
    ...AppTheme.shadow.card
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: AppTheme.spacing.lg,
    height: 180
  },
  bar: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: AppTheme.colors.primaryStrong
  },
  approvalList: {
    gap: AppTheme.spacing.md,
    marginTop: AppTheme.spacing.md
  },
  approvalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: AppTheme.spacing.md
  }
});
