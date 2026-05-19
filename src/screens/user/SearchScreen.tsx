import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { ProductCard } from '@/components/product/ProductCard';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { EmptyState } from '@/components/layout/EmptyState';
import { useGetProductsQuery } from '@/store/api/productApi';
import { ROUTES } from '@/constants/navigation';
import { mapBackendProduct } from '@/utils/catalog';

export function SearchScreen({ navigation, route }: any) {
  const initialQuery = typeof route?.params?.query === 'string' ? route.params.query : '';
  const [query, setQuery] = useState(initialQuery);
  const category = route?.params?.category;
  const categoryName = route?.params?.categoryName;
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);
  const { data } = useGetProductsQuery(query || category ? { search: query || undefined, category: category || undefined } : undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true
  });
  const filtered = useMemo(() => (data?.data ?? data ?? []).map(mapBackendProduct), [data]);

  return (
    <Screen>
      {categoryName ? (
        <View style={styles.categoryChip}>
          <Ionicons name="grid-outline" size={16} color={AppTheme.colors.primary} />
          <AppText variant="small" tone="primary">{categoryName}</AppText>
        </View>
      ) : null}
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={AppTheme.colors.textSoft} />
        <TextInput value={query} onChangeText={setQuery} placeholder={categoryName ? `Search ${categoryName.toLowerCase()}...` : 'Search products...'} style={styles.input} placeholderTextColor={AppTheme.colors.textSoft + '88'} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <ProductCard
              item={item}
              compact
              onPress={() => navigation.navigate(ROUTES.ProductDetails, { productSlug: item.slug, productId: item.id })}
            />
          </View>
        )}
        ListEmptyComponent={(
          <EmptyState
            title={query ? 'No matches found' : 'No products yet'}
            description={query ? 'Try a different keyword.' : 'Search becomes active once products are published by sellers.'}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
    margin: AppTheme.spacing.md,
    paddingHorizontal: AppTheme.spacing.md,
    height: 52,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.surface
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: AppTheme.spacing.md,
    marginTop: AppTheme.spacing.md,
    paddingHorizontal: AppTheme.spacing.md,
    paddingVertical: 8,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.primaryContainer
  },
  input: {
    flex: 1,
    color: AppTheme.colors.text
  },
  list: {
    paddingHorizontal: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl,
    gap: AppTheme.spacing.md
  },
  item: {
    width: '100%'
  }
});
