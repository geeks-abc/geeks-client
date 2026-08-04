import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { useAuth, useSwitchAccount } from '@/lib/auth';
import { usePolling } from '@/lib/hooks';
import { C } from '@/lib/theme';

// 홈 공통 헤더: 로고 + 현재 접속 + 알림 벨(미읽음 뱃지) + 계정 전환
export function HomeHeader({ subtitle, light }: { subtitle: string; light?: boolean }) {
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
    () => (recipient ? api.unreadCount(recipient.type, recipient.id) : Promise.resolve({ count: 0 })),
    5000,
  );

  return (
    <View style={s.wrap}>
      <View>
        <Text style={[s.logo, light && { color: C.yellow }]}>이음</Text>
        <Text style={[s.subtitle, light && { color: '#8D97AC' }]}>{subtitle}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {recipient ? (
          <Pressable style={s.chip} onPress={() => router.push('/notifications')}>
            <Text style={s.chipText}>알림</Text>
            {unread && unread.count > 0 ? (
              <View style={s.dot}>
                <Text style={s.dotText}>{unread.count}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
        <Pressable style={s.chip} onPress={switchAccount}>
          <Text style={s.chipText}>계정 전환</Text>
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
    paddingBottom: 16,
  },
  logo: { fontSize: 22, fontFamily: 'Pretendard-Black', color: C.text },
  subtitle: { fontSize: 11, fontFamily: 'Pretendard-Bold', color: C.sub, letterSpacing: 1.2, marginTop: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.card,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.line,
  },
  chipText: { fontSize: 13, fontFamily: 'Pretendard-Bold', color: C.text },
  dot: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dotText: { color: '#FFF', fontSize: 11, fontFamily: 'Pretendard-ExtraBold' },
});
