import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, ListingStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtTime, remainingLabel, usePolling } from '@/lib/hooks';
import { useSafeBack } from '@/lib/navigation';

const P = {
  outer: '#E7E7E3',
  surface: '#F9F9F5',
  white: '#FFFFFF',
  orange: '#FF9740',
  navy: '#051224',
  sub: '#6B7078',
  line: '#E0E3E0',
  green: '#159A55',
  greenSoft: '#DFF7E9',
  paleYellow: '#FFECA5',
  red: '#C53B32',
  redSoft: '#FCE9E7',
};

const STATUS: Record<ListingStatus, { label: string; fg: string; bg: string }> = {
  OPEN: { label: '모집 중', fg: P.green, bg: P.greenSoft },
  MATCHED: { label: '픽업 예정', fg: P.navy, bg: P.paleYellow },
  COMPLETED: { label: '전달 완료', fg: P.white, bg: P.navy },
  EXPIRED: { label: '마감', fg: P.sub, bg: '#EEF0EE' },
  CANCELLED: { label: '취소', fg: P.sub, bg: '#EEF0EE' },
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

  const remaining = listing
    ? remainingLabel(listing.pickupEnd).replace(/\s+\S+$/, '')
    : '-';

  const cancelListing = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.cancelListing(listingId);
      setCancelOpen(false);
      router.replace('/store');
    } catch (e) {
      setError(e instanceof Error ? e.message : '등록을 취소하지 못했습니다.');
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
      setError(e instanceof Error ? e.message : '픽업 신청에 실패했습니다.');
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
    } catch (e) {
      setError(e instanceof Error ? e.message : '확인서를 불러오지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  if (!listing) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.loading}>
          <ActivityIndicator color={P.navy} />
        </View>
      </SafeAreaView>
    );
  }

  const status = STATUS[listing.status];
  const storeAddress = listing.store?.address ?? me?.store?.address ?? '-';

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.screen}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <View>
              <Text style={s.logo}>이음</Text>
              <Text style={s.englishLabel}>LISTING DETAIL</Text>
            </View>
            <Pressable onPress={goBackSafe} style={({ pressed }) => pressed && s.pressed}>
              <Text style={s.close}>닫기</Text>
            </Pressable>
          </View>

          <View style={s.photoBox}>
            {listing.photoUrl ? (
              <Image source={{ uri: listing.photoUrl }} style={s.photo} />
            ) : (
              <View style={s.photoFallback} />
            )}
            <View style={s.photoFooter}>
              <Text style={s.photoFooterText}>FOOD</Text>
            </View>
          </View>

          <View style={[s.statusPill, { backgroundColor: status.bg }]}>
            <Text style={[s.statusText, { color: status.fg }]}>{status.label}</Text>
          </View>

          <Text style={s.title}>{listing.itemName}</Text>
          <Text style={s.meta}>총 {listing.quantity}개 · 오늘 {fmtTime(listing.pickupStart)}–{fmtTime(listing.pickupEnd)}</Text>

          <View style={s.infoCard}>
            <InfoRow label="등록 위치" value={storeAddress} />
            <InfoRow label="노출 범위" value="반경 3km" />
            <InfoRow label="남은 시간" value={remaining} last />
          </View>

          {listing.match?.facility ? (
            <View style={s.matchCard}>
              <Text style={s.matchLabel}>픽업 시설</Text>
              <Text style={s.matchName}>{listing.match.facility.name}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {!isFacility && listing.status === 'OPEN' ? (
            <View style={s.actionRow}>
              <Pressable
                onPress={() => router.push(`/edit-listing/${listing.id}`)}
                style={({ pressed }) => [s.secondaryButton, pressed && s.pressed]}
              >
                <Text style={s.secondaryButtonText}>등록 내용 수정</Text>
              </Pressable>
              <Pressable
                onPress={() => setCancelOpen(true)}
                style={({ pressed }) => [s.primaryButton, pressed && s.pressed]}
              >
                <Text style={s.primaryButtonText}>등록 취소</Text>
              </Pressable>
            </View>
          ) : null}

          {!isFacility && listing.status === 'MATCHED' && listing.match ? (
            <Pressable
              onPress={() => router.push(`/match/${listing.match?.id}`)}
              style={({ pressed }) => [s.fullButton, pressed && s.pressed]}
            >
              <Text style={s.primaryButtonText}>매칭 상세 보기</Text>
            </Pressable>
          ) : null}

          {!isFacility && listing.status === 'COMPLETED' ? (
            <Pressable
              disabled={busy}
              onPress={openCertificate}
              style={({ pressed }) => [s.fullButton, (pressed || busy) && s.pressed]}
            >
              {busy ? <ActivityIndicator color={P.white} /> : <Text style={s.primaryButtonText}>기부 완료 확인서 보기</Text>}
            </Pressable>
          ) : null}

          {isFacility && listing.status === 'OPEN' ? (
            <Pressable
              disabled={busy}
              onPress={applyForPickup}
              style={({ pressed }) => [s.fullButton, (pressed || busy) && s.pressed]}
            >
              {busy ? <ActivityIndicator color={P.white} /> : <Text style={s.primaryButtonText}>픽업 신청하기</Text>}
            </Pressable>
          ) : null}
        </ScrollView>
      </View>

      <Modal visible={cancelOpen} transparent animationType="fade" onRequestClose={() => setCancelOpen(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>기부 등록을 취소할까요?</Text>
            <Text style={s.modalDescription}>취소하면 주변 시설에서{`\n`}더 이상 확인할 수 없습니다.</Text>
            {error ? <Text style={s.modalError}>{error}</Text> : null}
            <View style={s.modalActions}>
              <Pressable
                disabled={busy}
                onPress={() => setCancelOpen(false)}
                style={({ pressed }) => [s.modalGhost, pressed && s.pressed]}
              >
                <Text style={s.modalGhostText}>돌아가기</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={cancelListing}
                style={({ pressed }) => [s.modalPrimary, (pressed || busy) && s.pressed]}
              >
                {busy ? <ActivityIndicator color={P.white} /> : <Text style={s.modalPrimaryText}>등록 취소</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.infoRow, !last && s.infoDivider]}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text numberOfLines={1} style={s.infoValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: P.outer },
  screen: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 28,
    backgroundColor: P.surface,
    overflow: 'hidden',
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { color: P.navy, fontSize: 23, lineHeight: 32, fontFamily: 'Pretendard-Black' },
  englishLabel: { color: P.sub, fontSize: 10, lineHeight: 14, fontFamily: 'Pretendard-Bold' },
  close: { color: P.navy, fontSize: 13, lineHeight: 18, fontFamily: 'Pretendard-Bold', paddingTop: 4 },
  photoBox: {
    height: 210,
    borderRadius: 24,
    backgroundColor: P.orange,
    overflow: 'hidden',
    marginTop: 28,
    justifyContent: 'flex-end',
  },
  photo: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  photoFallback: { ...StyleSheet.absoluteFillObject, backgroundColor: P.orange },
  photoFooter: { height: 48, backgroundColor: P.navy, justifyContent: 'center', paddingHorizontal: 16 },
  photoFooterText: { color: P.white, fontSize: 11, lineHeight: 15, fontFamily: 'Pretendard-Bold' },
  statusPill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, marginTop: 24 },
  statusText: { fontSize: 10, lineHeight: 14, fontFamily: 'Pretendard-Bold' },
  title: { color: P.navy, fontSize: 27, lineHeight: 38, fontFamily: 'Pretendard-Black', marginTop: 16, letterSpacing: -0.7 },
  meta: { color: P.sub, fontSize: 12, lineHeight: 17, fontFamily: 'Pretendard-Regular', marginTop: 3 },
  infoCard: { backgroundColor: P.white, borderRadius: 24, marginTop: 36, paddingHorizontal: 16 },
  infoRow: { minHeight: 53, flexDirection: 'row', alignItems: 'center', gap: 16 },
  infoDivider: { borderBottomWidth: 1, borderBottomColor: '#F0F1EF' },
  infoLabel: { color: P.sub, fontSize: 11, lineHeight: 15, fontFamily: 'Pretendard-Regular' },
  infoValue: { flex: 1, color: P.navy, fontSize: 12, lineHeight: 17, fontFamily: 'Pretendard-Bold', textAlign: 'right' },
  matchCard: { backgroundColor: P.white, borderRadius: 18, padding: 16, marginTop: 12 },
  matchLabel: { color: P.sub, fontSize: 11, fontFamily: 'Pretendard-Regular' },
  matchName: { color: P.navy, fontSize: 16, fontFamily: 'Pretendard-Bold', marginTop: 5 },
  errorBox: { borderRadius: 14, backgroundColor: P.redSoft, padding: 12, marginTop: 14 },
  errorText: { color: P.red, fontSize: 12, lineHeight: 17, fontFamily: 'Pretendard-SemiBold' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 38 },
  secondaryButton: { flex: 1, height: 54, borderRadius: 18, backgroundColor: P.white, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: P.navy, fontSize: 15, lineHeight: 21, fontFamily: 'Pretendard-Bold' },
  primaryButton: { flex: 1, height: 54, borderRadius: 18, backgroundColor: P.navy, alignItems: 'center', justifyContent: 'center' },
  fullButton: { height: 54, borderRadius: 18, backgroundColor: P.navy, alignItems: 'center', justifyContent: 'center', marginTop: 38 },
  primaryButtonText: { color: P.white, fontSize: 15, lineHeight: 21, fontFamily: 'Pretendard-Bold' },
  pressed: { opacity: 0.72 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(5,18,36,0.24)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 48 },
  modalCard: { alignSelf: 'stretch', minHeight: 300, borderRadius: 28, backgroundColor: P.white, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 28 },
  modalTitle: { color: P.navy, fontSize: 24, lineHeight: 33, fontFamily: 'Pretendard-Black' },
  modalDescription: { color: P.sub, fontSize: 13, lineHeight: 20, fontFamily: 'Pretendard-Regular', marginTop: 28 },
  modalError: { color: P.red, fontSize: 12, fontFamily: 'Pretendard-SemiBold', marginTop: 12 },
  modalActions: { flexDirection: 'row', gap: 20, marginTop: 'auto' },
  modalGhost: { flex: 1, height: 54, borderRadius: 18, backgroundColor: P.white, alignItems: 'center', justifyContent: 'center' },
  modalGhostText: { color: P.navy, fontSize: 15, fontFamily: 'Pretendard-Bold' },
  modalPrimary: { flex: 1, height: 54, borderRadius: 18, backgroundColor: P.navy, alignItems: 'center', justifyContent: 'center' },
  modalPrimaryText: { color: P.white, fontSize: 15, fontFamily: 'Pretendard-Bold' },
});
