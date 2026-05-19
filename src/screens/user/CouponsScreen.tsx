import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';

const coupon = {
  code: 'WELCOME10',
  title: 'Welcome Bonus',
  description: '10% off up to Rs 150 on your first order above Rs 999.',
  tone: 'success' as const
};

type Props = any;

export function CouponsScreen({ navigation }: Props) {
  return (
    <Screen>
      <PageHeader title="Coupons" subtitle="One simple welcome offer for your first order." />
      <View style={styles.content}>
        <SectionCard style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="pricetag-outline" size={24} color={AppTheme.colors.white} />
          </View>
          <AppText variant="headline">Active offer</AppText>
          <AppText variant="body" tone="soft" style={styles.center}>
            Use the welcome code in checkout or tap the card to apply it.
          </AppText>
        </SectionCard>

        <SectionCard style={styles.couponCard}>
          <View style={styles.topRow}>
            <View style={[styles.codeBadge, coupon.tone === 'success' && styles.success]}>
              <AppText variant="label" tone="white">{coupon.code}</AppText>
            </View>
            <View style={styles.dotRow}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
          <AppText variant="title">{coupon.title}</AppText>
          <AppText variant="body" tone="soft">{coupon.description}</AppText>
          <AppButton
            title="Use in Checkout"
            variant="secondary"
            onPress={() => navigation.navigate(ROUTES.Checkout, { couponCode: coupon.code })}
          />
        </SectionCard>
      </View>
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
    alignItems: 'center',
    gap: AppTheme.spacing.sm
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primary
  },
  center: {
    textAlign: 'center'
  },
  couponCard: {
    gap: AppTheme.spacing.sm
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  codeBadge: {
    paddingHorizontal: AppTheme.spacing.sm,
    paddingVertical: 6,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.primary
  },
  success: {
    backgroundColor: AppTheme.colors.success
  },
  dotRow: {
    flexDirection: 'row',
    gap: 4
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppTheme.colors.border
  }
});
