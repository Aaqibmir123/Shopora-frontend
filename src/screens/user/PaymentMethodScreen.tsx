import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppButton } from '@/components/common/AppButton';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';

type Props = any;

export function PaymentMethodScreen({ navigation }: Props) {
  return (
    <Screen>
      <PageHeader title="Payment Method" subtitle="Choose how you want to pay at checkout." />
      <View style={styles.content}>
        <SectionCard style={styles.hero}>
          <View style={styles.badge}>
            <Ionicons name="card-outline" size={24} color={AppTheme.colors.white} />
          </View>
          <AppText variant="headline">Secure payment flow</AppText>
          <AppText variant="body" tone="soft" style={styles.center}>
            UPI, cards, and cash on delivery are ready in the checkout screen while the payment gateway layer can be connected later.
          </AppText>
        </SectionCard>

        <SectionCard style={styles.optionCard}>
          <AppText variant="title">UPI / QR</AppText>
          <AppText variant="body" tone="soft">Pay quickly using GPay, PhonePe, or BHIM.</AppText>
        </SectionCard>
        <SectionCard style={styles.optionCard}>
          <AppText variant="title">Credit / Debit Card</AppText>
          <AppText variant="body" tone="soft">Visa, Mastercard, and Amex can be plugged in later.</AppText>
        </SectionCard>
        <SectionCard style={styles.optionCard}>
          <AppText variant="title">Cash on Delivery</AppText>
          <AppText variant="body" tone="soft">Hand over cash when the order reaches you.</AppText>
        </SectionCard>

        <AppButton title="Go to Checkout" onPress={() => navigation.navigate(ROUTES.Checkout)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md
  },
  hero: {
    alignItems: 'center',
    gap: AppTheme.spacing.sm
  },
  badge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primary
  },
  center: {
    textAlign: 'center'
  },
  optionCard: {
    gap: 4
  }
});
