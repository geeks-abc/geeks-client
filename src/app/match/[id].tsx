import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Linking,
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

// S-04 가게 매칭 상세 — 상품 상세와 동일한 디자인 언어 (화이트 + 오렌지)
export default function StoreMatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const goBackSafe = useSafeBack();
  const matchId = Number(id);
  const { data: match } = usePolling(() => api.match(matchId), 3000);
  const completed = match?.listing?.status === 'COMPLETED';

  const facilityPhone = match?.facility?.phone;

  if (!match) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.loading}>
          <ActivityIndicator color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={s.navTitle}>매칭 정보</Text>
          <View style={s.navButton} />
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.hero}>
            <View style={[s.heroIcon, completed && s.heroIconDone]}>
              <Ionicons
                name={completed ? 'checkmark-circle' : 'time-outline'}
                size={26}
                color={completed ? '#FFFFFF' : C.brand}
              />
            </View>
            <Text style={s.heroTitle}>
              {completed ? '전달이 완료됐어요' : '시설 방문을 기다리고 있어요'}
            </Text>
            <Text style={s.heroSub}>
              {completed
                ? '따뜻한 나눔이 잘 전달됐어요. 감사합니다!'
                : '시설 담당자가 방문하면 QR로 인수를 확인해주세요.'}
            </Text>
          </View>

          <Text style={s.sectionTitle}>픽업 시설</Text>
          <View style={s.card}>
            <View style={s.facilityHead}>
              <View style={s.facilityAvatar}>
                <Ionicons name="home" size={20} color={C.blue} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.facilityName}>{match.facility?.name ?? '수령 시설'}</Text>
                <Text style={s.facilityType}>{match.facility?.type ?? '복지시설'}</Text>
              </View>
              {facilityPhone ? (
                <Pressable
                  accessibilityLabel="시설에 전화하기"
                  onPress={() => Linking.openURL(`tel:${facilityPhone}`)}
                  style={({ pressed }) => [s.callButton, pressed && s.pressed]}
                >
                  <Ionicons name="call" size={17} color={C.brand} />
                </Pressable>
              ) : null}
            </View>
            <View style={s.cardDivider} />
            <InfoRow label="연락처" value={facilityPhone ?? '-'} />
            <InfoRow
              label="픽업 시간"
              value={
                match.listing
                  ? `${fmtTime(match.listing.pickupStart)} - ${fmtTime(match.listing.pickupEnd)}`
                  : '-'
              }
              last
            />
          </View>

          <Text style={s.sectionTitle}>전달 품목</Text>
          <Pressable
            onPress={() => match.listing && router.push(`/listing/${match.listing.id}`)}
            style={({ pressed }) => [s.card, s.foodCard, pressed && s.rowPressed]}
          >
            {match.listing?.photoUrl ? (
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
              <Text style={s.foodName}>{match.listing?.itemName ?? '-'}</Text>
              <Text style={s.foodMeta}>
                {match.listing
                  ? `${match.listing.quantity}개 · ${fmtTime(match.listing.pickupEnd)} 마감`
                  : '-'}
              </Text>
              <View style={[s.statusPill, completed ? s.statusPillDone : s.statusPillWaiting]}>
                <Text style={[s.statusText, completed ? s.statusTextDone : s.statusTextWaiting]}>
                  {completed ? '전달 완료' : '픽업 예정'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.gray} />
          </Pressable>
        </ScrollView>

        <View style={s.actionBar}>
          {completed ? (
            <Pressable
              onPress={() => router.replace('/store/history')}
              style={({ pressed }) => [s.primaryButton, pressed && s.pressed]}
            >
              <Text style={s.primaryButtonText}>기부 내역 확인하기</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push(`/scan?matchId=${matchId}`)}
              style={({ pressed }) => [s.primaryButton, pressed && s.pressed]}
            >
              <Ionicons name="qr-code-outline" size={19} color="#FFFFFF" />
              <Text style={s.primaryButtonText}>시설 QR 스캔하기</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.infoRow, !last && s.infoDivider]}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text numberOfLines={2} style={s.infoValue}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  screen: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  heroIconDone: { backgroundColor: C.brand },
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
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.line },
  infoRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 16 },
  infoDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  infoLabel: { width: 64, color: C.sub, fontSize: 13, fontFamily: 'Pretendard-Regular' },
  infoValue: {
    flex: 1,
    color: C.text,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'right',
    fontFamily: 'Pretendard-SemiBold',
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 14,
  },
  foodImage: { width: 64, height: 64, borderRadius: 14, backgroundColor: C.brandSoft },
  foodImageFallback: { alignItems: 'center', justifyContent: 'center' },
  foodName: { color: C.text, fontSize: 15, fontFamily: 'Pretendard-Bold' },
  foodMeta: { color: C.sub, fontSize: 12, fontFamily: 'Pretendard-Regular' },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 3,
  },
  statusPillWaiting: { backgroundColor: C.blueSoft },
  statusPillDone: { backgroundColor: C.navy },
  statusText: { fontSize: 10.5, fontFamily: 'Pretendard-ExtraBold' },
  statusTextWaiting: { color: C.blue },
  statusTextDone: { color: '#FFFFFF' },
  actionBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
    backgroundColor: C.card,
  },
  primaryButton: {
    height: 54,
    borderRadius: R.button,
    backgroundColor: C.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15.5, fontFamily: 'Pretendard-Bold' },
  pressed: { opacity: 0.72 },
  rowPressed: { opacity: 0.58 },
});
