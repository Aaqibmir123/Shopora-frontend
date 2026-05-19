import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '../common/AppText';
import { AppTheme } from '@/theme';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function QuantityStepper({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => onChange(Math.max(0, value - 1))} style={styles.button}>
        <Ionicons name="remove" size={18} color={AppTheme.colors.primary} />
      </Pressable>
      <AppText variant="label">{value}</AppText>
      <Pressable onPress={() => onChange(value + 1)} style={styles.button}>
        <Ionicons name="add" size={18} color={AppTheme.colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
    backgroundColor: AppTheme.colors.surfaceSoft,
    borderRadius: AppTheme.radius.pill,
    paddingHorizontal: AppTheme.spacing.sm,
    paddingVertical: 4
  },
  button: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
  }
});
