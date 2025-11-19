/**
 * Hook to get text styles with dynamic font family
 * Use this instead of static typography.fontFamily
 */

import { useMemo } from 'react';
import { useTheme } from './theme';
import { typography } from './theme';

export const useTextStyles = () => {
  const theme = useTheme();
  const fontFamily = theme.typography.fontFamily;

  return useMemo(
    () => ({
      regular: {
        fontFamily: fontFamily.regular,
        fontSize: typography.sizes.sm,
      },
      medium: {
        fontFamily: fontFamily.medium,
        fontSize: typography.sizes.md,
      },
      semibold: {
        fontFamily: fontFamily.semibold,
        fontSize: typography.sizes.md,
      },
      bold: {
        fontFamily: fontFamily.bold,
        fontSize: typography.sizes.lg,
      },
      light: {
        fontFamily: fontFamily.light,
        fontSize: typography.sizes.sm,
      },
      // Size variants
      xs: {
        fontFamily: fontFamily.regular,
        fontSize: typography.sizes.xs,
      },
      sm: {
        fontFamily: fontFamily.regular,
        fontSize: typography.sizes.sm,
      },
      md: {
        fontFamily: fontFamily.regular,
        fontSize: typography.sizes.md,
      },
      lg: {
        fontFamily: fontFamily.regular,
        fontSize: typography.sizes.lg,
      },
      xl: {
        fontFamily: fontFamily.regular,
        fontSize: typography.sizes.xl,
      },
      xxl: {
        fontFamily: fontFamily.semibold,
        fontSize: typography.sizes.xxl,
      },
      xxxl: {
        fontFamily: fontFamily.bold,
        fontSize: typography.sizes.xxxl,
      },
    }),
    [fontFamily]
  );
};

