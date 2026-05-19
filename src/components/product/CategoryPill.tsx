import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '../common/AppText';
import { Category } from '@/types/models';
import { AppTheme } from '@/theme';

type Props = {
  category: Category;
  onPress?: () => void;
};

export function CategoryPill({ category, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: category.tint }]}>
        <Ionicons name={category.icon as never} size={22} color={AppTheme.colors.white} />
      </View>
      <AppText variant="small" tone="soft">{category.name}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8, width: 82 },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    ...AppTheme.shadow.card
  }
});
