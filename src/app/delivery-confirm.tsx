import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { fmtTime, usePolling } from '@/lib/hooks';
import { C } from '@/lib/theme';
import { useSafeBack } from '@/lib/navigation';
import { notify } from '@/lib/feedback';

// S-06 전달 최종 확인 — 이 단계에서만 실제 인수 완료 처리
export default function DeliveryConfirm() {
  const { matchId, qrToken } = useLocalSearchParams<{ matchId?: string; qrToken?: string }>();
  const router = useRouter();
  const goBackSafe = useSafeBack();
  const numericMatchId = Number(matchId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: match } = usePolling(
    () => (Number.isFinite(numericMatchId) && numericMatchId > 0 ? api.match(numericMatchId) : Promise.reject(new Error('매칭 정보를 찾을 수 없어요.'))),
    5000,
    [numericMatchId],
  );

  const completeDelivery = async () => {
    if (!qrToken || !match) {
      setError('전달 확인 정보를 찾을 수 없어요. 다시 스캔해주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await api.completeMatch(match.id, qrToken);
      notify.success('전달이 완료됐어요', '기부확인서가 발급됐어요.');
      router.replace(`/donation-complete/${result.donation.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '전달 완료 처리에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  const reScan = () => {
    router.replace({
      pathname: '/scan',
      params: Number.isFinite(numericMatchId) && numericMatchId > 0 ? { matchId: String(numericMatchId) } : {},
    });
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.screen}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <View>
              <Text style={s.logo}>이음</Text>
              <Text style={s.screenLabel}>FINAL CHECK</Text>
            </View>
            <Pressable onPress={goBackSafe} hitSlop={8}><Text style={s.closeText}>닫기</Text></Pressable>
          </View>

          <Text style={s.title}>전달 정보를 확인해 주세요.</Text>

          <View style={s.facilityCard}>
            <View style={s.facilityAvatar}><Ionicons name="heart" size={23} color={C.navy} /></View>
            <Text style={s.facilityName}>{match?.facility?.name ?? '수령 시설'}</Text>
            <Text style={s.facilityMeta}>{match?.facility?.type ?? '복지시설'}</Text>
            <View style={s.confirmedChip}><Text style={s.confirmedChipText}>QR · 코드 확인 완료</Text></View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>전달 품목</Text>
            <View style={s.foodCard}>
              {match?.listing?.photoUrl ? (
                <Image transition={150} source={{ uri: match.listing.photoUrl }} style={s.foodImage} />
              ) : (
                <View style={s.foodImage}><View style={s.foodFooter}><Text style={s.foodFooterText}>FOOD</Text></View></View>
              )}
              <View style={s.foodInfo}>
                <Text style={s.foodStore}>{match?.listing?.store?.name ?? '오늘의 나눔'}</Text>
                <Text style={s.foodName}>{match?.listing?.itemName ?? '-'}</Text>
                <Text style={s.foodMeta}>
                  {match?.listing ? `${match.listing.quantity}개 · ${fmtTime(match.listing.pickupEnd)} 마감` : '-'}
                </Text>
                <View style={s.foodChip}><Text style={s.foodChipText}>픽업 예정</Text></View>
              </View>
              <Ionicons name="arrow-forward" size={22} color={C.navy} />
            </View>
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}
        </ScrollView>

        <View style={s.actionBar}>
          <Text style={s.warning}>아래 버튼을 누르면 되돌릴 수 없습니다.</Text>
          <View style={s.actions}>
            <Button title="다시 확인" variant="ghost" onPress={reScan} style={s.retryButton} />
            <Button title="전달 완료" variant="dark" loading={busy} onPress={completeDelivery} style={s.completeButton} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E9E9E6' },
  screen: { flex: 1, backgroundColor: '#FBFBF9', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  content: { padding: 20, gap: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { color: C.navy, fontSize: 25, fontFamily: 'Pretendard-Black' },
  screenLabel: { color: C.sub, fontSize: 10, fontFamily: 'Pretendard-ExtraBold', letterSpacing: 0.7 },
  closeText: { color: C.navy, fontSize: 12, fontFamily: 'Pretendard-ExtraBold', paddingTop: 7 },
  title: { color: C.navy, fontSize: 24, fontFamily: 'Pretendard-Black', letterSpacing: -0.8 },
  facilityCard: { backgroundColor: '#FFD21D', borderRadius: 21, padding: 20, gap: 4 },
  facilityAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF2A8', alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  facilityName: { color: C.navy, fontSize: 18, fontFamily: 'Pretendard-ExtraBold' },
  facilityMeta: { color: '#4D5158', fontSize: 11, fontFamily: 'Pretendard-Regular' },
  confirmedChip: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  confirmedChipText: { color: '#149050', fontSize: 10, fontFamily: 'Pretendard-ExtraBold' },
  section: { gap: 12 },
  sectionTitle: { color: C.navy, fontSize: 17, fontFamily: 'Pretendard-ExtraBold' },
  foodCard: { minHeight: 102, padding: 10, borderRadius: 22, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 12 },
  foodImage: { width: 82, height: 82, borderRadius: 15, overflow: 'hidden', backgroundColor: '#1F9C59', justifyContent: 'flex-end' },
  foodFooter: { height: 28, paddingHorizontal: 11, justifyContent: 'center', backgroundColor: C.navy },
  foodFooterText: { color: '#FFFFFF', fontSize: 9, fontFamily: 'Pretendard-ExtraBold' },
  foodInfo: { flex: 1, gap: 3 },
  foodStore: { color: C.sub, fontSize: 10, fontFamily: 'Pretendard-Regular' },
  foodName: { color: C.navy, fontSize: 14, fontFamily: 'Pretendard-ExtraBold' },
  foodMeta: { color: C.sub, fontSize: 10, fontFamily: 'Pretendard-Regular' },
  foodChip: { alignSelf: 'flex-start', backgroundColor: '#FFF1B5', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4, marginTop: 2 },
  foodChipText: { color: C.navy, fontSize: 9, fontFamily: 'Pretendard-ExtraBold' },
  error: { color: C.red, fontSize: 13, fontFamily: 'Pretendard-SemiBold', textAlign: 'center' },
  actionBar: { borderTopWidth: 1, borderColor: C.line, backgroundColor: '#FBFBF9', padding: 20, gap: 18 },
  warning: { color: C.red, fontSize: 10.5, fontFamily: 'Pretendard-SemiBold' },
  actions: { flexDirection: 'row', gap: 12 },
  retryButton: { flex: 1 },
  completeButton: { flex: 1.25 },
});
