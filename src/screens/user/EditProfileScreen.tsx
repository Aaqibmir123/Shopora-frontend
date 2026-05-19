// @ts-nocheck
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { AppTheme } from '@/theme';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { useAppDispatch } from '@/store/hooks';
import { useMeQuery, useUpdateMeMutation } from '@/store/api/authApi';
import { pickAndUploadImage } from '@/services/imageUpload';
import { getAuthSession, setAuthSession } from '@/services/tokenStorage';
import { setSession } from '@/store/slices/authSlice';
import { useAuthContext } from '@/context/AuthContext';

const schema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().min(8, 'Enter a valid phone number'),
  avatarUrl: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export function EditProfileScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { sessionReady } = useAuthContext();
  const { data } = useMeQuery(undefined, {
    skip: !sessionReady,
    refetchOnMountOrArgChange: true
  });
  const [updateMe, { isLoading }] = useUpdateMeMutation();
  const { control, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      avatarUrl: ''
    }
  });

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

  const avatarUrl = watch('avatarUrl');

  const uploadPhoto = async () => {
    if (!sessionReady) {
      dispatch(showFeedback({ type: 'info', title: 'Please wait', message: 'Restoring your session before uploading.' }));
      return;
    }

    try {
      const url = await pickAndUploadImage();
      if (!url) return;
      setValue('avatarUrl', url, { shouldDirty: true, shouldValidate: true });
      dispatch(showFeedback({ type: 'success', title: 'Photo uploaded', message: 'Profile picture attached.' }));
    } catch (error: any) {
      dispatch(showFeedback({
        type: 'error',
        title: 'Upload failed',
        message: error?.message?.includes('Cloudinary')
          ? 'Photo upload is not configured yet. Save your profile without a photo or try again later.'
          : error?.message ?? 'Try again.'
      }));
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      dispatch(showFeedback({
        type: 'error',
        title: 'Profile incomplete',
        message: parsed.error.issues[0]?.message ?? 'Please check the fields.'
      }));
      return;
    }

    try {
      const response = await updateMe({
        name: parsed.data.name.trim(),
        email: parsed.data.email?.trim() || undefined,
        phone: parsed.data.phone.trim(),
        avatarUrl: parsed.data.avatarUrl?.trim() || undefined
      }).unwrap();

      const nextUser = response?.data ?? {};
      const currentSession = getAuthSession();
      const nextSession = {
        token: currentSession?.token ?? '',
        refreshToken: currentSession?.refreshToken ?? null,
        phone: nextUser.phone ?? parsed.data.phone.trim(),
        role: currentSession?.role ?? 'shopper'
      };
      if (nextSession.token) {
        await setAuthSession(nextSession as any);
      }
      if (nextSession.token) {
        dispatch(setSession(nextSession as any));
      }
      dispatch(showFeedback({ type: 'success', title: 'Profile saved', message: 'Your details were updated.' }));
      navigation.goBack?.();
    } catch (error: any) {
      dispatch(showFeedback({
        type: 'error',
        title: 'Save failed',
        message: error?.data?.message ?? 'Could not update profile.'
      }));
    }
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Edit Profile" subtitle="Update photo, name, email, and phone." />

        <SectionCard style={styles.card}>
          <View style={styles.avatarWrap}>
            <Pressable style={styles.avatar} onPress={() => void uploadPhoto()}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> : <AppText variant="title">P</AppText>}
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={12} color={AppTheme.colors.white} />
              </View>
            </Pressable>
            <AppText variant="small" tone="soft">Tap the avatar to upload a new photo.</AppText>
          </View>

          <View style={styles.form}>
            <AppInput control={control} name="name" label="Full name" placeholder="Your name" />
            <AppInput control={control} name="email" label="Email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
            <AppInput control={control} name="phone" label="Phone" placeholder="10-digit phone" keyboardType="phone-pad" prefix="+91" editable={false} />
          </View>

          <AppButton title="Save Profile" loading={isLoading} onPress={onSubmit} />
          <AppButton title="Cancel" variant="secondary" onPress={() => navigation.goBack?.()} />
        </SectionCard>
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
  card: {
    gap: AppTheme.spacing.lg
  },
  avatarWrap: {
    gap: AppTheme.spacing.md,
    alignItems: 'center'
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
  },
  avatarBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primary
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  form: {
    gap: AppTheme.spacing.md
  }
});
