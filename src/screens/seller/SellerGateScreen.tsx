import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { AppButton } from '@/components/common/AppButton';
import { AppText } from '@/components/common/AppText';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { useGetSellerApplicationStatusQuery } from '@/store/api/sellerApi';

export function SellerGateScreen({ navigation }: any) {
  const { sessionReady } = useAuthContext();
  const hasRouted = React.useRef(false);
  const { data, isLoading, isFetching, refetch } = useGetSellerApplicationStatusQuery(undefined, {
    skip: !sessionReady,
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  React.useEffect(() => {
    if (hasRouted.current) return;
    const payload = data?.data ?? data ?? {};
    if (!sessionReady || isLoading || isFetching) return;

    if (payload?.hasStore) {
      hasRouted.current = true;
      navigation.reset({
        index: 0,
        routes: [{ name: ROUTES.SellerWorkspace }]
      });
      return;
    }

    const application = payload?.application;
    if (application?.status === 'PENDING') {
      hasRouted.current = true;
      navigation.reset({
        index: 0,
        routes: [{ name: ROUTES.ApprovalPending }]
      });
      return;
    }

    hasRouted.current = true;
    navigation.reset({
      index: 0,
      routes: [{ name: ROUTES.SellerRegistration }]
    });
  }, [data, isFetching, isLoading, navigation, sessionReady]);

  return (
    <Screen>
      <View style={styles.wrap}>
        <SectionCard style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="storefront-outline" size={26} color={AppTheme.colors.primary} />
          </View>
          <AppText variant="headline" style={styles.center}>Checking seller access</AppText>
          <AppText variant="body" tone="soft" style={styles.center}>
            We are verifying your seller status and opening the correct workspace.
          </AppText>
          <AppButton title="Refresh status" variant="secondary" onPress={() => void refetch()} loading={isLoading || isFetching} />
        </SectionCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: AppTheme.spacing.md
  },
  card: {
    width: '100%',
    gap: AppTheme.spacing.md,
    alignItems: 'center'
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
  },
  center: {
    textAlign: 'center'
  }
});
