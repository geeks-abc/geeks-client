import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeader } from '@/components/header';
import { Row } from '@/components/ui';
import { api } from '@/lib/api';
import { usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// S-07 임팩트 대시보드 (관리자) — 마이페이지/가게 홈과 같은 디자인 시스템
export default function Dashboard() {
  const { data: impact } = usePolling(() => api.impact(), 5000);

  const daily = impact?.daily ?? [];
  const maxCount = Math.max(1, ...daily.map((d) => d.count));
  const weekTotal = daily.reduce((sum, d) => sum + d.count, 0);

  const stats = [
    { label: '누적 기부', value: `${impact?.totalDonations ?? 0}건` },
    { label: '구한 음식', value: `${impact?.totalWeightKg ?? 0}kg` },
    { label: 'CO₂e 절감', value: `${impact?.totalCo2eKg ?? 0}kg` },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />

        <View style={s.profileHead}>
          <View style={s.avatar}>
            <Ionicons name="stats-chart" size={24} color={C.brand} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={s.name}>우리가 함께 만든 변화</Text>
            <View style={s.roleChip}>
              <Text style={s.roleChipText}>관리자</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>누적 임팩트</Text>
        <View style={s.statsCard}>
          {stats.map((stat, index) => (
            <View key={stat.label} style={[s.stat, index > 0 && s.statDivider]}>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.sectionHead}>
          <Text style={[s.sectionTitle, { marginBottom: 0 }]}>최근 7일</Text>
          <Text style={s.sectionMeta}>기부 {weekTotal}건</Text>
        </View>
        <View style={s.chartCard}>
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
        </View>

        <Text style={s.sectionTitle}>참여 현황</Text>
        <View style={s.card}>
          <Row label="참여 가게" value={`${impact?.storeCount ?? 0}곳`} />
          <Row label="참여 시설" value={`${impact?.facilityCount ?? 0}곳`} />
        </View>

        <Text style={s.footnote}>전달 완료된 기부 무게 기준으로 CO₂e를 환산해요.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  profileHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 20, fontFamily: 'Pretendard-ExtraBold', color: C.text },
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
    marginBottom: 10,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionMeta: { fontSize: 12.5, fontFamily: 'Pretendard-SemiBold', color: C.brand },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: R.card,
    paddingVertical: 18,
    marginBottom: 24,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: C.line,
  },
  statValue: { fontSize: 19, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  statLabel: { fontSize: 12, fontFamily: 'Pretendard-Regular', color: C.sub },
  chartCard: {
    backgroundColor: C.card,
    borderRadius: R.card,
    padding: 18,
    paddingBottom: 14,
    marginBottom: 24,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    gap: 8,
  },
  barWrap: { flex: 1, alignItems: 'center', gap: 7, height: '100%' },
  barValue: { fontSize: 11.5, fontFamily: 'Pretendard-ExtraBold', color: C.brand },
  barValueSpace: { height: 14 },
  barTrack: { flex: 1, width: '100%', maxWidth: 24, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 8, backgroundColor: C.graySoft },
  barActive: { backgroundColor: C.brand },
  barLabel: { fontSize: 10.5, fontFamily: 'Pretendard-Regular', color: C.gray },
  barLabelActive: { fontFamily: 'Pretendard-ExtraBold', color: C.text },
  chartEmpty: { flex: 1, textAlign: 'center', color: C.sub, fontFamily: 'Pretendard-Regular' },
  card: {
    backgroundColor: C.card,
    borderRadius: R.card,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 24,
  },
  footnote: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: C.gray,
    textAlign: 'center',
  },
});
