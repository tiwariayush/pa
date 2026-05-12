/**
 * Floating menu component
 * A hide/show menu that replaces the bottom tab bar
 * Shows navigation options in a floating overlay
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, typography, shadows, useTheme } from '../theme/theme';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList, MainTabParamList } from '../types';

interface MenuItem {
  name: string;
  screen: keyof MainTabParamList;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

const menuItems: MenuItem[] = [
  { name: 'Home', screen: 'Home', icon: 'home', label: 'Home' },
  { name: 'Inbox', screen: 'Inbox', icon: 'inbox', label: 'Inbox' },
  { name: 'Tasks', screen: 'Tasks', icon: 'assignment', label: 'Tasks' },
  { name: 'Calendar', screen: 'Calendar', icon: 'event', label: 'Calendar' },
  { name: 'Assistant', screen: 'Assistant', icon: 'auto-awesome', label: 'AI Assistant' },
  { name: 'Settings', screen: 'Settings', icon: 'settings', label: 'Settings' },
];

const FloatingMenu: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();

  const [isOpen, setIsOpen] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));

  const currentScreen = route.name;

  const toggleMenu = () => {
    if (isOpen) {
      // Close
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setIsOpen(false));
    } else {
      // Open
      setIsOpen(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleNavigate = (screen: MenuItem['screen']) => {
    if (currentScreen !== screen) {
      // Navigate to the screen within the Main stack navigator
      (navigation as any).navigate('Main', { screen });
    }
    toggleMenu();
  };

  const menuButtonPosition = {
    bottom: insets.bottom + 20,
    right: 20,
  };

  return (
    <>
      {/* Floating Menu Button */}
      <TouchableOpacity
        style={[
          styles.menuButton,
          {
            backgroundColor: theme.colors.primary,
            bottom: menuButtonPosition.bottom,
            right: menuButtonPosition.right,
          },
        ]}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={isOpen ? 'close' : 'menu'}
          size={24}
          color="white"
        />
      </TouchableOpacity>

      {/* Menu Overlay */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={toggleMenu}
      >
        <Pressable
          style={styles.overlay}
          onPress={toggleMenu}
        >
          <Animated.View
            style={[
              styles.menuContainer,
              {
                bottom: menuButtonPosition.bottom + 70,
                right: menuButtonPosition.right,
                opacity: opacityAnim,
                transform: [
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {menuItems.map((item, index) => {
              const isActive = currentScreen === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.menuItem,
                    {
                      backgroundColor: isActive
                        ? theme.colors.primary + '15'
                        : 'transparent',
                    },
                  ]}
                  onPress={() => handleNavigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuItemIcon,
                      {
                        backgroundColor: isActive
                          ? theme.colors.primary
                          : colors.gray[200],
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={20}
                      color={isActive ? 'white' : colors.gray[700]}
                    />
                  </View>
                  <Animated.Text
                    style={[
                      styles.menuItemLabel,
                      {
                        color: isActive
                          ? theme.colors.primary
                          : theme.colors.onSurface,
                        fontFamily: theme.typography.fontFamily.medium,
                      },
                    ]}
                  >
                    {item.label}
                  </Animated.Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 200,
    ...shadows.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
});

export default FloatingMenu;
