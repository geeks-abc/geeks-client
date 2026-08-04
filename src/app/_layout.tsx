import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AuthProvider } from '@/lib/auth';
import { C } from '@/lib/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('@/assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-SemiBold': require('@/assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('@/assets/fonts/Pretendard-Bold.otf'),
    'Pretendard-ExtraBold': require('@/assets/fonts/Pretendard-ExtraBold.otf'),
    'Pretendard-Black': require('@/assets/fonts/Pretendard-Black.otf'),
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="store" />
        <Stack.Screen name="facility" />
        <Stack.Screen name="new-listing" options={{ presentation: 'modal' }} />
        <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
      </Stack>
    </AuthProvider>
  );
}
