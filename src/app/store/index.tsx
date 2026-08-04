import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeader } from '@/components/header';
import { ListRowSkeleton } from '@/components/skeleton';
import { api, Listing, ListingStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtTime, isToday, remainingLabel, usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';

const STATUS: Record<ListingStatus, { label: string; fg: string; bg: string }> = {
  OPEN: { label: '모집 중', fg: C.brandDeep, bg: C.brandSoft },
  MATCHED: { label: '픽업 예정', fg: C.blue, bg: C.blueSoft },
  COMPLETED: { label: '전달 완료', fg: '#FFFFFF', bg: C.navy },
  EXPIRED: { label: '마감', fg: C.sub, bg: C.graySoft },
  CANCELLED: { label: '취소', fg: C.sub, bg: C.graySoft },
};

// S-01 가게 홈 — 마이페이지 디자인 시스템 기준
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

  const visibleListings = (listings ?? []).filter((item) => item.status !== 'CANCELLED');
  // 모집 중·픽업 예정은 등록일과 무관하게 "지금 진행 중"인 수, 전달 완료만 오늘 기준
  const stats = [
    { label: '모집 중', value: visibleListings.filter((i) => i.status === 'OPEN').length },
    { label: '픽업 예정', value: visibleListings.filter((i) => i.status === 'MATCHED').length },
    {
      label: '전달 완료',
      value: visibleListings.filter((i) => i.status === 'COMPLETED' && isToday(i.pickupEnd))
        .length,
    },
  ];

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

        <View style={s.profileHead}>
          <View style={s.avatar}>
            <Ionicons name="storefront" size={24} color={C.brand} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={s.name}>{me?.store?.name ?? '이음 가게'}</Text>
            <View style={s.roleChip}>
              <Text style={s.roleChipText}>음식점</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>오늘 현황</Text>
        <View style={s.statsCard}>
          {stats.map((stat, index) => (
            <View key={stat.label} style={[s.stat, index > 0 && s.statDivider]}>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => router.push('/new-listing')}
          style={({ pressed }) => [s.registerButton, pressed && s.pressed]}
        >
          <Text style={s.registerButtonText}>+ 기부 품목 등록</Text>
        </Pressable>

        <Text style={s.sectionTitle}>내 등록 품목</Text>

        {listings === null ? (
          <View style={{ gap: 10 }}>
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </View>
        ) : visibleListings.length === 0 ? (
          <View style={s.emptyCard}>
            <View style={s.emptyIcon}>
              <Ionicons name="fast-food-outline" size={26} color={C.brand} />
            </View>
            <Text style={s.emptyTitle}>아직 등록한 기부 식품이 없어요</Text>
            <Text style={s.emptySub}>오늘 남은 식품을 등록해 보세요.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {visibleListings.map((listing) => (
              <ListingRow
                key={listing.id}
                listing={listing}
                onPress={() => router.push(`/listing/${listing.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ListingRow({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  const status = STATUS[listing.status];
  const timeText =
    listing.status === 'OPEN'
      ? remainingLabel(listing.pickupEnd)
      : `${fmtTime(listing.pickupEnd)} 마감`;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.row, pressed && s.pressed]}>
      {listing.photoUrl ? (
        <Image transition={150} source={{ uri: listing.photoUrl }} style={s.thumb} />
      ) : (
        <View style={[s.thumb, s.thumbFallback]}>
          <Ionicons name="fast-food-outline" size={20} color={C.gray} />
        </View>
      )}
      <View style={{ flex: 1, gap: 3 }}>
        <Text numberOfLines={1} style={s.rowTitle}>{listing.itemName}</Text>
        <Text style={s.rowMeta}>
          {listing.quantity}개 · {timeText}
        </Text>
      </View>
      <View style={[s.statusPill, { backgroundColor: status.bg }]}>
        <Text style={[s.statusText, { color: status.fg }]}>{status.label}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 12,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  pressed: { opacity: 0.7 },
  profileHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
    marginBottom: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 19, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: C.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleChipText: { fontSize: 11.5, fontFamily: 'Pretendard-Bold', color: C.brandDeep },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    color: C.text,
    marginTop: 8,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: R.card,
    paddingVertical: 18,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: C.line,
  },
  statValue: { fontSize: 21, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  statLabel: { fontSize: 12, fontFamily: 'Pretendard-Regular', color: C.sub },
  registerButton: {
    backgroundColor: C.brand,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  registerButtonText: { fontSize: 15.5, fontFamily: 'Pretendard-Bold', color: '#FFFFFF' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: R.card,
    padding: 14,
  },
  thumb: { width: 52, height: 52, borderRadius: 12 },
  thumbFallback: {
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 15, fontFamily: 'Pretendard-Bold', color: C.text },
  rowMeta: { fontSize: 12.5, fontFamily: 'Pretendard-Regular', color: C.sub },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: { fontSize: 11.5, fontFamily: 'Pretendard-ExtraBold' },
  emptyCard: {
    backgroundColor: C.card,
    borderRadius: R.card,
    padding: 30,
    alignItems: 'center',
    gap: 6,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontFamily: 'Pretendard-Bold', color: C.text },
  emptySub: { fontSize: 12.5, fontFamily: 'Pretendard-Regular', color: C.sub },
});
