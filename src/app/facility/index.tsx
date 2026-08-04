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
import { api, FeedItem } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';

// S-04 시설 피드 (3초 폴링) + S-04D 빈 상태
export default function FacilityFeed() {
  const { me } = useAuth();
  const router = useRouter();
  const facilityId = me?.facilityId;
  const [applying, setApplying] = useState<number | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
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

  const apply = async (item: FeedItem) => {
    if (!facilityId) return;
    setApplying(item.id);
    setApplyError(null);
    try {
      const match = await api.applyMatch(item.id, facilityId);
      router.push(`/pickup/${match.id}`);
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : '신청에 실패했어요. 다시 시도해주세요.');
      refresh();
    } finally {
      setApplying(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <HomeHeader />

        <Text style={s.facilityName}>{me?.facility?.name ?? ''}</Text>
        <View style={s.locationRow}>
          <Ionicons name="location-outline" size={14} color={C.sub} />
          <Text style={s.locationText}>{me?.facility?.address ?? '-'} · 반경 3km</Text>
        </View>

        <Text style={s.sectionTitle}>
          지금 받을 수 있는 나눔{feed && feed.length > 0 ? ` ${feed.length}` : ''}
        </Text>

        {applyError ? (
          <View style={s.errorBox}>
            <Text style={s.errorBoxText}>{applyError}</Text>
          </View>
        ) : null}

        {feed === null ? null : feed.length === 0 ? (
          <View style={s.emptyCard}>
            <Ionicons name="leaf-outline" size={28} color={C.gray} />
            <Text style={s.emptyTitle}>지금은 주변에 나눔이 없어요</Text>
            <Text style={s.emptySub}>새 나눔이 올라오면 여기에 바로 나타나요.</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {feed.map((item) => {
              const urgent = item.remainingMinutes <= 45;
              return (
                <View key={item.id} style={s.feedCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {item.photoUrl ? (
                      <Image source={{ uri: item.photoUrl }} style={s.thumb} />
                    ) : (
                      <View style={[s.thumb, s.thumbFallback]}>
                        <Ionicons name="fast-food-outline" size={22} color={C.gray} />
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={s.storeName}>{item.store.name}</Text>
                      <Text style={s.itemName}>{item.itemName}</Text>
                      <Text style={s.itemMeta}>
                        {item.quantity}개 · {item.distanceKm}km
                      </Text>
                    </View>
                    <Text style={[s.remaining, urgent && { color: C.red }]}>
                      {urgent ? '마감 임박' : ''}
                      {urgent ? '\n' : ''}
                      {item.remainingMinutes}분 남음
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => apply(item)}
                    disabled={applying === item.id}
                    style={({ pressed }) => [
                      s.applyButton,
                      (pressed || applying === item.id) && { opacity: 0.8 },
                    ]}
                  >
                    <Text style={s.applyButtonText}>
                      {applying === item.id ? '신청하는 중…' : '받으러 갈게요'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  facilityName: {
    fontSize: 22,
    fontFamily: 'Pretendard-ExtraBold',
    color: C.text,
    marginTop: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    marginBottom: 20,
  },
  locationText: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: C.sub },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    color: C.text,
    marginBottom: 10,
  },
  errorBox: {
    backgroundColor: C.redSoft,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  errorBoxText: { color: C.red, fontSize: 13, fontFamily: 'Pretendard-SemiBold' },
  feedCard: {
    backgroundColor: C.card,
    borderRadius: R.card,
    padding: 16,
    gap: 14,
  },
  thumb: { width: 48, height: 48, borderRadius: 12 },
  thumbFallback: {
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: { fontSize: 12, color: C.sub, fontFamily: 'Pretendard-Regular' },
  itemName: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: C.text },
  itemMeta: { fontSize: 12.5, fontFamily: 'Pretendard-Regular', color: C.sub },
  remaining: {
    fontSize: 12.5,
    fontFamily: 'Pretendard-Bold',
    color: C.brandDeep,
    textAlign: 'right',
    lineHeight: 18,
  },
  applyButton: {
    backgroundColor: C.brand,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  applyButtonText: { fontSize: 14.5, fontFamily: 'Pretendard-Bold', color: '#FFF' },
  emptyCard: {
    backgroundColor: C.card,
    borderRadius: R.card,
    padding: 32,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: { fontSize: 14.5, fontFamily: 'Pretendard-Bold', color: C.text, marginTop: 4 },
  emptySub: { fontSize: 12.5, fontFamily: 'Pretendard-Regular', color: C.sub },
});
