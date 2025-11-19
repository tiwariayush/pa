/**
 * Theme Definitions
 * Multiple font and background theme options
 */

import { FontTheme, BackgroundTheme } from '../stores/ThemeStore';

// Font configurations
export const fontThemes: Record<FontTheme, {
  name: string;
  description: string;
  fontFamily: {
    regular: string;
    light: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}> = {
  'space-grotesk': {
    name: 'Space Grotesk',
    description: 'Geometric sans-serif, modern and technical',
    fontFamily: {
      regular: 'SpaceGrotesk-Regular',
      light: 'SpaceGrotesk-Light',
      medium: 'SpaceGrotesk-Medium',
      semibold: 'SpaceGrotesk-SemiBold',
      bold: 'SpaceGrotesk-Bold',
    },
  },
  'inter': {
    name: 'Inter',
    description: 'Clean, highly legible sans-serif',
    fontFamily: {
      regular: 'Inter-Regular',
      light: 'Inter-Light',
      medium: 'Inter-Medium',
      semibold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
    },
  },
  'dm-sans': {
    name: 'DM Sans',
    description: 'Versatile sans-serif, great for UI',
    fontFamily: {
      regular: 'DMSans-Regular',
      light: 'DMSans-Light',
      medium: 'DMSans-Medium',
      semibold: 'DMSans-SemiBold',
      bold: 'DMSans-Bold',
    },
  },
  'manrope': {
    name: 'Manrope',
    description: 'Open-source sans-serif, friendly and readable',
    fontFamily: {
      regular: 'Manrope-Regular',
      light: 'Manrope-Light',
      medium: 'Manrope-Medium',
      semibold: 'Manrope-SemiBold',
      bold: 'Manrope-Bold',
    },
  },
  'work-sans': {
    name: 'Work Sans',
    description: 'Designed for screens, excellent readability',
    fontFamily: {
      regular: 'WorkSans-Regular',
      light: 'WorkSans-Light',
      medium: 'WorkSans-Medium',
      semibold: 'WorkSans-SemiBold',
      bold: 'WorkSans-Bold',
    },
  },
  'plus-jakarta-sans': {
    name: 'Plus Jakarta Sans',
    description: 'Modern sans-serif with geometric influences',
    fontFamily: {
      regular: 'PlusJakartaSans-Regular',
      light: 'PlusJakartaSans-Light',
      medium: 'PlusJakartaSans-Medium',
      semibold: 'PlusJakartaSans-SemiBold',
      bold: 'PlusJakartaSans-Bold',
    },
  },
};

// Background configurations
export const backgroundThemes: Record<BackgroundTheme, {
  name: string;
  description: string;
  colors: {
    background: string;
    surface: string;
    surfaceVariant: string;
    outline: string;
  };
}> = {
  chalk: {
    name: 'Light Chalk',
    description: 'Very light, neutral chalk color',
    colors: {
      background: '#FAFAF9',
      surface: '#FFFFFF',
      surfaceVariant: '#F7F7F5',
      outline: '#E8E8E6',
    },
  },
  'warm-beige': {
    name: 'Warm Beige',
    description: 'Soft, warm paper-like background',
    colors: {
      background: '#F5F1E6',
      surface: '#FFFFFF',
      surfaceVariant: '#F8F7F4',
      outline: '#E0D3BD',
    },
  },
  'cool-gray': {
    name: 'Cool Gray',
    description: 'Modern, cool-toned neutral',
    colors: {
      background: '#F8F9FA',
      surface: '#FFFFFF',
      surfaceVariant: '#F1F3F5',
      outline: '#DEE2E6',
    },
  },
  'paper-white': {
    name: 'Paper White',
    description: 'Pure white with subtle warmth',
    colors: {
      background: '#FEFEFE',
      surface: '#FFFFFF',
      surfaceVariant: '#FAFAFA',
      outline: '#F0F0F0',
    },
  },
  cream: {
    name: 'Cream',
    description: 'Soft, warm cream tone',
    colors: {
      background: '#FFFEF7',
      surface: '#FFFFFF',
      surfaceVariant: '#FFFCF5',
      outline: '#F5F0E1',
    },
  },
  sage: {
    name: 'Sage',
    description: 'Subtle green-gray, calming',
    colors: {
      background: '#F7F8F6',
      surface: '#FFFFFF',
      surfaceVariant: '#F2F4F0',
      outline: '#E0E4DD',
    },
  },
};

