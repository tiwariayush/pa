import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { spacing, typography, shadows, theme, useTheme } from '../theme/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
}

/**
 * PrimaryButton
 * App-wide primary CTA with loading and disabled states.
 */
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
}) => {
  const dynamicTheme = useTheme();
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={[styles.label, { fontFamily: dynamicTheme.typography.fontFamily.semibold }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: spacing.md,
    borderRadius: theme.roundness,
    alignItems: 'center',
    justifyContent: 'center',
    // Softer elevation to match the flatter dashboard aesthetic
    ...shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});

export default PrimaryButton;


