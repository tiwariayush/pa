import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/stores/AuthStore';
import { TaskProvider } from './src/stores/TaskStore';
import { useThemeStore } from './src/stores/ThemeStore';
import { theme } from './src/theme/theme';

export default function App() {
  const initializeTheme = useThemeStore((state) => state.initialize);
  const [fontsLoaded] = useFonts({
    // Space Grotesk (can use root files or folder)
    'SpaceGrotesk-Regular': require('./assets/fonts/SpaceGrotesk-Regular.ttf'),
    'SpaceGrotesk-Light': require('./assets/fonts/SpaceGrotesk-Light.ttf'),
    'SpaceGrotesk-Medium': require('./assets/fonts/SpaceGrotesk-Medium.ttf'),
    'SpaceGrotesk-SemiBold': require('./assets/fonts/SpaceGrotesk-SemiBold.ttf'),
    'SpaceGrotesk-Bold': require('./assets/fonts/SpaceGrotesk-Bold.ttf'),
    
    // Inter
    'Inter-Regular': require('./assets/fonts/Inter/static/Inter_18pt-Regular.ttf'),
    'Inter-Light': require('./assets/fonts/Inter/static/Inter_18pt-Light.ttf'),
    'Inter-Medium': require('./assets/fonts/Inter/static/Inter_18pt-Medium.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter/static/Inter_18pt-SemiBold.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter/static/Inter_18pt-Bold.ttf'),
    
    // DM Sans
    'DMSans-Regular': require('./assets/fonts/DM_Sans/static/DMSans-Regular.ttf'),
    'DMSans-Light': require('./assets/fonts/DM_Sans/static/DMSans-Light.ttf'),
    'DMSans-Medium': require('./assets/fonts/DM_Sans/static/DMSans-Medium.ttf'),
    'DMSans-SemiBold': require('./assets/fonts/DM_Sans/static/DMSans-SemiBold.ttf'),
    'DMSans-Bold': require('./assets/fonts/DM_Sans/static/DMSans-Bold.ttf'),
    
    // Manrope
    'Manrope-Regular': require('./assets/fonts/Manrope/static/Manrope-Regular.ttf'),
    'Manrope-Light': require('./assets/fonts/Manrope/static/Manrope-Light.ttf'),
    'Manrope-Medium': require('./assets/fonts/Manrope/static/Manrope-Medium.ttf'),
    'Manrope-SemiBold': require('./assets/fonts/Manrope/static/Manrope-SemiBold.ttf'),
    'Manrope-Bold': require('./assets/fonts/Manrope/static/Manrope-Bold.ttf'),
    
    // Work Sans
    'WorkSans-Regular': require('./assets/fonts/Work_Sans/static/WorkSans-Regular.ttf'),
    'WorkSans-Light': require('./assets/fonts/Work_Sans/static/WorkSans-Light.ttf'),
    'WorkSans-Medium': require('./assets/fonts/Work_Sans/static/WorkSans-Medium.ttf'),
    'WorkSans-SemiBold': require('./assets/fonts/Work_Sans/static/WorkSans-SemiBold.ttf'),
    'WorkSans-Bold': require('./assets/fonts/Work_Sans/static/WorkSans-Bold.ttf'),
    
    // Plus Jakarta Sans
    'PlusJakartaSans-Regular': require('./assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Light': require('./assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-Light.ttf'),
    'PlusJakartaSans-Medium': require('./assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('./assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('./assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-Bold.ttf'),
  });

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AuthProvider>
            <TaskProvider>
              <AppNavigator />
              <StatusBar style="auto" />
            </TaskProvider>
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
