// @ts-nocheck
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/common/AppText';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';
import { useGetSellerStoreQuery, useUpdateSellerStoreMutation } from '@/store/api/sellerApi';
import { executeWithOfflineQueue } from '@/services/offlineQueue';
import { useAppDispatch } from '@/store/hooks';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { clearAuthToken } from '@/services/tokenStorage';
import { clearSession } from '@/store/slices/authSlice';
import { setCartState, setRole, setWishlist } from '@/store/slices/uiSlice';
import { baseApi } from '@/store/api/baseApi';

const drawerItems = [
  { title: 'Store details', subtitle: 'Name, address and branding', icon: 'list-outline', route: ROUTES.SellerStoreDetails },
  { title: 'Products', subtitle: 'Add, edit, delete items', icon: 'albums-outline', route: 'Products' },
  { title: 'Profile', subtitle: 'Phone, email and photo', icon: 'person-outline', route: ROUTES.EditProfile },
  { title: 'Logout', subtitle: 'End session now', icon: 'log-out-outline', action: 'logout' as const, danger: true }
] as const;

export function StoreProfileScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { data, isLoading, isFetching } = useGetSellerStoreQuery(undefined, { refetchOnFocus: true, refetchOnReconnect: true });
  const [updateSellerStore] = useUpdateSellerStoreMutation();
  const store = data?.data ?? data ?? {};

  const navigateTo = (route: string) => {
    const sellerTabsNavigation = navigation.getParent?.('SellerTabs') ?? navigation.getParent?.();
    const sellerStackNavigation = navigation.getParent?.('SellerStack') ?? sellerTabsNavigation?.getParent?.();
    const rootNavigation = sellerStackNavigation?.getParent?.();

    if (route === 'Products') {
      if (sellerTabsNavigation?.navigate) {
        sellerTabsNavigation.navigate('Products');
        return;
      }
      if (rootNavigation?.navigate) {
        rootNavigation.navigate(ROUTES.SellerStack, {
          screen: ROUTES.SellerWorkspace,
          params: { screen: 'Products' }
        });
        return;
      }
      navigation.navigate(ROUTES.SellerStack, {
        screen: ROUTES.SellerWorkspace,
        params: { screen: 'Products' }
      });
      return;
    }

    if (rootNavigation?.navigate) {
      rootNavigation.navigate(route);
      return;
    }

    if (sellerStackNavigation?.navigate) {
      sellerStackNavigation.navigate(route);
      return;
    }

    navigation.navigate(route);
  };

  const updateOpenState = () => {
    void executeWithOfflineQueue({
      type: 'seller.updateStore',
      payload: { isOpen: !store.isOpen },
      action: () => updateSellerStore({ isOpen: !store.isOpen }).unwrap()
    })
      .then((result) =>
        dispatch(showFeedback({
          type: 'info',
          title: 'Store status updated',
          message: result.queued ? 'Saved offline. It will sync automatically.' : !store.isOpen ? 'Your store is now open.' : 'Your store is now paused.'
        }))
      )
      .catch((error: any) => dispatch(showFeedback({ type: 'error', title: 'Status update failed', message: error?.data?.message ?? 'Please try again.' })));
  };

  const handleLogout = async () => {
    await clearAuthToken();
    dispatch(clearSession());
    dispatch(setRole('seller'));
    dispatch(setWishlist([]));
    dispatch(setCartState({}));
    dispatch(baseApi.util.resetApiState());
    const targetNavigation = navigation.getParent?.() ?? navigation;
    targetNavigation.reset({
      index: 0,
      routes: [{ name: 'Login' as never }]
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionCard style={styles.coverCard}>
          <View style={styles.coverFrame}>
            {store.coverUrl ? (
              <Image source={{ uri: store.coverUrl }} style={styles.coverImage} contentFit="cover" />
            ) : (
              <View style={styles.placeholderFrame}>
                <Ionicons name="images-outline" size={24} color={AppTheme.colors.textSoft} />
                <AppText variant="small" tone="soft">No cover image selected</AppText>
              </View>
            )}
          </View>
          <View style={styles.brandRow}>
            <View style={styles.logoWrap}>
              {store.logoUrl ? (
                <Image source={{ uri: store.logoUrl }} style={styles.logoImage} contentFit="cover" />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="image-outline" size={24} color={AppTheme.colors.textSoft} />
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="headline">{store.name || 'Store'}</AppText>
              <AppText variant="body" tone="soft">{store.slug || 'store-slug'}</AppText>
              <View style={styles.livePill}>
                <AppText variant="small" tone="white">{store.isOpen ? 'Store open' : 'Store paused'}</AppText>
              </View>
            </View>
            <Pressable onPress={updateOpenState} style={[styles.toggleButton, store.isOpen && styles.toggleButtonActive]}>
              <Ionicons name={store.isOpen ? 'pause' : 'play'} size={16} color={store.isOpen ? AppTheme.colors.white : AppTheme.colors.primary} />
              <AppText variant="small" tone={store.isOpen ? 'white' : 'primary'}>{store.isOpen ? 'Pause' : 'Open'}</AppText>
            </Pressable>
          </View>
          <AppText variant="small" tone="soft">
            {isLoading || isFetching ? 'Refreshing store status...' : 'Store menu for management and branding.'}
          </AppText>
        </SectionCard>

        <SectionCard style={styles.drawerCard}>
          <View style={styles.sectionHeading}>
            <AppText variant="title">Store menu</AppText>
            <AppText variant="small" tone="soft">Open details, products, profile, branding, or sign out.</AppText>
          </View>
          <View style={styles.drawerGrid}>
            {drawerItems.map((item) => {
              const danger = item.danger === true;
              return (
                <Pressable
                  key={item.title}
                  style={[styles.drawerTile, danger && styles.drawerDangerTile]}
                  onPress={() => {
                    if ('route' in item) {
                      navigateTo(item.route);
                      return;
                    }
                    void handleLogout();
                  }}
                >
                  <View style={[styles.drawerIconWrap, danger && styles.drawerDangerIconWrap]}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={danger ? AppTheme.colors.danger : AppTheme.colors.primary}
                    />
                  </View>
                  <AppText variant="label" style={styles.drawerTitle}>{item.title}</AppText>
                  <AppText variant="small" tone="soft">{item.subtitle}</AppText>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard>
          <AppText variant="title">Store metrics</AppText>
          <View style={styles.metricRow}>
            <View style={styles.metric}><AppText variant="small" tone="soft">Rating</AppText><AppText variant="headline">{Number(store.rating ?? 0).toFixed(1)}</AppText></View>
            <View style={styles.metric}><AppText variant="small" tone="soft">Products</AppText><AppText variant="headline">{store.productCount ?? 0}</AppText></View>
            <View style={styles.metric}><AppText variant="small" tone="soft">Orders</AppText><AppText variant="headline">{store.ordersCount ?? 0}</AppText></View>
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
    paddingBottom: AppTheme.spacing.xl + 96
  },
  coverCard: {
    gap: AppTheme.spacing.md,
    overflow: 'hidden'
  },
  coverFrame: {
    width: '100%',
    height: 140,
    borderRadius: AppTheme.radius.lg,
    overflow: 'hidden',
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  coverImage: {
    width: '100%',
    height: '100%'
  },
  placeholderFrame: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  brandRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.md,
    alignItems: 'center'
  },
  logoWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  logoImage: {
    width: '100%',
    height: '100%'
  },
  logoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  livePill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.primary
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: AppTheme.spacing.md,
    height: 42,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  toggleButtonActive: {
    backgroundColor: AppTheme.colors.primary
  },
  drawerCard: {
    gap: AppTheme.spacing.md
  },
  sectionHeading: {
    gap: 4
  },
  drawerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm
  },
  drawerTile: {
    width: '48%',
    minHeight: 90,
    borderRadius: 20,
    padding: AppTheme.spacing.sm,
    gap: 6,
    backgroundColor: '#FFF8F4',
    borderWidth: 1,
    borderColor: '#F4D9CB',
    ...AppTheme.shadow.card
  },
  drawerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surface
  },
  drawerDangerTile: {
    backgroundColor: '#FFF1ED',
    borderColor: '#F3C1B7'
  },
  drawerDangerIconWrap: {
    backgroundColor: '#FFE2DC'
  },
  drawerTitle: {
    marginTop: 2
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm,
    marginTop: AppTheme.spacing.md
  },
  metric: {
    flex: 1,
    minWidth: 96,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  }
});
