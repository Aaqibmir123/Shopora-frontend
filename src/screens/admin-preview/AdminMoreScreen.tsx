import React from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';
import { useMeQuery } from '@/store/api/authApi';
import { useAppDispatch } from '@/store/hooks';
import { clearAuthToken } from '@/services/tokenStorage';
import { useAuthContext } from '@/context/AuthContext';
import { clearSession } from '@/store/slices/authSlice';
import { setCartState, setRole, setWishlist } from '@/store/slices/uiSlice';
import { baseApi } from '@/store/api/baseApi';
import { getAuthSession } from '@/services/tokenStorage';

const quickLinks = [
  { title: 'Profile', subtitle: 'Edit account info', route: ROUTES.AdminProfile, icon: 'account-circle-outline', parentRoute: true },
  { title: 'User Management', subtitle: 'Users, roles, and access', route: 'UserManagement', icon: 'account-group-outline', parentRoute: true },
  { title: 'Product Moderation', subtitle: 'Catalog review queue', route: 'ProductModeration', icon: 'shield-check-outline', parentRoute: true },
  { title: 'Home Banners', subtitle: 'Promos shown on the user home screen', route: ROUTES.AdminBanners, icon: 'image-outline', parentRoute: true },
  { title: 'Seller Approvals', subtitle: 'Review applications', route: ROUTES.SellerApprovals, icon: 'store-check-outline', parentRoute: false },
  { title: 'Return Requests', subtitle: 'Approve or reject returns', route: ROUTES.AdminReturns, icon: 'backup-restore-outline', parentRoute: false },
  { title: 'Support Inbox', subtitle: 'Chat with customers', route: ROUTES.AdminSupportInbox, icon: 'message-text-outline', parentRoute: true },
  { title: 'Logout', subtitle: 'Sign out of admin', route: ROUTES.Login, icon: 'logout', parentRoute: false }
] as const;

export function AdminMoreScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { sessionReady } = useAuthContext();
  const tokenReady = Boolean(getAuthSession()?.token);
  const { data } = useMeQuery(undefined, {
    skip: !sessionReady || !tokenReady,
    refetchOnMountOrArgChange: true
  });
  const user = data?.data ?? {};
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

  const logout = async () => {
    await clearAuthToken();
    dispatch(clearSession());
    dispatch(setRole('shopper'));
    dispatch(setWishlist([]));
    dispatch(setCartState({}));
    dispatch(baseApi.util.resetApiState());
    navigation.reset({
      index: 0,
      routes: [{ name: ROUTES.Login as never }]
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Admin Hub" subtitle="Shortcuts, support, and account access." />

        <SectionCard style={styles.profileCard}>
          <View style={styles.avatar}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Ionicons name="shield-checkmark" size={28} color={AppTheme.colors.white} />
            )}
          </View>
          <View style={{ flex: 1 }}>
              <AppText variant="headline">{user.name ?? 'Admin account'}</AppText>
              <AppText variant="body" tone="soft">{user.phone ?? 'Phone not set'}</AppText>
              <AppText variant="small" tone="soft">{user.email ?? 'Email not set'}</AppText>
          </View>
          <View style={styles.rolePill}>
            <AppText variant="small" tone="white">ADMIN</AppText>
          </View>
        </SectionCard>

        <SectionCard>
          <AppText variant="title">Quick actions</AppText>
          <View style={styles.quickGrid}>
            {quickLinks.map((item) => (
              <Pressable
                key={item.title}
                onPress={() => (item.title === 'Logout' ? logout() : navigateTo(item.route as string, Boolean(item.parentRoute)))}
                style={styles.quickCard}
              >
                <View style={styles.quickIcon}>
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={AppTheme.colors.primary} />
                </View>
                <AppText variant="title">{item.title}</AppText>
                <AppText variant="small" tone="soft">{item.subtitle}</AppText>
              </Pressable>
            ))}
          </View>
        </SectionCard>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.md
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primary,
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.primary
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm
  },
  quickCard: {
    width: '48%',
    gap: 8,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surface
  },
});
