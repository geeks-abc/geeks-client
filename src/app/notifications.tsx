import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListRowSkeleton } from '@/components/skeleton';
import { EmptyState } from '@/components/ui';
import { api, Notice } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';
import { useSafeBack } from '@/lib/navigation';

const TYPE_META: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; fg: string; bg: string }
> = {
  NEW_LISTING: { label: '주변에 새로운 나눔', icon: 'sparkles', fg: C.brand, bg: C.brandSoft },
  MATCHED: { label: '픽업이 정해졌어요', icon: 'calendar', fg: C.blue, bg: C.blueSoft },
  COMPLETED: { label: '전달 완료', icon: 'checkmark-circle', fg: '#FFFFFF', bg: C.navy },
  MATCH_CANCELLED: { label: '픽업이 취소됐어요', icon: 'close-circle', fg: C.red, bg: C.redSoft },
};

// "방금 전 / n분 전 / n시간 전 / n일 전" — 알림함용 상대 시간
const timeAgo = (iso: string) => {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
};

export default function Notifications() {
  const { me } = useAuth();
  const goBackSafe = useSafeBack();

  const recipient =
    me?.role === 'STORE' && me.storeId
      ? ({ type: 'STORE', id: me.storeId } as const)
      : me?.facilityId
        ? ({ type: 'FACILITY', id: me.facilityId } as const)
        : null;

  const { data: notices } = usePolling(
    () =>
      recipient
        ? api.notifications(recipient.type, recipient.id)
        : Promise.resolve([] as Notice[]),
    5000,
    [recipient?.type, recipient?.id],
  );

  // 알림함을 열면 전체 읽음 처리 (벨 뱃지 초기화)
  useEffect(() => {
    if (recipient) api.readAll(recipient.type, recipient.id).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipient?.type, recipient?.id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <View style={s.navbar}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          hitSlop={10}
          onPress={goBackSafe}
          style={({ pressed }) => [s.navButton, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={26} color={C.text} />
        </Pressable>
        <Text style={s.navTitle}>알림</Text>
        <View style={s.navButton} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {notices === null ? (
          <ListRowSkeleton />
        ) : notices.length === 0 ? (
          <EmptyState title="알림이 없어요" sub="새로운 소식이 오면 여기에 쌓여요." />
        ) : (
          <View style={s.listCard}>
            {notices.map((notice, index) => {
              const meta = TYPE_META[notice.type] ?? {
                label: notice.type,
                icon: 'notifications' as const,
                fg: C.sub,
                bg: C.graySoft,
              };
              const body = [
                [
                  String(notice.payload.itemName ?? ''),
                  notice.payload.quantity ? `${notice.payload.quantity}개` : '',
                ]
                  .filter(Boolean)
                  .join(' '),
                String(notice.payload.storeName ?? notice.payload.facilityName ?? ''),
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <View
                  key={notice.id}
                  style={[s.row, index < notices.length - 1 && s.rowDivider]}
                >
                  <View style={[s.iconCircle, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon} size={18} color={meta.fg} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[s.type, notice.read && s.readText]}>{meta.label}</Text>
                    {body ? (
                      <Text numberOfLines={1} style={s.body}>
                        {body}
                      </Text>
                    ) : null}
                  </View>
                  <View style={s.rowRight}>
                    <Text style={s.date}>{timeAgo(notice.createdAt)}</Text>
                    {!notice.read ? <View style={s.unreadDot} /> : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  navbar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navTitle: { color: C.text, fontSize: 17, fontFamily: 'Pretendard-ExtraBold' },
  content: { padding: 20, paddingTop: 8, paddingBottom: 32 },
  listCard: {
    backgroundColor: C.card,
    borderRadius: R.card,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  type: { fontSize: 14, fontFamily: 'Pretendard-Bold', color: C.text },
  readText: { color: C.sub },
  body: { fontSize: 12.5, fontFamily: 'Pretendard-Regular', color: C.sub },
  rowRight: { alignItems: 'flex-end', gap: 5 },
  date: { fontSize: 11, fontFamily: 'Pretendard-Regular', color: C.gray },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.brand },
});
