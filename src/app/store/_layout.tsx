import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { C } from '@/lib/theme';

function Label({ focused, title }: { focused: boolean; title: string }) {
  return (
    <Text style={{ fontSize: 12, fontFamily: focused ? 'Pretendard-ExtraBold' : 'Pretendard-SemiBold', color: focused ? C.text : C.gray }}>
      {title}
    </Text>
  );
}

export default function StoreTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: C.card, borderTopColor: C.line, height: 84, paddingTop: 10 },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <Label focused={focused} title="홈" /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ tabBarIcon: ({ focused }) => <Label focused={focused} title="내역" /> }}
      />
    </Tabs>
  );
}
