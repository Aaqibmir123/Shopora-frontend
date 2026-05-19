import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTheme } from '@/theme';

type Props = ViewProps & {
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
};

export function Screen({ style, children, edges = ['top', 'bottom', 'left', 'right'], ...props }: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <View style={[styles.container, style]} {...props}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppTheme.colors.background },
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background
  }
});
