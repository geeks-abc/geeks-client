import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { Badge, Button, Card, Row } from '@/components/ui';
import { api } from '@/lib/api';
import { fmtTime, usePolling } from '@/lib/hooks';
import { C } from '@/lib/theme';

// S-03 매칭 상세 (가게) — 시설이 스캔할 QR 표시, 완료를 폴링으로 감지
export default function StoreMatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const matchId = Number(id);

  const { data: match } = usePolling(() => api.match(matchId), 3000);
  const completed = match?.listing?.status === 'COMPLETED';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={s.hero}>
          <Text style={s.heroLogo}>이음</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={s.heroTitle}>
              {completed ? '인수가 완료됐어요!' : '매칭이 확정됐어요'}
            </Text>
            <Badge status={completed ? 'COMPLETED' : 'MATCHED'} />
          </View>
          <Text style={s.heroSub}>{match?.facility?.name ?? ''}</Text>
        </View>

        {match ? (
          <Card>
            <Text style={s.itemName}>{match.listing?.itemName}</Text>
            <Row
              label="픽업 시간"
              value={
                match.listing
                  ? `${fmtTime(match.listing.pickupStart)}–${fmtTime(match.listing.pickupEnd)}`
                  : '-'
              }
            />
            <Row label="수량" value={`${match.listing?.quantity ?? '-'}개`} />
            <Row label="수령 시설" value={match.facility?.name ?? '-'} />
            <Row label="시설 연락처" value={match.facility?.phone ?? '-'} />
          </Card>
        ) : null}

        {!completed && match ? (
          <>
            <Text style={s.qrTitle}>픽업용 QR</Text>
            <Card style={{ alignItems: 'center', paddingVertical: 36 }}>
              <QRCode
                value={JSON.stringify({ matchId: match.id, qrToken: match.qrToken })}
                size={200}
                color={C.navy}
              />
              <Text style={s.qrHint}>시설 담당자가 이 QR을 스캔하면 인수가 완료돼요.</Text>
            </Card>
            <Button title="인수 완료 대기 중…" onPress={() => {}} disabled />
          </>
        ) : null}

        {completed ? (
          <Button title="기부 내역에서 확인서 보기" variant="dark" onPress={() => router.replace('/store/history')} />
        ) : null}

        <Button title="뒤로" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: C.navy, borderRadius: 24, padding: 24, gap: 10 },
  heroLogo: { color: C.yellow, fontWeight: '900', fontSize: 16 },
  heroTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  heroSub: { color: '#AAB4C8', fontSize: 14, fontWeight: '600' },
  itemName: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8 },
  qrTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  qrHint: { fontSize: 12, color: C.sub, marginTop: 16 },
});
