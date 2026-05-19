import React from 'react';
import { View, StyleSheet } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function ScreenSection({ title, subtitle, children }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <AppText variant="title">{title}</AppText>
        {subtitle ? <AppText variant="small" tone="soft">{subtitle}</AppText> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: AppTheme.spacing.md
  },
  heading: {
    gap: 2
  }
});
