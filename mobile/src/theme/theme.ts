import { useThemeStore } from '../stores/ThemeStore';
import { fontThemes, backgroundThemes } from './themes';

// Base theme structure - colors that don't change
const baseTheme = {
  // Primary accent – used for CTAs and key highlights
  primary: '#1F2937', // Inky charcoal
  secondary: '#A1623B', // Warm accent (copper)
  tertiary: '#6B7280', // Muted accent for secondary UI

  // Semantic
  error: '#B91C1C',

  // Text colors (don't change with background)
  onSurface: '#1C1917', // Primary text
  onSurfaceVariant: '#4B5563', // Secondary text
};

// Default theme (for static imports)
export const theme = {
  colors: {
    ...baseTheme,
    // Surfaces & background - default to chalk
    background: '#FAFAF9',
    surface: '#FFFFFF',
    surfaceVariant: '#F7F7F5',
    outline: '#E8E8E6',
  },
  roundness: 10,
};

// Typography sizes and weights (don't change with theme)
const typographySizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 19,
  xxl: 23,
  xxxl: 30,
};

const typographyWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Hook to get dynamic theme based on user selection
export const useTheme = () => {
  const { currentTheme } = useThemeStore();
  const bgTheme = backgroundThemes[currentTheme.background];
  const fontTheme = fontThemes[currentTheme.font];

  return {
    colors: {
      ...baseTheme,
      background: bgTheme.colors.background,
      surface: bgTheme.colors.surface,
      surfaceVariant: bgTheme.colors.surfaceVariant,
      outline: bgTheme.colors.outline,
    },
    roundness: 10,
    typography: {
      fontFamily: fontTheme.fontFamily,
      sizes: typographySizes,
      weights: typographyWeights,
    },
  };
};

export const colors = {
  // Task domain colors
  domains: {
    family: '#EC4899', // Pink
    home: '#F59E0B', // Amber
    job: '#3B82F6', // Blue
    company: '#8B5CF6', // Purple
    personal: '#10B981', // Emerald
  },
  
  // Priority colors
  priorities: {
    critical: '#DC2626', // Red
    high: '#EA580C', // Orange
    medium: '#CA8A04', // Yellow
    low: '#059669', // Green
    someday: '#6B7280', // Gray
  },
  
  // Status colors
  statuses: {
    captured: '#6B7280',
    parsed: '#3B82F6',
    triaged: '#F59E0B',
    planned: '#8B5CF6',
    scheduled: '#EC4899',
    in_progress: '#10B981',
    done: '#059669',
    cancelled: '#9CA3AF',
  },
  
  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral colors – adjusted for lighter chalk background
  gray: {
    50: '#FAFAF9',
    100: '#F5F5F3',
    200: '#E8E8E6',
    300: '#D4D4D1',
    400: '#A3A3A0',
    500: '#73736F',
    600: '#52524E',
    700: '#40403C',
    800: '#2E2E2A',
    900: '#1C1C19',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 22,
  xl: 30,
  xxl: 44,
};

export const typography = {
  fontFamily: {
    regular: 'SpaceGrotesk-Regular',
    light: 'SpaceGrotesk-Light',
    medium: 'SpaceGrotesk-Medium',
    semibold: 'SpaceGrotesk-SemiBold',
    bold: 'SpaceGrotesk-Bold',
  },
  sizes: typographySizes,
  weights: typographyWeights,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
