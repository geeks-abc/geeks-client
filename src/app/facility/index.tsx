import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import { NearbyMap } from '@/components/nearby-map';
import { NearbyMapItem } from '@/components/nearby-map.types';
import { FeedCardSkeleton } from '@/components/skeleton';
import { api, FeedItem } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { usePolling } from '@/lib/hooks';
import { loadProfileLocation, ProfileLocation } from '@/lib/profile-location';
import { C, R } from '@/lib/theme';

function remainingText(minutes: number) {
  if (minutes < 60) return `${minutes}분 남음`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}시간 ${rest}분` : `${hours}시간`;
}

// S-04 시설 피드 — 리스트·OpenStreetMap 지도 제공
export default function FacilityFeed() {
  const { me } = useAuth();
  const router = useRouter();
  const facilityId = me?.facilityId;
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [savedLocation, setSavedLocation] = useState<ProfileLocation | null>(null);

  useEffect(() => {
    let active = true;
    const facility = me?.facility;
    if (!facility) {
      setSavedLocation(null);
      return;
    }

    void loadProfileLocation(facility.id).then((saved) => {
      if (!active) return;
      setSavedLocation(saved?.address === facility.address ? saved : null);
    });
    return () => {
      active = false;
    };
  }, [me?.facility]);

  const mapLocation = savedLocation ?? (me?.facility
    ? {
        address: me.facility.address,
        lat: me.facility.lat,
        lng: me.facility.lng,
        source: 'search' as const,
      }
    : null);

  const { data: feed, refresh } = usePolling(
    () => (facilityId ? api.feed(facilityId) : Promise.resolve([] as FeedItem[])),
    3000,
    [facilityId],
  );

  const mapItems = useMemo<NearbyMapItem[]>(
    () =>
      (feed ?? []).map((item) => ({
        id: item.id,
        lat: item.store.lat,
        lng: item.store.lng,
        storeName: item.store.name,
        itemName: item.itemName,
        quantity: item.quantity,
        distanceKm: item.distanceKm,
        remainingText:
          item.remainingMinutes <= 45 ? '마감 임박' : remainingText(item.remainingMinutes),
      })),
    [feed],
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

        <View style={s.profileHead}>
          <View style={s.avatar}>
            <Ionicons name="home" size={22} color={C.brand} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={s.name}>{me?.facility?.name ?? '이음 시설'}</Text>
            <View style={s.roleChip}>
              <Text style={s.roleChipText}>복지시설</Text>
            </View>
          </View>
        </View>

        <View style={s.locationCard}>
          <Ionicons name="location" size={18} color={C.brand} />
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={s.locationLabel}>설정 위치</Text>
            <Text numberOfLines={1} style={s.locationValue}>
              {mapLocation?.address ?? '위치를 설정해주세요'}
            </Text>
          </View>
          <Text style={s.locationRadius}>반경 3km</Text>
        </View>

        <View style={s.viewToggle}>
          <Pressable
            onPress={() => setViewMode('list')}
            style={[s.viewToggleButton, viewMode === 'list' && s.viewToggleButtonActive]}
          >
            <Ionicons name="list" size={17} color={viewMode === 'list' ? '#FFFFFF' : C.sub} />
            <Text style={[s.viewToggleText, viewMode === 'list' && s.viewToggleTextActive]}>
              리스트
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode('map')}
            style={[s.viewToggleButton, viewMode === 'map' && s.viewToggleButtonActive]}
          >
            <Ionicons name="map-outline" size={17} color={viewMode === 'map' ? '#FFFFFF' : C.sub} />
            <Text style={[s.viewToggleText, viewMode === 'map' && s.viewToggleTextActive]}>
              지도
            </Text>
          </Pressable>
        </View>

        <Text style={s.sectionTitle}>
          지금 받을 수 있는 나눌{feed && feed.length > 0 ? ` ${feed.length}` : ''}
        </Text>

        {viewMode === 'map' && me?.facility && mapLocation ? (
          feed === null ? (
            <View style={s.mapSkeleton}>
              <FeedCardSkeleton />
            </View>
          ) : (
            <>
              <View style={s.mapCard}>
                <NearbyMap
                  facility={{
                    name: me.facility.name,
                    lat: mapLocation.lat,
                    lng: mapLocation.lng,
                  }}
                  items={mapItems}
                  onSelect={(listingId) => router.push(`/listing/${listingId}`)}
                />
              </View>
              <View style={s.mapHint}>
                <Ionicons name="information-circle-outline" size={16} color={C.sub} />
                <Text style={s.mapHintText}>
                  마커를 누르면 상품 정보를 확인할 수 있어요.
                </Text>
              </View>
            </>
          )
        ) : feed === null ? (
          <View style={s.list}>
            <FeedCardSkeleton />
            <FeedCardSkeleton />
          </View>
        ) : feed.length === 0 ? (
          <View style={s.emptyCard}>
            <View style={s.emptyIcon}>
              <Ionicons name="leaf-outline" size={26} color={C.brand} />
            </View>
            <Text style={s.emptyTitle}>지금은 주변에 나눌이 없어요</Text>
            <Text style={s.emptySub}>새 나눌이 올라오면 여기에 바로 나타나요.</Text>
          </View>
        ) : (
          <View style={s.list}>
            {feed.map((item) => {
              const urgent = item.remainingMinutes <= 45;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/listing/${item.id}`)}
                  style={({ pressed }) => [s.row, pressed && s.pressed]}
                >
                  {item.photoUrl ? (
                    <Image transition={150} source={{ uri: item.photoUrl }} style={s.thumb} />
                  ) : (
                    <View style={[s.thumb, s.thumbFallback]}>
                      <Ionicons name="fast-food-outline" size={20} color={C.gray} />
                    </View>
                  )}
                  <View style={s.rowContent}>
                    <Text numberOfLines={1} style={s.rowStore}>{item.store.name}</Text>
                    <Text numberOfLines={1} style={s.rowTitle}>{item.itemName}</Text>
                    <Text style={s.rowMeta}>{item.quantity}개 · {item.distanceKm}km</Text>
                  </View>
                  <View style={s.rowEnd}>
                    <Text style={[s.remaining, urgent && { color: C.red }]}>
                      {urgent ? '마감 임박' : remainingText(item.remainingMinutes)}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={C.gray} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  profileHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6, marginBottom: 4 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 19, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  roleChip: { alignSelf: 'flex-start', backgroundColor: C.brandSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  roleChipText: { fontSize: 11.5, fontFamily: 'Pretendard-Bold', color: C.brandDeep },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: R.card, paddingHorizontal: 16, paddingVertical: 13 },
  locationLabel: { fontSize: 11, fontFamily: 'Pretendard-Regular', color: C.sub },
  locationValue: { fontSize: 13.5, fontFamily: 'Pretendard-Bold', color: C.text },
  locationRadius: { fontSize: 12, fontFamily: 'Pretendard-Bold', color: C.brandDeep },
  viewToggle: { height: 48, borderRadius: 14, backgroundColor: C.card, padding: 4, flexDirection: 'row', gap: 4 },
  viewToggleButton: { flex: 1, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  viewToggleButtonActive: { backgroundColor: C.navy },
  viewToggleText: { color: C.sub, fontSize: 13.5, fontFamily: 'Pretendard-Bold' },
  viewToggleTextActive: { color: '#FFFFFF' },
  sectionTitle: { fontSize: 15, fontFamily: 'Pretendard-Bold', color: C.text, marginTop: 8 },
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: R.card, padding: 14 },
  thumb: { width: 52, height: 52, borderRadius: 12 },
  thumbFallback: { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, gap: 2 },
  rowEnd: { alignItems: 'flex-end', gap: 4 },
  rowStore: { fontSize: 11.5, fontFamily: 'Pretendard-Regular', color: C.sub },
  rowTitle: { fontSize: 15, fontFamily: 'Pretendard-Bold', color: C.text },
  rowMeta: { fontSize: 12.5, fontFamily: 'Pretendard-Regular', color: C.sub },
  remaining: { fontSize: 12, fontFamily: 'Pretendard-Bold', color: C.brandDeep },
  mapCard: { height: 460, borderRadius: R.card, overflow: 'hidden', backgroundColor: '#EEF1EF' },
  mapSkeleton: { height: 460, borderRadius: R.card, overflow: 'hidden', justifyContent: 'center' },
  mapHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 2 },
  mapHintText: { color: C.sub, fontSize: 11.5, fontFamily: 'Pretendard-Regular' },
  emptyCard: { backgroundColor: C.card, borderRadius: R.card, padding: 30, alignItems: 'center', gap: 6 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontFamily: 'Pretendard-Bold', color: C.text },
  emptySub: { fontSize: 12.5, fontFamily: 'Pretendard-Regular', color: C.sub },
});
