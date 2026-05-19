import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { useGetUsersOverviewQuery } from '@/store/api/adminApi';

export function UserManagementPreviewScreen() {
  const { data, isLoading, isFetching, refetch } = useGetUsersOverviewQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  const users = data?.data ?? data ?? [];

  return (
    <Screen>
      <FlatList
        data={users}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.content}
        refreshing={isLoading || isFetching}
        onRefresh={refetch}
        ListHeaderComponent={<PageHeader title="User Management" subtitle="Preview users, roles, and store access in one place." />}
        ListEmptyComponent={
          <SectionCard style={styles.emptyCard}>
            <Ionicons name="people-outline" size={30} color={AppTheme.colors.primary} />
            <AppText variant="headline" style={{ marginTop: 12 }}>No users found</AppText>
          </SectionCard>
        }
        renderItem={({ item }: any) => (
          <SectionCard style={styles.card}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <AppText variant="label" tone="white">{(item.name ?? item.phone ?? 'U').slice(0, 1).toUpperCase()}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.metaRow}>
                  <AppText variant="title">{item.name ?? 'Unknown user'}</AppText>
                  <View style={styles.rolePill}>
                    <AppText variant="small" tone="white">{item.role}</AppText>
                  </View>
                </View>
                <AppText variant="body" tone="soft">{item.phone ?? 'No phone'}</AppText>
                <AppText variant="small" tone="soft">{item.email ?? 'No email'} | Active: {String(item.isActive ?? true)}</AppText>
              </View>
            </View>
          </SectionCard>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: AppTheme.spacing.xl
  },
  card: {
    gap: AppTheme.spacing.md
  },
  row: {
    flexDirection: 'row',
    gap: AppTheme.spacing.md,
    alignItems: 'center'
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primary
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: AppTheme.spacing.sm
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.primary
  }
});
