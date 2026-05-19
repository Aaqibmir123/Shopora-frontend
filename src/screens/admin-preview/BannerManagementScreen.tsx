// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useForm } from 'react-hook-form';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { AppTheme } from '@/theme';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { useAppDispatch } from '@/store/hooks';
import { pickAndUploadImage } from '@/services/imageUpload';
import { useCreateBannerMutation, useDeleteBannerMutation, useGetAdminBannersQuery, useUpdateBannerMutation } from '@/store/api/bannerApi';
import { Banner } from '@/types/models';
import { mapBackendBanner } from '@/utils/banner';

type FormValues = {
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  ctaLabel: string;
  targetType: Banner['targetType'];
  targetValue: string;
  accentColor: string;
  sortOrder: string;
  isActive: boolean;
};

const TARGET_OPTIONS: Array<{ value: Banner['targetType']; label: string; placeholder: string }> = [
  { value: 'NONE', label: 'None', placeholder: 'Optional link value' },
  { value: 'SEARCH', label: 'Search', placeholder: 'Search keyword, e.g. summer sale' },
  { value: 'CATEGORY', label: 'Category', placeholder: 'Category slug, e.g. women' },
  { value: 'PRODUCT', label: 'Product', placeholder: 'Product slug, e.g. farak' }
];

const emptyForm = (): FormValues => ({
  title: '',
  subtitle: '',
  badge: '',
  imageUrl: '',
  ctaLabel: 'Shop now',
  targetType: 'NONE',
  targetValue: '',
  accentColor: '#FF6B00',
  sortOrder: '0',
  isActive: true
});

export function BannerManagementScreen() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isFetching, refetch } = useGetAdminBannersQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true
  });
  const [createBanner, { isLoading: creating }] = useCreateBannerMutation();
  const [updateBanner, { isLoading: updating }] = useUpdateBannerMutation();
  const [deleteBanner] = useDeleteBannerMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const banners = useMemo(() => (data?.data ?? data ?? []).map(mapBackendBanner), [data]);

  const { control, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: emptyForm()
  });

  const targetType = watch('targetType');
  const imageUrl = watch('imageUrl');
  const isActive = watch('isActive');

  const startEdit = (banner: Banner) => {
    setEditingId(banner.id);
    reset({
      title: banner.title ?? '',
      subtitle: banner.subtitle ?? '',
      badge: banner.badge ?? '',
      imageUrl: banner.imageUrl ?? '',
      ctaLabel: banner.ctaLabel ?? 'Shop now',
      targetType: banner.targetType ?? 'NONE',
      targetValue: banner.targetValue ?? '',
      accentColor: banner.accentColor ?? '#FF6B00',
      sortOrder: String(banner.sortOrder ?? 0),
      isActive: banner.isActive
    });
    setIsFormOpen(true);
  };

  const clearForm = () => {
    setEditingId(null);
    reset(emptyForm());
  };

  const openCreateForm = () => {
    clearForm();
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    clearForm();
  };

  const uploadImage = async () => {
    try {
      const url = await pickAndUploadImage();
      if (!url) return;
      setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true });
      dispatch(showFeedback({ type: 'success', title: 'Image uploaded', message: 'Banner image attached.' }));
    } catch (error: any) {
      dispatch(showFeedback({
        type: 'error',
        title: 'Upload failed',
        message: error?.message?.includes('Cloudinary')
          ? 'Banner image upload is not configured yet. Try again later.'
          : error?.message ?? 'Could not upload banner image.'
      }));
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      title: values.title.trim(),
      subtitle: values.subtitle.trim() || undefined,
      badge: values.badge.trim() || undefined,
      imageUrl: values.imageUrl.trim() || undefined,
      ctaLabel: values.ctaLabel.trim() || undefined,
      targetType: values.targetType,
      targetValue: values.targetValue.trim() || undefined,
      accentColor: values.accentColor.trim() || undefined,
      isActive: values.isActive,
      sortOrder: Number(values.sortOrder) || 0
    };

    try {
      if (editingId) {
        await updateBanner({ id: editingId, ...payload }).unwrap();
        dispatch(showFeedback({ type: 'success', title: 'Banner updated', message: 'Your banner changes were saved.' }));
      } else {
        await createBanner(payload).unwrap();
        dispatch(showFeedback({ type: 'success', title: 'Banner created', message: 'New home banner is ready.' }));
      }
      closeForm();
      refetch();
    } catch (error: any) {
      dispatch(showFeedback({
        type: 'error',
        title: 'Save failed',
        message: error?.data?.message ?? 'Could not save banner.'
      }));
    }
  });

  const removeBanner = async (id: string) => {
    try {
      await deleteBanner(id).unwrap();
      if (editingId === id) closeForm();
      dispatch(showFeedback({ type: 'success', title: 'Banner deleted', message: 'Banner removed from home.' }));
    } catch (error: any) {
      dispatch(showFeedback({
        type: 'error',
        title: 'Delete failed',
        message: error?.data?.message ?? 'Could not delete banner.'
      }));
    }
  };

  const targetPlaceholder = TARGET_OPTIONS.find((option) => option.value === targetType)?.placeholder ?? 'Optional link value';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Home Banners" subtitle="Create promos for the user home top banner." />

        <View style={styles.toolbar}>
          <View style={{ flex: 1 }}>
            <AppText variant="title">Saved banners</AppText>
            <AppText variant="small" tone="soft">{isLoading || isFetching ? 'Refreshing...' : `${banners.length} total`}</AppText>
          </View>
          <AppButton title="Create Banner" onPress={openCreateForm} style={styles.createButton} />
        </View>

        <SectionCard style={styles.listCard}>
          <FlatList
            data={banners}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: AppTheme.spacing.md }} />}
            ListEmptyComponent={<AppText variant="body" tone="soft">No banners yet. Create the first promo above.</AppText>}
            renderItem={({ item }) => (
              <View style={styles.bannerItem}>
                <View style={styles.bannerThumbWrap}>
                  {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.bannerThumb} contentFit="cover" /> : <Ionicons name="image-outline" size={22} color={AppTheme.colors.primary} />}
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={styles.bannerTopRow}>
                    <AppText variant="title">{item.title}</AppText>
                    <View style={[styles.statePill, { backgroundColor: item.isActive ? AppTheme.colors.success : AppTheme.colors.textSoft }]}>
                      <AppText variant="small" tone="white">{item.isActive ? 'Active' : 'Hidden'}</AppText>
                    </View>
                  </View>
                  <AppText variant="small" tone="soft">{item.subtitle ?? 'No subtitle'}</AppText>
                  <AppText variant="small" tone="soft">Badge: {item.badge ?? 'None'} | Link: {item.targetType}{item.targetValue ? ` / ${item.targetValue}` : ''}</AppText>
                  <AppText variant="small" tone="soft">CTA: {item.ctaLabel ?? 'Shop now'} | Order: {item.sortOrder}</AppText>
                  <View style={styles.itemActions}>
                    <Pressable style={styles.actionIconButton} onPress={() => startEdit(item)}>
                      <Ionicons name="pencil-outline" size={18} color={AppTheme.colors.primary} />
                    </Pressable>
                    <Pressable
                      style={styles.actionIconButton}
                      onPress={async () => {
                        try {
                          await updateBanner({ id: item.id, isActive: !item.isActive }).unwrap();
                          refetch();
                        } catch (error: any) {
                          dispatch(showFeedback({
                            type: 'error',
                            title: 'Update failed',
                            message: error?.data?.message ?? 'Could not update banner.'
                          }));
                        }
                      }}
                    >
                      <Ionicons name={item.isActive ? 'eye-off-outline' : 'eye-outline'} size={18} color={AppTheme.colors.primary} />
                    </Pressable>
                    <Pressable style={[styles.actionIconButton, styles.actionIconDanger]} onPress={() => void removeBanner(item.id)}>
                      <Ionicons name="trash-outline" size={18} color={AppTheme.colors.danger} />
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          />
        </SectionCard>

        <Modal visible={isFormOpen} transparent animationType="fade" onRequestClose={closeForm}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={closeForm} />
            <View style={styles.modalSheet}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="headline">{editingId ? 'Edit banner' : 'Create banner'}</AppText>
                    <AppText variant="small" tone="soft">Fill promo details and save it to show on the user home screen.</AppText>
                  </View>
                  <Pressable onPress={closeForm} style={styles.closeButton}>
                    <Ionicons name="close" size={20} color={AppTheme.colors.text} />
                  </Pressable>
                </View>

                <Pressable style={[styles.uploadCard, imageUrl ? styles.uploadCardImage : null]} onPress={() => void uploadImage()}>
                  {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.uploadImage} contentFit="cover" /> : <Ionicons name="image-outline" size={30} color={AppTheme.colors.primary} />}
                </Pressable>
                <AppText variant="small" tone="soft" style={{ textAlign: 'center' }}>Tap the preview to upload the banner image.</AppText>

                <AppInput control={control} name="title" label="Banner title" placeholder="Fresh drops, clean checkout" />
                <AppInput control={control} name="subtitle" label="Subtitle" placeholder="Sale, offer, or season line" />
                <AppInput control={control} name="badge" label="Badge" placeholder="Sale, New, Offer, Limited" />

                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <AppInput control={control} name="ctaLabel" label="CTA label" placeholder="Shop now" />
                  </View>
                  <View style={styles.flex1}>
                    <AppInput control={control} name="accentColor" label="Accent color" placeholder="#FF6B00" />
                  </View>
                </View>

                <AppText variant="small" tone="soft">Link type</AppText>
                <View style={styles.chips}>
                  {TARGET_OPTIONS.map((option) => {
                    const active = targetType === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        style={[styles.chip, active ? styles.chipActive : null]}
                        onPress={() => setValue('targetType', option.value, { shouldDirty: true, shouldValidate: true })}
                      >
                        <AppText variant="small" tone={active ? 'white' : 'primary'}>{option.label}</AppText>
                      </Pressable>
                    );
                  })}
                </View>

                <AppInput control={control} name="targetValue" label="Link value" placeholder={targetPlaceholder} />

                <View style={styles.row}>
                  <View style={[styles.flex1, styles.sortWrap]}>
                    <AppInput control={control} name="sortOrder" label="Sort order" placeholder="0" keyboardType="numeric" />
                  </View>
                  <View style={styles.toggleWrap}>
                    <View style={styles.toggleRow}>
                      <AppText variant="body">Active on home</AppText>
                      <Switch value={isActive} onValueChange={(value) => setValue('isActive', value, { shouldDirty: true })} />
                    </View>
                  </View>
                </View>

                <View style={styles.formActions}>
                  <AppButton title={editingId ? 'Update Banner' : 'Save Banner'} loading={creating || updating} onPress={onSubmit} />
                  <AppButton title="Cancel" variant="secondary" onPress={closeForm} />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.md
  },
  createButton: {
    minWidth: 140
  },
  uploadCard: {
    width: '100%',
    height: 180,
    borderRadius: AppTheme.radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: AppTheme.colors.border,
    backgroundColor: AppTheme.colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  uploadCardImage: {
    borderStyle: 'solid'
  },
  uploadImage: {
    width: '100%',
    height: '100%'
  },
  row: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm
  },
  flex1: {
    flex: 1
  },
  sortWrap: {
    flex: 0.4
  },
  toggleWrap: {
    flex: 0.6,
    justifyContent: 'flex-end'
  },
  toggleRow: {
    minHeight: 52,
    borderRadius: AppTheme.radius.md,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    backgroundColor: AppTheme.colors.surface,
    paddingHorizontal: AppTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm
  },
  chip: {
    paddingHorizontal: AppTheme.spacing.md,
    paddingVertical: 10,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  chipActive: {
    backgroundColor: AppTheme.colors.primary
  },
  formActions: {
    gap: AppTheme.spacing.sm
  },
  listCard: {
    gap: AppTheme.spacing.md
  },
  bannerItem: {
    flexDirection: 'row',
    gap: AppTheme.spacing.md,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.lg,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  bannerThumbWrap: {
    width: 88,
    height: 88,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  bannerThumb: {
    width: '100%',
    height: '100%'
  },
  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: AppTheme.spacing.sm
  },
  statePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AppTheme.radius.pill
  },
  itemActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm,
    marginTop: AppTheme.spacing.xs
  },
  actionIconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    backgroundColor: AppTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionIconDanger: {
    borderColor: `${AppTheme.colors.danger}33`,
    backgroundColor: `${AppTheme.colors.danger}10`
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 10, 0.42)',
    justifyContent: 'flex-end'
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modalSheet: {
    maxHeight: '92%',
    borderTopLeftRadius: AppTheme.radius.xl,
    borderTopRightRadius: AppTheme.radius.xl,
    backgroundColor: AppTheme.colors.surface,
    paddingTop: AppTheme.spacing.md
  },
  modalContent: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AppTheme.spacing.md
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surfaceSoft
  }
});
