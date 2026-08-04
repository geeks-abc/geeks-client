import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, EmptyState, SectionTitle } from '@/components/ui';
import { api, Notice } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtDateTime, usePolling } from '@/lib/hooks';
import { C } from '@/lib/theme';

const TYPE_LABEL: Record<string, string> = {
  NEW_LISTING: '새 기부 등록',
  MATCHED: '매칭 확정',
  COMPLETED: '인수 완료',
  MATCH_CANCELLED: '픽업 취소',
};

export default function Notifications() {
  const { me } = useAuth();
  const router = useRouter();

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
  );

  // 알림함을 열면 전체 읽음 처리 (벨 뱃지 초기화)
  useEffect(() => {
    if (recipient) api.readAll(recipient.type, recipient.id).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipient?.type, recipient?.id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <SectionTitle>알림</SectionTitle>
        {notices === null ? null : notices.length === 0 ? (
          <EmptyState title="알림이 없어요" />
        ) : (
          notices.map((notice) => (
            <Card key={notice.id} style={{ gap: 4, opacity: notice.read ? 0.6 : 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={s.type}>{TYPE_LABEL[notice.type] ?? notice.type}</Text>
                <Text style={s.date}>{fmtDateTime(notice.createdAt)}</Text>
              </View>
              <Text style={s.body}>
                {String(notice.payload.itemName ?? '')}
                {notice.payload.quantity ? ` ${notice.payload.quantity}개` : ''}
                {notice.payload.storeName ? ` · ${notice.payload.storeName}` : ''}
                {notice.payload.facilityName ? ` · ${notice.payload.facilityName}` : ''}
              </Text>
            </Card>
          ))
        )}
        <Button title="닫기" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  type: { fontSize: 13, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  date: { fontSize: 11, fontFamily: 'Pretendard-Regular', color: C.gray },
  body: { fontSize: 14, fontFamily: 'Pretendard-Regular', color: C.sub },
});
