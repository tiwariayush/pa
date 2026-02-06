/**
 * Main tab navigator for authenticated users
 * Implements the 6-tab structure: Home, Inbox, Tasks, Calendar, Assistant, Settings
 * With polished styling, responsive sizing, and clean headers.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useWindowDimensions, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { MainTabParamList } from '../types';
import { colors, typography, shadows, useTheme } from '../theme/theme';

// Import screens
import HomeScreen from '../screens/home/HomeScreen';
import InboxScreen from '../screens/inbox/InboxScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import AssistantScreen from '../screens/assistant/AssistantScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();

  const isSmallWidth = width < 360;
  const isShortHeight = height < 700;

  const tabBarHeight = isShortHeight ? 62 : 78;
  const labelFontSize = isSmallWidth ? typography.sizes.xs - 1 : typography.sizes.xs;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home';
              break;
            case 'Inbox':
              iconName = focused ? 'inbox' : 'inbox';
              break;
            case 'Tasks':
              iconName = focused ? 'assignment' : 'assignment';
              break;
            case 'Calendar':
              iconName = focused ? 'event' : 'event';
              break;
            case 'Assistant':
              iconName = focused ? 'auto-awesome' : 'auto-awesome';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings';
              break;
            default:
              iconName = 'help';
          }

          return (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <MaterialIcons
                name={iconName}
                size={focused ? 22 : 20}
                color={color}
              />
            </View>
          );
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingBottom: isShortHeight ? 6 : 10,
          paddingTop: 8,
          height: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: labelFontSize,
          fontWeight: typography.weights.medium,
          fontFamily: theme.typography.fontFamily.medium,
          letterSpacing: 0.3,
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.outline,
        },
        headerTitleStyle: {
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.semibold,
          fontFamily: theme.typography.fontFamily.semibold,
          color: theme.colors.onSurface,
          letterSpacing: -0.2,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerTitle: 'Today',
        }}
      />

      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          title: 'Inbox',
          headerTitle: 'Inbox',
        }}
      />

      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          title: 'Tasks',
          headerTitle: 'My Tasks',
        }}
      />

      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: 'Calendar',
          headerTitle: 'Schedule',
        }}
      />

      <Tab.Screen
        name="Assistant"
        component={AssistantScreen}
        options={{
          title: 'AI',
          headerTitle: 'AI Assistant',
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 28,
    borderRadius: 8,
  },
  iconContainerFocused: {
    backgroundColor: colors.gray[100],
  },
});

export default MainTabNavigator;
