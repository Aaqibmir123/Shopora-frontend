import React from 'react';
import { View, StyleSheet } from 'react-native';

import { AppButton } from '../common/AppButton';
import { AppText } from '../common/AppText';
import { AppTheme } from '@/theme';

type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function EmptyState({ title, description, actionLabel, onActionPress }: Props) {
  return (
    <View style={styles.wrap}>
      <AppText variant="title">{title}</AppText>
      <AppText variant="body" tone="soft" style={styles.description}>{description}</AppText>
      {actionLabel ? <AppButton title={actionLabel} onPress={onActionPress} style={styles.button} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: AppTheme.spacing.xl,
    gap: AppTheme.spacing.sm
  },
  description: {
    textAlign: 'center',
    maxWidth: 280
  },
  button: { marginTop: AppTheme.spacing.md, width: 180 }
});
