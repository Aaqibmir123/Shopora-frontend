import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';

import { AppText } from './AppText';
import { AppTheme } from '@/theme';

type Props = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  subtitle?: string;
};

export function SectionHeader({ title, actionLabel, subtitle, onActionPress }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <AppText variant="title">{title}</AppText>
        {subtitle ? <AppText variant="small" tone="soft" style={{ marginTop: 2 }}>{subtitle}</AppText> : null}
      </View>
      {actionLabel ? (
        <Pressable onPress={onActionPress}>
          <AppText variant="label" tone="primary">{actionLabel}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: AppTheme.spacing.md
  }
});
