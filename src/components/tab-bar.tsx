import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/lib/theme';

export interface TabMeta {
  icon: keyof typeof Ionicons.glyphMap; // 채워진 아이콘 이름 (outline은 자동)
  label: string;
}

// expo-router Tabs가 넘겨주는 tabBar props 중 사용하는 부분만 정의
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  // react-navigation의 복잡한 제네릭 시그니처 대신 필요한 메서드만 사용
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  tabs: Record<string, TabMeta>;
}

// 커스텀 탭바 — 아이콘 + 활성 탭 그린 필 하이라이트
export function AppTabBar({ state, navigation, tabs }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const meta = tabs[route.name];
        if (!meta) return null;
        const active = state.index === index;

        return (
          <Pressable
            key={route.key}
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
            style={({ pressed }) => [s.tab, pressed && { opacity: 0.7 }]}
          >
            <View style={[s.iconPill, active && s.iconPillActive]}>
              <Ionicons
                name={active ? meta.icon : (`${meta.icon}-outline` as TabMeta['icon'])}
                size={21}
                color={active ? C.brandDeep : C.gray}
              />
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
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  iconPill: {
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: 999,
  },
  iconPillActive: { backgroundColor: C.brandSoft },
  label: { fontSize: 11, fontFamily: 'Pretendard-SemiBold', color: C.gray },
  labelActive: { color: C.brandDeep, fontFamily: 'Pretendard-ExtraBold' },
});
