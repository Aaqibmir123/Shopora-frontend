export const AppTheme = {
  colors: {
    background: '#FFF8F6',
    surface: '#FFFFFF',
    surfaceSoft: '#FFF1EB',
    surfaceWarm: '#FFEAE1',
    surfaceElevated: '#FFF8F6',
    surfaceTint: '#A04100',
    primary: '#A04100',
    primaryStrong: '#FF6B00',
    primarySoft: '#FFB693',
    primaryContainer: '#FFDBCC',
    secondary: '#49607E',
    tertiary: '#0062A1',
    text: '#261812',
    textSoft: '#5A4136',
    border: '#E2BFB0',
    borderSoft: '#F0D8CC',
    danger: '#BA1A1A',
    success: '#118A41',
    info: '#0E6DB5',
    white: '#FFFFFF',
    black: '#000000'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    pill: 9999
  },
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4
    }
  },
  typography: {
    display: { fontSize: 34, lineHeight: 42, fontWeight: '800' as const },
    headline: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
    title: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
    body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
    label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
    small: { fontSize: 11, lineHeight: 16, fontWeight: '500' as const }
  }
} as const;

export type AppThemeType = typeof AppTheme;
