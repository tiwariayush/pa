/**
 * Main tab navigator for authenticated users
 * Implements the 5-tab structure: Home, Inbox, Tasks, Calendar, Assistant
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import { MainTabParamList } from '../types';
import { colors, typography, useTheme } from '../theme/theme';

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
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Inbox':
              iconName = 'inbox';
              break;
            case 'Tasks':
              iconName = 'assignment';
              break;
            case 'Calendar':
              iconName = 'event';
              break;
            case 'Assistant':
              iconName = 'chat';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'help';
          }

          const iconSize = focused ? size + 2 : size;

          return (
            <React.Fragment>
              <MaterialIcons
                name={iconName}
                size={iconSize}
                color={color}
              />
            </React.Fragment>
          );
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 74,
        },
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.medium,
          fontFamily: theme.typography.fontFamily.medium,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray[200],
        },
        headerTitleStyle: {
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.semibold,
          fontFamily: theme.typography.fontFamily.semibold,
          color: theme.colors.onSurface,
          letterSpacing: 0.4,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Today',
          headerTitle: 'What should I do now?',
        }}
      />
      
      <Tab.Screen 
        name="Inbox" 
        component={InboxScreen}
        options={{
          title: 'Inbox',
          headerTitle: 'Captured Items',
          tabBarBadge: undefined, // Will be set dynamically based on unprocessed items
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
          title: 'Assistant',
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

export default MainTabNavigator;
