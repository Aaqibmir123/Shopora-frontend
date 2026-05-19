import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store } from '@/store/store';
import { RootNavigator } from '@/navigation/RootNavigator';
import { FeedbackToast } from '@/components/common/FeedbackToast';
import { processOfflineQueue, registerDefaultOfflineHandlers } from '@/services/offlineQueue';
import { AuthProvider } from '@/context/AuthContext';

function OfflineBootstrap() {
  useEffect(() => {
    registerDefaultOfflineHandlers();
    void processOfflineQueue();
    const timer = setInterval(() => {
      void processOfflineQueue();
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  return null;
}

function AppShell() {
  return (
    <NavigationContainer theme={DefaultTheme}>
      <StatusBar style="dark" />
      <RootNavigator />
      <FeedbackToast />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <AuthProvider>
            <OfflineBootstrap />
            <AppShell />
          </AuthProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
