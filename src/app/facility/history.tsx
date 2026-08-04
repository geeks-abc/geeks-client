import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeader } from '@/components/header';
import { Card, EmptyState, SectionTitle } from '@/components/ui';
import { api, Donation } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtDateTime, usePolling } from '@/lib/hooks';
import { C } from '@/lib/theme';

// 시설 수령 완료 내역
export default function FacilityHistory() {
  const { me } = useAuth();

  const { data: donations } = usePolling(
    () =>
      me?.facilityId
        ? api.donations({ facilityId: me.facilityId })
        : Promise.resolve([] as Donation[]),
    5000,
    [me?.facilityId],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <HomeHeader subtitle="RECEIVED HISTORY" />
        <SectionTitle>수령 완료 내역</SectionTitle>

        {donations === null ? null : donations.length === 0 ? (
          <EmptyState title="아직 수령한 기부가 없어요" sub="피드에서 첫 픽업을 신청해보세요." />
        ) : (
          donations.map((donation) => (
            <Card key={donation.id} style={s.row}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={s.store}>{donation.match.listing.store.name}</Text>
                <Text style={s.item}>{donation.match.listing.itemName}</Text>
                <Text style={s.meta}>
                  {donation.match.listing.quantity}개 · {donation.weightKg}kg
                </Text>
              </View>
              <Text style={s.date}>{fmtDateTime(donation.completedAt)}</Text>
            </Card>
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
  meta: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: C.sub },
  date: { fontSize: 11, fontFamily: 'Pretendard-Regular', color: C.gray, maxWidth: 90, textAlign: 'right' },
});
