import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TextInput as RNTextInput,
  useWindowDimensions,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';
import { useVerifyOtpMutation, useRequestOtpMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/store/hooks';
import { setSession } from '@/store/slices/authSlice';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { setAuthSession } from '@/services/tokenStorage';
import { setRole } from '@/store/slices/uiSlice';
import { normalizeAuthRole } from '@/utils/auth';

type Props = any;

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export function OtpScreen({ navigation, route }: Props) {
  const [code, setCode] = useState(String(route?.params?.devOtp ?? '').replace(/\D/g, '').slice(0, OTP_LENGTH));
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const phone = String(route?.params?.phone ?? '').replace(/\D/g, '').slice(-10);
  const dispatch = useAppDispatch();
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [requestOtp, { isLoading: isResending }] = useRequestOtpMutation();
  const inputRef = useRef<RNTextInput | null>(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    const next = String(route?.params?.devOtp ?? '').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (next) {
      setCode(next);
    }
  }, [route?.params?.devOtp]);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 260);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((current) => (current <= 0 ? 0 : current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const digits = useMemo(() => Array.from({ length: OTP_LENGTH }, (_, index) => code[index] ?? ''), [code]);
  const otpCellSize = useMemo(() => {
    const horizontalPadding = AppTheme.spacing.md * 2;
    const gapTotal = AppTheme.spacing.sm * (OTP_LENGTH - 1);
    const availableWidth = Math.max(280, width - horizontalPadding - gapTotal);
    return Math.max(40, Math.min(52, Math.floor(availableWidth / OTP_LENGTH)));
  }, [width]);

  const handleVerify = async () => {
    if (!phone || code.length !== OTP_LENGTH) {
      dispatch(showFeedback({ type: 'error', title: 'Invalid OTP', message: 'Enter the 6-digit code first.' }));
      return;
    }

    try {
      const response = await verifyOtp({ phone, code }).unwrap();
      const payload = response?.data ?? response ?? {};
      const backendRole = normalizeAuthRole(payload?.user?.role);
      const role = backendRole;
      const nextSession = {
        token: payload.token,
        refreshToken: payload.refreshToken ?? null,
        phone: payload?.user?.phone ?? phone,
        role
      };

      if (!nextSession.token) {
        throw new Error('Missing token from server');
      }

      await setAuthSession(nextSession);
      dispatch(setSession(nextSession));
      dispatch(setRole(role));
      dispatch(showFeedback({ type: 'success', title: 'Verified', message: 'You are now signed in.' }));

      if (role === 'seller') {
        navigation.replace(ROUTES.SellerStack);
        return;
      }
      if (role === 'admin') {
        navigation.replace(ROUTES.AdminStack);
        return;
      }
      navigation.replace(ROUTES.MainTabs);
    } catch (error: any) {
      dispatch(showFeedback({
        type: 'error',
        title: 'OTP verification failed',
        message: error?.data?.message ?? 'Please check the code and try again.'
      }));
    }
  };

  const handleResend = async () => {
    if (!phone || resendTimer > 0) return;
    try {
      await requestOtp({ phone }).unwrap();
      setCode('');
      setResendTimer(RESEND_SECONDS);
      dispatch(showFeedback({
        type: 'success',
        title: 'Code resent',
        message: 'A fresh verification code has been sent.'
      }));
    } catch (error: any) {
      dispatch(showFeedback({
        type: 'error',
        title: 'Could not resend code',
        message: error?.data?.message ?? 'Please try again later.'
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
          <View style={styles.topBar}>
            <AppText variant="headline" style={styles.brandText}>NovaMart</AppText>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <AppText variant="display" style={styles.title}>Verification</AppText>
              <AppText variant="body" tone="soft" style={styles.subtitle}>
                Enter the 6-digit code sent to +91 {phone || 'your number'}.
              </AppText>
              <Pressable onPress={() => navigation.goBack()}>
                <AppText variant="small" style={styles.changeNumber}>Change number?</AppText>
              </Pressable>
            </View>

            <Pressable onPressIn={() => inputRef.current?.focus()} style={styles.otpRow}>
              {digits.map((digit, index) => {
                const active = index === code.length;
                return (
                  <View
                    key={`${index}-${digit}`}
                    style={[
                      styles.otpCell,
                      { width: otpCellSize, height: otpCellSize + 8 },
                      active && styles.otpCellActive
                    ]}
                  >
                    <AppText variant="display" style={styles.otpDigit}>
                      {digit || '•'}
                    </AppText>
                  </View>
                );
              })}
            </Pressable>

            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
              placeholder="Enter code"
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              autoFocus
              showSoftInputOnFocus
              caretHidden
              style={styles.hiddenInput}
            />

            <Pressable
              onPress={handleVerify}
              disabled={isLoading || code.length !== OTP_LENGTH}
              style={({ pressed }) => [
                styles.verifyButton,
                (isLoading || code.length !== OTP_LENGTH || pressed) && styles.verifyButtonPressed
              ]}
            >
              <AppText variant="label" tone="white" style={styles.verifyText}>
                Verify & Continue
              </AppText>
            </Pressable>

            <View style={styles.resendRow}>
              <Ionicons name="refresh-outline" size={15} color={AppTheme.colors.primaryStrong} />
              <Pressable onPress={handleResend} disabled={resendTimer > 0 || isResending}>
                <AppText
                  variant="label"
                  style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                </AppText>
              </Pressable>
            </View>

            <AppText variant="small" tone="soft" style={styles.helper}>
              Keep this code private. We will never ask for it outside the app.
            </AppText>
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
    maxWidth: 320
  },
  changeNumber: {
    color: AppTheme.colors.primaryStrong,
    fontWeight: '800'
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: AppTheme.spacing.sm,
    flexWrap: 'nowrap'
  },
  otpCell: {
    borderRadius: 16,
    backgroundColor: '#F8F2ED',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1
  },
  otpCellActive: {
    borderColor: AppTheme.colors.primary,
    backgroundColor: '#FFF5EA',
    transform: [{ translateY: -1 }]
  },
  otpDigit: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900'
  },
  hiddenInput: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 160,
    height: 56,
    opacity: 0.01
  },
  verifyButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#132238',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#132238',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  verifyButtonPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }]
  },
  verifyText: {
    fontWeight: '900'
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  resendText: {
    color: AppTheme.colors.primaryStrong,
    fontWeight: '800'
  },
  resendTextDisabled: {
    color: AppTheme.colors.textSoft
  },
  helper: {
    textAlign: 'center',
    lineHeight: 20
  }
});

