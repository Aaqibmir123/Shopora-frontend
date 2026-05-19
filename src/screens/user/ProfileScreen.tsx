import React from 'react';
import { View, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { AppButton } from '@/components/common/AppButton';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';
import { useMeQuery } from '@/store/api/authApi';
import { clearAuthToken } from '@/services/tokenStorage';
import { useAuthContext } from '@/context/AuthContext';
import { useAppDispatch } from '@/store/hooks';
import { clearSession } from '@/store/slices/authSlice';
import { setCartState, setRole, setWishlist } from '@/store/slices/uiSlice';
import { baseApi } from '@/store/api/baseApi';
import { getAuthSession } from '@/services/tokenStorage';
import { SectionCard } from '@/components/layout/SectionCard';

type Props = any;

const items = [
  {
    title: 'My Orders',
    subtitle: 'Track, return or buy again',
    route: ROUTES.MyOrders,
    accent: AppTheme.colors.primaryStrong,
    soft: '#FFF1E8'
  },
  {
    title: 'Wishlist',
    subtitle: 'Items you saved for later',
    route: ROUTES.Wishlist,
    accent: '#C85D93',
    soft: '#FDEDF5'
  },
  {
    title: 'Saved Addresses',
    subtitle: 'Home, work and other locations',
    route: ROUTES.AddressSelection,
    accent: AppTheme.colors.tertiary,
    soft: '#EAF5FD'
  },
  {
    title: 'Saved Cards',
    subtitle: 'Manage your payment methods',
    route: ROUTES.PaymentMethod,
    accent: '#1E9B59',
    soft: '#EAF9F0'
  },
  {
    title: 'Notifications',
    subtitle: 'Control your alert settings',
    route: ROUTES.Notifications,
    accent: '#7C59D1',
    soft: '#F2ECFF'
  },
  {
    title: 'Sell on Shopora',
    subtitle: 'Apply for your seller store',
    route: ROUTES.SellerStack,
    accent: '#D97706',
    soft: '#FFF4E5'
  },
  {
    title: 'Help Center',
    subtitle: 'Chat with Shopora support',
    route: ROUTES.HelpSupport,
    accent: '#0E7490',
    soft: '#E8F9FC'
  }
];

export function ProfileScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { sessionReady } = useAuthContext();
  const tokenReady = Boolean(getAuthSession()?.token);
  const { data } = useMeQuery(undefined, {
    skip: !sessionReady || !tokenReady,
    refetchOnMountOrArgChange: true
  });
  const user = data?.data ?? {};
  const avatarUrl = user?.avatarUrl as string | undefined;

  const handleLogout = React.useCallback(async () => {
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
  }, [dispatch, navigation]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.profileCard} onPress={() => navigation.navigate(ROUTES.EditProfile)}>
          <View style={styles.profileTopStrip} />
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={32} color={AppTheme.colors.primary} />
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color={AppTheme.colors.white} />
            </View>
          </View>
          <AppText variant="headline" style={styles.nameText}>
            {user?.name || 'Your Profile'}
          </AppText>
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="title">Quick menu</AppText>
            <AppText variant="small" tone="soft">
              Orders, addresses, support and account tools.
            </AppText>
          </View>
          {items.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => navigation.navigate(item.route as never)}
              style={[styles.row, { backgroundColor: item.soft, borderColor: item.accent + '22' }]}
            >
              <View style={[styles.rowAccent, { backgroundColor: item.accent }]} />
              <View style={[styles.rowIcon, { backgroundColor: item.accent + '18' }]}>
                <Ionicons name="chevron-forward" size={18} color={item.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title">{item.title}</AppText>
                <AppText variant="small" tone="soft">{item.subtitle}</AppText>
              </View>
            </Pressable>
          ))}
        </View>

        <SectionCard style={styles.logoutCard}>
          <AppButton title="Logout" variant="secondary" onPress={() => void handleLogout()} style={styles.logoutButton} />
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl + 96
  },
  profileCard: {
    alignItems: 'center',
    padding: AppTheme.spacing.lg,
    borderRadius: 28,
    backgroundColor: AppTheme.colors.surface,
    borderWidth: 1,
    borderColor: AppTheme.colors.borderSoft,
    ...AppTheme.shadow.card
  },
  profileTopStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: AppTheme.colors.primaryStrong
  },
  nameText: {
    marginTop: AppTheme.spacing.sm,
    textAlign: 'center'
  },
  logoutCard: {
    backgroundColor: AppTheme.colors.surfaceSoft,
    padding: AppTheme.spacing.lg
  },
  logoutButton: {
    width: '100%'
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer,
    marginBottom: AppTheme.spacing.md,
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  editBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primary
  },
  section: {
    gap: AppTheme.spacing.md
  },
  sectionHeader: {
    gap: 4,
    marginTop: AppTheme.spacing.xs,
    paddingHorizontal: 2
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.md,
    padding: AppTheme.spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: AppTheme.colors.surface,
    ...AppTheme.shadow.card
  },
  rowAccent: {
    width: 6,
    height: 44,
    borderRadius: 9999
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surface
  }
});
