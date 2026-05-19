import React from 'react';
import { View, StyleSheet } from 'react-native';

import { AppText } from './AppText';
import { AppTheme } from '@/theme';

type Props = {
  label: string;
  value: string;
  tone?: 'primary' | 'info' | 'success' | 'danger';
};

export function StatCard({ label, value, tone = 'primary' }: Props) {
  return (
    <View style={styles.card}>
      <AppText variant="small" tone="soft" style={styles.label} numberOfLines={1}>
        {label}
      </AppText>
      <AppText
        variant="headline"
        tone={tone === 'primary' ? 'primary' : 'default'}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
      >
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 96,
    borderRadius: AppTheme.radius.lg,
    backgroundColor: AppTheme.colors.surface,
    padding: AppTheme.spacing.md,
    gap: 6,
    ...AppTheme.shadow.card
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.8
  }
});
