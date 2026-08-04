import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { useAuth, useSwitchAccount } from '@/lib/auth';
import { usePolling } from '@/lib/hooks';
import { C } from '@/lib/theme';

// 홈 공통 헤더 — 워드마크 + 알림 벨(미읽음 뱃지) + 계정 전환 아이콘
export function HomeHeader({ light }: { subtitle?: string; light?: boolean }) {
  const { me } = useAuth();
  const router = useRouter();
  const switchAccount = useSwitchAccount();

  const recipient =
    me?.role === 'STORE' && me.storeId
      ? ({ type: 'STORE', id: me.storeId } as const)
      : me?.role === 'FACILITY' && me.facilityId
        ? ({ type: 'FACILITY', id: me.facilityId } as const)
        : null;

  const { data: unread } = usePolling(
    () =>
      recipient ? api.unreadCount(recipient.type, recipient.id) : Promise.resolve({ count: 0 }),
    5000,
  );

  const fg = light ? '#FFFFFF' : C.text;

  return (
    <View style={s.wrap}>
      <Text style={[s.logo, { color: fg }]}>이음</Text>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {recipient ? (
          <Pressable
            onPress={() => router.push('/notifications')}
            hitSlop={6}
            style={({ pressed }) => [s.iconButton, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="notifications-outline" size={23} color={fg} />
            {unread && unread.count > 0 ? (
              <View style={s.dot}>
                <Text style={s.dotText}>{unread.count > 9 ? '9+' : unread.count}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
        <Pressable
          onPress={switchAccount}
          hitSlop={6}
          style={({ pressed }) => [s.iconButton, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="swap-horizontal-outline" size={23} color={fg} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  logo: { fontSize: 20, fontFamily: 'Pretendard-Black' },
  iconButton: { padding: 6 },
  dot: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  dotText: { color: '#FFF', fontSize: 9.5, fontFamily: 'Pretendard-ExtraBold' },
});
