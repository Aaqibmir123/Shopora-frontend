import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

import { AppTheme } from '@/theme';

type Props = TextProps & {
  variant?: 'display' | 'headline' | 'title' | 'body' | 'label' | 'small';
  tone?: 'default' | 'soft' | 'primary' | 'white';
};

export function AppText({ variant = 'body', tone = 'default', style, ...props }: Props) {
  return <Text {...props} style={[styles.base, styles[variant], styles[tone], style]} />;
}

const styles = StyleSheet.create({
  base: {
    color: AppTheme.colors.text,
    fontFamily: 'System'
  },
  display: AppTheme.typography.display,
  headline: AppTheme.typography.headline,
  title: AppTheme.typography.title,
  body: AppTheme.typography.body,
  label: AppTheme.typography.label,
  small: AppTheme.typography.small,
  default: {},
  soft: { color: AppTheme.colors.textSoft },
  primary: { color: AppTheme.colors.primaryStrong },
  white: { color: AppTheme.colors.white }
});
