/**
 * Authentication store using Zustand
 * Manages user authentication state and operations
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { User, AuthState } from '../types';
import { apiService } from '../services/api';

interface AuthStore extends AuthState {
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,

    initialize: async () => {
      set({ isLoading: true });
      
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const userData = await AsyncStorage.getItem('user_data');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        set({ isLoading: false });
      }
    },

    login: async (email: string, password: string) => {
      set({ isLoading: true });
      
      try {
        const { user, token } = await apiService.login(email, password);
        
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error: any) {
        set({ isLoading: false });
        throw new Error(error.response?.data?.detail || 'Login failed');
      }
    },

    register: async (userData: any) => {
      set({ isLoading: true });
      
      try {
        const { user, token } = await apiService.register(userData);
        
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error: any) {
        set({ isLoading: false });
        throw new Error(error.response?.data?.detail || 'Registration failed');
      }
    },

    logout: async () => {
      set({ isLoading: true });
      
      try {
        await apiService.logout();
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      } catch (error) {
        console.error('Logout error:', error);
        // Even if logout fails, clear local state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    },

    setUser: (user: User | null) => {
      set({ user, isAuthenticated: !!user });
    },

    setToken: (token: string | null) => {
      set({ token });
    },

    setLoading: (isLoading: boolean) => {
      set({ isLoading });
    },
  }))
);

// React Context for auth store
const AuthContext = createContext<AuthStore | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const store = useAuthStore();

  // Initialize auth state once on mount.
  // Use the store's static getState() to avoid re-running on every state change.
  React.useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  return (
    <AuthContext.Provider value={store}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth store
export const useAuth = (): AuthStore => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Selector hooks for specific auth state
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
