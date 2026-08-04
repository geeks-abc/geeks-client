import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/lib/theme';

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

// 하단 내비게이션 — 활성 탭은 오렌지 소프트 필(아이콘+라벨)로 확장, 비활성은 아웃라인 아이콘만
export function AppTabBar({ state, navigation, tabs }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
            accessibilityLabel={meta.label}
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
            <Animated.View
              layout={LinearTransition.duration(220)}
              style={[s.pill, active && s.pillActive]}
            >
              {iconName ? (
                <Ionicons name={iconName} size={21} color={active ? C.brand : C.gray} />
              ) : (
                <View style={[s.fallbackDot, { backgroundColor: active ? C.brand : C.gray }]} />
              )}
              {active ? (
                <Animated.Text entering={FadeIn.duration(180)} style={s.pillLabel}>
                  {meta.label}
                </Animated.Text>
              ) : null}
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // 위쪽으로 은은한 그림자 (경계선 대체)
    shadowColor: '#0B1220',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -8 },
    elevation: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 -8px 20px rgba(11, 18, 32, 0.1)' }
      : null),
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    minWidth: 44,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: C.brandSoft,
    paddingHorizontal: 16,
  },
  pillLabel: {
    color: C.brandDeep,
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'Pretendard-Bold',
  },
  fallbackDot: { width: 6, height: 6, borderRadius: 3 },
});
