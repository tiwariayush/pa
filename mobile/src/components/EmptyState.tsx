import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography, useTheme } from '../theme/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  style?: ViewStyle | ViewStyle[];
  /** Compact variant for inline use */
  compact?: boolean;
}

/**
 * EmptyState
 * Reusable illustration-like empty state for lists / screens.
 * Supports a compact variant for inline use inside cards.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '✨',
  title,
  message,
  style,
  compact = false,
}) => {
  const dynamicTheme = useTheme();

  return (
    <View style={[compact ? styles.containerCompact : styles.container, style]}>
      <View style={styles.iconWrapper}>
        <Text style={compact ? styles.iconCompact : styles.icon}>{icon}</Text>
      </View>
      <Text
        style={[
          compact ? styles.titleCompact : styles.title,
          { fontFamily: dynamicTheme.typography.fontFamily.semibold },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          compact ? styles.messageCompact : styles.message,
          { fontFamily: dynamicTheme.typography.fontFamily.regular },
        ]}
      >
        {message}
      </Text>
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
  containerCompact: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  iconWrapper: {
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 40,
  },
  iconCompact: {
    fontSize: 28,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  messageCompact: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 17,
  },
});

export default EmptyState;
