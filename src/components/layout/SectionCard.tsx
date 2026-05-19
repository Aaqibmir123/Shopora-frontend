import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

import { AppTheme } from '@/theme';

export function SectionCard({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppTheme.colors.surface,
    borderRadius: AppTheme.radius.lg,
    padding: AppTheme.spacing.md,
    ...AppTheme.shadow.card
  }
});
