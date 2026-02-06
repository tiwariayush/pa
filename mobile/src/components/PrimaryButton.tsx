import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { spacing, typography, shadows, theme, useTheme } from '../theme/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  /** Optional icon to show before label */
  icon?: keyof typeof MaterialIcons.glyphMap;
  /** Use outline/secondary variant */
  variant?: 'filled' | 'outline' | 'ghost';
}

/**
 * PrimaryButton
 * App-wide primary CTA with loading, disabled states, icon support,
 * and outline/ghost variants.
 */
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
  icon,
  variant = 'filled',
}) => {
  const dynamicTheme = useTheme();
  const isDisabled = disabled || loading;

  const isFilled = variant === 'filled';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isFilled && styles.buttonFilled,
        isOutline && [styles.buttonOutline, { borderColor: dynamicTheme.colors.primary }],
        isGhost && styles.buttonGhost,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isFilled ? '#FFFFFF' : dynamicTheme.colors.primary} />
      ) : (
        <View style={styles.content}>
          {icon && (
            <MaterialIcons
              name={icon}
              size={18}
              color={isFilled ? '#FFFFFF' : dynamicTheme.colors.primary}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.label,
              { fontFamily: dynamicTheme.typography.fontFamily.semibold },
              isFilled && styles.labelFilled,
              (isOutline || isGhost) && { color: dynamicTheme.colors.primary },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFilled: {
    backgroundColor: theme.colors.primary,
    ...shadows.sm,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  labelFilled: {
    color: '#FFFFFF',
  },
});

export default PrimaryButton;
