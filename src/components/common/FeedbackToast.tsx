import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { hideFeedback } from '@/store/slices/feedbackSlice';
import { AppTheme } from '@/theme';
import { AppText } from './AppText';

type ToastTone = 'success' | 'error' | 'info';

const TOAST_CONFIG: Record<ToastTone, { backgroundColor: string; icon: keyof typeof Ionicons.glyphMap; accent: string }> = {
  success: { backgroundColor: '#0F7A39', icon: 'checkmark-circle', accent: '#A9F2C4' },
  error: { backgroundColor: '#B71C1C', icon: 'close-circle', accent: '#FFB3B3' },
  info: { backgroundColor: '#A04100', icon: 'information-circle', accent: '#FFD3B6' }
};

export function FeedbackToast() {
  const dispatch = useAppDispatch();
  const feedback = useAppSelector((state: any) => state.feedback);
  const toastType = (feedback.type in TOAST_CONFIG ? feedback.type : 'info') as ToastTone;
  const config = TOAST_CONFIG[toastType];

  useEffect(() => {
    if (!feedback.visible) return undefined;
    const timer = setTimeout(() => dispatch(hideFeedback()), 1800);
    return () => clearTimeout(timer);
  }, [dispatch, feedback.visible, feedback.message, feedback.title, feedback.type]);

  if (!feedback.visible) {
    return null;
  }

  return (
    <Pressable onPress={() => dispatch(hideFeedback())} style={[styles.wrap, { backgroundColor: config.backgroundColor }]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: config.accent }]}>
          <Ionicons name={config.icon} size={18} color={config.backgroundColor} />
        </View>
        <View style={styles.textWrap}>
          <AppText variant="label" tone="white" style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {feedback.title}
          </AppText>
          {feedback.message ? (
            <AppText variant="small" tone="white" style={styles.message} numberOfLines={2} ellipsizeMode="tail">
              {feedback.message}
            </AppText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: AppTheme.spacing.md,
    right: AppTheme.spacing.md,
    top: 50,
    zIndex: 999,
    paddingVertical: AppTheme.spacing.sm,
    paddingHorizontal: AppTheme.spacing.md,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  textWrap: {
    flex: 1,
    gap: 2
  },
  title: {
    fontWeight: '900',
    letterSpacing: 0.1
  },
  message: {
    opacity: 0.95,
    lineHeight: 18
  }
});
