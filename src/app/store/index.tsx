import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
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
import { api, Listing, ListingStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtTime, isToday, remainingLabel, usePolling } from '@/lib/hooks';
import { ListRowSkeleton } from '@/components/skeleton';

const P = {
  outer: '#E7E7E3',
  surface: '#F9F9F5',
  white: '#FFFFFF',
  yellow: '#FFCF14',
  paleYellow: '#FFECA5',
  navy: '#051224',
  sub: '#6B7078',
  line: '#E0E3E0',
  orange: '#FF9740',
  green: '#159A55',
  greenSoft: '#DFF7E9',
  blue: '#2E77D0',
};

const STATUS: Record<ListingStatus, { label: string; fg: string; bg: string }> = {
  OPEN: { label: '모집 중', fg: P.green, bg: P.greenSoft },
  MATCHED: { label: '픽업 예정', fg: P.navy, bg: P.paleYellow },
  COMPLETED: { label: '전달 완료', fg: P.white, bg: P.navy },
  EXPIRED: { label: '마감', fg: P.sub, bg: '#EEF0EE' },
  CANCELLED: { label: '취소', fg: P.sub, bg: '#EEF0EE' },
};

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
  const today = visibleListings.filter((item) => isToday(item.createdAt));
  const stats = {
    open: today.filter((item) => item.status === 'OPEN').length,
    matched: today.filter((item) => item.status === 'MATCHED').length,
    completed: today.filter((item) => item.status === 'COMPLETED').length,
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={P.navy} />
          }
          contentContainerStyle={s.scrollContent}
        >
          <View style={s.hero}>
            <Text style={s.logo}>이음</Text>
            <Text style={s.englishLabel}>STORE HOME</Text>
            <Text style={s.storeName}>{me?.store?.name ?? '오늘의 빵집'}</Text>
            <Text style={s.heroTitle}>오늘 남은 식품을{`\n`}필요한 곳에 이어보세요.</Text>
          </View>

          {visibleListings.length > 0 ? (
            <View style={s.statsCard}>
              <Stat label="모집 중" value={stats.open} />
              <Stat label="픽업 예정" value={stats.matched} />
              <Stat label="전달 완료" value={stats.completed} />
            </View>
          ) : null}

          <View style={s.body}>
            {visibleListings.length > 0 ? (
              <Pressable
                onPress={() => router.push('/new-listing')}
                style={({ pressed }) => [s.registerTopButton, pressed && s.pressed]}
              >
                <Text style={s.registerTopButtonText}>+ 기부 품목 등록</Text>
              </Pressable>
            ) : null}

            <Text style={s.sectionTitle}>내 등록 품목</Text>

            {listings === null ? (
              <View style={{ gap: 10 }}>
                <ListRowSkeleton />
                <ListRowSkeleton />
                <ListRowSkeleton />
              </View>
            ) : visibleListings.length === 0 ? (
              <View style={s.emptyCard}>
                <View style={s.emptyCircle}>
                  <View style={s.emptyCircleInner} />
                </View>
                <Text style={s.emptyTitle}>아직 등록한 기부 식품이 없습니다.</Text>
                <Text style={s.emptySub}>오늘 남은 식품을 등록해 보세요.</Text>
                <Pressable
                  onPress={() => router.push('/new-listing')}
                  style={({ pressed }) => [s.emptyButton, pressed && s.pressed]}
                >
                  <Text style={s.emptyButtonText}>기부 품목 등록</Text>
                </Pressable>
              </View>
            ) : (
              <View style={s.listGap}>
                {visibleListings.map((listing, index) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    accent={index % 2 === 0 ? P.orange : '#E1B544'}
                    onPress={() => router.push(`/listing/${listing.id}`)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}건</Text>
    </View>
  );
}

function ListingCard({
  listing,
  accent,
  onPress,
}: {
  listing: Listing;
  accent: string;
  onPress: () => void;
}) {
  const status = STATUS[listing.status];
  const timeText =
    listing.status === 'OPEN'
      ? remainingLabel(listing.pickupEnd)
      : `${fmtTime(listing.pickupEnd)} 마감`;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.foodCard, pressed && s.pressed]}>
      {listing.photoUrl ? (
        <Image transition={150} source={{ uri: listing.photoUrl }} style={s.foodImage} />
      ) : (
        <View style={[s.foodImage, { backgroundColor: accent }]}>
          <View style={s.foodImageFooter}>
            <Text style={s.foodImageLabel}>FOOD</Text>
          </View>
        </View>
      )}
      <View style={s.foodContent}>
        <Text style={s.foodStore}>{listing.store?.name ?? '오늘의 빵집'}</Text>
        <Text numberOfLines={1} style={s.foodTitle}>{listing.itemName}</Text>
        <Text style={s.foodMeta}>{listing.quantity}개 · {timeText}</Text>
        <View style={[s.statusPill, { backgroundColor: status.bg }]}>
          <Text style={[s.statusText, { color: status.fg }]}>{status.label}</Text>
        </View>
      </View>
      <Ionicons name="arrow-forward" size={24} color={P.navy} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: P.outer },
  screen: {
    flex: 1,
    marginHorizontal: 0,
    backgroundColor: P.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  scrollContent: { paddingBottom: 30 },
  hero: {
    minHeight: 250,
    backgroundColor: P.yellow,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  logo: {
    color: P.navy,
    fontSize: 23,
    lineHeight: 32,
    fontFamily: 'Pretendard-Black',
  },
  englishLabel: {
    color: P.sub,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'Pretendard-Bold',
  },
  storeName: {
    color: P.navy,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Pretendard-Bold',
    marginTop: 27,
  },
  heroTitle: {
    color: P.navy,
    fontSize: 26,
    lineHeight: 36,
    fontFamily: 'Pretendard-Black',
    letterSpacing: -0.8,
    marginTop: 17,
  },
  statsCard: {
    marginHorizontal: 20,
    marginTop: -36,
    minHeight: 108,
    backgroundColor: P.white,
    borderRadius: 24,
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  stat: { flex: 1, gap: 7 },
  statLabel: { color: P.sub, fontSize: 11, fontFamily: 'Pretendard-Regular' },
  statValue: { color: P.navy, fontSize: 23, fontFamily: 'Pretendard-Black' },
  body: { paddingHorizontal: 20, paddingTop: 46 },
  registerTopButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: P.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  registerTopButtonText: { color: P.navy, fontSize: 15, fontFamily: 'Pretendard-Bold' },
  sectionTitle: {
    color: P.navy,
    fontSize: 20,
    lineHeight: 28,
    fontFamily: 'Pretendard-Black',
    marginBottom: 18,
  },
  loadingCard: {
    minHeight: 180,
    borderRadius: 24,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    minHeight: 300,
    borderRadius: 24,
    backgroundColor: P.white,
    alignItems: 'center',
    paddingTop: 34,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  emptyCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: P.paleYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCircleInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: P.navy,
  },
  emptyTitle: {
    color: P.navy,
    fontSize: 18,
    lineHeight: 25,
    fontFamily: 'Pretendard-Bold',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySub: {
    color: P.sub,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Pretendard-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    alignSelf: 'stretch',
    height: 54,
    borderRadius: 18,
    backgroundColor: P.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  emptyButtonText: { color: P.navy, fontSize: 15, fontFamily: 'Pretendard-Bold' },
  listGap: { gap: 12 },
  foodCard: {
    minHeight: 122,
    borderRadius: 22,
    backgroundColor: P.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 16,
  },
  foodImage: {
    width: 104,
    height: 98,
    borderRadius: 17,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  foodImageFooter: { height: 34, backgroundColor: P.navy, justifyContent: 'center', paddingLeft: 15 },
  foodImageLabel: { color: P.white, fontSize: 11, fontFamily: 'Pretendard-Bold' },
  foodContent: { flex: 1, alignSelf: 'stretch', paddingTop: 3 },
  foodStore: { color: P.sub, fontSize: 11, fontFamily: 'Pretendard-Regular' },
  foodTitle: { color: P.navy, fontSize: 17, fontFamily: 'Pretendard-Bold', marginTop: 8 },
  foodMeta: { color: P.sub, fontSize: 11, fontFamily: 'Pretendard-Regular', marginTop: 4 },
  statusPill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, marginTop: 7 },
  statusText: { fontSize: 10, fontFamily: 'Pretendard-Bold' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
