import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeader } from '@/components/header';
import { api, Listing, ListingStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtTime, isToday, remainingLabel, usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';

const STATUS_TEXT: Record<
  ListingStatus,
  { label: string; color: string }
> = {
  OPEN: { label: '매칭 대기', color: C.brand },
  MATCHED: { label: '픽업 예정', color: C.blue },
  COMPLETED: { label: '완료', color: C.sub },
  EXPIRED: { label: '마감', color: C.gray },
  CANCELLED: { label: '취소', color: C.gray },
};

// S-01 가게 홈
export default function StoreHome() {
  const { me } = useAuth();
  const router = useRouter();
  const storeId = me?.storeId;
  const [refreshing, setRefreshing] = useState(false);

  const { data: listings, refresh } = usePolling(
    () => (storeId ? api.myListings(storeId) : Promise.resolve([] as Listing[])),
    3000,
    [storeId],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const today = (listings ?? []).filter((l) => isToday(l.createdAt));
  const stats = [
    { label: '등록', value: today.length },
    { label: '매칭', value: today.filter((l) => l.status === 'MATCHED').length },
    { label: '완료', value: today.filter((l) => l.status === 'COMPLETED').length },
  ];

  const active = (listings ?? []).filter(
    (l) => l.status === 'OPEN' || l.status === 'MATCHED',
  );
  const past = (listings ?? [])
    .filter((l) => l.status !== 'OPEN' && l.status !== 'MATCHED')
    .slice(0, 10);

  const rowMeta = (listing: Listing) => {
    if (listing.status === 'OPEN')
      return `${listing.quantity}개 · ${remainingLabel(listing.pickupEnd)}`;
    if (listing.status === 'MATCHED' && listing.match?.facility)
      return `${listing.match.facility.name} · ${fmtTime(listing.pickupEnd)}까지`;
    return `${listing.quantity}개 · ${fmtTime(listing.pickupEnd)} 마감`;
  };

  const renderRow = (listing: Listing, index: number, list: Listing[]) => {
    const status = STATUS_TEXT[listing.status];
    return (
      <View key={listing.id}>
        <Pressable
          onPress={() => router.push(`/listing/${listing.id}`)}
          style={({ pressed }) => [s.row, pressed && { backgroundColor: C.bg }]}
        >
          {listing.photoUrl ? (
            <Image source={{ uri: listing.photoUrl }} style={s.thumb} />
          ) : (
            <View style={[s.thumb, s.thumbFallback]}>
              <Ionicons name="fast-food-outline" size={20} color={C.gray} />
            </View>
          )}
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={s.rowTitle}>{listing.itemName}</Text>
            <Text style={s.rowMeta}>{rowMeta(listing)}</Text>
          </View>
          <Text style={[s.rowStatus, { color: status.color }]}>{status.label}</Text>
        </Pressable>
        {index < list.length - 1 ? <View style={s.divider} /> : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <HomeHeader />

        <Text style={s.storeName}>{me?.store?.name ?? ''}</Text>

        {/* 오늘 현황 */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>오늘 현황</Text>
          <View style={{ flexDirection: 'row', marginTop: 14 }}>
            {stats.map((stat, index) => (
              <View key={stat.label} style={[s.statCol, index > 0 && s.statDivider]}>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/new-listing')}
          style={({ pressed }) => [s.registerButton, pressed && { opacity: 0.85 }]}
        >
          <Text style={s.registerButtonText}>기부 품목 등록하기</Text>
        </Pressable>

        {/* 진행중 */}
        <Text style={s.sectionTitle}>
          진행중인 품목{active.length > 0 ? ` ${active.length}` : ''}
        </Text>
        {listings === null ? null : active.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>진행중인 품목이 없어요</Text>
            <Text style={s.emptySub}>남은 식품을 등록하면 주변 시설과 연결돼요.</Text>
          </View>
        ) : (
          <View style={s.listCard}>
            {active.map((l, i) => renderRow(l, i, active))}
          </View>
        )}

        {/* 지난 품목 */}
        {past.length > 0 ? (
          <>
            <Text style={s.sectionTitle}>지난 품목</Text>
            <View style={[s.listCard, { opacity: 0.75 }]}>
              {past.map((l, i) => renderRow(l, i, past))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  storeName: {
    fontSize: 22,
    fontFamily: 'Pretendard-ExtraBold',
    color: C.text,
    marginTop: 10,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: C.card,
    borderRadius: R.card,
    padding: 20,
    marginBottom: 12,
  },
  summaryTitle: { fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: C.sub },
  statCol: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: C.line,
  },
  statValue: { fontSize: 22, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  statLabel: { fontSize: 12, fontFamily: 'Pretendard-Regular', color: C.sub },
  registerButton: {
    backgroundColor: C.brand,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 28,
  },
  registerButtonText: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: '#FFF' },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    color: C.text,
    marginBottom: 10,
    marginTop: 4,
  },
  listCard: {
    backgroundColor: C.card,
    borderRadius: R.card,
    overflow: 'hidden',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.line, marginLeft: 68 },
  thumb: { width: 40, height: 40, borderRadius: 10 },
  thumbFallback: {
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: C.text },
  rowMeta: { fontSize: 12.5, fontFamily: 'Pretendard-Regular', color: C.sub },
  rowStatus: { fontSize: 13, fontFamily: 'Pretendard-Bold' },
  emptyCard: {
    backgroundColor: C.card,
    borderRadius: R.card,
    padding: 28,
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 14.5, fontFamily: 'Pretendard-Bold', color: C.text },
  emptySub: { fontSize: 12.5, fontFamily: 'Pretendard-Regular', color: C.sub },
});
