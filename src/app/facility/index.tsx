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
import { api, FeedItem } from '@/lib/api';
import { useAuth, useSwitchAccount } from '@/lib/auth';
import { usePolling } from '@/lib/hooks';
import { C } from '@/lib/theme';
import { FeedCardSkeleton } from '@/components/skeleton';

const FALLBACK_COLORS = ['#FFA044', '#219B5A', '#F2B93D'];

function remainingTime(minutes: number) {
  if (minutes < 60) return `${minutes}분 남음`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes ? `${hours}시간 ${restMinutes}분` : `${hours}시간`;
}

// S-04 시설 피드 (3초 폴링) + S-04D 빈 상태
export default function FacilityFeed() {
  const { me } = useAuth();
  const switchAccount = useSwitchAccount();
  const router = useRouter();
  const facilityId = me?.facilityId;
  const [refreshing, setRefreshing] = useState(false);

  const { data: feed, refresh } = usePolling(
    () => (facilityId ? api.feed(facilityId) : Promise.resolve([] as FeedItem[])),
    3000,
    [facilityId],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.screen}>
        <ScrollView
          contentContainerStyle={s.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.header}>
            <View>
              <Text style={s.logo}>이음</Text>
              <Text style={s.homeLabel}>FACILITY HOME</Text>
            </View>
            <Pressable
              onPress={switchAccount}
              hitSlop={8}
              style={({ pressed }) => [s.switchAccount, pressed && { opacity: 0.6 }]}
            >
              <Text style={s.switchAccountText}>계정 전환</Text>
            </Pressable>
          </View>

          <View style={s.profileCard}>
            <View style={s.profileIcon}>
              <Ionicons name="heart" size={22} color={C.navy} />
            </View>
            <View style={s.profileText}>
              <Text style={s.profileEyebrow}>현재 접속 중</Text>
              <Text style={s.facilityName}>{me?.facility?.name ?? '복지시설'}</Text>
            </View>
            <View style={s.roleChip}>
              <Text style={s.roleChipText}>복지시설</Text>
            </View>
          </View>

          <View style={s.locationCard}>
            <View style={s.locationText}>
              <Text style={s.locationLabel}>현재 위치</Text>
              <Text numberOfLines={1} style={s.locationName}>
                {me?.facility?.address ?? '위치를 설정해주세요'}
              </Text>
            </View>
            <View style={s.locationButton}>
              <Ionicons name="locate-outline" size={22} color={C.navy} />
            </View>
          </View>

          <View style={s.viewTabs}>
            <View style={s.activeTab}>
              <Text style={s.activeTabText}>리스트</Text>
            </View>
            <View style={s.inactiveTab}>
              <Text style={s.inactiveTabText}>지도</Text>
            </View>
          </View>

          <View style={s.feedHeading}>
            <Text style={s.sectionTitle}>주변 기부 식품</Text>
            <Text style={s.sectionSub}>반경 3km · OPEN {feed?.length ?? 0}건</Text>
          </View>

          {feed === null ? (
            <View style={{ gap: 12 }}>
              <FeedCardSkeleton />
              <FeedCardSkeleton />
            </View>
          ) : feed.length === 0 ? (
            <View style={s.emptyCard}>
              <View style={s.emptyIcon}>
                <Ionicons name="leaf-outline" size={30} color={C.brand} />
              </View>
              <Text style={s.emptyTitle}>지금은 주변에 나눔이 없어요</Text>
              <Text style={s.emptySub}>새 나눔이 올라오면 여기에 바로 나타나요.</Text>
            </View>
          ) : (
            <View style={s.feedList}>
              {feed.map((item, index) => {
                const urgent = item.remainingMinutes <= 45;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(`/listing/${item.id}`)}
                    style={({ pressed }) => [s.feedCard, pressed && { transform: [{ scale: 0.985 }] }]}
                  >
                    {item.photoUrl ? (
                      <Image transition={150} source={{ uri: item.photoUrl }} style={s.thumbnail} />
                    ) : (
                      <View style={[s.thumbnail, { backgroundColor: FALLBACK_COLORS[index % FALLBACK_COLORS.length] }]}>
                        <View style={s.thumbnailFooter}>
                          <Text style={s.thumbnailLabel}>FOOD</Text>
                        </View>
                      </View>
                    )}
                    <View style={s.itemContent}>
                      <Text numberOfLines={1} style={s.storeName}>{item.store.name}</Text>
                      <Text numberOfLines={1} style={s.itemName}>{item.itemName}</Text>
                      <Text style={s.itemMeta}>
                        {item.quantity}개 · {item.distanceKm}km · {remainingTime(item.remainingMinutes)}
                      </Text>
                      <View style={[s.statusChip, urgent ? s.urgentChip : s.openChip]}>
                        <Text style={[s.statusText, urgent ? s.urgentText : s.openText]}>
                          {urgent ? '마감임박' : 'OPEN'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="arrow-forward" size={28} color={C.navy} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E7E7E3' },
  screen: {
    flex: 1,
    backgroundColor: '#FAFAF8',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  content: { padding: 32, paddingBottom: 40, gap: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { color: C.navy, fontSize: 36, fontFamily: 'Pretendard-Black', letterSpacing: -1.8 },
  homeLabel: { color: '#6E747C', fontSize: 15, fontFamily: 'Pretendard-ExtraBold', marginTop: -2 },
  switchAccount: { paddingVertical: 8, paddingLeft: 12 },
  switchAccountText: { color: C.navy, fontSize: 16, fontFamily: 'Pretendard-ExtraBold' },
  profileCard: {
    minHeight: 90,
    borderRadius: 26,
    backgroundColor: C.card,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD21D',
  },
  profileText: { flex: 1, gap: 2 },
  profileEyebrow: { color: '#767D86', fontSize: 13, fontFamily: 'Pretendard-Regular' },
  facilityName: { color: C.navy, fontSize: 19, fontFamily: 'Pretendard-ExtraBold' },
  roleChip: { backgroundColor: '#FFF1BA', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  roleChipText: { color: C.navy, fontSize: 14, fontFamily: 'Pretendard-ExtraBold' },
  locationCard: {
    borderRadius: 26,
    backgroundColor: C.card,
    paddingLeft: 22,
    paddingRight: 14,
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  locationText: { flex: 1, gap: 3 },
  locationLabel: { color: '#767D86', fontSize: 13, fontFamily: 'Pretendard-Regular' },
  locationName: { color: C.navy, fontSize: 17, fontFamily: 'Pretendard-ExtraBold' },
  locationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFD21D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewTabs: {
    height: 76,
    borderRadius: 26,
    backgroundColor: C.card,
    padding: 8,
    flexDirection: 'row',
  },
  activeTab: { flex: 1, borderRadius: 19, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  inactiveTab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeTabText: { color: '#FFFFFF', fontSize: 17, fontFamily: 'Pretendard-ExtraBold' },
  inactiveTabText: { color: '#777D85', fontSize: 17, fontFamily: 'Pretendard-ExtraBold' },
  feedHeading: { marginTop: 22, gap: 6 },
  sectionTitle: { color: C.navy, fontSize: 32, fontFamily: 'Pretendard-Black', letterSpacing: -1.2 },
  sectionSub: { color: '#737A83', fontSize: 16, fontFamily: 'Pretendard-Regular' },
  feedList: { gap: 16 },
  feedCard: {
    minHeight: 162,
    borderRadius: 30,
    backgroundColor: C.card,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  thumbnail: { width: 104, height: 128, borderRadius: 24, overflow: 'hidden', justifyContent: 'flex-end' },
  thumbnailFooter: { height: 38, backgroundColor: C.navy, paddingHorizontal: 18, justifyContent: 'center' },
  thumbnailLabel: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Pretendard-ExtraBold' },
  itemContent: { flex: 1, gap: 7 },
  storeName: { color: '#747B84', fontSize: 14, fontFamily: 'Pretendard-SemiBold' },
  itemName: { color: C.navy, fontSize: 21, fontFamily: 'Pretendard-ExtraBold', letterSpacing: -0.7 },
  itemMeta: { color: '#727983', fontSize: 14, fontFamily: 'Pretendard-Regular' },
  statusChip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, marginTop: 2 },
  urgentChip: { backgroundColor: '#FCE4DE' },
  openChip: { backgroundColor: '#E2F5EA' },
  statusText: { fontSize: 13, fontFamily: 'Pretendard-ExtraBold' },
  urgentText: { color: C.red },
  openText: { color: '#159654' },
  emptyCard: { backgroundColor: C.card, borderRadius: 30, padding: 36, alignItems: 'center', gap: 8 },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { color: C.navy, fontSize: 17, fontFamily: 'Pretendard-ExtraBold' },
  emptySub: { color: '#737A83', fontSize: 13, fontFamily: 'Pretendard-Regular', textAlign: 'center' },
});
