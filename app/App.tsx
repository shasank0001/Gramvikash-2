import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { useAppStore } from './src/store/useAppStore';
import { requestMicPermission } from './src/services/voiceService';
import { requestLocationPermission, getCurrentLocation } from './src/services/locationService';

export default function App() {
  const { setIsOffline, setLocation } = useAppStore();

  useEffect(() => {
    bootstrapApp();
  }, []);

  const bootstrapApp = async () => {
    // Request permissions on startup
    await Promise.all([
      requestMicPermission(),
      requestLocationPermission(),
    ]);

    // Get initial location
    const loc = await getCurrentLocation();
    if (loc) {
      setLocation({ ...loc, radiusKm: 10 });
    }
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
