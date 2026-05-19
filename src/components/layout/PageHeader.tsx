import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { AppText } from '../common/AppText';
import { AppTheme } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
};

export function PageHeader({ title, subtitle, onBack, rightLabel, onRightPress }: Props) {
  const navigation = useNavigation();
  const canGoBack = Boolean(onBack) || Boolean(navigation?.canGoBack?.());

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {canGoBack ? (
          <Pressable onPress={onBack ?? (() => navigation?.goBack?.())} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={20} color={AppTheme.colors.primary} />
          </Pressable>
        ) : <View style={styles.iconButton} />}
        <View style={{ flex: 1 }}>
          <AppText variant="headline">{title}</AppText>
          {subtitle ? <AppText variant="small" tone="soft" style={{ marginTop: 2 }}>{subtitle}</AppText> : null}
        </View>
        {rightLabel ? (
          <Pressable onPress={onRightPress} style={styles.rightButton}>
            <AppText variant="label" tone="primary">{rightLabel}</AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: AppTheme.spacing.md,
    paddingTop: AppTheme.spacing.sm,
    paddingBottom: AppTheme.spacing.md
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rightButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surfaceSoft
  }
});
