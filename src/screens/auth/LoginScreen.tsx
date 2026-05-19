// @ts-nocheck
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';
import { useRequestOtpMutation } from '@/store/api/authApi';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { useAppDispatch } from '@/store/hooks';

type Props = any;

export function LoginScreen({ navigation }: Props) {
  const [phoneValue, setPhoneValue] = useState('');
  const dispatch = useAppDispatch();
  const [requestOtp, { isLoading }] = useRequestOtpMutation();

  const phoneDigits = useMemo(() => phoneValue.replace(/\D/g, '').slice(0, 10), [phoneValue]);
  const canContinue = phoneDigits.length === 10;

  const submit = async () => {
    if (phoneDigits.length !== 10) {
      dispatch(showFeedback({
        type: 'error',
        title: 'Validation failed',
        message: 'Enter a valid 10-digit phone number.'
      }));
      return;
    }

    try {
      const response = await requestOtp({ phone: phoneDigits }).unwrap();
      const payload = response?.data ?? response ?? {};
      dispatch(showFeedback({
        type: 'success',
        title: 'Code sent',
        message: 'Check your messages for the verification code.'
      }));
      navigation.navigate(ROUTES.Otp, {
        phone: phoneDigits,
        devOtp: __DEV__ ? payload?.devOtp : undefined
      });
    } catch (error: any) {
      dispatch(showFeedback({
        type: 'error',
        title: 'Could not send OTP',
        message: error?.data?.message ?? 'Please try again.'
      }));
    }
  };

  return (
    <Screen style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={AppTheme.colors.background} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.glowA} />
          <View style={styles.glowB} />

          <View style={styles.topBar}>
            <AppText variant="headline" style={styles.brandText}>Shopora</AppText>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <AppText variant="display" style={styles.title}>Welcome Back</AppText>
              <AppText variant="body" tone="soft" style={styles.subtitle}>
                Sign in to continue shopping, track orders, and get support.
              </AppText>
            </View>

            <View style={styles.fieldBlock}>
              <AppText variant="label" style={styles.fieldLabel}>
                Phone number
              </AppText>

              <View style={styles.phoneField}>
                <View style={styles.prefixBox}>
                  <AppText variant="body" style={styles.prefixText}>+91</AppText>
                  <Ionicons name="chevron-down" size={14} color={AppTheme.colors.textSoft} />
                </View>
                <View style={styles.fieldDivider} />
                <TextInput
                  value={phoneValue}
                  onChangeText={(text) => setPhoneValue(text.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  placeholderTextColor={AppTheme.colors.textSoft + '88'}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={styles.fieldInput}
                  selectionColor={AppTheme.colors.primary}
                />
              </View>

              <AppText variant="small" tone="soft" style={styles.helper}>
                {`${phoneDigits.length}/10 digits`}
              </AppText>
            </View>

            <Pressable
              onPress={submit}
              disabled={!canContinue || isLoading}
              style={({ pressed }) => [
                styles.cta,
                (!canContinue || isLoading || pressed) && styles.ctaPressed
              ]}
            >
              <LinearGradient colors={['#FF6B00', '#FF8A2A']} style={styles.ctaGradient}>
                <AppText variant="label" tone="white" style={styles.ctaText}>
                  Continue
                </AppText>
              </LinearGradient>
            </Pressable>

            <AppText variant="small" tone="soft" style={styles.terms}>
              By continuing you agree to our Terms, Privacy Policy, and Cookie Policy.
            </AppText>

            <View style={styles.policyRow}>
              <Pressable onPress={() => navigation.navigate(ROUTES.PrivacyPolicy)} style={styles.policyLink}>
                <AppText variant="small" style={styles.policyText}>Privacy Policy</AppText>
              </Pressable>
              <AppText variant="small" tone="soft">•</AppText>
              <Pressable onPress={() => navigation.navigate(ROUTES.TermsConditions)} style={styles.policyLink}>
                <AppText variant="small" style={styles.policyText}>Terms & Conditions</AppText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F6F0EA'
  },
  flex: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: AppTheme.spacing.md,
    paddingTop: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl * 1.5,
    justifyContent: 'center'
  },
  glowA: {
    position: 'absolute',
    top: 34,
    left: -24,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,120,34,0.08)'
  },
  glowB: {
    position: 'absolute',
    bottom: 40,
    right: -36,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(24,40,74,0.05)'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AppTheme.spacing.lg
  },
  brandText: {
    fontWeight: '900',
    letterSpacing: -0.4
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: AppTheme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(232,216,204,0.72)',
    gap: AppTheme.spacing.lg,
    ...AppTheme.shadow.card
  },
  cardHeader: {
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: AppTheme.spacing.sm
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
    textAlign: 'center'
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 300
  },
  fieldBlock: {
    gap: 10
  },
  fieldLabel: {
    marginLeft: 2
  },
  phoneField: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(232,216,204,0.8)',
    backgroundColor: '#FBF7F3',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden'
  },
  prefixBox: {
    paddingLeft: AppTheme.spacing.md,
    paddingRight: AppTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  prefixText: {
    fontWeight: '800'
  },
  fieldDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: 'rgba(180,160,145,0.5)'
  },
  fieldInput: {
    flex: 1,
    minHeight: 58,
    paddingHorizontal: AppTheme.spacing.md,
    color: AppTheme.colors.text,
    fontSize: 16,
    fontWeight: '600'
  },
  helper: {
    marginLeft: 2
  },
  cta: {
    borderRadius: 18,
    overflow: 'hidden'
  },
  ctaGradient: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18
  },
  ctaText: {
    fontWeight: '900',
    letterSpacing: 0.2
  },
  ctaPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }]
  },
  terms: {
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: AppTheme.spacing.xs
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap'
  },
  policyLink: {
    alignSelf: 'center'
  },
  policyText: {
    color: AppTheme.colors.primaryStrong,
    fontWeight: '800'
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }]
  }
});
