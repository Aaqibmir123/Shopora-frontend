// @ts-nocheck
import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { AppTheme } from '@/theme';
import { useAppDispatch } from '@/store/hooks';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { useGetSellerStoreQuery, useUpdateSellerStoreMutation } from '@/store/api/sellerApi';
import { executeWithOfflineQueue } from '@/services/offlineQueue';
import { pickAndUploadImage } from '@/services/imageUpload';
import { useAuthContext } from '@/context/AuthContext';

const schema = z.object({
  name: z.string().min(3, 'Store name is required'),
  slug: z.string().min(3, 'Store slug is required'),
  logoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  phone: z.string().min(8, 'Enter phone number'),
  email: z.string().email('Enter a valid email'),
  address: z.string().min(5, 'Enter store address')
});

type FormValues = z.infer<typeof schema>;

export function StoreDetailsScreen() {
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();
  const { sessionReady } = useAuthContext();
  const { data, isLoading, isFetching } = useGetSellerStoreQuery(undefined, { refetchOnFocus: true, refetchOnReconnect: true });
  const [updateSellerStore, { isLoading: saving }] = useUpdateSellerStoreMutation();
  const store = data?.data ?? data ?? {};
  const formDefaults = useMemo<FormValues>(() => ({
    name: store.name ?? '',
    slug: store.slug ?? '',
    logoUrl: store.logoUrl ?? '',
    coverUrl: store.coverUrl ?? '',
    phone: store.phone ?? '',
    email: store.email ?? '',
    address: store.address ?? ''
  }), [store]);
  const { control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: formDefaults
  });
  const stackFields = width < 520;

  useEffect(() => {
    reset(formDefaults);
  }, [formDefaults, reset]);

  const onSave = handleSubmit((values: FormValues) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      dispatch(showFeedback({ type: 'error', title: 'Validation failed', message: parsed.error.issues[0]?.message ?? 'Please review the form.' }));
      return;
    }

    void executeWithOfflineQueue({
      type: 'seller.updateStore',
      payload: parsed.data,
      action: () => updateSellerStore(parsed.data).unwrap()
    })
      .then((result) =>
        dispatch(showFeedback({
          type: result.queued ? 'info' : 'success',
          title: 'Store details saved',
          message: result.queued ? 'Saved offline. It will sync automatically.' : 'Your store details were updated.'
        }))
      )
      .catch((error: any) => dispatch(showFeedback({ type: 'error', title: 'Save failed', message: error?.data?.message ?? 'Please try again.' })));
  });

  const uploadLogo = async () => {
    if (!sessionReady) {
      dispatch(showFeedback({ type: 'info', title: 'Please wait', message: 'Restoring your session before uploading.' }));
      return;
    }

    try {
      const url = await pickAndUploadImage();
      if (!url) return;
      setValue('logoUrl', url, { shouldDirty: true, shouldValidate: true });
      dispatch(showFeedback({ type: 'success', title: 'Logo uploaded', message: 'Your store logo is ready.' }));
    } catch (error: any) {
      dispatch(showFeedback({ type: 'error', title: 'Upload failed', message: error?.message ?? 'Please try again.' }));
    }
  };

  const uploadCover = async () => {
    if (!sessionReady) {
      dispatch(showFeedback({ type: 'info', title: 'Please wait', message: 'Restoring your session before uploading.' }));
      return;
    }

    try {
      const url = await pickAndUploadImage();
      if (!url) return;
      setValue('coverUrl', url, { shouldDirty: true, shouldValidate: true });
      dispatch(showFeedback({ type: 'success', title: 'Cover uploaded', message: 'Your store banner is ready.' }));
    } catch (error: any) {
      dispatch(showFeedback({ type: 'error', title: 'Upload failed', message: error?.message ?? 'Please try again.' }));
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Store Details" subtitle="Name, address, branding, and upload settings." />

        <SectionCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="storefront-outline" size={20} color={AppTheme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="title">{watch('name') || store.name || 'Store name'}</AppText>
              <AppText variant="small" tone="soft">
                {isLoading || isFetching ? 'Loading store details...' : 'Keep your branding and contact data updated.'}
              </AppText>
            </View>
          </View>
          <View style={styles.summaryChips}>
            <View style={styles.summaryChip}><AppText variant="small" tone="primary">Required fields</AppText></View>
            <View style={styles.summaryChipSoft}><AppText variant="small" tone="soft">Logo + cover optional</AppText></View>
          </View>
        </SectionCard>

        <SectionCard>
          <AppText variant="title">Basic details</AppText>
          <AppText variant="small" tone="soft">Use the exact store name and contact information buyers should see.</AppText>
          <View style={styles.form}>
            <AppInput control={control} name="name" label="Store name" placeholder="Brand name" required helperText="Visible on your storefront." />
            <AppInput control={control} name="slug" label="Store slug" placeholder="brand-name" autoCapitalize="none" required helperText="Short unique name for your store URL." />
            <View style={[styles.row, stackFields && styles.rowStack]}>
              <AppInput containerStyle={styles.flexField} control={control} name="phone" label="Phone" placeholder="+91..." keyboardType="phone-pad" required helperText="Used for seller support and contact." />
              <AppInput containerStyle={styles.flexField} control={control} name="email" label="Email" placeholder="support@brand.com" keyboardType="email-address" autoCapitalize="none" required helperText="Where store notifications are sent." />
            </View>
            <AppInput control={control} name="address" label="Warehouse / business address" placeholder="Store / warehouse address" required helperText="This helps delivery and pickup flows." />
          </View>
        </SectionCard>

        <SectionCard>
          <AppText variant="title">Brand uploads</AppText>
          <AppText variant="small" tone="soft">Upload clean brand images. Leave blank if you want to add them later.</AppText>
          <View style={styles.uploadGrid}>
            <View style={styles.uploadCard}>
              <View style={styles.uploadHeader}>
                <View style={{ flex: 1 }}>
                  <AppText variant="label">Store logo</AppText>
                  <AppText variant="small" tone="soft">Square image for profile.</AppText>
                </View>
                <AppButton title="Choose" variant="secondary" onPress={uploadLogo} style={styles.uploadButton} />
              </View>
              <View style={styles.previewBox}>
                {watch('logoUrl') ? (
                  <Image source={{ uri: watch('logoUrl') }} style={styles.previewImage} contentFit="cover" />
                ) : (
                  <View style={styles.previewEmpty}>
                    <Ionicons name="image-outline" size={20} color={AppTheme.colors.textSoft} />
                    <AppText variant="small" tone="soft">Tap to add logo</AppText>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.uploadCard}>
              <View style={styles.uploadHeader}>
                <View style={{ flex: 1 }}>
                  <AppText variant="label">Store cover</AppText>
                  <AppText variant="small" tone="soft">Banner image for storefront.</AppText>
                </View>
                <AppButton title="Choose" variant="secondary" onPress={uploadCover} style={styles.uploadButton} />
              </View>
              <View style={styles.previewBox}>
                {watch('coverUrl') ? (
                  <Image source={{ uri: watch('coverUrl') }} style={styles.previewImage} contentFit="cover" />
                ) : (
                  <View style={styles.previewEmpty}>
                    <Ionicons name="images-outline" size={20} color={AppTheme.colors.textSoft} />
                    <AppText variant="small" tone="soft">Tap to add cover</AppText>
                  </View>
                )}
              </View>
            </View>
          </View>
        </SectionCard>

        <SectionCard>
          <AppText variant="title">Store metrics</AppText>
          <View style={styles.metricRow}>
            <View style={styles.metric}><AppText variant="small" tone="soft">Rating</AppText><AppText variant="headline">{Number(store.rating ?? 0).toFixed(1)}</AppText></View>
            <View style={styles.metric}><AppText variant="small" tone="soft">Products</AppText><AppText variant="headline">{store.productCount ?? 0}</AppText></View>
            <View style={styles.metric}><AppText variant="small" tone="soft">Orders</AppText><AppText variant="headline">{store.ordersCount ?? 0}</AppText></View>
          </View>
        </SectionCard>

        <View style={styles.actions}>
          <AppButton title="Save Store Details" onPress={onSave} loading={saving} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl + 96
  },
  summaryCard: {
    gap: AppTheme.spacing.sm
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.md
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
  },
  summaryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm
  },
  summaryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: '#FFF1E7'
  },
  summaryChipSoft: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  form: {
    gap: AppTheme.spacing.md,
    marginTop: AppTheme.spacing.md
  },
  row: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm
  },
  rowStack: {
    flexDirection: 'column'
  },
  flexField: {
    flex: 1
  },
  uploadGrid: {
    flexDirection: 'column',
    gap: AppTheme.spacing.md,
    marginTop: AppTheme.spacing.md
  },
  uploadCard: {
    gap: AppTheme.spacing.sm,
    padding: AppTheme.spacing.md,
    borderRadius: 18,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: AppTheme.spacing.sm
  },
  uploadButton: {
    minWidth: 86
  },
  previewBox: {
    minHeight: 84,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: AppTheme.colors.surface
  },
  previewImage: {
    width: '100%',
    height: 96,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  previewEmpty: {
    flex: 1,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    padding: AppTheme.spacing.md,
    gap: 6
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm,
    marginTop: AppTheme.spacing.md
  },
  metric: {
    flex: 1,
    minWidth: 96,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  actions: {
    gap: AppTheme.spacing.md
  }
});
