import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { fmtTime, usePolling } from '@/lib/hooks';
import { C } from '@/lib/theme';
import { useSafeBack } from '@/lib/navigation';

// S-04 가게 매칭 상세 — 시설 인수 확인 진입점
export default function StoreMatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const goBackSafe = useSafeBack();
  const matchId = Number(id);
  const { data: match } = usePolling(() => api.match(matchId), 3000);
  const completed = match?.listing?.status === 'COMPLETED';

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.screen}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.topBar}>
            <View>
              <Text style={s.logo}>이음</Text>
              <Text style={s.screenLabel}>STORE MATCH</Text>
            </View>
            <Text style={s.step}>S-04</Text>
          </View>

          <View style={s.intro}>
            <Text style={s.introTitle}>{completed ? '전달이 완료됐어요.' : '시설 방문을 기다리고 있어요.'}</Text>
            <View style={[s.statusChip, completed && s.completedChip]}>
              <Text style={[s.statusText, completed && s.completedText]}>{completed ? '전달 완료' : '픽업 예정'}</Text>
            </View>
          </View>

          <View style={s.facilityCard}>
            <View style={s.facilityAvatar}>
              <Ionicons name="heart" size={22} color={C.navy} />
            </View>
            <Text style={s.facilityName}>{match?.facility?.name ?? '수령 시설'}</Text>
            <View style={s.facilityRows}>
              <InfoRow label="시설 유형" value={match?.facility?.type ?? '-'} />
              <InfoRow label="연락처" value={match?.facility?.phone ?? '-'} />
              <InfoRow
                label="픽업 시간"
                value={
                  match?.listing
                    ? `${fmtTime(match.listing.pickupStart)}-${fmtTime(match.listing.pickupEnd)}`
                    : '-'
                }
              />
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>전달 품목</Text>
            <View style={s.foodCard}>
              {match?.listing?.photoUrl ? (
                <Image source={{ uri: match.listing.photoUrl }} style={s.foodImage} />
              ) : (
                <View style={s.foodImage}>
                  <View style={s.foodFooter}>
                    <Text style={s.foodFooterText}>FOOD</Text>
                  </View>
                </View>
              )}
              <View style={s.foodInfo}>
                <Text style={s.foodStore}>{match?.listing?.store?.name ?? '오늘의 나눔'}</Text>
                <Text style={s.foodName}>{match?.listing?.itemName ?? '-'}</Text>
                <Text style={s.foodMeta}>
                  {match?.listing ? `${match.listing.quantity}개 · ${fmtTime(match.listing.pickupEnd)} 마감` : '-'}
                </Text>
                <View style={s.foodChip}><Text style={s.foodChipText}>{completed ? '전달 완료' : '픽업 예정'}</Text></View>
              </View>
              <Ionicons name="arrow-forward" size={22} color={C.navy} />
            </View>
          </View>
        </ScrollView>

        <View style={s.actionBar}>
          {completed ? (
            <Button title="기부 내역 확인하기" variant="dark" onPress={() => router.replace('/store/history')} />
          ) : (
            <Button title="시설 QR 스캔하기" variant="dark" onPress={() => router.push(`/scan?matchId=${matchId}`)} />
          )}
          <Button title="뒤로" variant="ghost" onPress={goBackSafe} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E9E9E6' },
  screen: { flex: 1, backgroundColor: '#FBFBF9', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  content: { padding: 20, paddingBottom: 20, gap: 28 },
  topBar: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  logo: { color: C.navy, fontSize: 25, fontFamily: 'Pretendard-Black' },
  screenLabel: { color: C.sub, fontSize: 10, fontFamily: 'Pretendard-ExtraBold', letterSpacing: 0.7 },
  step: { color: C.red, fontSize: 11, fontFamily: 'Pretendard-ExtraBold' },
  intro: { gap: 12 },
  introTitle: { color: C.navy, fontSize: 25, fontFamily: 'Pretendard-Black', letterSpacing: -0.8 },
  statusChip: { alignSelf: 'flex-start', backgroundColor: '#E0F6E9', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  completedChip: { backgroundColor: '#FFF0B9' },
  statusText: { color: '#14894C', fontSize: 11, fontFamily: 'Pretendard-ExtraBold' },
  completedText: { color: C.navy },
  facilityCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, gap: 14 },
  facilityAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFD21D', alignItems: 'center', justifyContent: 'center' },
  facilityName: { color: C.navy, fontSize: 19, fontFamily: 'Pretendard-ExtraBold' },
  facilityRows: { gap: 11, marginTop: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { color: C.sub, fontSize: 12, fontFamily: 'Pretendard-Regular' },
  infoValue: { color: C.navy, fontSize: 12, fontFamily: 'Pretendard-SemiBold' },
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
  actionBar: { borderTopWidth: 1, borderColor: C.line, backgroundColor: '#FBFBF9', padding: 20, gap: 10 },
});
