import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppButton } from '@/components/common/AppButton';
import { AppText } from '@/components/common/AppText';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppTheme } from '@/theme';
import { formatCurrency } from '@/utils/format';
import { ROUTES } from '@/constants/navigation';

type Props = any;

export function OrderSuccessScreen({ navigation, route }: Props) {
  const params = route?.params ?? {};
  const amount = Number(params.total ?? 0);
  const items = Array.isArray(params.items) ? params.items : [];
  const amountLabel = params.paymentMethod === 'COD' ? 'Amount due' : 'Amount paid';

  const addressLines = useMemo(() => {
    const address = params.address;
    if (!address) return [];
    return [
      `${address.label ?? 'Address'} - ${address.name ?? ''}`.trim(),
      [address.line1, address.line2, address.city, address.state, address.postalCode].filter(Boolean).join(', ')
    ].filter(Boolean);
  }, [params.address]);

  return (
    <Screen>
      <PageHeader title="Order Success" subtitle="Your order is confirmed." onBack={() => navigation.navigate(ROUTES.MainTabs)} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.checkWrap}>
            <Ionicons name="checkmark" size={26} color={AppTheme.colors.white} />
          </View>
          <AppText variant="headline">Order confirmed</AppText>
          <AppText variant="body" tone="soft" style={styles.centerText}>
            {params.queued
              ? 'Your order is queued offline and will sync as soon as the network returns.'
              : params.paymentMethod === 'COD'
                ? 'Your order has been placed and is moving to fulfillment.'
                : 'Your payment has been confirmed and your order is moving to fulfillment.'}
          </AppText>
          <View style={styles.orderBadge}>
            <AppText variant="small" tone="white">Order #{params.orderNumber ?? 'SHP-000000'}</AppText>
          </View>
        </View>

        <SectionCard>
          <View style={styles.summaryRow}>
            <AppText variant="body" tone="soft">{amountLabel}</AppText>
            <AppText variant="headline" tone="primary">{formatCurrency(amount)}</AppText>
          </View>
          <View style={styles.summaryRow}>
            <AppText variant="body" tone="soft">Payment method</AppText>
            <AppText variant="title">{params.paymentMethod ?? 'UPI'}</AppText>
          </View>
          <View style={styles.summaryRow}>
            <AppText variant="body" tone="soft">Coupon</AppText>
            <AppText variant="title">{params.couponCode ?? 'None'}</AppText>
          </View>
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={18} color={AppTheme.colors.primary} />
            <AppText variant="title">Delivery Address</AppText>
          </View>
          {addressLines.length ? (
            addressLines.map((line) => (
              <AppText key={line} variant="body" tone="soft">
                {line}
              </AppText>
            ))
          ) : (
            <AppText variant="body" tone="soft">Address details were not provided.</AppText>
          )}
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={18} color={AppTheme.colors.primary} />
            <AppText variant="title">Receipt Breakdown</AppText>
          </View>
          <View style={styles.summaryRow}><AppText variant="body" tone="soft">Subtotal</AppText><AppText variant="title">{formatCurrency(Number(params.subtotal ?? 0))}</AppText></View>
          <View style={styles.summaryRow}><AppText variant="body" tone="soft">Discount</AppText><AppText variant="title" tone="primary">- {formatCurrency(Number(params.discountAmount ?? 0))}</AppText></View>
          <View style={styles.summaryRow}><AppText variant="body" tone="soft">Shipping</AppText><AppText variant="title" tone="primary">{Number(params.shippingFee ?? 0) ? formatCurrency(Number(params.shippingFee)) : 'FREE'}</AppText></View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}><AppText variant="headline">Grand Total</AppText><AppText variant="headline" tone="primary">{formatCurrency(amount)}</AppText></View>
        </SectionCard>

        {items.length ? (
          <SectionCard>
            <View style={styles.sectionHeader}>
              <Ionicons name="bag-outline" size={18} color={AppTheme.colors.primary} />
              <AppText variant="title">Items in Order</AppText>
            </View>
            <View style={styles.itemList}>
              {items.map((item: any) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="label" numberOfLines={1}>{item.title}</AppText>
                    <AppText variant="small" tone="soft" numberOfLines={1}>
                      {item.category}
                      {item.size ? ` | Size ${item.size}` : ''}
                      {item.color ? ` | ${item.color}` : ''}
                    </AppText>
                  </View>
                  <AppText variant="label" tone="soft">{item.quantity} x {formatCurrency(item.price)}</AppText>
                </View>
              ))}
            </View>
          </SectionCard>
        ) : null}

        <View style={styles.actionRow}>
          <AppButton
            title="Track Order"
            style={styles.flex}
            onPress={() => navigation.navigate(params.orderId ? ROUTES.OrderTracking : ROUTES.MyOrders, params.orderId ? { orderId: params.orderId } : undefined)}
          />
          <AppButton title="My Orders" variant="secondary" style={styles.flex} onPress={() => navigation.navigate(ROUTES.MyOrders)} />
        </View>
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
  hero: {
    gap: AppTheme.spacing.md,
    alignItems: 'center',
    padding: AppTheme.spacing.lg,
    borderRadius: AppTheme.radius.lg,
    backgroundColor: AppTheme.colors.surface,
    ...AppTheme.shadow.card
  },
  checkWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.success
  },
  centerText: {
    textAlign: 'center'
  },
  orderBadge: {
    paddingHorizontal: AppTheme.spacing.md,
    paddingVertical: 6,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.primary
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: AppTheme.spacing.sm
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
    marginBottom: AppTheme.spacing.sm
  },
  divider: {
    height: 1,
    backgroundColor: AppTheme.colors.borderSoft,
    marginVertical: AppTheme.spacing.sm
  },
  itemList: {
    gap: AppTheme.spacing.sm
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm
  },
  actionRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm
  },
  flex: {
    flex: 1
  }
});
