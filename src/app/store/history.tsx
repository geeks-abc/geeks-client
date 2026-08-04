import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeader } from '@/components/header';
import { Card, EmptyState, SectionTitle } from '@/components/ui';
import { api, Donation } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtDateTime, usePolling } from '@/lib/hooks';
import { C } from '@/lib/theme';

// 가게 기부 내역 — 확인서 재다운로드 진입점
export default function StoreHistory() {
  const { me } = useAuth();
  const router = useRouter();

  const { data: donations } = usePolling(
    () =>
      me?.storeId ? api.donations({ storeId: me.storeId }) : Promise.resolve([] as Donation[]),
    5000,
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <HomeHeader subtitle="DONATION HISTORY" />
        <SectionTitle>기부 완료 내역</SectionTitle>

        {donations === null ? null : donations.length === 0 ? (
          <EmptyState title="아직 완료된 기부가 없어요" sub="첫 기부가 완료되면 확인서가 발급돼요." />
        ) : (
          donations.map((donation) => (
            <Pressable key={donation.id} onPress={() => router.push(`/certificate/${donation.id}`)}>
              <Card style={s.row}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={s.item}>{donation.match.listing.itemName}</Text>
                  <Text style={s.meta}>
                    {donation.match.facility.name} · {donation.weightKg}kg
                  </Text>
                  <Text style={s.date}>{fmtDateTime(donation.completedAt)}</Text>
                </View>
                <Text style={s.link}>확인서 →</Text>
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
  item: { fontSize: 16, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  meta: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: C.sub },
  date: { fontSize: 12, fontFamily: 'Pretendard-Regular', color: C.gray },
  link: { fontSize: 13, fontFamily: 'Pretendard-ExtraBold', color: '#B4950A' },
});
