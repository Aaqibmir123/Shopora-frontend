import React, { useEffect } from 'react';
import { Image, Pressable, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store/hooks';

import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';
import { selectAuthHydrated, selectAuthRole, selectAuthToken } from '@/store/slices/authSlice';
import { getAuthSession } from '@/services/tokenStorage';

type Props = any;

const LOGO = require('../../../assets/auth/lumina-logo.png');
const HERO = require('../../../assets/auth/splash-illustration.png');

export function SplashScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const hydrated = useAppSelector(selectAuthHydrated);
  const token = useAppSelector(selectAuthToken);
  const role = useAppSelector(selectAuthRole);

  const goNext = () => {
    const session = getAuthSession();
    if (!token) {
      navigation.replace(ROUTES.Login);
      return;
    }

    if (role === 'admin') {
      navigation.replace(ROUTES.AdminStack);
      return;
    }

    if (role === 'seller') {
      navigation.replace(ROUTES.SellerStack);
      return;
    }

    if (session?.role === 'admin') {
      navigation.replace(ROUTES.AdminStack);
      return;
    }

    if (session?.role === 'seller') {
      navigation.replace(ROUTES.SellerStack);
      return;
    }

    navigation.replace(ROUTES.MainTabs);
  };

  useEffect(() => {
    if (!hydrated) return;
    const id = setTimeout(goNext, 550);
    return () => clearTimeout(id);
  }, [hydrated, navigation, role, token]);

  return (
    <Screen style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#15264B" />
      <LinearGradient colors={['#16274B', '#0E1D3B', '#1F3564']} style={styles.wrap}>
        <View style={[styles.orb, styles.orbA]} />
        <View style={[styles.orb, styles.orbB]} />
        <View style={styles.topBrand}>
          <Image source={LOGO} style={styles.brandLogo} resizeMode="contain" />
          <AppText variant="title" tone="white" style={styles.brandText}>NovaMart</AppText>
        </View>

        <View style={[styles.heroWrap, width >= 768 && styles.heroWrapWide]}>
          <Image source={HERO} style={styles.heroImage} resizeMode="contain" />
        </View>

        <View style={styles.bottomCard}>
          <View style={styles.bottomTextWrap}>
            <AppText variant="display" style={styles.title}>Shop Your Heart Out</AppText>
            <AppText variant="body" tone="soft" style={styles.subtitle}>
              Explore fresh drops, premium deals, and fast checkout from one place.
            </AppText>
          </View>

          <Pressable onPress={goNext} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <LinearGradient colors={['#FF6B00', '#FF8A2A']} style={styles.ctaInner}>
              <AppText variant="label" tone="white" style={styles.ctaText}>Get Started</AppText>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
          <AppText variant="small" tone="soft" style={styles.ctaHint}>
            Tap to continue to phone login
          </AppText>

          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </LinearGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#15264B'
  },
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppTheme.spacing.md,
    paddingTop: AppTheme.spacing.xl,
    paddingBottom: AppTheme.spacing.lg,
    overflow: 'hidden'
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  orbA: {
    width: 200,
    height: 200,
    top: 16,
    right: -80
  },
  orbB: {
    width: 260,
    height: 260,
    bottom: 140,
    left: -90,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  topBrand: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 1
  },
  brandLogo: {
    width: 28,
    height: 28
  },
  brandText: {
    fontWeight: '900',
    letterSpacing: -0.6
  },
  heroWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: AppTheme.spacing.lg,
    zIndex: 1
  },
  heroWrapWide: {
    maxWidth: 620
  },
  heroImage: {
    width: '100%',
    height: '100%',
    maxHeight: 420
  },
  bottomCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: AppTheme.spacing.lg,
    gap: AppTheme.spacing.lg,
    marginTop: AppTheme.spacing.md,
    ...AppTheme.shadow.card
  },
  bottomTextWrap: {
    gap: 8,
    alignItems: 'center'
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
    maxWidth: 340
  },
  cta: {
    borderRadius: 18,
    overflow: 'hidden'
  },
  ctaInner: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  ctaPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }]
  },
  ctaText: {
    fontWeight: '900'
  },
  ctaHint: {
    textAlign: 'center',
    marginTop: -6
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D9C8BA'
  },
  dotActive: {
    width: 22,
    backgroundColor: '#FF6B00'
  }
});

