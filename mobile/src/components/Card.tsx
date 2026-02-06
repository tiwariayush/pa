import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { spacing, shadows, useTheme } from '../theme/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Add a colored left accent border */
  accentColor?: string;
  /** Use a more elevated look */
  elevated?: boolean;
}

/**
 * Card
 * Generic elevated surface used across Home, Tasks, Inbox, etc.
 * Supports dynamic theming, optional accent border, and elevated variant.
 */
export const Card: React.FC<CardProps> = ({ children, style, accentColor, elevated }) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
        elevated && styles.cardElevated,
        accentColor && {
          borderLeftWidth: 3,
          borderLeftColor: accentColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    ...shadows.sm,
  },
  cardElevated: {
    ...shadows.md,
    borderWidth: 0,
  },
});

export default Card;
