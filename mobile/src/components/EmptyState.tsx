import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  style?: ViewStyle | ViewStyle[];
}

/**
 * EmptyState
 * Reusable illustration-like empty state for lists / screens.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '✨',
  title,
  message,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    fontSize: typography.sizes.xxxl,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    textAlign: 'center',
  },
});

export default EmptyState;


