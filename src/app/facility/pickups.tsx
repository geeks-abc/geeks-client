import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeader } from '@/components/header';
import { Badge, Card, EmptyState, SectionTitle } from '@/components/ui';
import { api, Match } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtTime, usePolling } from '@/lib/hooks';
import { C } from '@/lib/theme';

// 진행중 픽업 목록 (S-05 진입점) — 새로고침해도 여기서 복귀
export default function Pickups() {
  const { me } = useAuth();
  const router = useRouter();

  const { data: matches } = usePolling(
    () =>
      me?.facilityId
        ? api.facilityMatches(me.facilityId, 'MATCHED')
        : Promise.resolve([] as Match[]),
    3000,
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <HomeHeader subtitle="PICKUP" />
        <SectionTitle>진행중인 픽업</SectionTitle>

        {matches === null ? null : matches.length === 0 ? (
          <EmptyState title="진행중인 픽업이 없어요" sub="피드에서 기부 식품을 신청해보세요." />
        ) : (
          matches.map((match) => (
            <Pressable key={match.id} onPress={() => router.push(`/pickup/${match.id}`)}>
              <Card style={s.row}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={s.store}>{match.listing?.store?.name}</Text>
                  <Text style={s.item}>{match.listing?.itemName}</Text>
                  <Text style={s.meta}>
                    {match.listing ? `~${fmtTime(match.listing.pickupEnd)} 픽업` : ''}
                  </Text>
                </View>
                <Badge status="MATCHED" />
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  store: { fontSize: 12, color: C.sub, fontFamily: 'Pretendard-SemiBold' },
  item: { fontSize: 16, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  meta: { fontSize: 12, fontFamily: 'Pretendard-Regular', color: C.sub },
});
