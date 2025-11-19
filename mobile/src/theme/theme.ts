export const theme = {
  /**
   * Core theme palette
   * Inspired by a calm, data‑dashboard aesthetic:
   * - Warm, paper‑like backgrounds
   * - Soft card surfaces with subtle outlines
   * - Dark, inky text for strong contrast
   */
  colors: {
    // Primary accent – used for CTAs and key highlights
    primary: '#1F2937', // Inky charcoal
    secondary: '#A1623B', // Warm accent (copper)
    tertiary: '#6B7280', // Muted accent for secondary UI

    // Surfaces & background
    background: '#FAFAF9', // Light chalk color
    surface: '#FFFFFF', // Card / panel background
    surfaceVariant: '#F7F7F5', // Muted panels / headers

    // Semantic
    error: '#B91C1C',

    // Text & borders
    onSurface: '#1C1917', // Primary text
    onSurfaceVariant: '#4B5563', // Secondary text
    outline: '#E8E8E6', // Hairline borders / dividers (lighter for chalk background)
  },

  // Slightly tighter radius to feel more "dashboard" and less "mobile‑card"
  roundness: 10,
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
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 19,
    xxl: 23,
    xxxl: 30,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
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
