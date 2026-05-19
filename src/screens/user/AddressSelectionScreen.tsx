// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { AppTheme } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { selectAuthToken } from '@/store/slices/authSlice';
import {
  useCreateAddressMutation,
  useDeleteAddressMutation,
  useGetAddressesQuery,
  useUpdateAddressMutation
} from '@/store/api/addressApi';
import { ROUTES } from '@/constants/navigation';
import { executeWithOfflineQueue } from '@/services/offlineQueue';
import { getAuthSession } from '@/services/tokenStorage';
import { useAuthContext } from '@/context/AuthContext';

const schema = z.object({
  label: z.string().min(2, 'Enter a label'),
  name: z.string().min(2, 'Enter recipient name'),
  phone: z.string().min(8, 'Enter phone number'),
  line1: z.string().min(3, 'Enter address line 1'),
  line2: z.string().optional(),
  city: z.string().min(2, 'Enter city'),
  state: z.string().min(2, 'Enter state'),
  postalCode: z.string().min(3, 'Enter postal code'),
  country: z.string().min(2).optional()
});

type FormValues = z.infer<typeof schema>;

type Props = any;

export function AddressSelectionScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { sessionReady } = useAuthContext();
  const token = useAppSelector(selectAuthToken) ?? getAuthSession()?.token ?? null;
  const { data, isLoading, isFetching, refetch } = useGetAddressesQuery(undefined, { skip: !token });
  const [createAddress] = useCreateAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const { control, handleSubmit, reset } = useForm<FormValues>();

  const addresses = useMemo(() => data?.data ?? [], [data]);

  useEffect(() => {
    if (!editingId) {
      reset({
        label: 'Home',
        name: '',
        phone: '',
        line1: '',
        line2: '',
        city: '',
        state: 'India',
        postalCode: '',
        country: 'India'
      });
      setIsDefault(addresses.length === 0);
    }
  }, [addresses.length, editingId, reset]);

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setIsDefault(Boolean(item.isDefault));
    reset({
      label: item.label,
      name: item.name,
      phone: item.phone,
      line1: item.line1,
      line2: item.line2 ?? '',
      city: item.city,
      state: item.state,
      postalCode: item.postalCode,
      country: item.country
    });
  };

  const onSave = handleSubmit((values: FormValues) => {
    if (!schema.safeParse(values).success) return;

    const payload = { ...values, isDefault };
    const action = editingId
      ? () => updateAddress({ id: editingId, ...payload }).unwrap()
      : () => createAddress(payload).unwrap();
    const type = editingId ? 'address.update' : 'address.create';
    void executeWithOfflineQueue({ type, payload: editingId ? { id: editingId, body: payload } : payload, action })
      .then((result) => {
        dispatch(showFeedback({
          type: result.queued ? 'info' : 'success',
          title: editingId ? 'Address updated' : 'Address added',
          message: result.queued ? 'Saved offline. It will sync automatically.' : isDefault ? 'This address is now your default delivery address.' : 'Saved successfully.'
        }));
        setEditingId(null);
        setIsDefault(false);
        reset();
      })
      .catch((error: any) => {
        dispatch(showFeedback({
          type: 'error',
          title: 'Address save failed',
          message: error?.data?.message ?? 'Please check the form and try again.'
        }));
      });
  });

  if (!sessionReady) {
    return (
      <Screen>
        <PageHeader title="Address Selection" subtitle="Loading your secure session..." />
        <View style={styles.emptyWrap}>
          <SectionCard>
            <AppText variant="headline">Hold on</AppText>
            <AppText variant="body" tone="soft" style={{ marginTop: 6 }}>
              Restoring your account before showing saved addresses.
            </AppText>
          </SectionCard>
        </View>
      </Screen>
    );
  }

  if (!token) {
    return (
      <Screen>
        <PageHeader title="Address Selection" subtitle="Please sign in first to manage delivery addresses." />
        <View style={styles.emptyWrap}>
          <SectionCard>
            <AppText variant="headline">Login required</AppText>
            <AppText variant="body" tone="soft" style={{ marginTop: 6 }}>
              After OTP login, you can add, edit, and set default delivery addresses.
            </AppText>
            <AppButton title="Go to Login" onPress={() => navigation.navigate(ROUTES.Login)} style={{ marginTop: AppTheme.spacing.md }} />
          </SectionCard>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="Address Selection" subtitle="Add, edit, select, or delete delivery addresses." />
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        refreshing={isLoading || isFetching}
        onRefresh={refetch}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <SectionCard>
            <AppText variant="title">{editingId ? 'Edit Address' : 'Add New Address'}</AppText>
            <View style={styles.form}>
              <AppInput control={control} name="label" label="Label" placeholder="Home / Office / Other" />
              <AppInput control={control} name="name" label="Name" placeholder="Recipient name" />
              <AppInput control={control} name="phone" label="Phone" placeholder="Phone number" keyboardType="phone-pad" />
              <AppInput control={control} name="line1" label="Address Line 1" placeholder="House / Street / Area" />
              <AppInput control={control} name="line2" label="Address Line 2" placeholder="Apartment / Landmark" />
              <View style={styles.row}>
                <AppInput control={control} name="city" label="City" placeholder="City" />
                <AppInput control={control} name="postalCode" label="PIN Code" placeholder="PIN code" keyboardType="number-pad" />
              </View>
              <AppInput control={control} name="country" label="Country" placeholder="Country" />

              <Pressable style={styles.defaultRow} onPress={() => setIsDefault((prev) => !prev)}>
                <View style={[styles.checkbox, isDefault && styles.checkboxActive]}>
                  {isDefault ? <Ionicons name="checkmark" size={14} color={AppTheme.colors.white} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="label">Set as default address</AppText>
                  <AppText variant="small" tone="soft">This will be used at checkout by default.</AppText>
                </View>
              </Pressable>

              <AppButton title={editingId ? 'Update Address' : 'Save Address'} onPress={onSave} />
              {editingId ? (
                <AppButton
                  title="Cancel Editing"
                  variant="secondary"
                  onPress={() => {
                    setEditingId(null);
                    setIsDefault(false);
                    reset();
                  }}
                />
              ) : null}
            </View>
          </SectionCard>
        }
        ListEmptyComponent={
          <SectionCard>
            <AppText variant="headline">No saved addresses yet</AppText>
            <AppText variant="body" tone="soft" style={{ marginTop: 6 }}>
              Add your first delivery address above.
            </AppText>
          </SectionCard>
        }
        renderItem={({ item }) => (
          <SectionCard>
            <View style={styles.addressRow}>
              <Pressable
                style={styles.selectRow}
                onPress={() =>
                  void executeWithOfflineQueue({
                    type: 'address.update',
                    payload: { id: item.id, body: { isDefault: true } },
                    action: () => updateAddress({ id: item.id, isDefault: true }).unwrap()
                  })
                    .then((result) =>
                      dispatch(showFeedback({
                        type: result.queued ? 'info' : 'success',
                        title: 'Default address updated',
                        message: result.queued ? 'Saved offline. It will sync automatically.' : `${item.label} will be used at checkout.`
                      }))
                    )
                    .catch((error: any) =>
                      dispatch(showFeedback({
                        type: 'error',
                        title: 'Could not update default',
                        message: error?.data?.message ?? 'Please try again.'
                      }))
                    )
                }
              >
                <View style={[styles.radio, item.isDefault && styles.radioActive]} />
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <AppText variant="title">{item.label}</AppText>
                    {item.isDefault ? <View style={styles.defaultChip}><AppText variant="small" tone="white">Default</AppText></View> : null}
                  </View>
                  <AppText variant="body" tone="soft">
                    {item.name} / {item.phone}
                  </AppText>
                  <AppText variant="body" tone="soft">
                    {item.line1}
                    {item.line2 ? `, ${item.line2}` : ''}
                  </AppText>
                  <AppText variant="body" tone="soft">
                    {item.city}, {item.state} {item.postalCode}
                  </AppText>
                </View>
              </Pressable>

              <View style={styles.actions}>
                <Pressable style={styles.iconButton} onPress={() => startEdit(item)}>
                  <Ionicons name="pencil-outline" size={18} color={AppTheme.colors.primary} />
                </Pressable>
                <Pressable
                  style={styles.iconButton}
                  onPress={() =>
                    void executeWithOfflineQueue({
                      type: 'address.delete',
                      payload: { id: item.id },
                      action: () => deleteAddress(item.id).unwrap()
                    })
                      .then((result) =>
                        dispatch(showFeedback({
                          type: result.queued ? 'info' : 'info',
                          title: 'Address deleted',
                          message: result.queued ? 'Saved offline. It will sync automatically.' : 'The address was removed successfully.'
                        }))
                      )
                      .catch((error: any) =>
                        dispatch(showFeedback({
                          type: 'error',
                          title: 'Could not delete address',
                          message: error?.data?.message ?? 'Please try again.'
                        }))
                      )
                  }
                >
                  <Ionicons name="trash-outline" size={18} color={AppTheme.colors.danger} />
                </Pressable>
              </View>
            </View>
          </SectionCard>
        )}
        ListFooterComponent={
          <SectionCard>
            <AppText variant="title">Use at checkout</AppText>
            <AppText variant="body" tone="soft" style={{ marginTop: 4 }}>
              Checkout will use the current default address.
            </AppText>
            <AppButton title="Continue to Checkout" onPress={() => navigation.goBack()} style={{ marginTop: AppTheme.spacing.md }} />
          </SectionCard>
        }
      />
      {!addresses.length ? null : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl + 96
  },
  emptyWrap: {
    flex: 1,
    padding: AppTheme.spacing.md,
    justifyContent: 'center'
  },
  form: {
    gap: AppTheme.spacing.md,
    marginTop: AppTheme.spacing.md
  },
  row: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.md,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: AppTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxActive: {
    borderColor: AppTheme.colors.primary,
    backgroundColor: AppTheme.colors.primary
  },
  addressRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.md
  },
  selectRow: {
    flex: 1,
    flexDirection: 'row',
    gap: AppTheme.spacing.md
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: AppTheme.colors.border,
    marginTop: 2
  },
  radioActive: {
    borderColor: AppTheme.colors.primary,
    backgroundColor: AppTheme.colors.primaryContainer
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
    flexWrap: 'wrap'
  },
  defaultChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.primary
  },
  actions: {
    gap: AppTheme.spacing.sm
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surfaceSoft
  }
});

