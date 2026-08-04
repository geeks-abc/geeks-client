import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { C } from '@/lib/theme';

function Label({ focused, title }: { focused: boolean; title: string }) {
  return (
    <Text style={{ fontSize: 12, fontWeight: focused ? '800' : '600', color: focused ? C.text : C.gray }}>
      {title}
    </Text>
  );
}

export default function FacilityTabs() {
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
        options={{ tabBarIcon: ({ focused }) => <Label focused={focused} title="피드" /> }}
      />
      <Tabs.Screen
        name="pickups"
        options={{ tabBarIcon: ({ focused }) => <Label focused={focused} title="픽업" /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ tabBarIcon: ({ focused }) => <Label focused={focused} title="내역" /> }}
      />
    </Tabs>
  );
}
