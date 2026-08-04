import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 역할별 탭 구성 — 단일 소스 (레이아웃에서 중복 정의 금지)
const STORE_TABS: Record<string, TabMeta> = {
  index: { icon: 'home', label: '홈' },
  history: { icon: 'receipt', label: '내역' },
  profile: { icon: 'person', label: '내 정보' },
};

const FACILITY_TABS: Record<string, TabMeta> = {
  index: { icon: 'storefront', label: '피드' },
  pickups: { icon: 'qr-code', label: '픽업' },
  history: { icon: 'receipt', label: '내역' },
  profile: { icon: 'person', label: '내 정보' },
};

// 가게/시설 공용 탭 내비게이터 — 양쪽 레이아웃이 이 컴포넌트 하나만 사용
export function RoleTabs({ role }: { role: 'STORE' | 'FACILITY' }) {
  const tabs = role === 'STORE' ? STORE_TABS : FACILITY_TABS;
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AppTabBar {...props} tabs={tabs} />}
    >
      {Object.keys(tabs).map((name) => (
        <Tabs.Screen key={name} name={name} />
      ))}
    </Tabs>
  );
}

export interface TabMeta {
  icon?: keyof typeof Ionicons.glyphMap; // 채워진 아이콘 이름 (비활성은 -outline 자동)
  label: string;
}

interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  // react-navigation tab bar props 중 필요한 부분만 사용합니다.
  navigation: any;
  tabs: Record<string, TabMeta>;
}

const NAVY = '#051224';
const SUB = '#9AA0A6';
const YELLOW = '#FFCF14';

// 하단 내비게이션 — 활성 탭은 옐로 필 + 채워진 아이콘, 비활성은 아웃라인
export function AppTabBar({ state, navigation, tabs }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const meta = tabs[route.name];
        if (!meta) return null;
        const active = state.index === index;
        const iconName = meta.icon
          ? active
            ? meta.icon
            : (`${meta.icon}-outline` as keyof typeof Ionicons.glyphMap)
          : undefined;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={active ? { selected: true } : {}}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!active && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={({ pressed }) => [s.tab, pressed && s.pressed]}
          >
            <View style={[s.iconPill, active && s.iconPillActive]}>
              {iconName ? (
                <Ionicons name={iconName} size={21} color={active ? NAVY : SUB} />
              ) : (
                <View style={[s.fallbackDot, { backgroundColor: active ? NAVY : SUB }]} />
              )}
            </View>
            <Text style={[s.label, active && s.labelActive]}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingHorizontal: 8,
    // 위쪽으로 은은한 그림자 (경계선 대체)
    shadowColor: '#0B1220',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 },
    elevation: 14,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 -6px 16px rgba(11, 18, 32, 0.08)' }
      : null),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  pressed: { opacity: 0.6 },
  iconPill: {
    width: 58,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconPillActive: { backgroundColor: YELLOW },
  fallbackDot: { width: 6, height: 6, borderRadius: 3 },
  label: {
    color: SUB,
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Pretendard-SemiBold',
  },
  labelActive: {
    color: NAVY,
    fontFamily: 'Pretendard-ExtraBold',
  },
});
