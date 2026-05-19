// @ts-nocheck
import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { CategoryPill } from '@/components/product/CategoryPill';
import { ProductCard } from '@/components/product/ProductCard';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { ROUTES } from '@/constants/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart, selectUiState, toggleWishlist } from '@/store/slices/uiSlice';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { selectAuthToken } from '@/store/slices/authSlice';
import { useToggleFavoriteMutation } from '@/store/api/favoriteApi';
import { useUpsertCartItemMutation } from '@/store/api/cartApi';
import { executeWithOfflineQueue } from '@/services/offlineQueue';
import { useGetProductsQuery } from '@/store/api/productApi';
import { useGetCategoriesQuery } from '@/store/api/categoryApi';
import { mapBackendCategory, mapBackendProduct } from '@/utils/catalog';
import { useGetBannersQuery } from '@/store/api/bannerApi';
import { mapBackendBanner } from '@/utils/banner';

type Props = any;

export function HomeScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const dispatch = useAppDispatch();
  const ui = useAppSelector(selectUiState);
  const token = useAppSelector(selectAuthToken);
  const { data: categoriesData } = useGetCategoriesQuery(undefined, { refetchOnFocus: true, refetchOnReconnect: true });
  const { data: productsData } = useGetProductsQuery(undefined, { refetchOnFocus: true, refetchOnReconnect: true });
  const { data: bannersData } = useGetBannersQuery(undefined, { refetchOnFocus: true, refetchOnReconnect: true });
  const categories = useMemo(() => (categoriesData?.data ?? categoriesData ?? []).map(mapBackendCategory), [categoriesData]);
  const products = useMemo(() => (productsData?.data ?? productsData ?? []).map(mapBackendProduct), [productsData]);
  const banners = useMemo(() => (bannersData?.data ?? bannersData ?? []).map(mapBackendBanner), [bannersData]);
  const topCategories = categories.slice(0, 5);
  const saleProducts = useMemo(() => {
    const discounted = products.filter((product) => Boolean(product.discount));
    if (discounted.length) return discounted.slice(0, 3);

    const shoeLike = products.filter((product) => /shoe|sneak|boot|sandal|loafer/i.test(`${product.title} ${product.category}`));
    if (shoeLike.length) return shoeLike.slice(0, 3);

    return products.slice(0, 3);
  }, [products]);
  const hasProducts = products.length > 0;
  const hasCategories = categories.length > 0;
  const hasBanners = banners.length > 0;
  const bannerWidth = Math.min(width - AppTheme.spacing.md * 2, 720);
  const cartCount = Object.keys(ui.cart).length;
  const [toggleFavorite] = useToggleFavoriteMutation();
  const [upsertCartItem] = useUpsertCartItemMutation();

  const isWishlisted = (productId: string) => ui.wishlist.includes(productId);
  const isInCart = (productId: string) => Boolean(ui.cart[productId]);
  const openBanner = (banner: ReturnType<typeof mapBackendBanner>) => {
    switch (banner.targetType) {
      case 'SEARCH':
        navigation.navigate(ROUTES.Search, { query: banner.targetValue ?? banner.title });
        return;
      case 'CATEGORY':
        navigation.navigate(ROUTES.Search, {
          category: banner.targetValue ?? undefined,
          categoryName: banner.subtitle ?? banner.title
        });
        return;
      case 'PRODUCT':
        if (banner.targetValue) {
          navigation.navigate(ROUTES.ProductDetails, { productSlug: banner.targetValue, productId: banner.targetValue });
          return;
        }
        navigation.navigate(ROUTES.Search, { query: banner.title });
        return;
      default:
        navigation.navigate(ROUTES.Search, { query: banner.title });
    }
  };

  const syncWishlist = async (productId: string, nextWishlisted: boolean, title: string) => {
    dispatch(toggleWishlist(productId));

    if (!token) {
      dispatch(showFeedback({
        type: 'info',
        title: nextWishlisted ? 'Added locally' : 'Removed locally',
        message: 'Sign in to sync wishlist to your account.'
      }));
      return;
    }

    const result = await executeWithOfflineQueue({
      type: 'favorite.toggle',
      payload: { productId, favorited: nextWishlisted },
      action: () => toggleFavorite({ productId, favorited: nextWishlisted }).unwrap()
    });

    dispatch(showFeedback({
      type: result.queued ? 'info' : 'success',
      title: nextWishlisted ? 'Added to wishlist' : 'Removed from wishlist',
      message: result.queued ? 'Saved offline. It will sync automatically.' : title
    }));
  };

  const syncCart = async (productId: string, nextQuantity: number, title: string) => {
    dispatch(addToCart(productId));

    if (!token) {
      dispatch(showFeedback({
        type: 'info',
        title: 'Added locally',
        message: 'Sign in to sync cart items to your account.'
      }));
      return;
    }

    const result = await executeWithOfflineQueue({
      type: 'cart.upsert',
      payload: { productId, quantity: nextQuantity },
      action: () => upsertCartItem({ productId, quantity: nextQuantity }).unwrap()
    });

    dispatch(showFeedback({
      type: result.queued ? 'info' : 'success',
      title: 'Added to cart',
      message: result.queued ? 'Saved offline. It will sync automatically.' : title
    }));
  };

  return (
    <Screen edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <AppText variant="small" tone="soft">Good morning</AppText>
            <AppText variant="headline">NovaMart</AppText>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton} onPress={() => navigation.navigate(ROUTES.Notifications)}>
              <Ionicons name="notifications-outline" size={20} color={AppTheme.colors.primary} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => navigation.navigate(ROUTES.Wishlist)}>
              <Ionicons name="heart-outline" size={20} color={AppTheme.colors.primary} />
              {ui.wishlist.length ? <View style={styles.badge}><AppText variant="small" tone="white">{ui.wishlist.length}</AppText></View> : null}
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => navigation.navigate(ROUTES.MainTabs + ':Cart')}>
              <Ionicons name="bag-outline" size={20} color={AppTheme.colors.primary} />
              {cartCount ? <View style={styles.badge}><AppText variant="small" tone="white">{cartCount}</AppText></View> : null}
            </Pressable>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={AppTheme.colors.textSoft} />
          <AppText variant="body" tone="soft" style={{ flex: 1 }} onPress={() => navigation.navigate(ROUTES.Search)}>
            Search for fashion, beauty, tech...
          </AppText>
          <MaterialCommunityIcons name="microphone-outline" size={20} color={AppTheme.colors.primary} />
        </View>

        {hasBanners ? (
          <View style={styles.bannerSection}>
            <SectionHeader title="Featured banners" subtitle="Fresh offers, launches, and promos from admin" />
            <FlatList
              horizontal
              data={banners}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={bannerWidth + AppTheme.spacing.md}
              contentContainerStyle={styles.bannerList}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => openBanner(item)}
                  style={[
                    styles.bannerCard,
                    {
                      width: bannerWidth,
                      marginRight: AppTheme.spacing.md,
                      backgroundColor: item.accentColor ?? AppTheme.colors.primaryStrong
                    }
                  ]}
                >
                  {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} contentFit="cover" /> : null}
                  <View style={styles.bannerScrim} />
                  <View style={styles.bannerOverlay}>
                    {item.badge ? (
                      <View style={styles.bannerBadge}>
                        <AppText variant="small" tone="white">{item.badge}</AppText>
                      </View>
                    ) : null}
                    <AppText variant="small" tone="white">Featured collection</AppText>
                    <AppText variant="headline" tone="white">{item.title}</AppText>
                    {item.subtitle ? <AppText variant="body" tone="white">{item.subtitle}</AppText> : null}
                    <View style={styles.bannerFooter}>
                      <AppText variant="label" tone="white">{item.ctaLabel ?? 'Shop now'}</AppText>
                      <Ionicons name="arrow-forward" size={16} color={AppTheme.colors.white} />
                    </View>
                  </View>
                </Pressable>
              )}
            />
          </View>
        ) : (
          <View style={styles.banner}>
            <View style={styles.bannerGlow} />
            <View style={styles.bannerOverlay}>
              <AppText variant="small" tone="white">Featured collections</AppText>
              <AppText variant="headline" tone="white">Fresh drops, clean checkout</AppText>
              <AppText variant="body" tone="white">
                Browse live products, save favorites, and shop by category in one place.
              </AppText>
              <View style={styles.bannerStats}>
                <View style={styles.bannerStat}>
                  <AppText variant="small" tone="white">{products.length} live items</AppText>
                </View>
                <View style={styles.bannerStat}>
                  <AppText variant="small" tone="white">{categories.length} categories</AppText>
                </View>
              </View>
            </View>
          </View>
        )}

        <SectionHeader title="Categories" actionLabel="View All" onActionPress={() => navigation.navigate(ROUTES.Search)} />
        {hasCategories ? (
          <FlatList
            horizontal
            data={topCategories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CategoryPill
                category={item}
                onPress={() => navigation.navigate(ROUTES.Search, { category: item.id, categoryName: item.name })}
              />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        ) : (
          <EmptyState
            title="No categories yet"
            description="Create the first category in the admin panel to start organizing products."
          />
        )}

        {saleProducts.length ? (
          <>
            <SectionHeader title="Sale Picks" subtitle="A few sharp deals before the main catalog" />
            <View style={styles.saleStrip}>
              {saleProducts.map((item) => (
                <View key={item.id} style={styles.saleCell}>
                  <ProductCard
                    item={item}
                    compact
                    onPress={() => navigation.navigate(ROUTES.ProductDetails, { productSlug: item.slug, productId: item.id })}
                    onToggleFavorite={() => {
                      const nextWishlisted = !ui.wishlist.includes(item.id);
                      void syncWishlist(item.id, nextWishlisted, item.title);
                    }}
                    onAddToCart={() => {
                      const nextQuantity = (ui.cart[item.id] ?? 0) + 1;
                      void syncCart(item.id, nextQuantity, item.title);
                    }}
                    isWishlisted={isWishlisted(item.id)}
                    isInCart={isInCart(item.id)}
                  />
                </View>
              ))}
            </View>
          </>
        ) : null}

        {hasProducts ? (
          <>
            <SectionHeader title="Trending Now" subtitle="Top picks across the catalog" />
            <View style={styles.grid}>
              {products.map((item) => (
                <View key={item.id} style={styles.productCell}>
                  <ProductCard
                    item={item}
                    compact
                    onPress={() => navigation.navigate(ROUTES.ProductDetails, { productSlug: item.slug, productId: item.id })}
                    onToggleFavorite={() => {
                      const nextWishlisted = !ui.wishlist.includes(item.id);
                      void syncWishlist(item.id, nextWishlisted, item.title);
                    }}
                    onAddToCart={() => {
                      const nextQuantity = (ui.cart[item.id] ?? 0) + 1;
                      void syncCart(item.id, nextQuantity, item.title);
                    }}
                    isWishlisted={isWishlisted(item.id)}
                    isInCart={isInCart(item.id)}
                  />
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.footerCard}>
          <AppText variant="headline" tone="primary">NovaMart</AppText>
          <AppText variant="body" tone="soft" style={{ marginTop: AppTheme.spacing.sm }}>
            The world&apos;s premium marketplace for fashion, beauty, tech, and more.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl + 160,
    gap: AppTheme.spacing.lg
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerActions: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm
  },
  iconButton: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...AppTheme.shadow.card
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryStrong
  },
  searchBar: {
    minHeight: 52,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
    paddingHorizontal: AppTheme.spacing.md,
    ...AppTheme.shadow.card
  },
  bannerSection: {
    gap: AppTheme.spacing.md
  },
  bannerList: {
    paddingRight: AppTheme.spacing.md
  },
  bannerCard: {
    minHeight: 180,
    borderRadius: AppTheme.radius.lg,
    overflow: 'hidden',
    position: 'relative',
    padding: AppTheme.spacing.md,
    ...AppTheme.shadow.card
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject
  },
  bannerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.24)'
  },
  banner: {
    height: 200,
    borderRadius: AppTheme.radius.lg,
    overflow: 'hidden',
    padding: AppTheme.spacing.lg,
    backgroundColor: AppTheme.colors.primaryStrong
  },
  bannerGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -80,
    top: -70,
    backgroundColor: 'rgba(255,255,255,0.16)'
  },
  bannerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: AppTheme.spacing.sm
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)'
  },
  bannerFooter: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  bannerStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm,
    marginTop: AppTheme.spacing.xs
  },
  bannerStat: {
    paddingHorizontal: AppTheme.spacing.sm,
    paddingVertical: 8,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)'
  },
  horizontalList: {
    paddingVertical: 4,
    gap: AppTheme.spacing.md
  },
  grid: {
    flexDirection: 'column',
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.sm
  },
  saleStrip: {
    gap: AppTheme.spacing.md
  },
  saleCell: {
    width: '100%'
  },
  productCell: {
    width: '100%'
  },
  footerCard: {
    padding: AppTheme.spacing.lg,
    borderRadius: AppTheme.radius.lg,
    backgroundColor: AppTheme.colors.primaryContainer
  }
});

