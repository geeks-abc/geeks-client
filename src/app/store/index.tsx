import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Badge, Card, EmptyState } from '@/components/ui';
import { api, Listing } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtTime, isToday, remainingLabel, usePolling } from '@/lib/hooks';
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

  const cardMeta = (listing: Listing) => {
    if (listing.status === 'OPEN')
      return `${listing.quantity}개 · ${remainingLabel(listing.pickupEnd)}`;
    if (listing.status === 'MATCHED' && listing.match?.facility)
      return `${listing.match.facility.name} · ${fmtTime(listing.pickupEnd)}까지 픽업`;
    return `${listing.quantity}개 · ${fmtTime(listing.pickupEnd)} 마감`;
  };

  const renderCard = (listing: Listing, dimmed = false) => (
    <Animated.View key={listing.id} entering={FadeInUp.duration(400)}>
      <Pressable
        onPress={() => router.push(`/listing/${listing.id}`)}
        style={({ pressed }) => pressed && { opacity: 0.85 }}
      >
        <Card style={[s.listingCard, dimmed && { opacity: 0.65 }]}>
          <View style={s.thumb}>
            {listing.photoUrl ? (
              <Image source={{ uri: listing.photoUrl }} style={s.thumbImg} />
            ) : (
              <Text style={{ fontSize: 22 }}>🥐</Text>
            )}
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={s.listingName}>{listing.itemName}</Text>
            <Text
              style={[
                s.listingMeta,
                listing.status === 'MATCHED' && { color: C.blue },
                listing.status === 'OPEN' && { color: C.brandDeep },
              ]}
            >
              {cardMeta(listing)}
            </Text>
            <Badge status={listing.status} />
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.gray} />
        </Card>
      </Pressable>
    </Animated.View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <HomeHeader subtitle="STORE HOME" />

        <Animated.View entering={FadeInDown.duration(500)} style={{ gap: 6 }}>
          <Text style={s.greeting}>안녕하세요, {me?.store?.name ?? '사장님'} 👋</Text>
          <Text style={s.headline}>남은 식품을{'\n'}오늘도 이어볼까요?</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <LinearGradient
            colors={['#2C5E3F', '#152C1E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.statCard}
          >
            <Text style={s.statTitle}>오늘의 이음</Text>
            <View style={{ flexDirection: 'row' }}>
              {stats.map((stat, index) => (
                <View
                  key={stat.label}
                  style={[s.statCol, index > 0 && s.statColDivider]}
                >
                  <Text style={s.statValue}>
                    {stat.value}
                    <Text style={s.statUnit}>건</Text>
                  </Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(180).duration(500)}>
          <Pressable
            onPress={() => router.push('/new-listing')}
            style={({ pressed }) => [s.cta, pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <View style={s.ctaIcon}>
              <Ionicons name="add" size={24} color={C.brandDeep} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.ctaTitle}>기부 품목 등록</Text>
              <Text style={s.ctaSub}>마감 전 남은 식품, 30초면 등록 끝</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </Animated.View>

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>진행중인 품목</Text>
          {active.length > 0 ? (
            <View style={s.countChip}>
              <Text style={s.countChipText}>{active.length}</Text>
            </View>
          ) : null}
        </View>
        {listings === null ? null : active.length === 0 ? (
          <EmptyState
            title="진행중인 품목이 없어요"
            sub="30초면 오늘 남은 식품을 등록할 수 있어요."
          />
        ) : (
          active.map((l) => renderCard(l))
        )}

        {past.length > 0 ? (
          <>
            <View style={[s.sectionHeader, { marginTop: 8 }]}>
              <Text style={s.sectionTitle}>지난 품목</Text>
            </View>
            {past.map((l) => renderCard(l, true))}
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
  statCard: { borderRadius: R.card, padding: 20, gap: 16 },
  statTitle: {
    fontSize: 12,
    fontFamily: 'Pretendard-ExtraBold',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5,
  },
  statCol: { flex: 1, alignItems: 'center', gap: 3 },
  statColDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.2)',
  },
  statValue: { color: '#FFF', fontSize: 24, fontFamily: 'Pretendard-Black' },
  statUnit: { fontSize: 14, fontFamily: 'Pretendard-Bold', color: 'rgba(255,255,255,0.6)' },
  statLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Pretendard-SemiBold' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.brand,
    borderRadius: R.card,
    padding: 18,
  },
  ctaIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: { fontSize: 16, fontFamily: 'Pretendard-ExtraBold', color: '#FFF' },
  ctaSub: { fontSize: 12.5, fontFamily: 'Pretendard-Regular', color: 'rgba(255,255,255,0.75)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  countChip: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  countChipText: { fontSize: 12, fontFamily: 'Pretendard-ExtraBold', color: C.brandDeep },
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
  listingMeta: { fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: C.sub },
});
