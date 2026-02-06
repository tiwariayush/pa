import React from 'react';
import { View, StyleSheet, ViewStyle, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, useTheme } from '../theme/theme';

interface ScreenProps {
  children: React.ReactNode;
  /**
   * Optional style overrides for the root container.
   * Use this to change padding / alignment on specific screens.
   */
  style?: ViewStyle | ViewStyle[];
  /** If true, remove horizontal padding (useful for full-bleed lists) */
  noPadding?: boolean;
}

/**
 * Screen
 * Shared layout wrapper that gives a consistent background, padding,
 * safe-area handling, and status bar integration across the app.
 */
export const Screen: React.FC<ScreenProps> = ({ children, style, noPadding }) => {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
      />
      <View style={[styles.container, noPadding && styles.noPadding, style]}>
        {children}
      </View>
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
  noPadding: {
    paddingHorizontal: 0,
  },
});

export default Screen;
