import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { AppButton } from '@/components/common/AppButton';
import { AppTheme } from '@/theme';
import { formatCurrency } from '@/utils/format';
import { ROUTES } from '@/constants/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeFromCart, selectCartProducts, updateCartQuantity } from '@/store/slices/uiSlice';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { selectAuthToken } from '@/store/slices/authSlice';
import { executeWithOfflineQueue } from '@/services/offlineQueue';
import { useGetCartQuery, useRemoveCartItemMutation, useUpsertCartItemMutation } from '@/store/api/cartApi';

type Props = any;

type CartViewItem = {
  id: string;
  productId: string;
  title: string;
  subtitle?: string;
  category: string;
  price: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
  image: string;
  source: 'remote' | 'local';
};

export function CartScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);
  const localCartItems = useAppSelector(selectCartProducts);
  const { data: remoteCartData, refetch: refetchCart } = useGetCartQuery(undefined, { skip: !token });
  const [upsertCartItem] = useUpsertCartItemMutation();
  const [removeCartItem] = useRemoveCartItemMutation();

  const cartItems = useMemo<CartViewItem[]>(() => {
    if (token) {
      return (remoteCartData?.data ?? []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        title: item.product?.title ?? item.titleSnapshot ?? 'Cart item',
        subtitle: item.product?.subtitle ?? item.product?.brand ?? item.product?.category?.name ?? item.titleSnapshot,
        category: item.product?.category?.name ?? item.product?.category?.slug ?? 'Product',
        price: item.product?.price ?? item.priceSnapshot ?? 0,
        quantity: item.quantity,
        size: item.selectedSize ?? null,
        color: item.selectedColor ?? null,
        image: item.product?.imageUrl ?? item.imageSnapshot ?? item.product?.image ?? '',
        source: 'remote'
      }));
    }

    return localCartItems.map((item: any) => ({
      id: item.id,
      productId: item.id,
      title: item.title,
      subtitle: item.subtitle ?? item.category,
      category: item.category,
      price: item.price,
      quantity: item.quantity,
      size: item.size ?? null,
      color: item.color ?? null,
      image: item.image,
      source: 'local'
    }));
  }, [localCartItems, remoteCartData, token]);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  return (
    <Screen>
      <PageHeader title="Cart" subtitle="Review your cart before checkout." />
      <FlatList
        data={cartItems}
        keyExtractor={(item) => `${item.source}-${item.id}`}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SectionCard>
            <View style={styles.row}>
              <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" />
              <View style={styles.body}>
                <AppText variant="title" numberOfLines={2}>{item.title}</AppText>
                <AppText variant="small" tone="soft" numberOfLines={1}>{item.subtitle ?? item.category}</AppText>
                <AppText variant="headline" tone="primary">{formatCurrency(item.price)}</AppText>
                <View style={styles.metaRow}>
                  {item.size ? <View style={styles.metaChip}><AppText variant="small" tone="soft">Size {item.size}</AppText></View> : null}
                  {item.color ? <View style={styles.metaChip}><AppText variant="small" tone="soft">{item.color}</AppText></View> : null}
                </View>
                <View style={styles.actionsRow}>
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(next) => {
                      if (item.source === 'local') {
                        dispatch(updateCartQuantity({ productId: item.id, quantity: next }));
                        dispatch(showFeedback({ type: 'info', title: 'Updated locally', message: 'Sign in to sync cart changes.' }));
                        return;
                      }

                      const sync = async () => {
                        if (!token) {
                          dispatch(showFeedback({ type: 'info', title: 'Updated locally', message: 'Sign in to sync cart changes.' }));
                          return;
                        }
                        if (next <= 0) {
                          const removed = await executeWithOfflineQueue({
                            type: 'cart.remove',
                            payload: { productId: item.productId },
                          action: () => removeCartItem(item.productId).unwrap()
                        });
                        dispatch(showFeedback({
                          type: removed.queued ? 'info' : 'info',
                          title: 'Removed from cart',
                          message: removed.queued ? 'Saved offline. It will sync automatically.' : item.title
                        }));
                        if (!removed.queued) {
                          void refetchCart();
                        }
                        return;
                      }
                      const updated = await executeWithOfflineQueue({
                        type: 'cart.upsert',
                          payload: {
                            productId: item.productId,
                            quantity: next,
                            selectedSize: item.size ?? undefined,
                            selectedColor: item.color ?? undefined
                          },
                          action: () => upsertCartItem({
                            productId: item.productId,
                            quantity: next,
                            selectedSize: item.size ?? undefined,
                            selectedColor: item.color ?? undefined
                          }).unwrap()
                        });
                        dispatch(showFeedback({
                          type: updated.queued ? 'info' : 'success',
                          title: 'Cart updated',
                          message: updated.queued ? 'Saved offline. It will sync automatically.' : item.title
                        }));
                        if (!updated.queued) {
                          void refetchCart();
                        }
                      };
                      void sync();
                    }}
                  />
                  <Pressable
                    onPress={() => {
                      if (item.source === 'local') {
                        dispatch(removeFromCart(item.id));
                        dispatch(showFeedback({ type: 'info', title: 'Removed locally', message: 'Sign in to sync cart changes.' }));
                        return;
                      }
                      const sync = async () => {
                        if (!token) {
                          dispatch(showFeedback({ type: 'info', title: 'Removed locally', message: 'Sign in to sync cart changes.' }));
                          return;
                        }
                        const removed = await executeWithOfflineQueue({
                          type: 'cart.remove',
                          payload: { productId: item.productId },
                          action: () => removeCartItem(item.productId).unwrap()
                        });
                        dispatch(showFeedback({
                          type: removed.queued ? 'info' : 'info',
                          title: 'Removed from cart',
                          message: removed.queued ? 'Saved offline. It will sync automatically.' : item.title
                        }));
                        if (!removed.queued) {
                          void refetchCart();
                        }
                      };
                      void sync();
                    }}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash-outline" size={16} color={AppTheme.colors.danger} />
                    <AppText variant="small" tone="soft" style={styles.removeText}>Remove</AppText>
                  </Pressable>
                </View>
              </View>
            </View>
          </SectionCard>
        )}
        ListEmptyComponent={
          <SectionCard>
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="bag-outline" size={24} color={AppTheme.colors.primary} />
              </View>
              <AppText variant="headline">Cart is empty</AppText>
              <AppText variant="body" tone="soft" style={styles.emptyText}>Add products from Home or Wishlist to continue.</AppText>
              <View style={styles.emptyBill}>
                <View style={styles.summaryRow}>
                  <AppText variant="body" tone="soft">Grand Total</AppText>
                  <AppText variant="headline" tone="primary">{formatCurrency(0)}</AppText>
                </View>
              </View>
            </View>
          </SectionCard>
        }
        ListFooterComponent={
          cartItems.length ? (
            <View style={styles.footer}>
              <SectionCard>
                <View style={styles.summaryRow}>
                  <AppText variant="body" tone="soft">Subtotal</AppText>
                  <AppText variant="title">{formatCurrency(subtotal)}</AppText>
                </View>
                <View style={styles.summaryRow}>
                  <AppText variant="body" tone="soft">Shipping</AppText>
                  <AppText variant="title" tone="primary">FREE</AppText>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <AppText variant="headline">Grand Total</AppText>
                  <AppText variant="headline" tone="primary">{formatCurrency(subtotal)}</AppText>
                </View>
              </SectionCard>

              <AppButton title="Proceed to Checkout" onPress={() => navigation.navigate(ROUTES.Checkout)} />
            </View>
          ) : null
        }
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
    gap: AppTheme.spacing.md,
    alignItems: 'flex-start'
  },
  thumb: {
    width: 90,
    height: 90,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  body: {
    flex: 1,
    gap: 4
  },
  metaRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm,
    flexWrap: 'wrap',
    marginTop: 4
  },
  metaChip: {
    paddingHorizontal: AppTheme.spacing.sm,
    paddingVertical: 6,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: AppTheme.spacing.sm,
    marginTop: AppTheme.spacing.xs
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: AppTheme.spacing.sm,
    paddingVertical: 6
  },
  removeText: {
    color: AppTheme.colors.danger
  },
  footer: {
    gap: AppTheme.spacing.md,
    marginTop: AppTheme.spacing.md
  },
  emptyState: {
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
    paddingVertical: AppTheme.spacing.xl
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
  },
  emptyText: {
    textAlign: 'center'
  },
  emptyBill: {
    width: '100%',
    marginTop: AppTheme.spacing.sm,
    paddingTop: AppTheme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppTheme.colors.borderSoft
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: AppTheme.spacing.sm
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppTheme.colors.borderSoft,
    marginVertical: AppTheme.spacing.sm
  }
});
