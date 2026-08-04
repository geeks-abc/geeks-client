import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Row } from '@/components/ui';
import { api } from '@/lib/api';
import { fmtTime, remainingLabel, usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';

// S-05 매칭 상세 (시설) — 픽업 정보 + QR 스캔/완료 + 전화 + 취소
export default function PickupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const matchId = Number(id);
  const [busy, setBusy] = useState(false);

  const { data: match } = usePolling(() => api.match(matchId), 5000);
  const store = match?.listing?.store;

  const completeWithToken = async (qrToken: string) => {
    setBusy(true);
    try {
      const result = await api.completeMatch(matchId, qrToken);
      Alert.alert(
        '인수 완료!',
        `${result.itemName} ${result.quantity}개 (${result.donation.weightKg}kg)\n기부확인서가 발급됐어요.`,
        [{ text: '확인서 보기', onPress: () => router.replace(`/certificate/${result.donation.id}`) }],
      );
    } catch (e) {
      Alert.alert('완료 실패', e instanceof Error ? e.message : '다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    Alert.alert('픽업 취소', '이 픽업을 취소할까요? 품목은 다시 공개돼요.', [
      { text: '아니요', style: 'cancel' },
      {
        text: '픽업 취소',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.cancelMatch(matchId);
            router.back();
          } catch (e) {
            Alert.alert('취소 실패', e instanceof Error ? e.message : '');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={s.photo}>
          <Text style={s.photoLabel}>{match?.listing?.itemName ?? ''}</Text>
        </View>

        <View style={s.confirmChip}>
          <Text style={s.confirmChipText}>MATCH CONFIRMED</Text>
        </View>
        <Text style={s.storeName}>{store?.name ?? ''}</Text>
        <Text style={s.storeMeta}>
          총 {match?.listing?.quantity ?? '-'}개
          {match?.listing ? ` · ${remainingLabel(match.listing.pickupEnd)}` : ''}
        </Text>

        <Card>
          <Row label="주소" value={store?.address ?? '-'} />
          <Row
            label="픽업 시간"
            value={
              match?.listing
                ? `${fmtTime(match.listing.pickupStart)}–${fmtTime(match.listing.pickupEnd)}`
                : '-'
            }
          />
          <Row label="연락처" value={store?.phone ?? '-'} />
        </Card>

        <Button
          title="QR 스캔 시작"
          variant="dark"
          onPress={() => router.push(`/scan?matchId=${matchId}`)}
        />
        {match ? (
          <Button
            title="인수 완료 처리 (데모용)"
            loading={busy}
            onPress={() => completeWithToken(match.qrToken)}
          />
        ) : null}
        {store?.phone ? (
          <Button title="가게에 전화" variant="ghost" onPress={() => Linking.openURL(`tel:${store.phone}`)} />
        ) : null}
        <Button title="픽업 취소" variant="danger" onPress={cancel} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  photo: {
    height: 200,
    borderRadius: R.card,
    backgroundColor: '#A98963',
    justifyContent: 'flex-end',
    padding: 16,
  },
  photoLabel: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  confirmChip: {
    alignSelf: 'flex-start',
    backgroundColor: C.greenSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  confirmChipText: { fontSize: 11, fontWeight: '900', color: C.green, letterSpacing: 0.5 },
  storeName: { fontSize: 24, fontWeight: '900', color: C.text },
  storeMeta: { fontSize: 14, color: C.sub, marginTop: -8 },
});
