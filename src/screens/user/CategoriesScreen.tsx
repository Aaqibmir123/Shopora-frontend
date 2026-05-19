// @ts-nocheck
import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { CategoryPill } from '@/components/product/CategoryPill';
import { ProductCard } from '@/components/product/ProductCard';
import { AppTheme } from '@/theme';
import { EmptyState } from '@/components/layout/EmptyState';
import { useGetCategoriesQuery } from '@/store/api/categoryApi';
import { useGetProductsQuery } from '@/store/api/productApi';
import { mapBackendCategory, mapBackendProduct } from '@/utils/catalog';

export function CategoriesScreen() {
  const { data: categoriesData } = useGetCategoriesQuery(undefined, { refetchOnFocus: true, refetchOnReconnect: true });
  const { data: productsData } = useGetProductsQuery(undefined, { refetchOnFocus: true, refetchOnReconnect: true });
  const categories = (categoriesData?.data ?? categoriesData ?? []).map(mapBackendCategory);
  const products = (productsData?.data ?? productsData ?? []).map(mapBackendProduct);

  return (
    <Screen>
      <PageHeader title="Categories" subtitle="Browse curated storefronts and product families." />
      <View style={styles.content}>
        {categories.length ? (
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <CategoryPill category={item} />}
            contentContainerStyle={styles.categories}
            showsHorizontalScrollIndicator={false}
          />
        ) : (
          <EmptyState
            title="No categories yet"
            description="Add categories from the admin side to make browsing easier."
          />
        )}
        {products.length ? (
          <View style={styles.grid}>
            {products.map((item) => <ProductCard key={item.id} item={item} />)}
          </View>
        ) : (
          <EmptyState
            title="No listings yet"
            description="Once products are published, they will appear in this view."
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: AppTheme.spacing.md,
    gap: AppTheme.spacing.lg
  },
  categories: {
    gap: AppTheme.spacing.md
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: AppTheme.spacing.md
  }
});
