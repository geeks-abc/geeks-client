import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/back-button';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtDateTime, fmtTime, usePolling } from '@/lib/hooks';
import { C } from '@/lib/theme';
import { useSafeBack } from '@/lib/navigation';

const STATUS_LABEL: Record<string, string> = {
  OPEN: '픽업 가능',
  MATCHED: '픽업 예정',
  COMPLETED: '전달 완료',
  EXPIRED: '마감됨',
  CANCELLED: '취소됨',
};

// 품목 상세 — 식품 사진과 픽업 정보를 우선 보여주는 거래형 레이아웃
export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const goBackSafe = useSafeBack();
  const { me } = useAuth();
  const listingId = Number(id);

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: listing, refresh } = usePolling(() => api.listing(listingId), 3000);
  const store = listing?.store;
  const isFacility = me?.role === 'FACILITY';

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

  const applyForPickup = async () => {
    if (!me?.facilityId) return;
    setBusy(true);
    setError(null);
    try {
      const match = await api.applyMatch(listingId, me.facilityId);
      router.replace(`/pickup/${match.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '픽업 신청에 실패했어요. 다시 시도해주세요.');
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const openCertificate = async () => {
    if (!me?.storeId || !listing?.match) return;
    setBusy(true);
    try {
      const donations = await api.donations({ storeId: me.storeId });
      const donation = donations.find((item) => item.matchId === listing.match!.id);
      if (donation) router.push(`/certificate/${donation.id}`);
      else setError('확인서를 찾을 수 없어요.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '확인서 조회에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.screen}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.hero}>
            {listing?.photoUrl ? (
              <Image source={{ uri: listing.photoUrl }} style={s.heroImage} />
            ) : (
              <View style={s.heroFallback}>
                <Ionicons name="fast-food-outline" size={72} color="#FFFFFF" />
                <Text style={s.heroFallbackLabel}>FOOD SHARE</Text>
              </View>
            )}
            <View style={s.backButton}>
              <BackButton />
            </View>
          </View>

          {listing ? (
            <>
              <Pressable
                disabled={!store}
                onPress={() => store && router.push(`/store-detail/${store.id}`)}
                style={({ pressed }) => [s.storeRow, pressed && { opacity: 0.7 }]}
              >
                <View style={s.storeAvatar}>
                  <Text style={s.storeAvatarText}>{store?.name?.slice(0, 1) ?? '가'}</Text>
                </View>
                <View style={s.storeInfo}>
                  <Text style={s.storeName}>{store?.name ?? '나눔 가게'}</Text>
                  <Text numberOfLines={1} style={s.storeAddress}>{store?.address ?? '가게 위치 확인'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.gray} />
              </Pressable>

              <View style={s.divider} />

              <View style={s.titleSection}>
                <View style={s.titleTopRow}>
                  <Text style={s.category}>식품 나눔</Text>
                  <View style={[s.statusChip, listing.status === 'OPEN' ? s.openChip : s.defaultChip]}>
                    <Text style={[s.statusText, listing.status === 'OPEN' ? s.openText : s.defaultText]}>
                      {STATUS_LABEL[listing.status] ?? listing.status}
                    </Text>
                  </View>
                </View>
                <Text style={s.title}>{listing.itemName}</Text>
                <Text style={s.meta}>{fmtDateTime(listing.createdAt)} 등록</Text>
              </View>

              <View style={s.pickupCard}>
                <View style={s.pickupIcon}>
                  <Ionicons name="time-outline" size={24} color="#E86618" />
                </View>
                <View style={s.pickupText}>
                  <Text style={s.pickupTitle}>픽업 안내</Text>
                  <Text style={s.pickupTime}>
                    {fmtTime(listing.pickupStart)} - {fmtTime(listing.pickupEnd)}
                  </Text>
                  <Text style={s.pickupSub}>픽업 시간 안에 가게를 방문해주세요.</Text>
                </View>
              </View>

              <View style={s.descriptionSection}>
                <Text style={s.descriptionTitle}>나눔 정보</Text>
                <Text style={s.description}>
                  {store?.name ?? '가게'}에서 나눔하는 식품이에요. 필요한 이웃에게 따뜻하게 전달해주세요.
                </Text>
              </View>

              <View style={s.infoList}>
                <View style={s.infoRow}>
                  <Ionicons name="cube-outline" size={20} color={C.sub} />
                  <Text style={s.infoLabel}>수량</Text>
                  <Text style={s.infoValue}>{listing.quantity}개</Text>
                </View>
                <View style={s.infoRow}>
                  <Ionicons name="location-outline" size={20} color={C.sub} />
                  <Text style={s.infoLabel}>픽업 장소</Text>
                  <Text numberOfLines={1} style={s.infoValue}>{store?.address ?? '-'}</Text>
                </View>
                {listing.match?.facility ? (
                  <View style={s.infoRow}>
                    <Ionicons name="heart-outline" size={20} color={C.sub} />
                    <Text style={s.infoLabel}>수령 시설</Text>
                    <Text style={s.infoValue}>{listing.match.facility.name}</Text>
                  </View>
                ) : null}
              </View>

              {error ? (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              {!isFacility && listing.status === 'MATCHED' && listing.match ? (
                <Button
                  title="픽업 QR 보여주기"
                  variant="dark"
                  onPress={() => router.push(`/match/${listing.match!.id}`)}
                />
              ) : null}

              {!isFacility && listing.status === 'COMPLETED' ? (
                <Button title="기부확인서 보기" variant="dark" loading={busy} onPress={openCertificate} />
              ) : null}

              {!isFacility && listing.status === 'OPEN' ? (
                <Button
                  title={confirmCancel ? '한 번 더 누르면 나눔이 취소돼요' : '나눔 취소하기'}
                  variant="danger"
                  loading={busy}
                  onPress={cancelListing}
                />
              ) : null}
            </>
          ) : null}
        </ScrollView>

        {isFacility && listing?.status === 'OPEN' ? (
          <View style={s.actionBar}>
            <Button title="픽업하기" loading={busy} onPress={applyForPickup} style={s.pickupButton} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingBottom: 36 },
  hero: { height: 300, backgroundColor: '#F5A167', overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  heroFallback: { flex: 1, backgroundColor: '#F39A55', alignItems: 'center', justifyContent: 'center', gap: 10 },
  heroFallbackLabel: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Pretendard-ExtraBold', letterSpacing: 1.4 },
  backButton: { position: 'absolute', top: 16, left: 20 },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 20 },
  storeAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0DB',
  },
  storeAvatarText: { color: '#E86618', fontSize: 18, fontFamily: 'Pretendard-ExtraBold' },
  storeInfo: { flex: 1, gap: 3 },
  storeName: { color: C.text, fontSize: 16, fontFamily: 'Pretendard-ExtraBold' },
  storeAddress: { color: C.sub, fontSize: 13, fontFamily: 'Pretendard-Regular' },
  divider: { height: 1, backgroundColor: C.line, marginHorizontal: 20 },
  titleSection: { paddingHorizontal: 20, paddingTop: 24, gap: 7 },
  titleTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  category: { color: C.sub, fontSize: 14, fontFamily: 'Pretendard-SemiBold' },
  statusChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  openChip: { backgroundColor: '#E9F7EF' },
  defaultChip: { backgroundColor: C.graySoft },
  statusText: { fontSize: 12, fontFamily: 'Pretendard-ExtraBold' },
  openText: { color: '#168C4F' },
  defaultText: { color: C.sub },
  title: { color: C.text, fontSize: 26, fontFamily: 'Pretendard-Black', letterSpacing: -0.8 },
  meta: { color: C.sub, fontSize: 13, fontFamily: 'Pretendard-Regular' },
  pickupCard: {
    margin: 20,
    marginBottom: 8,
    borderRadius: 18,
    backgroundColor: '#FFF5EC',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pickupIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFE4CB', alignItems: 'center', justifyContent: 'center' },
  pickupText: { flex: 1, gap: 3 },
  pickupTitle: { color: '#A9470D', fontSize: 14, fontFamily: 'Pretendard-ExtraBold' },
  pickupTime: { color: C.text, fontSize: 18, fontFamily: 'Pretendard-ExtraBold' },
  pickupSub: { color: '#8E725F', fontSize: 12.5, fontFamily: 'Pretendard-Regular' },
  descriptionSection: { paddingHorizontal: 20, paddingTop: 22, gap: 10 },
  descriptionTitle: { color: C.text, fontSize: 16, fontFamily: 'Pretendard-ExtraBold' },
  description: { color: '#525B64', fontSize: 15, fontFamily: 'Pretendard-Regular', lineHeight: 23 },
  infoList: { marginTop: 24, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, paddingHorizontal: 20 },
  infoRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { color: C.sub, fontSize: 14, fontFamily: 'Pretendard-Regular' },
  infoValue: { flex: 1, color: C.text, fontSize: 14, fontFamily: 'Pretendard-SemiBold', textAlign: 'right' },
  errorBox: { marginHorizontal: 20, marginTop: 20, borderRadius: 14, backgroundColor: C.redSoft, padding: 14 },
  errorText: { color: C.red, fontSize: 13, fontFamily: 'Pretendard-SemiBold' },
  actionBar: { borderTopWidth: 1, borderColor: C.line, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 12 },
  pickupButton: { backgroundColor: '#FF6F0F' },
});
