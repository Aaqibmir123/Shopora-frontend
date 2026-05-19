import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

import { AppTheme } from '@/theme';

export function GlassCard({ style, children, ...props }: ViewProps) {
  return (
    <BlurView intensity={18} tint="light" style={[styles.card, style]} {...props}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: AppTheme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    overflow: 'hidden'
  }
});
