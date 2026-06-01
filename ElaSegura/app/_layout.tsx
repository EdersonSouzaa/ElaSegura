<<<<<<< HEAD
import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
=======
import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
>>>>>>> 825f13121a140c02c90bd695a3f4b1dbd851285a
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
<<<<<<< HEAD
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
=======
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Aqui ele vai carregar automaticamente as telas da pasta app */}
          <Stack.Screen name="index" />
          <Stack.Screen name="home" />
          <Stack.Screen name="perfil" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
>>>>>>> 825f13121a140c02c90bd695a3f4b1dbd851285a
  );
}
