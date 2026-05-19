import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';

const benefits = [
  { icon: 'cube-outline', title: 'Products', text: 'Add, edit, and manage your catalog.' },
  { icon: 'cash-outline', title: 'Earnings', text: 'Track orders, payouts, and revenue.' },
  { icon: 'shield-checkmark-outline', title: 'Review', text: 'Submit once and wait for approval.' }
] as const;

export function SellerApplyScreen({ navigation }: any) {
  return (
    <Screen>
      <View style={styles.content}>
        <PageHeader title="Apply for Store" subtitle="Create a seller account and submit your documents." />

        <SectionCard style={styles.hero}>
          <MaterialCommunityIcons name="storefront-outline" size={42} color={AppTheme.colors.primary} />
          <AppText variant="display">Seller onboarding</AppText>
          <View style={styles.heroStats}>
            <View style={styles.stat}>
              <AppText variant="small" tone="soft">Step 1</AppText>
              <AppText variant="title">Details</AppText>
            </View>
            <View style={styles.stat}>
              <AppText variant="small" tone="soft">Step 2</AppText>
              <AppText variant="title">Docs</AppText>
            </View>
            <View style={styles.stat}>
              <AppText variant="small" tone="soft">Step 3</AppText>
              <AppText variant="title">Submit</AppText>
            </View>
          </View>
        </SectionCard>

        <View style={styles.benefits}>
          {benefits.map((item) => (
            <SectionCard key={item.title} style={styles.benefitCard}>
              <View style={styles.benefitTop}>
                <View style={styles.iconWrap}>
                  <Ionicons name={item.icon as never} size={20} color={AppTheme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="title">{item.title}</AppText>
                  <AppText variant="small" tone="soft">{item.text}</AppText>
                </View>
              </View>
            </SectionCard>
          ))}
        </View>

        <View style={styles.actions}>
          <AppButton title="Start Registration" onPress={() => navigation.navigate(ROUTES.SellerRegistration)} />
          <AppButton title="Back to Shopping" variant="secondary" onPress={() => navigation.navigate(ROUTES.MainTabs)} />
        </View>
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
    gap: AppTheme.spacing.md,
    alignItems: 'center',
    paddingVertical: AppTheme.spacing.xl
  },
  heroStats: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm,
    width: '100%'
  },
  stat: {
    flex: 1,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  benefits: {
    gap: AppTheme.spacing.md
  },
  benefitCard: {
    gap: AppTheme.spacing.md
  },
  benefitTop: {
    flexDirection: 'row',
    gap: AppTheme.spacing.md,
    alignItems: 'center'
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
  },
  actions: {
    gap: AppTheme.spacing.md,
    marginTop: 'auto'
  }
});

