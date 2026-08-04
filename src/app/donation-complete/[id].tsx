import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { homePath, useAuth } from '@/lib/auth';
import { fmtDateTime } from '@/lib/hooks';
import { C } from '@/lib/theme';

type Certificate = Awaited<ReturnType<typeof api.certificate>>;

// S-07 기부 완료 — 전달 완료 후 양측이 보는 완료 화면
export default function DonationComplete() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { me } = useAuth();
  const donationId = Number(id);
  const [cert, setCert] = useState<Certificate | null>(null);

  useEffect(() => {
    api.certificate(donationId).then(setCert).catch(() => {});
  }, [donationId]);

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.screen}>
        <View style={s.yellowHeader}>
          <View>
            <Text style={s.logo}>이음</Text>
            <Text style={s.screenLabel}>COMPLETE</Text>
          </View>
        </View>
        <View style={s.checkIcon}>
          <Ionicons name="checkmark" size={47} color="#FFD21D" />
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>기부가 완료됐어요!</Text>
          <Text style={s.sub}>
            {cert?.beneficiary.name ?? '수령 시설'}에{`\n`}{cert?.itemName ?? '기부 식품'} {cert ? `${cert.quantity}개가` : '전달이'} 전달됐습니다.
          </Text>

          <View style={s.receipt}>
            <ReceiptRow label="기부 완료 번호" value={cert?.serialNumber ?? '불러오는 중'} />
            <ReceiptRow label="완료 시간" value={cert ? fmtDateTime(cert.completedAt) : '-'} />
          </View>
        </ScrollView>

        <View style={s.actionBar}>
          <Button title="기부 완료 확인서 보기" variant="dark" onPress={() => router.push(`/certificate/${donationId}`)} />
          <Pressable onPress={() => router.replace(me ? homePath(me.role) : '/')} style={s.homeButton}>
            <Text style={s.homeButtonText}>홈으로</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.receiptRow}>
      <Text style={s.receiptLabel}>{label}</Text>
      <Text style={s.receiptValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E9E9E6' },
  screen: { flex: 1, backgroundColor: '#FBFBF9', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  yellowHeader: { height: 192, backgroundColor: '#FFD21D', padding: 20 },
  logo: { color: C.navy, fontSize: 25, fontFamily: 'Pretendard-Black' },
  screenLabel: { color: '#4D5158', fontSize: 10, fontFamily: 'Pretendard-ExtraBold', letterSpacing: 0.7 },
  checkIcon: { position: 'absolute', top: 141, alignSelf: 'center', width: 84, height: 84, borderRadius: 42, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, padding: 20, paddingTop: 92, gap: 18 },
  title: { color: C.navy, fontSize: 26, fontFamily: 'Pretendard-Black', letterSpacing: -0.8 },
  sub: { color: '#68717B', fontSize: 13, fontFamily: 'Pretendard-Regular', lineHeight: 20 },
  receipt: { marginTop: 20, borderRadius: 18, backgroundColor: '#FFFFFF', padding: 18, gap: 16 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  receiptLabel: { color: C.sub, fontSize: 11, fontFamily: 'Pretendard-Regular' },
  receiptValue: { flex: 1, color: C.navy, fontSize: 11, fontFamily: 'Pretendard-ExtraBold', textAlign: 'right' },
  actionBar: { padding: 20, borderTopWidth: 1, borderColor: C.line, backgroundColor: '#FBFBF9', gap: 10 },
  homeButton: { minHeight: 48, backgroundColor: '#FFFFFF', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  homeButtonText: { color: C.navy, fontSize: 13, fontFamily: 'Pretendard-ExtraBold' },
});
