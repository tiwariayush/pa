/**
 * Main drawer navigator for authenticated users
 * Replaces the bottom tab bar with a left-side drawer
 * that opens when tapping the 3-dot icon in the header.
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
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

const Drawer = createDrawerNavigator<MainTabParamList>();

const MainDrawerNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Drawer.Navigator
      screenOptions={({ route, navigation }) => ({
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
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: 260,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: colors.gray[600],
        drawerLabelStyle: {
          fontSize: typography.sizes.sm,
          fontFamily: theme.typography.fontFamily.regular,
        },
        // 3-dot button to toggle the drawer
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.toggleDrawer()}
            style={{ paddingHorizontal: 12 }}
          >
            <MaterialIcons
              name="more-vert"
              size={22}
              color={theme.colors.onSurface}
            />
          </TouchableOpacity>
        ),
        // Icons in the drawer list
        drawerIcon: ({ color, size }) => {
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

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Today',
          headerTitle: 'What should I do now?',
          drawerLabel: 'Home',
        }}
      />

      <Drawer.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          title: 'Inbox',
          headerTitle: 'Captured Items',
          drawerLabel: 'Inbox',
        }}
      />

      <Drawer.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          title: 'Tasks',
          headerTitle: 'My Tasks',
          drawerLabel: 'Tasks',
        }}
      />

      <Drawer.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: 'Calendar',
          headerTitle: 'Schedule',
          drawerLabel: 'Calendar',
        }}
      />

      <Drawer.Screen
        name="Assistant"
        component={AssistantScreen}
        options={{
          title: 'Assistant',
          headerTitle: 'AI Assistant',
          drawerLabel: 'Assistant',
        }}
      />

      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
          drawerLabel: 'Settings',
        }}
      />
    </Drawer.Navigator>
  );
};

export default MainDrawerNavigator;


