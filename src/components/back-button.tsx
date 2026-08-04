import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeBack } from '@/lib/navigation';
import { C } from '@/lib/theme';

// 상세 화면 상단 뒤로가기 아이콘
export function BackButton({ light }: { light?: boolean }) {
  const goBackSafe = useSafeBack();
  return (
    <Pressable
      onPress={goBackSafe}
      hitSlop={8}
      style={({ pressed }) => [s.button, light && s.light, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name="chevron-back" size={22} color={light ? '#FFF' : C.text} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.line,
  },
  light: { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'transparent' },
});
