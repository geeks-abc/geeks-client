import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
import { BottomSheet } from '@/components/bottom-sheet';
import { dateTimeLabel } from '@/components/date-time-picker';
import { api, ListingStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { notify } from '@/lib/feedback';
import { remainingLabel, usePolling } from '@/lib/hooks';
import { useSafeBack } from '@/lib/navigation';
import { C, R } from '@/lib/theme';

const STATUS: Record<ListingStatus, { label: string; fg: string; bg: string }> = {
  OPEN: { label: '모집 중', fg: C.brandDeep, bg: C.brandSoft },
  MATCHED: { label: '픽업 예정', fg: C.blue, bg: C.blueSoft },
  COMPLETED: { label: '전달 완료', fg: '#FFFFFF', bg: C.navy },
  EXPIRED: { label: '마감', fg: C.sub, bg: C.graySoft },
  CANCELLED: { label: '취소', fg: C.sub, bg: C.graySoft },
};

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listingId = Number(id);
  const router = useRouter();
  const goBackSafe = useSafeBack();
  const { me } = useAuth();
  const isFacility = me?.role === 'FACILITY';

  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: listing, refresh } = usePolling(() => api.listing(listingId), 3000);

  const cancelListing = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.cancelListing(listingId);
      notify.success('나눌 등록을 취소했어요');
      setCancelOpen(false);
      router.replace('/store');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '등록을 취소하지 못했습니다.');
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
      notify.success('픽업이 확정됐어요', '픽업 정보를 확인해주세요.');
      router.replace(`/pickup/${match.id}`);
    } catch (caughtError) {
      notify.error('픽업 신청 실패', caughtError instanceof Error ? caughtError.message : undefined);
      setError(caughtError instanceof Error ? caughtError.message : '픽업 신청에 실패했습니다.');
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const openCertificate = async () => {
    if (!me?.storeId || !listing?.match) return;
    setBusy(true);
    setError(null);
    try {
      const donations = await api.donations({ storeId: me.storeId });
      const donation = donations.find((item) => item.matchId === listing.match?.id);
      if (!donation) throw new Error('기부 완료 확인서를 찾을 수 없습니다.');
      router.push(`/certificate/${donation.id}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '확인서를 불러오지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  if (!listing) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.loading}>
          <ActivityIndicator color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  const status = STATUS[listing.status];
  const storeAddress = listing.store?.address ?? me?.store?.address ?? '-';
  const hasBottomAction =
    (isFacility && listing.status === 'OPEN') ||
    (!isFacility && ['OPEN', 'MATCHED', 'COMPLETED'].includes(listing.status));

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
          <Text style={s.navTitle}>상품 상세</Text>
          <View style={s.navButton} />
        </View>

        <ScrollView
          contentContainerStyle={[s.content, hasBottomAction && s.contentWithAction]}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.photoBox}>
            {listing.photoUrl ? (
              <Image transition={150} source={{ uri: listing.photoUrl }} style={s.photo} contentFit="cover" />
            ) : (
              <View style={s.photoFallback}>
                <Ionicons name="fast-food-outline" size={46} color={C.brand} />
                <Text style={s.photoFallbackText}>등록된 사진이 없어요</Text>
              </View>
            )}
          </View>

          {listing.store ? (
            <Pressable
              onPress={() => router.push(`/store-detail/${listing.store!.id}`)}
              style={({ pressed }) => [s.storeRow, pressed && s.rowPressed]}
            >
              <View style={s.storeAvatar}>
                <Ionicons name="storefront" size={20} color={C.brand} />
              </View>
              <View style={s.storeInfo}>
                <Text style={s.storeName}>{listing.store.name}</Text>
                <Text numberOfLines={1} style={s.storeAddress}>{listing.store.address}</Text>
              </View>
              <Text style={s.storeMore}>가게 보기</Text>
              <Ionicons name="chevron-forward" size={17} color={C.gray} />
            </Pressable>
          ) : null}

          <View style={s.divider} />

          <View style={s.productSection}>
            <View style={[s.statusPill, { backgroundColor: status.bg }]}>
              <Text style={[s.statusText, { color: status.fg }]}>{status.label}</Text>
            </View>
            <Text style={s.title}>{listing.itemName}</Text>
            <Text style={s.summary}>
              {listing.quantity}개 · {remainingLabel(listing.pickupEnd)}
            </Text>
          </View>

          <Text style={s.sectionTitle}>픽업 정보</Text>
          <View style={s.infoCard}>
            <InfoRow label="시작" value={dateTimeLabel(new Date(listing.pickupStart))} />
            <InfoRow label="종료" value={dateTimeLabel(new Date(listing.pickupEnd))} />
            <InfoRow label="장소" value={storeAddress} last />
          </View>

          {listing.match?.facility ? (
            <>
              <Text style={s.sectionTitle}>픽업 시설</Text>
              <View style={s.matchCard}>
                <View style={s.facilityIcon}>
                  <Ionicons name="home-outline" size={20} color={C.blue} />
                </View>
                <View style={s.matchInfo}>
                  <Text style={s.matchName}>{listing.match.facility.name}</Text>
                  <Text style={s.matchMeta}>픽업이 확정된 시설이에요.</Text>
                </View>
              </View>
            </>
          ) : null}

          {error && !cancelOpen ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={C.red} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        {hasBottomAction ? (
          <View style={s.actionBar}>
            {!isFacility && listing.status === 'OPEN' ? (
              <>
                <Pressable
                  onPress={() => setCancelOpen(true)}
                  style={({ pressed }) => [s.cancelButton, pressed && s.pressed]}
                >
                  <Text style={s.cancelButtonText}>등록 취소</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/edit-listing/${listing.id}`)}
                  style={({ pressed }) => [s.primaryButton, pressed && s.pressed]}
                >
                  <Text style={s.primaryButtonText}>수정하기</Text>
                </Pressable>
              </>
            ) : null}

            {!isFacility && listing.status === 'MATCHED' && listing.match ? (
              <>
                <Pressable
                  onPress={() => router.push(`/match/${listing.match?.id}`)}
                  style={({ pressed }) => [s.secondaryButton, pressed && s.pressed]}
                >
                  <Text style={s.secondaryButtonText}>매칭 정보</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/scan?matchId=${listing.match?.id}`)}
                  style={({ pressed }) => [s.primaryButton, pressed && s.pressed]}
                >
                  <Text style={s.primaryButtonText}>QR 스캔</Text>
                </Pressable>
              </>
            ) : null}

            {!isFacility && listing.status === 'COMPLETED' ? (
              <Pressable
                disabled={busy}
                onPress={openCertificate}
                style={({ pressed }) => [s.primaryButton, s.fullButton, (pressed || busy) && s.pressed]}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={s.primaryButtonText}>기부 완료 확인서 보기</Text>
                )}
              </Pressable>
            ) : null}

            {isFacility && listing.status === 'OPEN' ? (
              <Pressable
                disabled={busy}
                onPress={applyForPickup}
                style={({ pressed }) => [s.primaryButton, s.fullButton, (pressed || busy) && s.pressed]}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={s.primaryButtonText}>픽업 신청하기</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      <BottomSheet visible={cancelOpen} onClose={() => !busy && setCancelOpen(false)} sheetStyle={s.cancelSheet}>
        <View style={s.sheetHeader}>
          <Text style={s.sheetTitle}>기부 등록을 취소할까요?</Text>
          <Pressable
            accessibilityLabel="취소 확인창 닫기"
            disabled={busy}
            hitSlop={8}
            onPress={() => setCancelOpen(false)}
            style={({ pressed }) => pressed && s.pressed}
          >
            <Ionicons name="close" size={24} color={C.text} />
          </Pressable>
        </View>
        <Text style={s.sheetDescription}>취소하면 주변 시설에서 더 이상 이 상품을 확인할 수 없어요.</Text>
        {error ? <Text style={s.sheetError}>{error}</Text> : null}
        <View style={s.sheetActions}>
          <Pressable
            disabled={busy}
            onPress={() => setCancelOpen(false)}
            style={({ pressed }) => [s.sheetSecondary, pressed && s.pressed]}
          >
            <Text style={s.sheetSecondaryText}>돌아가기</Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={cancelListing}
            style={({ pressed }) => [s.sheetDanger, (pressed || busy) && s.pressed]}
          >
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.sheetDangerText}>등록 취소</Text>}
          </Pressable>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.infoRow, !last && s.infoDivider]}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text numberOfLines={2} style={s.infoValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  screen: { flex: 1, backgroundColor: C.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navbar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
  },
  navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navTitle: { color: C.text, fontSize: 17, fontFamily: 'Pretendard-ExtraBold' },
  content: { paddingBottom: 32 },
  contentWithAction: { paddingBottom: 28 },
  photoBox: { width: '100%', height: 284, backgroundColor: C.brandSoft },
  photo: { width: '100%', height: '100%' },
  photoFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  photoFallbackText: { color: C.brandDeep, fontSize: 13, fontFamily: 'Pretendard-SemiBold' },
  storeRow: {
    minHeight: 78,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  storeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: { flex: 1, gap: 3 },
  storeName: { color: C.text, fontSize: 14.5, fontFamily: 'Pretendard-Bold' },
  storeAddress: { color: C.sub, fontSize: 11.5, fontFamily: 'Pretendard-Regular' },
  storeMore: { color: C.sub, fontSize: 11.5, fontFamily: 'Pretendard-SemiBold' },
  divider: { height: 8, backgroundColor: '#ECEFED' },
  productSection: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 30 },
  statusPill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 11.5, fontFamily: 'Pretendard-ExtraBold' },
  title: { color: C.text, fontSize: 24, lineHeight: 33, fontFamily: 'Pretendard-ExtraBold', marginTop: 13 },
  summary: { color: C.sub, fontSize: 13, fontFamily: 'Pretendard-Regular', marginTop: 7 },
  sectionTitle: {
    color: C.text,
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 26,
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: R.card,
    backgroundColor: C.card,
  },
  infoRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 16 },
  infoDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  infoLabel: { width: 38, color: C.sub, fontSize: 13, fontFamily: 'Pretendard-Regular' },
  infoValue: { flex: 1, color: C.text, fontSize: 13.5, lineHeight: 19, textAlign: 'right', fontFamily: 'Pretendard-SemiBold' },
  matchCard: {
    minHeight: 72,
    marginHorizontal: 20,
    marginBottom: 26,
    paddingHorizontal: 16,
    borderRadius: R.card,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  facilityIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  matchInfo: { flex: 1, gap: 3 },
  matchName: { color: C.text, fontSize: 14.5, fontFamily: 'Pretendard-Bold' },
  matchMeta: { color: C.sub, fontSize: 11.5, fontFamily: 'Pretendard-Regular' },
  errorBox: { marginHorizontal: 20, borderRadius: 12, backgroundColor: C.redSoft, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { flex: 1, color: C.red, fontSize: 12, lineHeight: 17, fontFamily: 'Pretendard-SemiBold' },
  actionBar: {
    minHeight: 78,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryButton: { flex: 1, height: 54, borderRadius: R.button, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15.5, fontFamily: 'Pretendard-Bold' },
  secondaryButton: { flex: 1, height: 54, borderRadius: R.button, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Pretendard-Bold' },
  cancelButton: { flex: 0.72, height: 54, borderRadius: R.button, backgroundColor: C.graySoft, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: C.red, fontSize: 14.5, fontFamily: 'Pretendard-Bold' },
  fullButton: { flex: 1 },
  rowPressed: { opacity: 0.58 },
  pressed: { opacity: 0.72 },
  cancelSheet: { backgroundColor: C.card, paddingHorizontal: 20, paddingBottom: 28 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  sheetTitle: { flex: 1, color: C.text, fontSize: 20, lineHeight: 28, fontFamily: 'Pretendard-ExtraBold' },
  sheetDescription: { color: C.sub, fontSize: 13, lineHeight: 20, fontFamily: 'Pretendard-Regular' },
  sheetError: { color: C.red, fontSize: 12, fontFamily: 'Pretendard-SemiBold' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  sheetSecondary: { flex: 1, height: 52, borderRadius: R.button, backgroundColor: C.graySoft, alignItems: 'center', justifyContent: 'center' },
  sheetSecondaryText: { color: C.text, fontSize: 15, fontFamily: 'Pretendard-Bold' },
  sheetDanger: { flex: 1, height: 52, borderRadius: R.button, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  sheetDangerText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Pretendard-Bold' },
});
