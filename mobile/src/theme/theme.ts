export const theme = {
  colors: {
    primary: '#6366F1', // Indigo
    secondary: '#EC4899', // Pink
    tertiary: '#10B981', // Emerald
    surface: '#FFFFFF',
    surfaceVariant: '#F8FAFC',
    background: '#FFFFFF',
    error: '#EF4444',
    onSurface: '#1E293B',
    onSurfaceVariant: '#64748B',
    outline: '#CBD5E1',
  },
  roundness: 12,
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
  
  // Neutral colors
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
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
