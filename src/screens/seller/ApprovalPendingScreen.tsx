import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';

const checklist = [
  'Business details verified',
  'Product catalog ready',
  'Inventory sync prepared',
  'Payout account connected'
];

export function ApprovalPendingScreen({ navigation }: any) {
  return (
    <Screen>
      <View style={styles.content}>
        <PageHeader title="Approval Pending" subtitle="Your seller application is under marketplace review." />

        <SectionCard style={styles.hero}>
          <View style={styles.badge}>
            <Ionicons name="time-outline" size={24} color={AppTheme.colors.primary} />
          </View>
          <AppText variant="headline" style={styles.centerText}>We are checking your seller profile</AppText>
          <AppText variant="body" tone="soft" style={styles.centerText}>
            Once approved, you can open the seller workspace, publish listings, and start fulfilling orders.
          </AppText>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </SectionCard>

        <SectionCard>
          <AppText variant="title">What happens next</AppText>
          <View style={styles.list}>
            {checklist.map((item) => (
              <View key={item} style={styles.listRow}>
                <View style={styles.dot} />
                <AppText variant="body" tone="soft">{item}</AppText>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard>
          <AppText variant="title">Seller workspace preview</AppText>
          <AppText variant="body" tone="soft" style={{ marginTop: 4 }}>
            Dashboard, products, inventory, orders, earnings, and store profile tabs will open automatically after approval.
          </AppText>
        </SectionCard>

        <View style={styles.actions}>
          <AppButton title="Check Status" onPress={() => navigation.navigate(ROUTES.SellerGate)} />
          <AppButton title="Back to Store" variant="secondary" onPress={() => navigation.navigate(ROUTES.MainTabs)} />
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
  badge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
  },
  centerText: {
    textAlign: 'center'
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.surfaceSoft,
    overflow: 'hidden'
  },
  progressFill: {
    width: '62%',
    height: '100%',
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.primaryStrong
  },
  list: {
    gap: AppTheme.spacing.sm,
    marginTop: AppTheme.spacing.sm
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppTheme.colors.primary
  },
  actions: {
    gap: AppTheme.spacing.md,
    marginTop: 'auto'
  }
});
