import React from 'react';
import { TextInput, View, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Controller } from 'react-hook-form';

import { AppText } from './AppText';
import { AppTheme } from '@/theme';

type Props = TextInputProps & {
  control: any;
  name: string;
  label?: string;
  helperText?: string;
  prefix?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
};

export function AppInput({ control, name, label, helperText, prefix, required, style, containerStyle, ...props }: Props) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }: any) => (
        <View style={[styles.container, containerStyle]}>
          {label ? (
            <AppText variant="label" style={styles.label}>
              {label}
              {required ? ' *' : ''}
            </AppText>
          ) : null}
          <View style={[styles.inputWrap, fieldState?.error ? styles.inputErrorWrap : null]}>
            {prefix ? (
              <View style={styles.prefixWrap}>
                <AppText variant="body" tone="soft" style={styles.prefixText}>{prefix}</AppText>
                <View style={styles.prefixDivider} />
              </View>
            ) : null}
            <TextInput
              value={field.value as string}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholderTextColor={AppTheme.colors.textSoft + '80'}
              style={[styles.input, prefix ? styles.inputWithPrefix : null, style]}
              {...props}
            />
          </View>
          {fieldState?.error?.message || helperText ? (
            <AppText variant="small" tone={fieldState?.error?.message ? 'primary' : 'soft'} style={styles.helper}>
              {fieldState?.error?.message ?? helperText}
            </AppText>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { gap: AppTheme.spacing.sm },
  label: { marginLeft: 2 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden'
  },
  inputErrorWrap: {
    borderColor: AppTheme.colors.danger,
    backgroundColor: '#FFF4F3'
  },
  prefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: AppTheme.spacing.md
  },
  prefixText: {
    fontWeight: '700'
  },
  prefixDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: AppTheme.colors.border,
    marginLeft: AppTheme.spacing.sm
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: AppTheme.spacing.md,
    color: AppTheme.colors.text
  },
  inputWithPrefix: {
    paddingLeft: AppTheme.spacing.sm
  },
  inputError: {
    borderColor: AppTheme.colors.danger,
    paddingHorizontal: AppTheme.spacing.md,
    backgroundColor: '#FFF4F3'
  },
  helper: { marginLeft: 2 }
});
