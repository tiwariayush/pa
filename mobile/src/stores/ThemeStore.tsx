/**
 * Theme Store
 * Manages theme selection (fonts and backgrounds) with persistence
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontTheme = 
  | 'space-grotesk'
  | 'inter'
  | 'dm-sans'
  | 'manrope'
  | 'work-sans'
  | 'plus-jakarta-sans';

export type BackgroundTheme = 
  | 'chalk'
  | 'warm-beige'
  | 'cool-gray'
  | 'paper-white'
  | 'cream'
  | 'sage';

export interface ThemeConfig {
  font: FontTheme;
  background: BackgroundTheme;
}

interface ThemeStore {
  currentTheme: ThemeConfig;
  setFont: (font: FontTheme) => Promise<void>;
  setBackground: (background: BackgroundTheme) => Promise<void>;
  setTheme: (theme: ThemeConfig) => Promise<void>;
  initialize: () => Promise<void>;
}

const DEFAULT_THEME: ThemeConfig = {
  font: 'space-grotesk',
  background: 'chalk',
};

const STORAGE_KEY = 'app_theme';

export const useThemeStore = create<ThemeStore>()(
  subscribeWithSelector((set, get) => ({
    currentTheme: DEFAULT_THEME,

    initialize: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const theme = JSON.parse(stored) as ThemeConfig;
          set({ currentTheme: theme });
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    },

    setFont: async (font: FontTheme) => {
      const newTheme = { ...get().currentTheme, font };
      set({ currentTheme: newTheme });
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTheme));
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    },

    setBackground: async (background: BackgroundTheme) => {
      const newTheme = { ...get().currentTheme, background };
      set({ currentTheme: newTheme });
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTheme));
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    },

    setTheme: async (theme: ThemeConfig) => {
      set({ currentTheme: theme });
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    },
  }))
);

