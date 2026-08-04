import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Skeleton } from '@/components/skeleton';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { homePath, useAuth } from '@/lib/auth';
import { fmtDateTime } from '@/lib/hooks';
import { useSafeBack } from '@/lib/navigation';
import { C } from '@/lib/theme';

type Certificate = Awaited<ReturnType<typeof api.certificate>>;

// 기부 완료 — 증명서를 인라인으로 보여주고 PDF 다운로드까지
export default function DonationComplete() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const goBackSafe = useSafeBack();
  const { me } = useAuth();
  const donationId = Number(id);
  const [cert, setCert] = useState<Certificate | null>(null);

  useEffect(() => {
    api.certificate(donationId).then(setCert).catch(() => {});
  }, [donationId]);

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.navbar}>
        <Pressable
          onPress={goBackSafe}
          hitSlop={10}
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <Ionicons name="chevron-back" size={26} color={C.text} />
        </Pressable>
        <Text style={s.navTitle}>기부 완료</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <View style={s.checkOuter}>
            <View style={s.checkIcon}>
              <Ionicons name="checkmark" size={34} color="#FFFFFF" />
            </View>
          </View>
          <Text style={s.title}>기부가 완료됐어요!</Text>
          <Text style={s.sub}>
            {cert
              ? `${cert.beneficiary.name}에\n${cert.itemName} ${cert.quantity}개가 전달됐어요.`
              : '전달 내역을 불러오고 있어요.'}
          </Text>
        </View>

        {/* 인라인 증명서 */}
        <View style={s.paper}>
          <Text style={s.paperTitle}>식품 기부 확인서</Text>
          <Text style={s.serial}>NO. {cert?.serialNumber ?? '…'}</Text>
          <View style={s.divider} />

          {cert ? (
            <>
              <PaperRow label="기부자" value={cert.donor.name} />
              <PaperRow label="수혜 시설" value={cert.beneficiary.name} />
              <PaperRow label="품목" value={cert.itemName} />
              <PaperRow label="수량" value={`총 ${cert.quantity}개 (${cert.weightKg}kg)`} />
              <PaperRow label="인수 일시" value={fmtDateTime(cert.completedAt)} />
            </>
          ) : (
            <View style={{ gap: 12, paddingVertical: 4 }}>
              <Skeleton height={14} width="70%" />
              <Skeleton height={14} width="55%" />
              <Skeleton height={14} width="62%" />
            </View>
          )}

          <View style={s.stampRow}>
            <Text style={s.stampCaption}>이음</Text>
            <View style={s.stamp}>
              <Text style={s.stampText}>확인</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={s.actionBar}>
        <Button
          title="PDF 다운로드"
          disabled={!cert}
          onPress={() => WebBrowser.openBrowserAsync(api.certificatePdfUrl(donationId))}
        />
        <Pressable
          onPress={() => router.replace(me ? homePath(me.role) : '/')}
          style={({ pressed }) => [s.homeButton, pressed && { opacity: 0.6 }]}
        >
          <Text style={s.homeButtonText}>홈으로</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function PaperRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.paperRow}>
      <Text style={s.paperLabel}>{label}</Text>
      <Text style={s.paperValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navTitle: { fontSize: 17, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  content: { padding: 24, paddingTop: 16, gap: 24 },
  hero: { alignItems: 'center', gap: 10 },
  checkOuter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: C.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  checkIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: C.text, fontSize: 25, fontFamily: 'Pretendard-Black', letterSpacing: -0.6 },
  sub: {
    color: C.sub,
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    lineHeight: 21,
    textAlign: 'center',
  },
  paper: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.line,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  paperTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-Black',
    color: C.text,
    textAlign: 'center',
  },
  serial: {
    fontSize: 11,
    fontFamily: 'Pretendard-Regular',
    color: C.sub,
    textAlign: 'center',
    marginTop: 6,
  },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 16 },
  paperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 7,
  },
  paperLabel: { color: C.sub, fontSize: 13, fontFamily: 'Pretendard-Regular' },
  paperValue: {
    flex: 1,
    color: C.text,
    fontSize: 13.5,
    fontFamily: 'Pretendard-Bold',
    textAlign: 'right',
  },
  stampRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  stampCaption: { fontSize: 14, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  stamp: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampText: { color: C.brand, fontSize: 12, fontFamily: 'Pretendard-ExtraBold' },
  actionBar: { padding: 20, paddingTop: 8, gap: 6, backgroundColor: '#FFFFFF' },
  homeButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  homeButtonText: { color: C.sub, fontSize: 14, fontFamily: 'Pretendard-Bold' },
});
