import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from './AppText';
import { AppTheme } from '@/theme';

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export function Chip({ label, active, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.active]}>
      <AppText variant="label" tone={active ? 'white' : 'default'}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: AppTheme.radius.pill,
    paddingHorizontal: AppTheme.spacing.md,
    paddingVertical: AppTheme.spacing.sm,
    backgroundColor: AppTheme.colors.surface,
    borderWidth: 1,
    borderColor: AppTheme.colors.borderSoft
  },
  active: {
    backgroundColor: AppTheme.colors.primaryStrong,
    borderColor: AppTheme.colors.primaryStrong
  }
});
