import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, useTheme } from '../theme/theme';

interface ScreenProps {
  children: React.ReactNode;
  /**
   * Optional style overrides for the root container.
   * Use this to change padding / alignment on specific screens.
   */
  style?: ViewStyle | ViewStyle[];
}

/**
 * Screen
 * Shared layout wrapper that gives a consistent background, padding,
 * and safe-area handling across the app.
 */
export const Screen: React.FC<ScreenProps> = ({ children, style }) => {
  const theme = useTheme();
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
});

export default Screen;


