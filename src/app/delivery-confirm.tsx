import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { fmtTime, usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';
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
    () =>
      Number.isFinite(numericMatchId) && numericMatchId > 0
        ? api.match(numericMatchId)
        : Promise.reject(new Error('매칭 정보를 찾을 수 없어요.')),
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
      params:
        Number.isFinite(numericMatchId) && numericMatchId > 0
          ? { matchId: String(numericMatchId) }
          : {},
    });
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.screen}>
        <View style={s.navbar}>
          <Pressable
            accessibilityLabel="뒤로 가기"
            hitSlop={10}
            onPress={goBackSafe}
            style={({ pressed }) => [s.navButton, pressed && s.pressed]}
          >
            <Ionicons name="chevron-back" size={26} color={C.text} />
          </Pressable>
          <Text style={s.navTitle}>전달 확인</Text>
          <View style={s.navButton} />
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.hero}>
            <View style={s.heroIcon}>
              <Ionicons name="shield-checkmark" size={26} color={C.brand} />
            </View>
            <Text style={s.heroTitle}>전달 정보를 확인해주세요</Text>
            <Text style={s.heroSub}>QR 확인이 끝났어요. 아래 내용이 맞는지 확인해주세요.</Text>
          </View>

          <Text style={s.sectionTitle}>받는 시설</Text>
          <View style={s.card}>
            <View style={s.facilityHead}>
              <View style={s.facilityAvatar}>
                <Ionicons name="home" size={20} color={C.blue} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.facilityName}>{match?.facility?.name ?? '수령 시설'}</Text>
                <Text style={s.facilityType}>{match?.facility?.type ?? '복지시설'}</Text>
              </View>
              <View style={s.verifiedChip}>
                <Ionicons name="checkmark-circle" size={13} color={C.brandDeep} />
                <Text style={s.verifiedChipText}>QR 확인 완료</Text>
              </View>
            </View>
          </View>

          <Text style={s.sectionTitle}>전달 품목</Text>
          <View style={[s.card, s.foodCard]}>
            {match?.listing?.photoUrl ? (
              <Image
                transition={150}
                source={{ uri: match.listing.photoUrl }}
                style={s.foodImage}
                contentFit="cover"
              />
            ) : (
              <View style={[s.foodImage, s.foodImageFallback]}>
                <Ionicons name="fast-food-outline" size={26} color={C.brand} />
              </View>
            )}
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={s.foodStore}>{match?.listing?.store?.name ?? '오늘의 나눔'}</Text>
              <Text style={s.foodName}>{match?.listing?.itemName ?? '-'}</Text>
              <Text style={s.foodMeta}>
                {match?.listing
                  ? `${match.listing.quantity}개 · ${fmtTime(match.listing.pickupEnd)} 마감`
                  : '-'}
              </Text>
            </View>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={C.red} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={s.actionBar}>
          <View style={s.warningRow}>
            <Ionicons name="information-circle-outline" size={15} color={C.sub} />
            <Text style={s.warning}>전달 완료 후에는 되돌릴 수 없어요.</Text>
          </View>
          <View style={s.actions}>
            <Pressable
              onPress={reScan}
              style={({ pressed }) => [s.secondaryButton, pressed && s.pressed]}
            >
              <Text style={s.secondaryButtonText}>다시 스캔</Text>
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={completeDelivery}
              style={({ pressed }) => [s.primaryButton, (pressed || busy) && s.pressed]}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={19} color="#FFFFFF" />
                  <Text style={s.primaryButtonText}>전달 완료</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  screen: { flex: 1 },
  navbar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navTitle: { color: C.text, fontSize: 17, fontFamily: 'Pretendard-ExtraBold' },
  content: { padding: 20, paddingTop: 8, paddingBottom: 24 },
  hero: { alignItems: 'center', gap: 8, paddingVertical: 26 },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: { color: C.text, fontSize: 21, fontFamily: 'Pretendard-ExtraBold' },
  heroSub: {
    color: C.sub,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Pretendard-Regular',
    textAlign: 'center',
  },
  sectionTitle: {
    color: C.text,
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    marginBottom: 10,
    marginTop: 6,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: R.card,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginBottom: 22,
  },
  facilityHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  facilityAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityName: { color: C.text, fontSize: 15.5, fontFamily: 'Pretendard-Bold' },
  facilityType: { color: C.sub, fontSize: 12, fontFamily: 'Pretendard-Regular' },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  verifiedChipText: { color: C.brandDeep, fontSize: 10.5, fontFamily: 'Pretendard-ExtraBold' },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 14,
  },
  foodImage: { width: 64, height: 64, borderRadius: 14, backgroundColor: C.brandSoft },
  foodImageFallback: { alignItems: 'center', justifyContent: 'center' },
  foodStore: { color: C.sub, fontSize: 11, fontFamily: 'Pretendard-Regular' },
  foodName: { color: C.text, fontSize: 15, fontFamily: 'Pretendard-Bold' },
  foodMeta: { color: C.sub, fontSize: 12, fontFamily: 'Pretendard-Regular' },
  errorBox: {
    borderRadius: 12,
    backgroundColor: C.redSoft,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: { flex: 1, color: C.red, fontSize: 12, lineHeight: 17, fontFamily: 'Pretendard-SemiBold' },
  actionBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
    backgroundColor: C.card,
    gap: 10,
  },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  warning: { color: C.sub, fontSize: 12, fontFamily: 'Pretendard-SemiBold' },
  actions: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 0.72,
    height: 54,
    borderRadius: R.button,
    backgroundColor: C.graySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: C.text, fontSize: 14.5, fontFamily: 'Pretendard-Bold' },
  primaryButton: {
    flex: 1,
    height: 54,
    borderRadius: R.button,
    backgroundColor: C.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15.5, fontFamily: 'Pretendard-Bold' },
  pressed: { opacity: 0.72 },
});
