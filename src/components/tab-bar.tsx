import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface TabMeta {
  icon?: string;
  label: string;
}

interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  // react-navigation tab bar props 중 필요한 부분만 사용합니다.
  navigation: any;
  tabs: Record<string, TabMeta>;
}

const NAVY = '#051224';
const SUB = '#8A8F96';
const YELLOW = '#FFCF14';
const LINE = '#E0E3E0';

/**
 * 최종 Figma 시안의 하단 내비게이션.
 * 아이콘 대신 텍스트와 활성 상태 점만 사용합니다.
 */
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
            <Text style={[s.label, active && s.labelActive]}>{meta.label}</Text>
            <View style={[s.dot, !active && s.dotHidden]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: LINE,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: 17,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 9,
  },
  pressed: { opacity: 0.62 },
  label: {
    color: SUB,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Pretendard-Regular',
  },
  labelActive: {
    color: NAVY,
    fontFamily: 'Pretendard-Bold',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: YELLOW,
  },
  dotHidden: { opacity: 0 },
});
