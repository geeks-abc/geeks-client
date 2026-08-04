import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/back-button';
import { Button, Card, Row } from '@/components/ui';
import { api } from '@/lib/api';
import { fmtTime, remainingLabel, usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';
import { useSafeBack } from '@/lib/navigation';

// S-05 매칭 상세 (시설) — 픽업 정보 + QR 스캔/완료 + 전화 + 취소
export default function PickupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const goBackSafe = useSafeBack();
  const matchId = Number(id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { data: match } = usePolling(() => api.match(matchId), 5000);
  const store = match?.listing?.store;

  const cancel = async () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.cancelMatch(matchId);
      goBackSafe();
    } catch (e) {
      setError(e instanceof Error ? e.message : '취소에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <BackButton />
        <View style={s.photo}>
          <Text style={s.photoLabel}>{match?.listing?.itemName ?? ''}</Text>
        </View>

        <View style={s.confirmChip}>
          <Text style={s.confirmChipText}>픽업이 정해졌어요</Text>
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

        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button
          title="가게 QR 스캔하기"
          variant="dark"
          onPress={() => router.push(`/scan?matchId=${matchId}`)}
        />
        {store?.phone ? (
          <Button title="가게에 전화하기" variant="ghost" onPress={() => Linking.openURL(`tel:${store.phone}`)} />
        ) : null}
        <Button
          title={confirmCancel ? '한 번 더 누르면 픽업이 취소돼요' : '픽업 취소'}
          variant="danger"
          loading={busy && confirmCancel}
          onPress={cancel}
        />
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
  photoLabel: { color: '#FFF', fontFamily: 'Pretendard-ExtraBold', fontSize: 14 },
  errorBox: { backgroundColor: C.redSoft, borderRadius: 12, padding: 14 },
  errorText: { color: C.red, fontSize: 13, fontFamily: 'Pretendard-SemiBold' },
  confirmChip: {
    alignSelf: 'flex-start',
    backgroundColor: C.greenSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  confirmChipText: { fontSize: 11, fontFamily: 'Pretendard-Black', color: C.green, letterSpacing: 0.5 },
  storeName: { fontSize: 24, fontFamily: 'Pretendard-Black', color: C.text },
  storeMeta: { fontSize: 14, fontFamily: 'Pretendard-Regular', color: C.sub, marginTop: -8 },
});
