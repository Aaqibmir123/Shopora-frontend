import React, { memo } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Product } from '@/types/models';
import { AppText } from '../common/AppText';
import { AppTheme } from '@/theme';
import { formatCurrency } from '@/utils/format';

type Props = {
  item: Product;
  onPress?: () => void;
  onToggleFavorite?: () => void;
  onAddToCart?: () => void;
  isWishlisted?: boolean;
  isInCart?: boolean;
  compact?: boolean;
};

function ProductCardBase({ item, onPress, onToggleFavorite, onAddToCart, isWishlisted, isInCart, compact }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, compact && styles.compact, pressed && styles.pressed]}>
      <View style={[styles.imageWrap, compact && styles.imageWrapCompact]}>
        <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" transition={180} />
        {item.discount ? <View style={styles.discount}><AppText variant="small" tone="white">{item.discount}</AppText></View> : null}
        {onToggleFavorite ? (
          <Pressable onPress={onToggleFavorite} style={({ pressed }) => [styles.heartButton, pressed && styles.pressed]}>
            <Ionicons name={isWishlisted ? 'heart' : 'heart-outline'} size={16} color={AppTheme.colors.primary} />
          </Pressable>
        ) : null}
        {onAddToCart ? (
          <Pressable onPress={onAddToCart} style={({ pressed }) => [styles.fab, isInCart && styles.fabActive, pressed && styles.pressed]}>
            <Ionicons name={isInCart ? 'checkmark' : 'add'} size={18} color={AppTheme.colors.white} />
          </Pressable>
        ) : null}
      </View>
      <View style={[styles.body, compact && styles.bodyCompact]}>
        <AppText variant="small" tone="soft">{item.category}</AppText>
        <AppText variant="title" numberOfLines={2}>{item.title}</AppText>
        {item.subtitle ? <AppText variant="small" tone="soft" numberOfLines={1}>{item.subtitle}</AppText> : null}
        <View style={styles.priceRow}>
          <AppText variant="title" tone="primary">{formatCurrency(item.price)}</AppText>
          {item.mrp ? <AppText variant="small" tone="soft" style={styles.mrp}>{formatCurrency(item.mrp)}</AppText> : null}
        </View>
      </View>
    </Pressable>
  );
}

export const ProductCard = memo(ProductCardBase);

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: AppTheme.radius.lg,
    backgroundColor: AppTheme.colors.surface,
    overflow: 'hidden',
    ...AppTheme.shadow.card
  },
  compact: {
    width: '100%'
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95
  },
  imageWrap: {
    position: 'relative',
    height: 170
  },
  imageWrapCompact: {
    height: 132
  },
  image: {
    width: '100%',
    height: '100%'
  },
  discount: {
    position: 'absolute',
    top: AppTheme.spacing.sm,
    left: AppTheme.spacing.sm,
    backgroundColor: '#B23A21',
    paddingHorizontal: AppTheme.spacing.sm,
    paddingVertical: 3,
    borderRadius: AppTheme.radius.pill
  },
  heartButton: {
    position: 'absolute',
    top: AppTheme.spacing.sm,
    right: AppTheme.spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fab: {
    position: 'absolute',
    right: AppTheme.spacing.sm,
    bottom: AppTheme.spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppTheme.colors.primaryStrong,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fabActive: {
    backgroundColor: AppTheme.colors.success
  },
  body: {
    padding: AppTheme.spacing.md,
    gap: 4
  },
  bodyCompact: {
    padding: 10,
    gap: 3
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: AppTheme.spacing.sm
  },
  mrp: {
    textDecorationLine: 'line-through'
  }
});
