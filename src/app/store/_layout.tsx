import { Tabs } from 'expo-router';
import React from 'react';
import { AppTabBar, TabMeta } from '@/components/tab-bar';

const TABS: Record<string, TabMeta> = {
  index: { icon: 'home', label: '홈' },
  history: { icon: 'receipt', label: '내역' },
};

export default function StoreTabs() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AppTabBar {...props} tabs={TABS} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
    </Tabs>
  );
}
