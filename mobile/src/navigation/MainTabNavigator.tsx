/**
 * Main tab navigator for authenticated users
 * Implements the 5-tab structure: Home, Inbox, Tasks, Calendar, Assistant
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import { MainTabParamList } from '../types';
import { colors, theme } from '../theme/theme';

// Import screens
import HomeScreen from '../screens/home/HomeScreen';
import InboxScreen from '../screens/inbox/InboxScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import AssistantScreen from '../screens/assistant/AssistantScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
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
            default:
              iconName = 'help';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: colors.gray[200],
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray[200],
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '600',
          color: colors.gray[900],
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
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
