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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { HomeHeader } from '@/components/header';
import { Badge, Button, Card, EmptyState, SectionTitle } from '@/components/ui';
import { api, Listing } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtTime, isToday, usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';

// S-01 가게 홈
export default function StoreHome() {
  const { me } = useAuth();
  const router = useRouter();
  const storeId = me?.storeId;
  const [refreshing, setRefreshing] = useState(false);

  const { data: listings, refresh } = usePolling(
    () => (storeId ? api.myListings(storeId) : Promise.resolve([] as Listing[])),
    3000,
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const today = (listings ?? []).filter((l) => isToday(l.createdAt));
  const stats = [
    { label: '오늘 등록', value: today.length },
    { label: '매칭', value: today.filter((l) => l.status === 'MATCHED').length },
    { label: '완료', value: today.filter((l) => l.status === 'COMPLETED').length },
  ];

  const active = (listings ?? []).filter(
    (l) => l.status === 'OPEN' || l.status === 'MATCHED',
  );
  const past = (listings ?? []).filter(
    (l) => l.status !== 'OPEN' && l.status !== 'MATCHED',
  );

  const renderCard = (listing: Listing) => (
    <Animated.View key={listing.id} entering={FadeInUp.duration(400)}>
      <Pressable
        onPress={() => router.push(`/listing/${listing.id}`)}
        style={({ pressed }) => pressed && { opacity: 0.85 }}
      >
        <Card style={s.listingCard}>
          <View style={s.thumb}>
            {listing.photoUrl ? (
              <Image source={{ uri: listing.photoUrl }} style={s.thumbImg} />
            ) : (
              <Text style={{ fontSize: 22 }}>🥐</Text>
            )}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.listingName}>{listing.itemName}</Text>
            <Text style={s.listingMeta}>
              {listing.quantity}개 · {fmtTime(listing.pickupEnd)} 마감
            </Text>
            <Badge status={listing.status} />
          </View>
          <Text style={s.arrow}>→</Text>
        </Card>
      </Pressable>
    </Animated.View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <HomeHeader subtitle="STORE HOME" />

        <Animated.View entering={FadeInDown.duration(500)} style={{ gap: 6 }}>
          <Text style={s.greeting}>안녕하세요, {me?.store?.name ?? '사장님'} 👋</Text>
          <Text style={s.headline}>남은 식품을{'\n'}오늘도 이어볼까요?</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).duration(500)} style={s.statCard}>
          {stats.map((stat) => (
            <View key={stat.label} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <Text style={s.statLabel}>{stat.label}</Text>
              <Text style={[s.statValue, stat.label === '매칭' && { color: C.brandOnDark }]}>
                {stat.value}건
              </Text>
            </View>
          ))}
        </Animated.View>

        <Button title="+ 기부 품목 등록" onPress={() => router.push('/new-listing')} />

        <SectionTitle>진행중인 품목</SectionTitle>
        {listings === null ? null : active.length === 0 ? (
          <EmptyState
            title="진행중인 품목이 없어요"
            sub="30초면 오늘 남은 식품을 등록할 수 있어요."
          />
        ) : (
          active.map(renderCard)
        )}

        {past.length > 0 ? (
          <>
            <SectionTitle>지난 품목</SectionTitle>
            {past.map(renderCard)}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  greeting: { fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: C.sub },
  headline: {
    fontSize: 26,
    fontFamily: 'Pretendard-Black',
    color: C.text,
    lineHeight: 36,
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: C.navy,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 8,
  },
  statLabel: { color: '#8D97AC', fontSize: 12, fontFamily: 'Pretendard-SemiBold' },
  statValue: { color: '#FFF', fontSize: 22, fontFamily: 'Pretendard-Black' },
  listingCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: R.chip,
    backgroundColor: '#F1EBE0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  listingName: { fontSize: 16, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  listingMeta: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: C.sub, marginBottom: 4 },
  arrow: { fontSize: 18, color: C.gray, fontFamily: 'Pretendard-Bold' },
});
