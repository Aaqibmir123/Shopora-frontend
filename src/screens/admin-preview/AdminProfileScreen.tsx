import React, { useEffect } from 'react';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useForm } from 'react-hook-form';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppInput } from '@/components/common/AppInput';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';
import { useMeQuery, useUpdateMeMutation } from '@/store/api/authApi';
import { pickAndUploadImage } from '@/services/imageUpload';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { useAppDispatch } from '@/store/hooks';
import { clearAuthToken, getAuthSession, setAuthSession } from '@/services/tokenStorage';
import { useAuthContext } from '@/context/AuthContext';
import { clearSession, setSession } from '@/store/slices/authSlice';
import { setCartState, setRole, setWishlist } from '@/store/slices/uiSlice';
import { baseApi } from '@/store/api/baseApi';

const quickLinks = [
  { title: 'Dashboard', subtitle: 'Overview and metrics', route: ROUTES.AdminDashboard, icon: 'grid-outline' },
  { title: 'Seller Approvals', subtitle: 'Review applications', route: ROUTES.SellerApprovals, icon: 'store-check-outline' },
  { title: 'Orders', subtitle: 'Platform order status', route: ROUTES.OrdersOverview, icon: 'receipt-outline' },
  { title: 'Support Inbox', subtitle: 'Reply to customers', route: ROUTES.AdminSupportInbox, icon: 'message-text-outline' },
  { title: 'Users', subtitle: 'Accounts and access', route: ROUTES.UserManagement, icon: 'people-outline' },
  { title: 'Revenue', subtitle: 'Analytics and trends', route: ROUTES.RevenueAnalytics, icon: 'chart-line', parentRoute: false }
] as const;

type ProfileFormValues = {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
};

export function AdminProfileScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { sessionReady } = useAuthContext();
  const tokenReady = Boolean(getAuthSession()?.token);
  const { data } = useMeQuery(undefined, {
    skip: !sessionReady || !tokenReady,
    refetchOnMountOrArgChange: true
  });
  const [updateMe, { isLoading }] = useUpdateMeMutation();
  const { control, handleSubmit, reset, setValue, watch } = useForm();

  useEffect(() => {
    const user = data?.data;
    if (!user) return;
    reset({
      name: user.name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      avatarUrl: user.avatarUrl ?? ''
    });
  }, [data?.data, reset]);

  const user = data?.data ?? {};
  const avatarUrl = watch('avatarUrl');
  const displayName = watch('name') || user.name || 'Admin account';
  const displayEmail = watch('email') || user.email || 'Email not set';
  const displayPhone = watch('phone') || user.phone || 'Phone not set';

  const navigateTo = (route: string) => {
    const parent = navigation.getParent?.();
    if (parent?.navigate) {
      parent.navigate(route as never);
      return;
    }
    navigation.navigate(route as never);
  };

  const uploadAvatar = async () => {
    try {
      const url = await pickAndUploadImage();
      if (!url) return;
      setValue('avatarUrl', url, { shouldDirty: true, shouldValidate: true });
      dispatch(showFeedback({ type: 'success', title: 'Photo uploaded', message: 'Profile picture attached.' }));
    } catch (error: any) {
      dispatch(showFeedback({ type: 'error', title: 'Upload failed', message: error?.message ?? 'Try again.' }));
    }
  };

  const onSubmit = handleSubmit(async (values: ProfileFormValues) => {
    if (!values.name?.trim() || !values.email?.trim() || !values.phone?.trim()) {
      dispatch(showFeedback({ type: 'error', title: 'Missing details', message: 'Add name, email, and phone.' }));
      return;
    }

    try {
      const response = await updateMe({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        avatarUrl: values.avatarUrl?.trim() || undefined
      }).unwrap();

      const nextUser = response?.data ?? {};
      const currentSession = getAuthSession();
      const nextSession = {
        token: currentSession?.token ?? '',
        refreshToken: currentSession?.refreshToken ?? null,
        phone: nextUser.phone ?? values.phone.trim(),
        role: currentSession?.role ?? 'shopper'
      };
      if (nextSession.token) {
        await setAuthSession(nextSession as any);
        dispatch(setSession(nextSession as any));
      }

      dispatch(showFeedback({ type: 'success', title: 'Profile saved', message: 'Admin profile updated.' }));
    } catch (error: any) {
      dispatch(showFeedback({ type: 'error', title: 'Save failed', message: error?.data?.message ?? 'Could not update profile.' }));
    }
  });

  const logout = async () => {
    await clearAuthToken();
    dispatch(clearSession());
    dispatch(setRole('shopper'));
    dispatch(setWishlist([]));
    dispatch(setCartState({}));
    dispatch(baseApi.util.resetApiState());
    navigation.reset({
      index: 0,
      routes: [{ name: ROUTES.Login as never }]
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Admin profile" subtitle="Manage your account, shortcuts, and session." />

        <SectionCard style={styles.profileHero}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Ionicons name="shield-checkmark-outline" size={52} color={AppTheme.colors.primary} />
              )}
            </View>
            <AppButton title="Upload photo" variant="secondary" onPress={() => void uploadAvatar()} />
          </View>

          <View style={styles.summary}>
            <View style={styles.rolePill}>
              <AppText variant="small" tone="white">
                ADMIN
              </AppText>
            </View>
            <AppText variant="headline" style={styles.centerText}>
              {displayName}
            </AppText>
            <AppText variant="body" tone="soft" style={styles.centerText}>
              {displayPhone}
            </AppText>
            <AppText variant="small" tone="soft" style={styles.centerText}>
              {displayEmail}
            </AppText>
          </View>
        </SectionCard>

        <SectionCard style={styles.formCard}>
          <AppText variant="title">Edit profile</AppText>
          <View style={styles.form}>
            <AppInput control={control} name="name" label="Name" placeholder="Admin name" />
            <AppInput control={control} name="email" label="Email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
            <AppInput control={control} name="phone" label="Phone" placeholder="9596523404" keyboardType="phone-pad" />
          </View>
          <AppButton title="Save profile" loading={isLoading} onPress={onSubmit} />
        </SectionCard>

        <SectionCard>
          <AppText variant="title">Quick links</AppText>
          <View style={styles.quickGrid}>
            {quickLinks.map((item) => (
              <Pressable key={item.title} onPress={() => navigateTo(item.route)} style={styles.quickCard}>
                <View style={styles.quickIcon}>
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={AppTheme.colors.primary} />
                </View>
                <AppText variant="title">{item.title}</AppText>
                <AppText variant="small" tone="soft">
                  {item.subtitle}
                </AppText>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        <SectionCard style={styles.sessionCard}>
          <View style={styles.sessionRow}>
            <View style={styles.sessionIcon}>
              <Ionicons name="log-out-outline" size={18} color={AppTheme.colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="title">Session</AppText>
              <AppText variant="small" tone="soft">
                Logout clears the current admin session from this device.
              </AppText>
            </View>
          </View>
          <AppButton title="Logout" variant="secondary" onPress={() => void logout()} />
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl + 20
  },
  profileHero: {
    gap: AppTheme.spacing.md,
    alignItems: 'center'
  },
  avatarWrap: {
    gap: AppTheme.spacing.md,
    alignItems: 'center'
  },
  avatar: {
    width: 116,
    height: 116,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  summary: {
    alignItems: 'center',
    gap: 4
  },
  centerText: {
    textAlign: 'center'
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.primary
  },
  formCard: {
    gap: AppTheme.spacing.md
  },
  form: {
    gap: AppTheme.spacing.md
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm
  },
  quickCard: {
    width: '48%',
    gap: 8,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surface
  },
  sessionCard: {
    gap: AppTheme.spacing.md
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.md
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surfaceSoft
  }
});
