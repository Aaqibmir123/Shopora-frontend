// @ts-nocheck
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';
import { useAppDispatch } from '@/store/hooks';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { executeWithOfflineQueue } from '@/services/offlineQueue';
import { pickAndUploadImage } from '@/services/imageUpload';
import { useAuthContext } from '@/context/AuthContext';
import { requestJson } from '@/services/apiClient';

const schema = z.object({
  storeName: z.string().trim().min(3, 'Enter store name'),
  ownerName: z.string().trim().min(3, 'Enter owner name'),
  phone: z.string().trim().min(8, 'Enter phone number'),
  email: z.string().trim().email('Enter valid email'),
  category: z.string().trim().min(2, 'Enter primary category'),
  city: z.string().trim().min(2, 'Enter city'),
  gstNumber: z.string().optional(),
  bankAccount: z.string().trim().min(6, 'Enter bank account'),
  ifsc: z.string().trim().min(4, 'Enter IFSC code'),
  aadhaarFrontUrl: z.string().url('Upload Aadhaar front'),
  aadhaarBackUrl: z.string().url('Upload Aadhaar back'),
  panCardUrl: z.string().url('Upload PAN card'),
  addressProofUrl: z.string().url('Upload address proof')
});

type FormValues = z.infer<typeof schema>;
type DocFieldKey = keyof Pick<FormValues, 'aadhaarFrontUrl' | 'aadhaarBackUrl' | 'panCardUrl' | 'addressProofUrl'>;

const docFields: Array<{ key: DocFieldKey; label: string; required?: boolean }> = [
  { key: 'aadhaarFrontUrl', label: 'Aadhaar Front', required: true },
  { key: 'aadhaarBackUrl', label: 'Aadhaar Back', required: true },
  { key: 'panCardUrl', label: 'PAN Card', required: true },
  { key: 'addressProofUrl', label: 'Address Proof', required: true }
];

export function SellerRegistrationScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { sessionReady } = useAuthContext();
  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      storeName: '',
      ownerName: '',
      phone: '',
      email: '',
      category: '',
      city: '',
      gstNumber: '',
      bankAccount: '',
      ifsc: '',
      aadhaarFrontUrl: '',
      aadhaarBackUrl: '',
      panCardUrl: '',
      addressProofUrl: ''
    }
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const uploadDocument = async (key: DocFieldKey, label: string) => {
    if (!sessionReady) {
      dispatch(showFeedback({ type: 'info', title: 'Please wait', message: 'Restoring your session before uploading documents.' }));
      return;
    }
    try {
      const url = await pickAndUploadImage();
      if (!url) return;
      setValue(key, url, { shouldDirty: true, shouldValidate: true });
      dispatch(showFeedback({ type: 'success', title: `${label} uploaded`, message: 'Document image attached.' }));
    } catch (error: any) {
      dispatch(showFeedback({ type: 'error', title: 'Upload failed', message: error?.message ?? 'Try again.' }));
    }
  };

  const onSubmit = handleSubmit((values: FormValues) => {
    if (!sessionReady) {
      dispatch(showFeedback({ type: 'info', title: 'Please wait', message: 'Restoring your session before submitting.' }));
      return;
    }
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      dispatch(showFeedback({
        type: 'error',
        title: 'Registration incomplete',
        message: parsed.error.issues[0]?.message ?? 'Please fill the required fields.'
      }));
      return;
    }

    const payload = {
      storeName: parsed.data.storeName.trim(),
      ownerName: parsed.data.ownerName.trim(),
      applicantPhone: parsed.data.phone.trim(),
      applicantEmail: parsed.data.email.trim().toLowerCase(),
      city: parsed.data.city.trim(),
      bankAccount: parsed.data.bankAccount.trim(),
      ifsc: parsed.data.ifsc.trim().toUpperCase(),
      category: parsed.data.category.trim(),
      gstNumber: parsed.data.gstNumber?.trim() || undefined,
      bankLast4: parsed.data.bankAccount.trim().slice(-4),
      aadhaarFrontUrl: parsed.data.aadhaarFrontUrl?.trim() || undefined,
      aadhaarBackUrl: parsed.data.aadhaarBackUrl?.trim() || undefined,
      panCardUrl: parsed.data.panCardUrl?.trim() || undefined,
      addressProofUrl: parsed.data.addressProofUrl?.trim() || undefined,
      note: `Documents and seller info submitted for review.`
    };

    void executeWithOfflineQueue({
      type: 'seller.apply',
      payload,
      action: async () => {
        setIsLoading(true);
        try {
          return await requestJson('/seller/apply', {
            method: 'POST',
            body: payload
          });
        } finally {
          setIsLoading(false);
        }
      }
    })
      .then((result) => {
        dispatch(showFeedback({
          type: result.queued ? 'info' : 'success',
          title: 'Application submitted',
          message: result.queued ? 'Saved offline. It will sync automatically.' : 'Your seller request has been sent for review.'
        }));
        navigation.navigate(ROUTES.ApprovalPending);
      })
      .catch((error: any) => {
        dispatch(showFeedback({
          type: 'error',
          title: 'Seller application failed',
          message: error?.body?.error ?? error?.data?.message ?? error?.message ?? 'Please review your details and try again.'
        }));
      });
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Seller Registration" subtitle="Fill the form, upload documents, and submit for review." />

        <SectionCard style={styles.hero}>
          <Ionicons name="storefront-outline" size={38} color={AppTheme.colors.primary} />
          <AppText variant="headline" style={styles.centerText}>Start your seller account</AppText>
          <AppText variant="body" tone="soft" style={styles.centerText}>
            Simple business details and document uploads. GST is optional.
          </AppText>
        </SectionCard>

        <SectionCard>
          <AppText variant="title">Business details</AppText>
          <View style={styles.form}>
            <AppInput control={control} name="storeName" label="Store name" placeholder="Your brand name" required />
            <AppInput control={control} name="ownerName" label="Owner name" placeholder="Authorized owner" required />
            <AppInput control={control} name="phone" label="Phone" placeholder="10-digit phone" keyboardType="phone-pad" prefix="+91" required />
            <AppInput control={control} name="email" label="Email" placeholder="you@brand.com" keyboardType="email-address" autoCapitalize="none" required />
            <View style={styles.row}>
              <View style={styles.rowField}>
                <AppInput control={control} name="category" label="Category" placeholder="Fashion / Tech / Home" required />
              </View>
              <View style={styles.rowField}>
                <AppInput control={control} name="city" label="City" placeholder="City" required />
              </View>
            </View>
            <AppInput control={control} name="gstNumber" label="GST number (optional)" placeholder="GST number" autoCapitalize="characters" />
            <View style={styles.row}>
              <View style={styles.rowField}>
                <AppInput control={control} name="bankAccount" label="Bank account" placeholder="Account number" keyboardType="number-pad" required />
              </View>
              <View style={styles.rowField}>
                <AppInput control={control} name="ifsc" label="IFSC" placeholder="Bank IFSC" autoCapitalize="characters" required />
              </View>
            </View>
          </View>
        </SectionCard>

        <SectionCard>
          <AppText variant="title">Documents</AppText>
          <AppText variant="small" tone="soft">
            Use the buttons below to pick and upload clear document images.
          </AppText>
          <View style={styles.docList}>
            {docFields.map((item) => {
              const value = watch(item.key);
              return (
                <View key={item.key} style={styles.docCard}>
                  <View style={styles.docHeader}>
                    <View style={styles.docIcon}>
                      <Ionicons name={value ? 'checkmark' : 'cloud-upload-outline'} size={18} color={value ? AppTheme.colors.primary : AppTheme.colors.textSoft} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="label">{item.label}{item.required ? ' *' : ''}</AppText>
                      <AppText variant="small" tone="soft">{value ? 'Uploaded' : 'Not uploaded yet'}</AppText>
                    </View>
                  </View>
                  {value ? (
                    <AppText variant="small" tone="soft" style={styles.docLink}>
                      File attached successfully.
                    </AppText>
                  ) : null}
                  {!value ? (
                    <AppText variant="small" tone="primary" style={styles.docLink}>
                      Required. Tap below to choose an image.
                    </AppText>
                  ) : null}
                  <AppButton
                    title={value ? 'Replace document' : 'Choose image'}
                    variant="secondary"
                    onPress={() => void uploadDocument(item.key, item.label)}
                    style={styles.docButton}
                  />
                </View>
              );
            })}
          </View>
        </SectionCard>

        <View style={styles.actions}>
          <AppButton title="Submit Application" onPress={onSubmit} loading={isLoading} />
          <AppButton title="Cancel" variant="secondary" onPress={() => navigation.goBack?.()} />
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
  hero: {
    alignItems: 'center',
    gap: AppTheme.spacing.sm
  },
  centerText: {
    textAlign: 'center'
  },
  form: {
    gap: AppTheme.spacing.md,
    marginTop: AppTheme.spacing.md
  },
  row: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm
  },
  rowField: {
    flex: 1
  },
  docList: {
    gap: AppTheme.spacing.sm,
    marginTop: AppTheme.spacing.sm
  },
  docCard: {
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft,
    gap: AppTheme.spacing.sm
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm
  },
  docIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surface
  },
  docButton: {
    width: '100%'
  },
  docLink: {
    marginLeft: 46
  },
  actions: {
    gap: AppTheme.spacing.md
  }
});
