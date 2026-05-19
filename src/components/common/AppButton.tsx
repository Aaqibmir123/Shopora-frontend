import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from './AppText';
import { AppTheme } from '@/theme';

type Props = {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: ViewStyle;
};

export function AppButton({ title, onPress, loading, disabled, variant = 'primary', style }: Props) {
  if (variant === 'primary') {
    return (
      <Pressable disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [style, styles.primaryWrap, (pressed || disabled) && styles.pressed]}>
        <LinearGradient colors={['#FF6B00', '#FF8533']} style={styles.primary}>
          {loading ? <ActivityIndicator color="#FFF" /> : <AppText variant="label" tone="white" style={styles.primaryText}>{title}</AppText>}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [style, styles.secondary, variant === 'ghost' && styles.ghost, (pressed || disabled) && styles.pressed]}>
      {loading ? <ActivityIndicator color={AppTheme.colors.primaryStrong} /> : <AppText variant="label" tone={variant === 'ghost' ? 'soft' : 'primary'}>{title}</AppText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryWrap: {
    borderRadius: AppTheme.radius.md,
    overflow: 'hidden'
  },
  primary: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: AppTheme.radius.md,
    paddingHorizontal: AppTheme.spacing.lg
  },
  primaryText: {
    fontWeight: '800'
  },
  secondary: {
    minHeight: 52,
    borderRadius: AppTheme.radius.md,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surface
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent'
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }]
  }
});
