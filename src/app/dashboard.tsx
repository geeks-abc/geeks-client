import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { HomeHeader } from '@/components/header';
import { Skeleton } from '@/components/skeleton';
import { api } from '@/lib/api';
import { usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// S-07 임팩트 대시보드 (관리자) — 타이포 중심의 미니멀 화이트
export default function Dashboard() {
  const { data: impact } = usePolling(() => api.impact(), 5000);

  const daily = impact?.daily ?? [];
  const maxCount = Math.max(1, ...daily.map((d) => d.count));
  const weekTotal = daily.reduce((sum, d) => sum + d.count, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <HomeHeader />

        {/* 핵심 지표 — 타이포로 크게 */}
        <Animated.View entering={FadeInDown.duration(450)} style={s.heroBlock}>
          <Text style={s.heroLabel}>지금까지 이어진 나눔</Text>
          {impact ? (
            <Text style={s.heroValue}>
              {impact.totalDonations}
              <Text style={s.heroUnit}>건</Text>
            </Text>
          ) : (
            <Skeleton height={44} width={140} />
          )}
        </Animated.View>

        {/* 요약 지표 — 한 줄 3분할 */}
        <Animated.View entering={FadeInUp.delay(100).duration(450)} style={s.statRow}>
          <View style={s.stat}>
            <Text style={s.statValue}>{impact?.totalWeightKg ?? '-'}kg</Text>
            <Text style={s.statLabel}>구한 음식</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statValue}>{impact?.totalCo2eKg ?? '-'}kg</Text>
            <Text style={s.statLabel}>CO₂e 절감</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statValue}>
              {impact ? impact.storeCount + impact.facilityCount : '-'}곳
            </Text>
            <Text style={s.statLabel}>참여 기관</Text>
          </View>
        </Animated.View>

        {/* 주간 추이 */}
        <Animated.View entering={FadeInUp.delay(180).duration(450)} style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>최근 7일</Text>
            <Text style={s.sectionMeta}>기부 {weekTotal}건</Text>
          </View>

          <View style={s.chart}>
            {daily.map((day, index) => {
              const date = new Date(day.date);
              const isLast = index === daily.length - 1;
              const isPeak = day.count === maxCount && day.count > 0;
              return (
                <View key={day.date} style={s.barWrap}>
                  {isPeak || isLast ? (
                    <Text style={s.barValue}>{day.count}</Text>
                  ) : (
                    <View style={s.barValueSpace} />
                  )}
                  <View style={s.barTrack}>
                    <View
                      style={[
                        s.bar,
                        { height: `${Math.max(6, (day.count / maxCount) * 100)}%` },
                        (isPeak || isLast) && s.barActive,
                      ]}
                    />
                  </View>
                  <Text style={[s.barLabel, isLast && s.barLabelActive]}>
                    {isLast ? '오늘' : WEEKDAYS[date.getDay()]}
                  </Text>
                </View>
              );
            })}
            {daily.length === 0 ? <Text style={s.chartEmpty}>아직 데이터가 없어요</Text> : null}
          </View>
        </Animated.View>

        {/* 참여 현황 */}
        <Animated.View entering={FadeInUp.delay(260).duration(450)} style={s.section}>
          <Text style={s.sectionTitle}>참여 현황</Text>
          <View style={s.list}>
            <View style={s.listRow}>
              <View style={s.listIcon}>
                <Ionicons name="storefront-outline" size={17} color={C.brand} />
              </View>
              <Text style={s.listLabel}>참여 가게</Text>
              <Text style={s.listValue}>{impact?.storeCount ?? '-'}곳</Text>
            </View>
            <View style={s.listDivider} />
            <View style={s.listRow}>
              <View style={s.listIcon}>
                <Ionicons name="home-outline" size={17} color={C.brand} />
              </View>
              <Text style={s.listLabel}>참여 시설</Text>
              <Text style={s.listValue}>{impact?.facilityCount ?? '-'}곳</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(320).duration(450)}>
          <Text style={s.footnote}>전달 완료된 기부 무게 기준으로 CO₂e를 환산해요.</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  content: { padding: 24, paddingBottom: 48 },
  heroBlock: { gap: 6, marginTop: 22 },
  heroLabel: { fontSize: 14, fontFamily: 'Pretendard-SemiBold', color: C.sub },
  heroValue: { fontSize: 46, lineHeight: 54, fontFamily: 'Pretendard-Black', color: C.text },
  heroUnit: { fontSize: 26, fontFamily: 'Pretendard-ExtraBold', color: C.brand },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: R.card,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginTop: 24,
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 16.5, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  statLabel: { fontSize: 11.5, fontFamily: 'Pretendard-Regular', color: C.sub },
  statDivider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: '#DDE1E4' },
  section: { marginTop: 36, gap: 16 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  sectionMeta: { fontSize: 12.5, fontFamily: 'Pretendard-SemiBold', color: C.brand },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    gap: 8,
  },
  barWrap: { flex: 1, alignItems: 'center', gap: 7, height: '100%' },
  barValue: { fontSize: 11.5, fontFamily: 'Pretendard-ExtraBold', color: C.brand },
  barValueSpace: { height: 14 },
  barTrack: { flex: 1, width: '100%', maxWidth: 26, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 8, backgroundColor: C.graySoft },
  barActive: { backgroundColor: C.brand },
  barLabel: { fontSize: 10.5, fontFamily: 'Pretendard-Regular', color: C.gray },
  barLabelActive: { fontFamily: 'Pretendard-ExtraBold', color: C.text },
  chartEmpty: { flex: 1, textAlign: 'center', color: C.sub, fontFamily: 'Pretendard-Regular' },
  list: {
    backgroundColor: C.bg,
    borderRadius: R.card,
    paddingHorizontal: 18,
  },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 },
  listIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listLabel: { flex: 1, fontSize: 14, fontFamily: 'Pretendard-SemiBold', color: C.text },
  listValue: { fontSize: 15, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  listDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E4E7EA' },
  footnote: {
    fontSize: 11.5,
    fontFamily: 'Pretendard-Regular',
    color: C.gray,
    marginTop: 28,
    textAlign: 'center',
  },
});
