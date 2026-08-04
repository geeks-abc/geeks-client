import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { BackButton } from '@/components/back-button';
import { Button, Card, Row } from '@/components/ui';
import { api } from '@/lib/api';
import { fmtTime, remainingLabel, usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';
import { useSafeBack } from '@/lib/navigation';

// S-05 매칭 상세 (시설) — 픽업 정보 + QR 스캔/완료 + 전화 + 취소
export default function PickupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goBackSafe = useSafeBack();
  const matchId = Number(id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const { data: match } = usePolling(() => api.match(matchId), 5000);
  const store = match?.listing?.store;
  const directCode = match?.qrToken.replace(/\D/g, '').padEnd(6, '0').slice(0, 6) ?? '';

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
          title="시설 QR 보여주기"
          variant="dark"
          onPress={() => setQrOpen(true)}
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

      <Modal visible={qrOpen} animationType="slide" onRequestClose={() => setQrOpen(false)}>
        <SafeAreaView style={s.qrScreen} edges={['top', 'bottom']}>
          <Text style={s.qrLogo}>이음</Text>
          <Text style={s.qrTitle}>가게 담당자에게{`\n`}이 QR을 보여주세요.</Text>
          <Text style={s.qrSub}>가게에서 스캔하면 전달 최종 확인으로 이어집니다.</Text>
          {match ? (
            <View style={s.qrCard}>
              <QRCode value={JSON.stringify({ matchId: match.id, qrToken: match.qrToken })} size={220} color={C.navy} />
              <Text style={s.qrItemName}>{match.listing?.itemName ?? '기부 식품'}</Text>
              <Text style={s.qrHint}>QR 스캔이 어려우면 아래 코드를 알려주세요.</Text>
              <Text style={s.directCode}>{directCode}</Text>
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          <Button title="닫기" variant="ghost" onPress={() => setQrOpen(false)} />
        </SafeAreaView>
      </Modal>
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
  qrScreen: { flex: 1, backgroundColor: C.navy, padding: 24 },
  qrLogo: { color: '#FFD21D', fontSize: 25, fontFamily: 'Pretendard-Black' },
  qrTitle: { color: '#FFFFFF', fontSize: 27, lineHeight: 36, fontFamily: 'Pretendard-Black', marginTop: 42 },
  qrSub: { color: '#AEB7C5', fontSize: 13, fontFamily: 'Pretendard-Regular', marginTop: 10 },
  qrCard: { backgroundColor: '#FFFFFF', borderRadius: 24, alignItems: 'center', padding: 24, marginTop: 38 },
  qrItemName: { color: C.navy, fontSize: 17, fontFamily: 'Pretendard-ExtraBold', marginTop: 20 },
  qrHint: { color: C.sub, fontSize: 12, fontFamily: 'Pretendard-Regular', marginTop: 18 },
  directCode: { color: C.navy, fontSize: 30, fontFamily: 'Pretendard-Black', letterSpacing: 5, marginTop: 6 },
});
