import { useState, useEffect, useCallback } from 'react';
import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { LogBox } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SessionContext } from '@/context/SessionContext';
import type { Role } from '@/types';

// Suppress Expo Go push notification warning for the demo
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  const [role, setRole] = useState<Role | null>(null);
  const [managerId, setManagerId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SessionContext.Provider value={{ role, setRole, managerId, setManagerId, token, setToken, email, setEmail }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#111315' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="operator-login" />
        <Stack.Screen name="manager-login" />
        <Stack.Screen name="(operator)" />
        <Stack.Screen name="(manager)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </SessionContext.Provider>
  );
}