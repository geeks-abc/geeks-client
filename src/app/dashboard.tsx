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

// S-07 임팩트 대시보드 (관리자) — 화이트 + 오렌지 디자인 시스템
export default function Dashboard() {
  const { data: impact } = usePolling(() => api.impact(), 5000);

  const daily = impact?.daily ?? [];
  const maxCount = Math.max(1, ...daily.map((d) => d.count));
  const weekTotal = daily.reduce((sum, d) => sum + d.count, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <HomeHeader />

        <Animated.View entering={FadeInDown.duration(450)} style={s.titleBlock}>
          <Text style={s.eyebrow}>임팩트 대시보드</Text>
          <Text style={s.headline}>우리가 함께 만든 변화</Text>
        </Animated.View>

        {/* 히어로 — 누적 기부 */}
        <Animated.View entering={FadeInUp.delay(80).duration(450)} style={s.heroCard}>
          <View style={s.heroTop}>
            <View style={{ gap: 4 }}>
              <Text style={s.heroLabel}>누적 기부</Text>
              {impact ? (
                <Text style={s.heroValue}>{impact.totalDonations}건</Text>
              ) : (
                <Skeleton height={34} width={110} />
              )}
            </View>
            <View style={s.heroIcon}>
              <Ionicons name="gift" size={24} color="#FFFFFF" />
            </View>
          </View>
          <View style={s.heroDivider} />
          <View style={s.heroMetrics}>
            <View style={s.heroMetric}>
              <Text style={s.heroMetricLabel}>구한 음식</Text>
              <Text style={s.heroMetricValue}>{impact?.totalWeightKg ?? '-'}kg</Text>
            </View>
            <View style={s.heroMetricDivider} />
            <View style={s.heroMetric}>
              <Text style={s.heroMetricLabel}>CO₂e 절감</Text>
              <Text style={s.heroMetricValue}>{impact?.totalCo2eKg ?? '-'}kg</Text>
            </View>
          </View>
        </Animated.View>

        {/* 참여 현황 */}
        <View style={s.pairRow}>
          <Animated.View entering={FadeInUp.delay(160).duration(450)} style={s.pairCard}>
            <View style={[s.pairIcon, { backgroundColor: C.brandSoft }]}>
              <Ionicons name="storefront" size={18} color={C.brand} />
            </View>
            <Text style={s.pairValue}>{impact?.storeCount ?? '-'}곳</Text>
            <Text style={s.pairLabel}>참여 가게</Text>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(220).duration(450)} style={s.pairCard}>
            <View style={[s.pairIcon, { backgroundColor: C.blueSoft }]}>
              <Ionicons name="home" size={18} color={C.blue} />
            </View>
            <Text style={s.pairValue}>{impact?.facilityCount ?? '-'}곳</Text>
            <Text style={s.pairLabel}>참여 시설</Text>
          </Animated.View>
        </View>

        {/* 주간 추이 */}
        <Animated.View entering={FadeInUp.delay(280).duration(450)} style={s.chartCard}>
          <View style={s.chartHead}>
            <Text style={s.chartTitle}>최근 7일 기부 추이</Text>
            <View style={s.chartBadge}>
              <Text style={s.chartBadgeText}>총 {weekTotal}건</Text>
            </View>
          </View>

          <View style={s.chart}>
            {daily.map((day, index) => {
              const date = new Date(day.date);
              const isPeak = day.count === maxCount && day.count > 0;
              const isLast = index === daily.length - 1;
              return (
                <View key={day.date} style={s.barWrap}>
                  <Text style={[s.barValue, (isPeak || isLast) && s.barValueStrong]}>
                    {day.count}
                  </Text>
                  <View style={s.barTrack}>
                    <View
                      style={[
                        s.bar,
                        { height: `${Math.max(7, (day.count / maxCount) * 100)}%` },
                        (isPeak || isLast) && s.barStrong,
                      ]}
                    />
                  </View>
                  <Text style={[s.barLabel, isLast && s.barLabelStrong]}>
                    {isLast ? '오늘' : WEEKDAYS[date.getDay()]}
                  </Text>
                </View>
              );
            })}
            {daily.length === 0 ? <Text style={s.chartEmpty}>아직 데이터가 없어요</Text> : null}
          </View>
        </Animated.View>

        {/* 환산 기준 안내 */}
        <Animated.View entering={FadeInUp.delay(340).duration(450)} style={s.footnote}>
          <Ionicons name="leaf" size={15} color={C.brand} />
          <Text style={s.footnoteText}>
            CO₂e는 전달 완료된 기부 무게를 기준으로 환산한 절감량이에요.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  titleBlock: { gap: 5, marginTop: 8, marginBottom: 18 },
  eyebrow: { fontSize: 12.5, fontFamily: 'Pretendard-Bold', color: C.brand },
  headline: { fontSize: 25, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  heroCard: {
    backgroundColor: C.brand,
    borderRadius: R.card,
    padding: 22,
    gap: 16,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroLabel: { fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: 'rgba(255,255,255,0.85)' },
  heroValue: { fontSize: 34, fontFamily: 'Pretendard-Black', color: '#FFFFFF' },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.35)' },
  heroMetrics: { flexDirection: 'row', alignItems: 'center' },
  heroMetric: { flex: 1, gap: 3 },
  heroMetricLabel: { fontSize: 12, fontFamily: 'Pretendard-Regular', color: 'rgba(255,255,255,0.8)' },
  heroMetricValue: { fontSize: 19, fontFamily: 'Pretendard-ExtraBold', color: '#FFFFFF' },
  heroMetricDivider: {
    width: StyleSheet.hairlineWidth,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginRight: 18,
  },
  pairRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  pairCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: R.card,
    padding: 18,
    gap: 3,
  },
  pairIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pairValue: { fontSize: 21, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  pairLabel: { fontSize: 12, fontFamily: 'Pretendard-Regular', color: C.sub },
  chartCard: {
    backgroundColor: C.card,
    borderRadius: R.card,
    padding: 20,
    marginTop: 12,
    gap: 18,
  },
  chartHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartTitle: { fontSize: 15, fontFamily: 'Pretendard-Bold', color: C.text },
  chartBadge: {
    backgroundColor: C.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chartBadgeText: { fontSize: 11.5, fontFamily: 'Pretendard-ExtraBold', color: C.brandDeep },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 168,
  },
  barWrap: { flex: 1, alignItems: 'center', gap: 6, height: '100%' },
  barValue: { fontSize: 11, fontFamily: 'Pretendard-SemiBold', color: C.gray },
  barValueStrong: { color: C.brandDeep, fontFamily: 'Pretendard-ExtraBold' },
  barTrack: { flex: 1, width: 20, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 10, backgroundColor: '#FFD9BC' },
  barStrong: { backgroundColor: C.brand },
  barLabel: { fontSize: 10.5, fontFamily: 'Pretendard-Regular', color: C.sub },
  barLabelStrong: { fontFamily: 'Pretendard-ExtraBold', color: C.text },
  chartEmpty: { flex: 1, textAlign: 'center', color: C.sub, fontFamily: 'Pretendard-Regular' },
  footnote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: C.brandSoft,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  footnoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Pretendard-Regular',
    color: C.brandDeep,
  },
});
