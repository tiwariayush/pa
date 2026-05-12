/**
 * Main stack navigator for authenticated users
 * Replaces bottom tabs with a stack navigator
 * Navigation is handled via FloatingMenu component
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';

import { MainTabParamList } from '../types';
import { colors, typography, useTheme } from '../theme/theme';

// Import screens
import HomeScreen from '../screens/home/HomeScreen';
import InboxScreen from '../screens/inbox/InboxScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import AssistantScreen from '../screens/assistant/AssistantScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Stack = createStackNavigator<MainTabParamList>();

const MainStackNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
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
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Today',
          headerTitle: 'Today',
        }}
      />

      <Stack.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          title: 'Inbox',
          headerTitle: 'Inbox',
        }}
      />

      <Stack.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          title: 'Tasks',
          headerTitle: 'My Tasks',
        }}
      />

      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: 'Calendar',
          headerTitle: 'Schedule',
        }}
      />

      <Stack.Screen
        name="Assistant"
        component={AssistantScreen}
        options={{
          title: 'AI Assistant',
          headerTitle: 'AI Assistant',
        }}
      />

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
        }}
      />
    </Stack.Navigator>
  );
};

export default MainStackNavigator;
