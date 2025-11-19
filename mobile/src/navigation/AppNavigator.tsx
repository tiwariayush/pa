/**
 * Main app navigator
 * Handles authentication flow and main app navigation
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

import { RootStackParamList } from '../types';
import { useAuthLoading, useIsAuthenticated } from '../stores/AuthStore';
import MainDrawerNavigator from './MainDrawerNavigator';
import LoginScreen from '../screens/auth/LoginScreen';
import TaskDetailScreen from '../screens/tasks/TaskDetailScreen';
import VoiceCaptureScreen from '../screens/capture/VoiceCaptureScreen';
import CaptureReviewScreen from '../screens/capture/CaptureReviewScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current }) => ({
          cardStyle: {
            opacity: current.progress,
          },
        }),
      }}
    >
      {isAuthenticated ? (
        // Authenticated stack
        <>
          <Stack.Screen 
            name="Main" 
            component={MainDrawerNavigator}
          />
          <Stack.Screen 
            name="TaskDetail" 
            component={TaskDetailScreen}
            options={{
              headerShown: true,
              title: 'Task Details',
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="VoiceCapture" 
            component={VoiceCaptureScreen}
            options={{
              headerShown: true,
              title: 'Voice Capture',
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="CaptureReview" 
            component={CaptureReviewScreen}
            options={{
              headerShown: true,
              title: 'Review Capture',
              presentation: 'modal',
            }}
          />
        </>
      ) : (
        // Unauthenticated stack
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
        />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
