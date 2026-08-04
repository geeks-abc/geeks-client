import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeader } from '@/components/header';
import { EmptyState } from '@/components/ui';
import { api, Match } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtTime, remainingLabel, usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';

// 진행중 픽업 목록 (S-05 진입점) — 새로고침해도 여기서 복귀
export default function Pickups() {
  const { me } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: matches, refresh } = usePolling(
    () =>
      me?.facilityId
        ? api.facilityMatches(me.facilityId, 'MATCHED')
        : Promise.resolve([] as Match[]),
    3000,
    [me?.facilityId],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

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
          <View style={s.pageTitleRow}>
            <Text style={s.pageTitle}>진행 중인 픽업</Text>
            {matches && matches.length > 0 ? (
              <Text style={s.count}>{matches.length}건</Text>
            ) : null}
          </View>
          <Text style={s.pageDescription}>픽업할 상품과 방문 시간을 확인해주세요.</Text>
        </View>

        {matches === null ? (
          <View style={s.loadingList}>
            <PickupSkeleton />
            <PickupSkeleton />
          </View>
        ) : matches.length === 0 ? (
          <EmptyState title="진행 중인 픽업이 없어요" sub="피드에서 기부 식품을 신청해보세요." />
        ) : (
          <View style={s.list}>
            {matches.map((match) => (
              <PickupRow
                key={match.id}
                match={match}
                onPress={() => router.push(`/pickup/${match.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PickupRow({ match, onPress }: { match: Match; onPress: () => void }) {
  const listing = match.listing;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${listing?.itemName ?? '기부 식품'} 픽업 상세 보기`}
      onPress={onPress}
      style={({ pressed }) => [s.row, pressed && s.pressed]}
    >
      {listing?.photoUrl ? (
        <Image transition={150} source={{ uri: listing.photoUrl }} style={s.thumb} contentFit="cover" />
      ) : (
        <View style={[s.thumb, s.thumbFallback]}>
          <Ionicons name="fast-food-outline" size={23} color={C.brand} />
        </View>
      )}

      <View style={s.rowContent}>
        <View style={s.storeLine}>
          <Text numberOfLines={1} style={s.store}>{listing?.store?.name ?? '나눔 가게'}</Text>
          <View style={s.statusPill}>
            <Text style={s.statusText}>픽업 예정</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={s.item}>{listing?.itemName ?? '기부 식품'}</Text>
        {listing ? (
          <Text numberOfLines={1} style={s.meta}>
            {listing.quantity}개 · {fmtTime(listing.pickupStart)}–{fmtTime(listing.pickupEnd)}
          </Text>
        ) : null}
        {listing ? <Text style={s.remaining}>{remainingLabel(listing.pickupEnd)}</Text> : null}
      </View>

      <View style={s.arrowButton}>
        <Ionicons name="chevron-forward" size={19} color={C.sub} />
      </View>
    </Pressable>
  );
}

function PickupSkeleton() {
  return (
    <View style={s.row}>
      <View style={[s.thumb, s.skeleton]} />
      <View style={s.skeletonContent}>
        <View style={[s.skeletonLine, { width: '42%' }]} />
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
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageTitle: { color: C.text, fontSize: 21, fontFamily: 'Pretendard-ExtraBold' },
  count: { color: C.brand, fontSize: 14, fontFamily: 'Pretendard-ExtraBold' },
  pageDescription: { color: C.sub, fontSize: 12.5, fontFamily: 'Pretendard-Regular' },
  list: { gap: 10 },
  loadingList: { gap: 10 },
  row: {
    minHeight: 110,
    borderRadius: R.card,
    backgroundColor: C.card,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: { width: 74, height: 82, borderRadius: 14 },
  thumbFallback: { backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, alignSelf: 'stretch', justifyContent: 'center', gap: 3 },
  storeLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  store: { flexShrink: 1, color: C.sub, fontSize: 11.5, fontFamily: 'Pretendard-Regular' },
  statusPill: { borderRadius: 999, backgroundColor: C.brandSoft, paddingHorizontal: 7, paddingVertical: 3 },
  statusText: { color: C.brandDeep, fontSize: 9.5, fontFamily: 'Pretendard-ExtraBold' },
  item: { color: C.text, fontSize: 16, fontFamily: 'Pretendard-Bold' },
  meta: { color: C.sub, fontSize: 12, fontFamily: 'Pretendard-Regular' },
  remaining: { color: C.brandDeep, fontSize: 11.5, fontFamily: 'Pretendard-Bold' },
  arrowButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.graySoft, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.68 },
  skeleton: { backgroundColor: C.graySoft },
  skeletonContent: { flex: 1, gap: 9 },
  skeletonLine: { height: 11, borderRadius: 6, backgroundColor: C.graySoft },
});
