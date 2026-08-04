import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeader } from '@/components/header';
import { EmptyState } from '@/components/ui';
import { api, Donation } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtDateTime, usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';

// 시설 수령 완료 내역
export default function FacilityHistory() {
  const { me } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: donations, refresh } = usePolling(
    () =>
      me?.facilityId
        ? api.donations({ facilityId: me.facilityId })
        : Promise.resolve([] as Donation[]),
    5000,
    [me?.facilityId],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const sortedDonations = [...(donations ?? [])].sort(
    (first, second) =>
      new Date(second.completedAt).getTime() - new Date(first.completedAt).getTime(),
  );
  const totalItems = sortedDonations.reduce(
    (total, donation) => total + donation.match.listing.quantity,
    0,
  );
  const totalWeight = sortedDonations.reduce((total, donation) => total + donation.weightKg, 0);

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.text} />
        }
        contentContainerStyle={s.content}
      >
        <HomeHeader />

        <View style={s.pageHead}>
          <Text style={s.pageTitle}>수령 완료 내역</Text>
          <Text style={s.pageDescription}>전달이 완료된 식품과 기부 확인서를 확인할 수 있어요.</Text>
        </View>

        {donations && donations.length > 0 ? (
          <View style={s.statsCard}>
            <Stat label="완료" value={`${donations.length}건`} />
            <View style={s.statDivider} />
            <Stat label="수령 수량" value={`${totalItems}개`} />
            <View style={s.statDivider} />
            <Stat label="환산 무게" value={`${Number(totalWeight.toFixed(1))}kg`} />
          </View>
        ) : null}

        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>수령 내역</Text>
          {donations && donations.length > 0 ? (
            <Text style={s.sectionCount}>{donations.length}</Text>
          ) : null}
        </View>

        {donations === null ? (
          <View style={s.list}>
            <HistorySkeleton />
            <HistorySkeleton />
          </View>
        ) : donations.length === 0 ? (
          <EmptyState title="아직 수령한 기부가 없어요" sub="피드에서 첫 픽업을 신청해보세요." />
        ) : (
          <View style={s.list}>
            {sortedDonations.map((donation) => (
              <HistoryRow
                key={donation.id}
                donation={donation}
                onPress={() => router.push(`/certificate/${donation.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function HistoryRow({ donation, onPress }: { donation: Donation; onPress: () => void }) {
  const listing = donation.match.listing;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${listing.itemName} 수령 내역 확인`}
      onPress={onPress}
      style={({ pressed }) => [s.row, pressed && s.pressed]}
    >
      {listing.photoUrl ? (
        <Image transition={150} source={{ uri: listing.photoUrl }} style={s.thumb} contentFit="cover" />
      ) : (
        <View style={[s.thumb, s.thumbFallback]}>
          <Ionicons name="fast-food-outline" size={22} color={C.brand} />
        </View>
      )}

      <View style={s.rowContent}>
        <View style={s.storeLine}>
          <Text numberOfLines={1} style={s.store}>{listing.store.name}</Text>
          <View style={s.completePill}>
            <Ionicons name="checkmark" size={11} color={C.brandDeep} />
            <Text style={s.completeText}>수령 완료</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={s.item}>{listing.itemName}</Text>
        <Text style={s.meta}>{listing.quantity}개 · {donation.weightKg}kg</Text>
        <Text style={s.date}>{fmtDateTime(donation.completedAt)}</Text>
      </View>

      <View style={s.arrowButton}>
        <Ionicons name="chevron-forward" size={18} color={C.sub} />
      </View>
    </Pressable>
  );
}

function HistorySkeleton() {
  return (
    <View style={s.row}>
      <View style={[s.thumb, s.skeleton]} />
      <View style={s.skeletonContent}>
        <View style={[s.skeletonLine, { width: '44%' }]} />
        <View style={[s.skeletonLine, { width: '72%', height: 15 }]} />
        <View style={[s.skeletonLine, { width: '58%' }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 32,
  },
  pageHead: { marginTop: 16, marginBottom: 18, gap: 5 },
  pageTitle: { color: C.text, fontSize: 21, fontFamily: 'Pretendard-ExtraBold' },
  pageDescription: { color: C.sub, fontSize: 12.5, fontFamily: 'Pretendard-Regular' },
  statsCard: {
    minHeight: 86,
    borderRadius: R.card,
    backgroundColor: C.card,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { color: C.text, fontSize: 18, fontFamily: 'Pretendard-ExtraBold' },
  statLabel: { color: C.sub, fontSize: 11.5, fontFamily: 'Pretendard-Regular' },
  statDivider: { width: StyleSheet.hairlineWidth, height: 34, backgroundColor: C.line },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { color: C.text, fontSize: 15, fontFamily: 'Pretendard-Bold' },
  sectionCount: { color: C.brand, fontSize: 13, fontFamily: 'Pretendard-ExtraBold' },
  list: { gap: 10 },
  row: {
    minHeight: 112,
    borderRadius: R.card,
    backgroundColor: C.card,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: { width: 72, height: 84, borderRadius: 14 },
  thumbFallback: { backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, alignSelf: 'stretch', justifyContent: 'center', gap: 3 },
  storeLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  store: { flexShrink: 1, color: C.sub, fontSize: 11.5, fontFamily: 'Pretendard-Regular' },
  completePill: { borderRadius: 999, backgroundColor: C.brandSoft, paddingHorizontal: 7, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 2 },
  completeText: { color: C.brandDeep, fontSize: 9.5, fontFamily: 'Pretendard-ExtraBold' },
  item: { color: C.text, fontSize: 15.5, fontFamily: 'Pretendard-Bold' },
  meta: { color: C.sub, fontSize: 12, fontFamily: 'Pretendard-Regular' },
  date: { color: C.gray, fontSize: 10.5, fontFamily: 'Pretendard-Regular' },
  arrowButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.graySoft, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.68 },
  skeleton: { backgroundColor: C.graySoft },
  skeletonContent: { flex: 1, gap: 9 },
  skeletonLine: { height: 11, borderRadius: 6, backgroundColor: C.graySoft },
});
