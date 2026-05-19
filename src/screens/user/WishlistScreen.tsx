import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppTheme } from '@/theme';
import { formatCurrency } from '@/utils/format';
import { ROUTES } from '@/constants/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { moveWishlistItemToCart, removeFromWishlist } from '@/store/slices/uiSlice';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { selectAuthToken } from '@/store/slices/authSlice';
import { useToggleFavoriteMutation } from '@/store/api/favoriteApi';
import { useUpsertCartItemMutation } from '@/store/api/cartApi';
import { executeWithOfflineQueue } from '@/services/offlineQueue';
import { useGetProductsQuery } from '@/store/api/productApi';
import { mapBackendProduct } from '@/utils/catalog';

type Props = any;

export function WishlistScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const wishlistIds = useAppSelector((state) => state.ui.wishlist);
  const token = useAppSelector(selectAuthToken);
  const [toggleFavorite] = useToggleFavoriteMutation();
  const [upsertCartItem] = useUpsertCartItemMutation();
  const { data: productsData } = useGetProductsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true
  });
  const catalogProducts = ((productsData?.data ?? productsData ?? []) as any[]).map(mapBackendProduct);
  const wishlistItems = catalogProducts.filter((item) => wishlistIds.includes(item.id));

  const syncRemove = async (productId: string, title: string) => {
    dispatch(removeFromWishlist(productId));
    if (!token) {
      dispatch(showFeedback({ type: 'info', title: 'Removed locally', message: 'Sign in to sync your wishlist.' }));
      return;
    }

    const result = await executeWithOfflineQueue({
      type: 'favorite.toggle',
      payload: { productId, favorited: false },
      action: () => toggleFavorite({ productId, favorited: false }).unwrap()
    });

    dispatch(showFeedback({
      type: result.queued ? 'info' : 'info',
      title: 'Removed from wishlist',
      message: result.queued ? 'Saved offline. It will sync automatically.' : title
    }));
  };

  const syncAddToCart = async (productId: string, title: string) => {
    dispatch(moveWishlistItemToCart(productId));
    const nextQuantity = 1;

    if (!token) {
      dispatch(showFeedback({ type: 'info', title: 'Moved locally', message: 'Sign in to sync cart items.' }));
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
    <Screen>
      <PageHeader
        title="Wishlist"
        subtitle="Saved products appear here and can be moved to cart instantly."
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={wishlistItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <SectionCard>
            <AppText variant="headline">Nothing saved yet</AppText>
            <AppText variant="body" tone="soft" style={{ marginTop: 6 }}>
              Tap the heart icon on any product to save it here.
            </AppText>
          </SectionCard>
        }
        renderItem={({ item }) => (
          <SectionCard>
            <View style={styles.row}>
              <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" />
              <View style={styles.body}>
                <AppText variant="title" numberOfLines={2}>{item.title}</AppText>
                <AppText variant="small" tone="soft">{item.category}</AppText>
                <AppText variant="headline" tone="primary">{formatCurrency(item.price)}</AppText>
                <View style={styles.actions}>
                  <AppButton
                    title="Add to Cart"
                    onPress={() => void syncAddToCart(item.id, item.title)}
                    style={styles.cta}
                  />
                  <Pressable
                    onPress={() => void syncRemove(item.id, item.title)}
                    style={styles.iconButton}
                  >
                    <Ionicons name="trash-outline" size={18} color={AppTheme.colors.danger} />
                  </Pressable>
                </View>
              </View>
            </View>
          </SectionCard>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl
  },
  row: {
    flexDirection: 'row',
    gap: AppTheme.spacing.md
  },
  thumb: {
    width: 92,
    height: 92,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  body: {
    flex: 1,
    gap: 4
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
    marginTop: AppTheme.spacing.xs
  },
  cta: {
    flex: 1
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: AppTheme.radius.md,
    borderWidth: 1,
    borderColor: AppTheme.colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surface
  },
});
