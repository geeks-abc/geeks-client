import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeader } from '@/components/header';
import { Card, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';

// S-07 임팩트 대시보드 (관리자)
export default function Dashboard() {
  const { data: impact } = usePolling(() => api.impact(), 5000);

  const tiles = [
    { label: '누적 기부', value: `${impact?.totalDonations ?? 0}건`, bg: C.yellow, fg: C.navy },
    { label: '감축량', value: `${impact?.totalWeightKg ?? 0}kg`, bg: C.yellowSoft, fg: C.text },
    { label: 'CO₂e', value: `${impact?.totalCo2eKg ?? 0}kg`, bg: C.greenSoft, fg: C.text },
    {
      label: '참여 기관',
      value: `${(impact?.storeCount ?? 0) + (impact?.facilityCount ?? 0)}곳`,
      bg: '#F6C6A2',
      fg: C.text,
    },
  ];

  const daily = impact?.daily ?? [];
  const maxCount = Math.max(1, ...daily.map((d) => d.count));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.navy }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ paddingBottom: 4 }}>
          <HomeHeader subtitle="IMPACT DASHBOARD" light />
        </View>
        <Text style={s.headline}>우리가 함께 만든 변화</Text>
        <Text style={s.sub}>COMPLETED 기부 데이터를 기준으로 집계합니다.</Text>

        <View style={s.grid}>
          {tiles.map((tile) => (
            <View key={tile.label} style={[s.tile, { backgroundColor: tile.bg }]}>
              <Text style={[s.tileLabel, { color: tile.fg }]}>{tile.label}</Text>
              <Text style={[s.tileValue, { color: tile.fg }]}>{tile.value}</Text>
            </View>
          ))}
        </View>

        <Card style={{ gap: 14 }}>
          <SectionTitle>일별 기부 추이</SectionTitle>
          <View style={s.chart}>
            {daily.map((day) => (
              <View key={day.date} style={s.barWrap}>
                <Text style={s.barValue}>{day.count}</Text>
                <View style={[s.bar, { height: Math.max(8, (day.count / maxCount) * 120) }]} />
                <Text style={s.barLabel}>
                  {new Date(day.date).getDate()}일
                </Text>
              </View>
            ))}
            {daily.length === 0 ? <Text style={{ color: C.sub }}>데이터가 없어요</Text> : null}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  headline: { fontSize: 26, fontWeight: '900', color: '#FFF' },
  sub: { fontSize: 12, color: '#8D97AC', marginTop: -8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '47.5%', borderRadius: R.card, padding: 18, gap: 6, flexGrow: 1 },
  tileLabel: { fontSize: 12, fontWeight: '700', opacity: 0.7 },
  tileValue: { fontSize: 26, fontWeight: '900' },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 160,
    paddingTop: 8,
  },
  barWrap: { alignItems: 'center', gap: 6, flex: 1 },
  bar: { width: 18, borderRadius: 9, backgroundColor: C.yellow },
  barValue: { fontSize: 11, fontWeight: '800', color: C.text },
  barLabel: { fontSize: 10, color: C.sub },
});
