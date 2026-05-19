import React from 'react';
import { View, StyleSheet } from 'react-native';

import { AppText } from './AppText';

interface PolicySectionProps {
  returnPolicy?: string;
  replacementPolicy?: string;
  paymentSafety?: string;
}

const PolicySection: React.FC<PolicySectionProps> = ({
  returnPolicy = 'Return terms are shown on each listing.',
  replacementPolicy = 'Replacement support follows the item policy.',
  paymentSafety = 'Payments are handled through secure checkout.'
}) => {
  return (
    <View style={styles.container}>
      <AppText style={styles.header}>Policies</AppText>
      <AppText style={styles.policy}>• Return: {returnPolicy}</AppText>
      <AppText style={styles.policy}>• Replacement: {replacementPolicy}</AppText>
      <AppText style={styles.policy}>• Payment safety: {paymentSafety}</AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    elevation: 1
  },
  header: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8
  },
  policy: {
    fontSize: 14,
    marginBottom: 4,
    color: '#444'
  }
});

export default PolicySection;
