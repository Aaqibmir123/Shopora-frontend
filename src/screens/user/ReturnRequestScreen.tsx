// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppButton } from '@/components/common/AppButton';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';
import { useGetOrderQuery } from '@/store/api/orderApi';
import { useCreateReturnRequestMutation } from '@/store/api/returnApi';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectAuthToken } from '@/store/slices/authSlice';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { formatCurrency } from '@/utils/format';
import { pickAndUploadImage } from '@/services/imageUpload';
import { executeWithOfflineQueue } from '@/services/offlineQueue';

const typeOptions = [
  { key: 'RETURN', title: 'Return', subtitle: 'Send item back and get a refund.' },
  { key: 'REPLACEMENT', title: 'Replacement', subtitle: 'Request a fresh item or correct item.' }
] as const;

const reasonsByType: Record<'RETURN' | 'REPLACEMENT', string[]> = {
  RETURN: ['Wrong size', 'Damaged item', 'Different product received', 'Not as described'],
  REPLACEMENT: ['Wrong size', 'Damaged item', 'Missing parts', 'Wrong color']
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const RETURN_WINDOW_DAYS = 2;

const resolveDeliveredAt = (order: any) => {
  if (order?.deliveredAt) {
    const deliveredAt = new Date(order.deliveredAt);
    if (!Number.isNaN(deliveredAt.getTime())) return deliveredAt;
  }
  const deliveredEvent = Array.isArray(order?.events)
    ? [...order.events].reverse().find((event: any) => String(event.status ?? '').toUpperCase() === 'DELIVERED')
    : null;
  if (deliveredEvent?.createdAt) {
    const deliveredAt = new Date(deliveredEvent.createdAt);
    if (!Number.isNaN(deliveredAt.getTime())) return deliveredAt;
  }
  return null;
};

export function ReturnRequestScreen({ navigation, route }: any) {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);
  const orderId = route?.params?.orderId;
  const initialItemId = route?.params?.orderItemId ?? null;
  const initialMode = route?.params?.mode === 'REPLACEMENT' ? 'REPLACEMENT' : 'RETURN';
  const { data, isLoading, isFetching, refetch } = useGetOrderQuery(orderId, { skip: !token || !orderId, refetchOnFocus: true, refetchOnReconnect: true });
  const [createReturnRequest, { isLoading: isSubmitting }] = useCreateReturnRequestMutation();

  const order = data ?? null;
  const [type, setType] = useState<'RETURN' | 'REPLACEMENT'>(initialMode);
  const [reason, setReason] = useState(reasonsByType[initialMode][0]);
  const [comments, setComments] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(initialItemId);
  const [attachments, setAttachments] = useState<string[]>([]);

  useEffect(() => {
    if (!order?.items?.length) return;
    setSelectedItemId((current) => current ?? initialItemId ?? order.items[0].id);
  }, [initialItemId, order?.items]);

  useEffect(() => {
    setReason(reasonsByType[type][0]);
  }, [type]);

  const selectedItem = useMemo(
    () => order?.items?.find((item: any) => item.id === selectedItemId) ?? order?.items?.[0],
    [order?.items, selectedItemId]
  );

  const deliveredAt = useMemo(() => resolveDeliveredAt(order), [order]);
  const eligible = String(order?.status ?? '').toUpperCase() === 'DELIVERED' && Boolean(deliveredAt) && Date.now() - deliveredAt.getTime() <= RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const alreadyRequested = Boolean(order?.returnRequests?.find((request: any) => String(request.orderItemId ?? '') === String(selectedItem?.id ?? '')));

  const addAttachment = async () => {
    try {
      const url = await pickAndUploadImage();
      if (!url) return;
      setAttachments((prev) => (prev.includes(url) ? prev : [...prev, url]).slice(0, 3));
    } catch (error: any) {
      dispatch(showFeedback({
        type: 'error',
        title: 'Upload failed',
        message: error?.message ?? 'Could not attach the image.'
      }));
    }
  };

  const submit = async () => {
    if (!order || !selectedItem) {
      dispatch(showFeedback({ type: 'error', title: 'Missing item', message: 'Please choose an item to return or replace.' }));
      return;
    }
    if (!eligible) {
      dispatch(showFeedback({ type: 'error', title: 'Not eligible', message: 'Returns and replacements are available within 2 days of delivery only.' }));
      return;
    }
    if (alreadyRequested) {
      dispatch(showFeedback({ type: 'error', title: 'Already requested', message: 'A request already exists for this item.' }));
      return;
    }

    const body = {
      orderId: order.id,
      orderItemId: selectedItem.id,
      type,
      reason,
      comments: comments.trim() || undefined,
      photoUrls: attachments.length ? attachments : undefined
    };

    void executeWithOfflineQueue({
      type: 'return.create',
      payload: body,
      action: () => createReturnRequest(body).unwrap()
    })
      .then((result) => {
        dispatch(showFeedback({
          type: result.queued ? 'info' : 'success',
          title: result.queued ? 'Saved offline' : 'Request submitted',
          message: result.queued ? 'It will sync when the network returns.' : 'Your request has been sent to the admin team.'
        }));
        if (!result.queued && result.result?.supportThreadId) {
          navigation.navigate(ROUTES.SupportChat, {
            composeOnly: false,
            scope: 'ORDER',
            threadId: result.result.supportThreadId,
            orderId: order.id,
            orderNumber: order.number,
            orderItemId: selectedItem.id,
            orderItemTitle: selectedItem.titleSnapshot
          });
          return;
        }
        navigation.navigate(ROUTES.OrderDetail, { orderId: order.id });
      })
      .catch((error: any) => {
        const message = error?.data?.message ?? error?.data?.error ?? error?.error ?? error?.message ?? 'Please check the form and try again.';
        dispatch(showFeedback({
          type: 'error',
          title: 'Could not submit request',
          message
        }));
      });
  };

  return (
    <Screen>
      <PageHeader title="Return / Replacement" subtitle="Raise a request for a delivered item and let the admin review it." />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshing={isLoading || isFetching} onRefresh={refetch}>
        <SectionCard style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.heroIcon}>
              <Ionicons name="refresh-outline" size={22} color={AppTheme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="small" tone="soft">Order</AppText>
              <AppText variant="headline">{order?.number ?? 'SHP-00000000'}</AppText>
              <AppText variant="body" tone="soft">{formatDate(order?.createdAt)}</AppText>
            </View>
          </View>
          <AppText variant="body" tone="soft">
            {eligible ? 'This order is eligible for return or replacement.' : 'Return or replacement is available only within 2 days of delivery.'}
          </AppText>
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube-outline" size={18} color={AppTheme.colors.primary} />
            <AppText variant="title">Select item</AppText>
          </View>
          <View style={styles.itemList}>
            {order?.items?.map((item: any) => {
              const active = selectedItem?.id === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedItemId(item.id)}
                  style={[styles.itemCard, active && styles.itemCardActive]}
                >
                  <View style={styles.itemThumb}>
                    <Image source={{ uri: item.imageSnapshot }} style={styles.itemImage} contentFit="cover" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="label" numberOfLines={1}>{item.titleSnapshot}</AppText>
                    <AppText variant="small" tone="soft">Qty {item.quantity} • {formatCurrency(item.priceSnapshot)}</AppText>
                    <AppText variant="small" tone="soft">
                      {item.size ? `Size ${item.size}` : 'Size not set'}{item.color ? ` • ${item.color}` : ''}
                    </AppText>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
          {!order?.items?.length ? <AppText variant="body" tone="soft">No item found for this order.</AppText> : null}
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Ionicons name="swap-horizontal-outline" size={18} color={AppTheme.colors.primary} />
            <AppText variant="title">Request type</AppText>
          </View>
          <View style={styles.typeRow}>
            {typeOptions.map((item) => {
              const active = item.key === type;
              return (
                <Pressable key={item.key} onPress={() => setType(item.key)} style={[styles.typeCard, active && styles.typeCardActive]}>
                  <AppText variant="label" tone={active ? 'white' : 'default'}>{item.title}</AppText>
                  <AppText variant="small" tone={active ? 'white' : 'soft'}>{item.subtitle}</AppText>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle-outline" size={18} color={AppTheme.colors.primary} />
            <AppText variant="title">Reason</AppText>
          </View>
          <View style={styles.reasonRow}>
            {reasonsByType[type].map((option) => {
              const active = option === reason;
              return (
                <Pressable key={option} onPress={() => setReason(option)} style={[styles.reasonChip, active && styles.reasonChipActive]}>
                  <AppText variant="small" tone={active ? 'white' : 'soft'}>{option}</AppText>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={AppTheme.colors.primary} />
            <AppText variant="title">Tell us more</AppText>
          </View>
          <View style={styles.textAreaWrap}>
            <TextInput
              value={comments}
              onChangeText={setComments}
              placeholder="Optional details for seller review..."
              placeholderTextColor={AppTheme.colors.textSoft + '88'}
              multiline
              style={styles.textArea}
            />
          </View>
          <AppText variant="small" tone="soft">Photos help if the item is damaged or different from what you ordered.</AppText>
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Ionicons name="image-outline" size={18} color={AppTheme.colors.primary} />
            <AppText variant="title">Attach images</AppText>
          </View>
          <View style={styles.attachmentRow}>
            <Pressable onPress={() => void addAttachment()} style={styles.uploadCard}>
              <Ionicons name="add-circle-outline" size={22} color={AppTheme.colors.primary} />
              <AppText variant="small" tone="soft">Add photo</AppText>
            </Pressable>
            {attachments.map((url) => (
              <View key={url} style={styles.previewCard}>
                <Image source={{ uri: url }} style={styles.previewImage} contentFit="cover" />
                <Pressable style={styles.removeChip} onPress={() => setAttachments((prev) => prev.filter((item) => item !== url))}>
                  <Ionicons name="close" size={12} color={AppTheme.colors.white} />
                </Pressable>
              </View>
            ))}
          </View>
        </SectionCard>

        {alreadyRequested ? (
          <SectionCard style={styles.warningCard}>
            <AppText variant="title">Request already submitted</AppText>
            <AppText variant="body" tone="soft">You already have an open request for this item. Support or seller will update you here.</AppText>
          </SectionCard>
        ) : null}

        <AppButton
          title={eligible ? `Submit ${type === 'RETURN' ? 'Return' : 'Replacement'}` : 'Not eligible yet'}
          disabled={!eligible || !selectedItem || alreadyRequested}
          loading={isSubmitting}
          onPress={() => void submit()}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl + 80
  },
  hero: {
    gap: AppTheme.spacing.sm
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.md
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
    marginBottom: AppTheme.spacing.sm
  },
  itemList: {
    gap: AppTheme.spacing.sm
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
    padding: AppTheme.spacing.sm,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  itemCardActive: {
    borderColor: AppTheme.colors.primary,
    backgroundColor: AppTheme.colors.surfaceWarm
  },
  itemThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: AppTheme.colors.surface
  },
  itemImage: {
    width: '100%',
    height: '100%'
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: AppTheme.colors.border
  },
  radioActive: {
    borderColor: AppTheme.colors.primary
  },
  radioDot: {
    flex: 1,
    borderRadius: 999,
    margin: 4,
    backgroundColor: AppTheme.colors.primary
  },
  typeRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm
  },
  typeCard: {
    flex: 1,
    gap: 4,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  typeCardActive: {
    backgroundColor: AppTheme.colors.primary
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm
  },
  reasonChip: {
    paddingHorizontal: AppTheme.spacing.md,
    paddingVertical: AppTheme.spacing.sm,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  reasonChipActive: {
    backgroundColor: AppTheme.colors.primary
  },
  textAreaWrap: {
    minHeight: 120,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft,
    padding: AppTheme.spacing.sm
  },
  textArea: {
    flex: 1,
    minHeight: 104,
    color: AppTheme.colors.text,
    textAlignVertical: 'top'
  },
  attachmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm
  },
  uploadCard: {
    width: 96,
    height: 96,
    borderRadius: AppTheme.radius.md,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: AppTheme.colors.borderSoft
  },
  previewCard: {
    width: 96,
    height: 96,
    borderRadius: AppTheme.radius.md,
    overflow: 'hidden',
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  previewImage: {
    width: '100%',
    height: '100%'
  },
  removeChip: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)'
  },
  warningCard: {
    gap: AppTheme.spacing.sm,
    backgroundColor: '#FFF7ED'
  }
});
