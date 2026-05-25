import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

function RootLayoutContent() {
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem('@camouflage_enabled').then(enabled => {
      if (enabled === 'true') {
        router.replace('/notepad');
      }
    });
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="home" />
      <Stack.Screen name="perfil" />
      <Stack.Screen name="notepad" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
