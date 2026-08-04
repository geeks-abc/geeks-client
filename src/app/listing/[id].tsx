import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge, Button, Card, Row } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtDateTime, fmtTime, usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';

const STATUS_NOTE: Record<string, string> = {
  OPEN: '주변 복지시설을 찾고 있어요. 신청이 오면 바로 알려드릴게요.',
  MATCHED: '받아갈 곳이 정해졌어요! 방문하면 QR을 보여주세요.',
  COMPLETED: '이웃에게 따뜻하게 전달된 나눔이에요.',
  EXPIRED: '픽업 시간이 지나 마감됐어요. 다음에 다시 나눠주세요.',
  CANCELLED: '취소한 등록이에요.',
};

// 품목 상세 (가게 관점) — 상태별 액션 허브
export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { me } = useAuth();
  const listingId = Number(id);

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: listing, refresh } = usePolling(() => api.listing(listingId), 3000);

  const cancelListing = async () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.cancelListing(listingId);
      setConfirmCancel(false);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '취소에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  const openCertificate = async () => {
    if (!me?.storeId || !listing?.match) return;
    setBusy(true);
    try {
      const donations = await api.donations({ storeId: me.storeId });
      const donation = donations.find((d) => d.matchId === listing.match!.id);
      if (donation) router.push(`/certificate/${donation.id}`);
      else setError('확인서를 찾을 수 없어요.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '확인서 조회에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={s.photo}>
          {listing?.photoUrl ? (
            <Image source={{ uri: listing.photoUrl }} style={s.photoImg} />
          ) : (
            <Text style={s.photoPlaceholder}>🥐</Text>
          )}
        </View>

        {listing ? (
          <>
            <View style={{ gap: 8 }}>
              <Badge status={listing.status} />
              <Text style={s.title}>{listing.itemName}</Text>
              <Text style={s.note}>{STATUS_NOTE[listing.status] ?? ''}</Text>
            </View>

            <Card>
              <Row label="수량" value={`${listing.quantity}개`} />
              <Row
                label="픽업 시간"
                value={`${fmtTime(listing.pickupStart)}–${fmtTime(listing.pickupEnd)}`}
              />
              <Row label="등록 시각" value={fmtDateTime(listing.createdAt)} />
              {listing.match?.facility ? (
                <Row label="수령 시설" value={listing.match.facility.name} />
              ) : null}
            </Card>

            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            {listing.status === 'MATCHED' && listing.match ? (
              <Button
                title="픽업 QR 보여주기"
                variant="dark"
                onPress={() => router.push(`/match/${listing.match!.id}`)}
              />
            ) : null}

            {listing.status === 'COMPLETED' ? (
              <Button title="기부확인서 보기" variant="dark" loading={busy} onPress={openCertificate} />
            ) : null}

            {listing.status === 'OPEN' ? (
              <Button
                title={confirmCancel ? '한 번 더 누르면 나눔이 취소돼요' : '나눔 취소하기'}
                variant="danger"
                loading={busy}
                onPress={cancelListing}
              />
            ) : null}
          </>
        ) : null}

        <Button title="뒤로" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  photo: {
    height: 200,
    borderRadius: R.card,
    backgroundColor: '#E8E2D8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImg: { width: '100%', height: '100%' },
  photoPlaceholder: { fontSize: 56 },
  title: { fontSize: 24, fontFamily: 'Pretendard-Black', color: C.text },
  note: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: C.sub },
  errorBox: { backgroundColor: C.redSoft, borderRadius: R.chip, padding: 14 },
  errorText: { color: C.red, fontSize: 13, fontFamily: 'Pretendard-SemiBold' },
});
