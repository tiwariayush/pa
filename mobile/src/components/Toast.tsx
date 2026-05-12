/**
 * Toast - Auto-dismissing toast notifications with slide animation,
 * swipe-to-dismiss, variant support, and queue management.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, shadows } from '../theme/theme';
import { useThemeStore } from '../stores/ThemeStore';
import { fontThemes } from '../theme/themes';

// Types
export type ToastVariant = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  text: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (text: string, variant?: ToastVariant) => void;
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Variant config
const variantConfig: Record<
  ToastVariant,
  { bg: string; icon: keyof typeof MaterialIcons.glyphMap; iconColor: string; textColor: string }
> = {
  success: {
    bg: '#ECFDF5',
    icon: 'check-circle',
    iconColor: colors.success,
    textColor: '#065F46',
  },
  error: {
    bg: '#FEF2F2',
    icon: 'error',
    iconColor: colors.error,
    textColor: '#991B1B',
  },
  info: {
    bg: '#EFF6FF',
    icon: 'info',
    iconColor: colors.info,
    textColor: '#1E40AF',
  },
};

const TOAST_DURATION = 3000;
const ANIMATION_DURATION = 250;
const SWIPE_THRESHOLD = 40;

// Individual toast view
const ToastView: React.FC<{
  message: ToastMessage;
  onDismiss: (id: number) => void;
}> = ({ message, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { currentTheme } = useThemeStore();
  const fontFamily = fontThemes[currentTheme.font]?.fontFamily?.medium || 'SpaceGrotesk-Medium';

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 80,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(message.id));
  }, [message.id, onDismiss, slideAnim, opacityAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > SWIPE_THRESHOLD) dismiss();
      },
    })
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(dismiss, TOAST_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss, slideAnim, opacityAnim]);

  const config = variantConfig[message.variant];

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.toast,
        { backgroundColor: config.bg },
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <MaterialIcons name={config.icon} size={18} color={config.iconColor} />
      <Text
        style={[
          styles.toastText,
          { color: config.textColor, fontFamily },
        ]}
        numberOfLines={2}
      >
        {message.text}
      </Text>
    </Animated.View>
  );
};

// Provider
let nextId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<ToastMessage[]>([]);
  const insets = useSafeAreaInsets();

  const current = queue.length > 0 ? queue[0] : null;

  const show = useCallback((text: string, variant: ToastVariant = 'info') => {
    setQueue((prev) => [...prev, { id: ++nextId, text, variant }]);
  }, []);

  const handleDismiss = useCallback((id: number) => {
    setQueue((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const ctx: ToastContextValue = {
    show,
    success: (text) => show(text, 'success'),
    error: (text) => show(text, 'error'),
    info: (text) => show(text, 'info'),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {current && (
        <View
          style={[styles.container, { bottom: insets.bottom + spacing.lg }]}
          pointerEvents="box-none"
        >
          <ToastView
            key={current.id}
            message={current}
            onDismiss={handleDismiss}
          />
        </View>
      )}
    </ToastContext.Provider>
  );
};

// Hook
export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: 12,
    gap: spacing.sm,
    width: '100%',
    ...shadows.md,
  },
  toastText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    lineHeight: 19,
  },
});
