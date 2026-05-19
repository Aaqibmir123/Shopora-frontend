import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';

type Props = any;

const sections = [
  {
    title: 'Using the app',
    items: [
      'Use your own phone number and keep your OTP private.',
      'Do not misuse products, coupons, support, or account access.',
      'You are responsible for the accuracy of information you add.'
    ]
  },
  {
    title: 'Orders and payments',
    items: [
      'COD and other available payment methods must be used honestly.',
      'Refunds, returns, and replacements follow the app policy shown in the order flow.',
      'We may cancel suspicious or fraudulent activity.'
    ]
  },
  {
    title: 'Seller and admin use',
    items: [
      'Sellers must list products truthfully and keep stock updated.',
      'Admins may review content, orders, returns, and support conversations.',
      'We may suspend accounts that violate these terms.'
    ]
  },
  {
    title: 'Account and liability',
    items: [
      'Keep your login details safe and log out from shared devices.',
      'NovaMart is not liable for misuse caused by sharing your account.',
      'We can update these terms when needed to keep the platform secure.'
    ]
  }
];

export function TermsConditionsScreen() {
  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="document-text" size={22} color={AppTheme.colors.primaryStrong} />
          </View>
          <View style={styles.topText}>
            <AppText variant="display" style={styles.title}>Terms & Conditions</AppText>
            <AppText variant="body" tone="soft" style={styles.subtitle}>
              Simple rules for using NovaMart safely and fairly.
            </AppText>
          </View>
        </View>

        <View style={styles.heroCard}>
          <AppText variant="headline" style={styles.heroTitle}>Please read before using NovaMart</AppText>
          <AppText variant="body" tone="soft" style={styles.heroText}>
            These terms explain how you can use the app, place orders, and interact with sellers, admin, and support.
            By continuing to use NovaMart, you agree to these rules.
          </AppText>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.sectionCard}>
            <AppText variant="title" style={styles.sectionTitle}>{section.title}</AppText>
            <View style={styles.list}>
              {section.items.map((item) => (
                <View key={item} style={styles.listRow}>
                  <View style={styles.bullet} />
                  <AppText variant="body" tone="soft" style={styles.listText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footerCard}>
          <AppText variant="title" style={styles.sectionTitle}>Need help?</AppText>
          <AppText variant="body" tone="soft" style={styles.footerText}>
            If you do not agree with any part of these terms, please stop using the app and contact support.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: AppTheme.colors.background
  },
  content: {
    padding: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl * 1.5,
    gap: AppTheme.spacing.md
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.md,
    marginBottom: AppTheme.spacing.sm
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surface,
    ...AppTheme.shadow.card
  },
  topText: {
    flex: 1,
    gap: 4
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900'
  },
  subtitle: {
    maxWidth: 320
  },
  heroCard: {
    backgroundColor: AppTheme.colors.surface,
    borderRadius: 28,
    padding: AppTheme.spacing.lg,
    gap: 10,
    ...AppTheme.shadow.card
  },
  heroTitle: {
    fontWeight: '900'
  },
  heroText: {
    lineHeight: 22
  },
  sectionCard: {
    backgroundColor: AppTheme.colors.surface,
    borderRadius: 24,
    padding: AppTheme.spacing.lg,
    gap: AppTheme.spacing.md,
    ...AppTheme.shadow.card
  },
  sectionTitle: {
    fontWeight: '900'
  },
  list: {
    gap: 10
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppTheme.colors.primaryStrong,
    marginTop: 8
  },
  listText: {
    flex: 1,
    lineHeight: 22
  },
  footerCard: {
    backgroundColor: AppTheme.colors.surface,
    borderRadius: 24,
    padding: AppTheme.spacing.lg,
    gap: 10,
    ...AppTheme.shadow.card
  },
  footerText: {
    lineHeight: 22
  }
});

