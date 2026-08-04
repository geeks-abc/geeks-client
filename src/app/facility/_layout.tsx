import { Tabs } from 'expo-router';
import React from 'react';
import { AppTabBar, TabMeta } from '@/components/tab-bar';

const TABS: Record<string, TabMeta> = {
  index: { icon: 'storefront', label: '피드' },
  pickups: { icon: 'qr-code', label: '픽업' },
  history: { icon: 'receipt', label: '내역' },
};

export default function FacilityTabs() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AppTabBar {...props} tabs={TABS} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="pickups" />
      <Tabs.Screen name="history" />
    </Tabs>
  );
}
