import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme, spacing, shadows } from '../theme/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Card
 * Generic elevated surface used across Home, Tasks, Inbox, etc.
 */
export const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
});

export default Card;


