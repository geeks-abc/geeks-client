import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toaster } from 'sonner-native';
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
    <GestureHandlerRootView style={{ flex: 1 }}>
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.bg },
          // 웹에서 스택 전환 애니메이션이 opacity:0 상태로 멈춰
          // 화면이 빈 페이지로 보이는 문제 방지
          animation: Platform.OS === 'web' ? 'none' : 'default',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="store" />
        <Stack.Screen name="facility" />
        <Stack.Screen
          name="new-listing"
          options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_bottom' }}
        />
        <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
      </Stack>
      <Toaster position="top-center" />
    </AuthProvider>
    </GestureHandlerRootView>
  );
}
