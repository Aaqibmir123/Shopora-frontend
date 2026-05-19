import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';
import { formatCurrency } from '@/utils/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAuthToken } from '@/store/slices/authSlice';
import { useGetAddressesQuery } from '@/store/api/addressApi';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { clearCart, selectCartProducts } from '@/store/slices/uiSlice';
import { useCheckoutMutation, useGetOrdersQuery } from '@/store/api/orderApi';
import { executeWithOfflineQueue } from '@/services/offlineQueue';
import { useGetCartQuery } from '@/store/api/cartApi';

type Props = any;

type CheckoutLine = {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  price: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
  image: string;
};

type CouponRule = {
  code: string;
  title: string;
  description: string;
  kind: 'percent';
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
};

const COUPONS: CouponRule[] = [
  {
    code: 'WELCOME10',
    title: 'WELCOME10',
    description: '10% off up to Rs 150 on your first order above Rs 999',
    kind: 'percent',
    value: 10,
    minSubtotal: 999,
    maxDiscount: 150
  }
];

export function CheckoutScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);
  const localCartItems = useAppSelector(selectCartProducts);
  const { data: addressData } = useGetAddressesQuery(undefined, { skip: !token });
  const { data: remoteCartData } = useGetCartQuery(undefined, { skip: !token });
  const { data: ordersData } = useGetOrdersQuery(undefined, { skip: !token });
  const [checkout] = useCheckoutMutation();
  const { width } = useWindowDimensions();
  const initialCoupon = String(route?.params?.couponCode ?? '').trim().toUpperCase();
  const [couponInput, setCouponInput] = useState(initialCoupon);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(initialCoupon || null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'COD'>('UPI');

  const addresses = useMemo(() => addressData?.data ?? [], [addressData]);
  const selectedAddress = addresses.find((item: any) => item.isDefault) ?? addresses[0] ?? null;
  const hasOrders = (ordersData ?? []).length > 0;

  const cartItems = useMemo<CheckoutLine[]>(() => {
    if (token) {
      return (remoteCartData?.data ?? []).map((item: any) => ({
        id: item.id,
        title: item.product?.title ?? item.product?.brand ?? item.product?.slug ?? 'Cart item',
        subtitle: item.product?.subtitle ?? item.product?.brand ?? item.product?.category?.name ?? item.product?.category?.slug,
        category: item.product?.category?.name ?? item.product?.category?.slug ?? 'Product',
        price: item.product?.price ?? item.priceSnapshot ?? 0,
        quantity: item.quantity,
        size: item.selectedSize ?? null,
        color: item.selectedColor ?? null,
        image: item.product?.imageUrl ?? item.imageSnapshot ?? item.product?.image ?? ''
      }));
    }

    return localCartItems.map((item: any) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle ?? item.category,
      category: item.category,
      price: item.price,
      quantity: item.quantity,
      size: item.size ?? null,
      color: item.color ?? null,
      image: item.image
    }));
  }, [localCartItems, remoteCartData, token]);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);

  const appliedCoupon = useMemo(
    () => COUPONS.find((coupon) => coupon.code === appliedCouponCode) ?? null,
    [appliedCouponCode]
  );

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || hasOrders) return 0;
    const meetsMinimum = subtotal >= (appliedCoupon.minSubtotal ?? 0);
    if (!meetsMinimum) return 0;
    return Math.min(
      Math.round((subtotal * appliedCoupon.value) / 100),
      appliedCoupon.maxDiscount ?? subtotal,
      subtotal
    );
  }, [appliedCoupon, hasOrders, subtotal]);

  const shippingFee = 0;
  const total = Math.max(0, subtotal - couponDiscount + shippingFee);
  const hasItems = cartItems.length > 0;
  const isTablet = width >= 900;

  const applyCoupon = () => {
    if (hasOrders) {
      setCouponInput('');
      setAppliedCouponCode(null);
      dispatch(showFeedback({ type: 'info', title: 'First order only', message: 'WELCOME10 is available only on your first order.' }));
      return;
    }

    const normalized = couponInput.trim().toUpperCase();
    if (!normalized) {
      setAppliedCouponCode(null);
      dispatch(showFeedback({ type: 'info', title: 'Coupon cleared', message: 'You can apply a promo code anytime.' }));
      return;
    }

    const coupon = COUPONS.find((item) => item.code === normalized);
    if (!coupon) {
      dispatch(showFeedback({ type: 'error', title: 'Invalid coupon', message: 'Please check the code and try again.' }));
      return;
    }

    setAppliedCouponCode(coupon.code);
    dispatch(showFeedback({ type: 'success', title: 'Coupon applied', message: coupon.description }));
  };

  return (
    <Screen>
      <PageHeader title="Checkout" subtitle="Shipping, coupons, payment and bill summary in one place." />
      <ScrollView contentContainerStyle={[styles.content, isTablet && styles.contentWide]} showsVerticalScrollIndicator={false}>
        <SectionCard>
          <View style={styles.sectionTitle}>
            <Ionicons name="location-outline" size={18} color={AppTheme.colors.primary} />
            <AppText variant="title">Delivery Address</AppText>
          </View>
          {selectedAddress ? (
            <AppText variant="body" tone="soft">
              {selectedAddress.label} - {selectedAddress.name}, {selectedAddress.line1}
              {selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}
            </AppText>
          ) : (
            <AppText variant="body" tone="soft">No delivery address selected yet.</AppText>
          )}
          <Pressable onPress={() => navigation.navigate(ROUTES.AddressSelection)}>
            <AppText variant="label" tone="primary">Change Address</AppText>
          </Pressable>
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionTitle}>
            <Ionicons name="pricetag-outline" size={18} color={AppTheme.colors.primary} />
            <AppText variant="title">Apply Coupon</AppText>
          </View>
          {hasOrders ? (
            <AppText variant="body" tone="soft">Welcome10 is only available on your first order.</AppText>
          ) : (
            <>
              <View style={styles.couponRow}>
                <TextInput
                  value={couponInput}
                  onChangeText={setCouponInput}
                  placeholder="Enter coupon code"
                  placeholderTextColor={AppTheme.colors.textSoft + '88'}
                  autoCapitalize="characters"
                  style={styles.couponInput}
                />
                <Pressable style={styles.applyChip} onPress={applyCoupon}>
                  <AppText variant="label" tone="white">Apply</AppText>
                </Pressable>
              </View>
              <View style={styles.couponHints}>
                {COUPONS.map((coupon) => (
                  <Pressable
                    key={coupon.code}
                    onPress={() => {
                      setCouponInput(coupon.code);
                      setAppliedCouponCode(coupon.code);
                      dispatch(showFeedback({ type: 'success', title: 'Coupon selected', message: coupon.description }));
                    }}
                    style={styles.couponHintCard}
                  >
                    <AppText variant="label" tone="primary">{coupon.title}</AppText>
                    <AppText variant="small" tone="soft">{coupon.description}</AppText>
                  </Pressable>
                ))}
              </View>
            </>
          )}
          {appliedCoupon && !hasOrders ? (
            <View style={styles.appliedCoupon}>
              <Ionicons name="checkmark-circle" size={16} color={AppTheme.colors.success} />
              <AppText variant="small" tone="soft">Applied: {appliedCoupon.code}</AppText>
            </View>
          ) : null}
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionTitle}>
            <Ionicons name="card-outline" size={18} color={AppTheme.colors.primary} />
            <AppText variant="title">Payment Method</AppText>
          </View>
          <View style={styles.paymentGrid}>
            {[
              { key: 'UPI', title: 'UPI / QR', note: 'Pay with GPay, PhonePe, BHIM' },
              { key: 'CARD', title: 'Card', note: 'Visa, Mastercard, Amex' },
              { key: 'COD', title: 'Cash on Delivery', note: 'Pay after package arrives' }
            ].map((method) => {
              const active = paymentMethod === method.key;
              return (
                <Pressable
                  key={method.key}
                  onPress={() => setPaymentMethod(method.key as 'UPI' | 'CARD' | 'COD')}
                  style={[styles.paymentOption, active && styles.paymentOptionActive]}
                >
                  <AppText variant="label" tone={active ? 'white' : 'primary'}>{method.title}</AppText>
                  <AppText variant="small" tone={active ? 'white' : 'soft'}>{method.note}</AppText>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionTitle}>
            <Ionicons name="bag-outline" size={18} color={AppTheme.colors.primary} />
            <AppText variant="title">Your Bill</AppText>
          </View>

          <View style={styles.billList}>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.billRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="label" numberOfLines={1}>{item.title}</AppText>
                  <AppText variant="small" tone="soft" numberOfLines={1}>
                    {item.category}
                    {item.size ? ` • Size ${item.size}` : ''}
                    {item.color ? ` • ${item.color}` : ''}
                  </AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText variant="label" tone="soft">{item.quantity} x {formatCurrency(item.price)}</AppText>
                  <AppText variant="small" tone="primary">{formatCurrency(item.price * item.quantity)}</AppText>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}><AppText variant="body" tone="soft">Subtotal</AppText><AppText variant="title">{formatCurrency(subtotal)}</AppText></View>
          <View style={styles.summaryRow}><AppText variant="body" tone="soft">Coupon Discount</AppText><AppText variant="title" tone="primary">- {formatCurrency(couponDiscount)}</AppText></View>
          <View style={styles.summaryRow}><AppText variant="body" tone="soft">Shipping</AppText><AppText variant="title" tone="primary">FREE</AppText></View>
          <View style={styles.summaryRow}><AppText variant="body" tone="soft">Estimated Tax</AppText><AppText variant="title" tone="primary">INCLUDED</AppText></View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}><AppText variant="headline">Grand Total</AppText><AppText variant="headline" tone="primary">{formatCurrency(total)}</AppText></View>
          <View style={{ marginTop: 8 }}>
            <AppText variant="small" tone="soft">All prices include GST. Shipping is free on every order.</AppText>
          </View>
        </SectionCard>

        <AppButton
          title={hasItems ? 'Place Order' : 'Cart Empty'}
          disabled={!hasItems}
          onPress={() => {
            if (!hasItems) {
              dispatch(showFeedback({ type: 'error', title: 'Cart empty', message: 'Add products before checkout.' }));
              return;
            }

            if (!token) {
              dispatch(showFeedback({ type: 'error', title: 'Login required', message: 'Please sign in before placing an order.' }));
              navigation.navigate(ROUTES.Login);
              return;
            }

            if (!selectedAddress) {
              dispatch(showFeedback({ type: 'error', title: 'Address required', message: 'Choose a delivery address first.' }));
              navigation.navigate(ROUTES.AddressSelection);
              return;
            }

            const payload = {
              paymentMethod,
              addressId: selectedAddress.id,
              couponCode: hasOrders ? undefined : appliedCoupon?.code
            };

            void executeWithOfflineQueue({
              type: 'order.checkout',
              payload,
              action: () => checkout(payload).unwrap()
            })
              .then((result) => {
                const order = (result as any)?.result?.data ?? (result as any)?.result;
                dispatch(clearCart());
                dispatch(showFeedback({
                  type: result.queued ? 'info' : 'success',
                  title: result.queued ? 'Order queued' : 'Order placed',
                  message: result.queued ? 'It will sync automatically when the network returns.' : 'Your checkout has been submitted successfully.'
                }));
                navigation.navigate(ROUTES.OrderSuccess, {
                  queued: result.queued,
                  orderId: order?.id ?? null,
                  orderNumber: order?.number ?? `SHP-${Date.now().toString().slice(-6)}`,
                  paymentMethod,
                  subtotal,
                  shippingFee: order?.shippingFee ?? shippingFee,
                  discountAmount: order?.discountAmount ?? couponDiscount,
                  total: order?.total ?? total,
                  couponCode: order?.couponCode ?? appliedCoupon?.code ?? null,
                  address: selectedAddress,
                  items: cartItems
                });
              })
              .catch((error: any) => {
                dispatch(showFeedback({
                  type: 'error',
                  title: 'Could not place order',
                  message: error?.data?.message ?? 'Please try again.'
                }));
              });
          }}
        />
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
  contentWide: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 760
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
    marginBottom: AppTheme.spacing.sm
  },
  couponRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm,
    alignItems: 'center'
  },
  couponInput: {
    flex: 1,
    minHeight: 52,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft,
    paddingHorizontal: AppTheme.spacing.md,
    color: AppTheme.colors.text
  },
  applyChip: {
    minWidth: 88,
    minHeight: 52,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppTheme.spacing.md
  },
  couponHints: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm,
    marginTop: AppTheme.spacing.sm
  },
  couponHintCard: {
    flexBasis: '48%',
    minWidth: 140,
    padding: AppTheme.spacing.sm,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft,
    gap: 4
  },
  appliedCoupon: {
    marginTop: AppTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  paymentGrid: {
    gap: AppTheme.spacing.sm
  },
  paymentOption: {
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft,
    padding: AppTheme.spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  paymentOptionActive: {
    backgroundColor: AppTheme.colors.primary,
    borderColor: AppTheme.colors.primary
  },
  billList: {
    gap: AppTheme.spacing.sm
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm
  },
  divider: {
    height: 1,
    backgroundColor: AppTheme.colors.borderSoft,
    marginVertical: AppTheme.spacing.sm
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6
  }
});
