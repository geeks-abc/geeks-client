import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeader } from '@/components/header';
import { Badge, Button, Card, EmptyState, SectionTitle } from '@/components/ui';
import { api, Listing } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtTime, isToday, usePolling } from '@/lib/hooks';
import { C } from '@/lib/theme';

// S-01 가게 홈
export default function StoreHome() {
  const { me } = useAuth();
  const router = useRouter();
  const storeId = me?.storeId;

  const { data: listings, refresh } = usePolling(
    () => (storeId ? api.myListings(storeId) : Promise.resolve([] as Listing[])),
    3000,
  );

  const today = (listings ?? []).filter((l) => isToday(l.createdAt));
  const stats = [
    { label: '오늘 등록', value: today.length },
    { label: '매칭', value: today.filter((l) => l.status === 'MATCHED').length },
    { label: '완료', value: today.filter((l) => l.status === 'COMPLETED').length },
  ];

  const onPressListing = (listing: Listing) => {
    if (listing.status === 'MATCHED' && listing.match) {
      router.push(`/match/${listing.match.id}`);
    } else if (listing.status === 'OPEN') {
      Alert.alert(listing.itemName, '아직 매칭을 기다리는 중이에요.', [
        {
          text: '등록 취소',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.cancelListing(listing.id);
              refresh();
            } catch (e) {
              Alert.alert('취소 실패', e instanceof Error ? e.message : '');
            }
          },
        },
        { text: '닫기', style: 'cancel' },
      ]);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <HomeHeader subtitle="STORE HOME" />

        <View style={s.currentChip}>
          <Text style={s.currentChipText}>현재 접속: {me?.store?.name ?? '가게'}</Text>
        </View>

        <Text style={s.headline}>남은 식품을{'\n'}오늘도 이어볼까요?</Text>

        <View style={s.statCard}>
          {stats.map((stat) => (
            <View key={stat.label} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <Text style={s.statLabel}>{stat.label}</Text>
              <Text style={[s.statValue, stat.label === '매칭' && { color: C.yellow }]}>
                {stat.value}건
              </Text>
            </View>
          ))}
        </View>

        <Button title="+ 기부 품목 등록" onPress={() => router.push('/new-listing')} />

        <SectionTitle>내 등록 품목</SectionTitle>
        {listings === null ? null : listings.length === 0 ? (
          <EmptyState title="아직 등록한 품목이 없어요" sub="30초면 오늘 남은 식품을 등록할 수 있어요." />
        ) : (
          listings.map((listing) => (
            <Pressable key={listing.id} onPress={() => onPressListing(listing)}>
              <Card style={s.listingCard}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={s.listingStore}>{me?.store?.name}</Text>
                  <Text style={s.listingName}>{listing.itemName}</Text>
                  <Text style={s.listingMeta}>
                    {listing.quantity}개 · {fmtTime(listing.pickupEnd)} 마감
                  </Text>
                  <Badge status={listing.status} />
                </View>
                <Text style={s.arrow}>→</Text>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  currentChip: {
    alignSelf: 'flex-end',
    backgroundColor: C.yellowSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  currentChipText: { fontSize: 12, fontWeight: '700', color: '#6B6300' },
  headline: { fontSize: 26, fontWeight: '900', color: C.text, lineHeight: 36 },
  statCard: {
    flexDirection: 'row',
    backgroundColor: C.navy,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 8,
  },
  statLabel: { color: '#8D97AC', fontSize: 12, fontWeight: '600' },
  statValue: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  listingCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  listingStore: { fontSize: 12, color: C.sub, fontWeight: '600' },
  listingName: { fontSize: 17, fontWeight: '800', color: C.text },
  listingMeta: { fontSize: 13, color: C.sub, marginBottom: 6 },
  arrow: { fontSize: 18, color: C.text, fontWeight: '700' },
});
