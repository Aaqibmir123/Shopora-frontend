import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';

type Props = any;

const sections = [
  {
    title: 'Information we collect',
    items: [
      'Phone number and profile details you add.',
      'Order, address, and support conversation data.',
      'App usage signals to keep Shopora working smoothly.'
    ]
  },
  {
    title: 'How we use it',
    items: [
      'Log you in securely with OTP.',
      'Show orders, carts, wishlists, and support chats.',
      'Improve performance, security, and product quality.'
    ]
  },
  {
    title: 'Sharing',
    items: [
      'We do not sell your personal data.',
      'Data is shared only with services needed to run the app.',
      'Support and order data may be visible to authorized staff.'
    ]
  },
  {
    title: 'Your choices',
    items: [
      'Update your profile and address from the app.',
      'Request account help through support.',
      'You can contact us to review or delete certain data.'
    ]
  }
];

export function PrivacyPolicyScreen({ navigation }: Props) {
  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark" size={22} color={AppTheme.colors.primaryStrong} />
          </View>
          <View style={styles.topText}>
            <AppText variant="display" style={styles.title}>Privacy Policy</AppText>
            <AppText variant="body" tone="soft" style={styles.subtitle}>
              Clear, simple rules for how Shopora handles your data.
            </AppText>
          </View>
        </View>

        <View style={styles.heroCard}>
          <AppText variant="headline" style={styles.heroTitle}>Your privacy matters</AppText>
          <AppText variant="body" tone="soft" style={styles.heroText}>
            We keep the experience focused on shopping, account safety, and support. We only use the data needed
            to operate the app and improve your experience.
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
          <AppText variant="title" style={styles.sectionTitle}>Contact</AppText>
          <AppText variant="body" tone="soft" style={styles.footerText}>
            For privacy questions, reach us through the Help & Support screen inside the app.
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
