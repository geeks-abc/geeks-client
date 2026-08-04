import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { HomeHeader } from '@/components/header';
import { Badge, Button, Card, EmptyState, SectionTitle } from '@/components/ui';
import { api, FeedItem } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtTime, usePolling } from '@/lib/hooks';
import { C } from '@/lib/theme';

// S-04 시설 피드 (3초 폴링) + S-04D 빈 상태
export default function FacilityFeed() {
  const { me } = useAuth();
  const router = useRouter();
  const facilityId = me?.facilityId;
  const [applying, setApplying] = useState<number | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  const { data: feed, refresh } = usePolling(
    () => (facilityId ? api.feed(facilityId) : Promise.resolve([] as FeedItem[])),
    3000,
  );

  const apply = async (item: FeedItem) => {
    if (!facilityId) return;
    setApplying(item.id);
    setApplyError(null);
    try {
      const match = await api.applyMatch(item.id, facilityId);
      router.push(`/pickup/${match.id}`);
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : '신청에 실패했어요. 다시 시도해주세요.');
      refresh();
    } finally {
      setApplying(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <HomeHeader subtitle="FACILITY HOME" />

        <Card style={s.profileCard}>
          <View style={s.profileDot} />
          <View style={{ flex: 1 }}>
            <Text style={s.profileLabel}>현재 접속 중</Text>
            <Text style={s.profileName}>{me?.facility?.name ?? '복지시설'}</Text>
          </View>
          <Badge status="OPEN" />
        </Card>

        <Card style={{ paddingVertical: 14 }}>
          <Text style={s.locationLabel}>현재 위치 (시설 등록 주소 기준)</Text>
          <Text style={s.locationValue}>{me?.facility?.address ?? '-'} · 반경 3km</Text>
        </Card>

        <SectionTitle>주변 기부 식품</SectionTitle>
        <Text style={s.feedMeta}>반경 3km · OPEN {feed?.length ?? 0}건 · 3초마다 자동 갱신</Text>

        {applyError ? (
          <View style={s.errorBox}>
            <Text style={s.errorBoxText}>{applyError}</Text>
          </View>
        ) : null}

        {feed === null ? null : feed.length === 0 ? (
          <EmptyState
            title={'현재 주변에 등록된\n기부 물품이 없습니다'}
            sub="잠시 후 다시 확인해 주세요. 새 등록이 오면 바로 나타나요."
          />
        ) : (
          feed.map((item) => {
            const urgent = item.remainingMinutes <= 45;
            return (
              <Animated.View key={item.id} entering={FadeInUp.duration(400)}>
              <Card style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={s.thumb}>
                    <Text style={s.thumbText}>FOOD</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.storeName}>{item.store.name}</Text>
                    <Text style={s.itemName}>{item.itemName}</Text>
                    <Text style={s.itemMeta}>
                      {item.quantity}개 · {item.distanceKm}km · {item.remainingMinutes}분 남음
                    </Text>
                  </View>
                  {urgent ? (
                    <View style={s.urgent}>
                      <Text style={s.urgentText}>마감임박</Text>
                    </View>
                  ) : (
                    <Badge status="OPEN" />
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    title="픽업 신청하기"
                    variant="dark"
                    style={{ flex: 1, paddingVertical: 13 }}
                    loading={applying === item.id}
                    onPress={() => apply(item)}
                  />
                  <Pressable style={s.timeChip}>
                    <Text style={s.timeChipText}>~{fmtTime(item.pickupEnd)}</Text>
                  </Pressable>
                </View>
              </Card>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  profileDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.brand },
  profileLabel: { fontSize: 11, color: C.sub, fontFamily: 'Pretendard-SemiBold' },
  profileName: { fontSize: 16, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  locationLabel: { fontSize: 11, color: C.sub, fontFamily: 'Pretendard-SemiBold' },
  locationValue: { fontSize: 14, fontFamily: 'Pretendard-Bold', color: C.text, marginTop: 2 },
  feedMeta: { fontSize: 12, fontFamily: 'Pretendard-Regular', color: C.sub, marginTop: -8 },
  errorBox: { backgroundColor: C.redSoft, borderRadius: 12, padding: 14 },
  errorBoxText: { color: C.red, fontSize: 13, fontFamily: 'Pretendard-SemiBold' },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#F0A24C',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 6,
  },
  thumbText: { fontSize: 9, fontFamily: 'Pretendard-Black', color: C.navy },
  storeName: { fontSize: 12, color: C.sub, fontFamily: 'Pretendard-SemiBold' },
  itemName: { fontSize: 16, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  itemMeta: { fontSize: 12, fontFamily: 'Pretendard-Regular', color: C.sub },
  urgent: { backgroundColor: C.redSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  urgentText: { fontSize: 11, fontFamily: 'Pretendard-ExtraBold', color: C.red },
  timeChip: {
    backgroundColor: C.brand,
    borderRadius: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  timeChipText: { fontFamily: 'Pretendard-ExtraBold', color: C.navy, fontSize: 13 },
});
