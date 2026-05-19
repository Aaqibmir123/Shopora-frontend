import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppButton } from '@/components/common/AppButton';
import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  note?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function FeatureScreen({ title, subtitle, note, actionLabel, onActionPress }: Props) {
  return (
    <Screen>
      <PageHeader title={title} subtitle={subtitle} />
      <View style={styles.body}>
        <View style={styles.card}>
          <AppText variant="headline">{title}</AppText>
          {subtitle ? <AppText variant="body" tone="soft" style={styles.subtitle}>{subtitle}</AppText> : null}
          {note ? <AppText variant="small" tone="soft" style={styles.note}>{note}</AppText> : null}
          {actionLabel ? <AppButton title={actionLabel} onPress={onActionPress} style={styles.button} /> : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    padding: AppTheme.spacing.md
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: AppTheme.spacing.md,
    padding: AppTheme.spacing.xl,
    borderRadius: AppTheme.radius.lg,
    backgroundColor: AppTheme.colors.surface,
    ...AppTheme.shadow.card
  },
  subtitle: {
    textAlign: 'center'
  },
  note: {
    textAlign: 'center',
    maxWidth: 320
  },
  button: {
    marginTop: AppTheme.spacing.md,
    width: 220
  }
});
