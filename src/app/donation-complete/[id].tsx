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
import { C, R } from '@/lib/theme';

type Certificate = Awaited<ReturnType<typeof api.certificate>>;

// 기부 완료 — 완료 내역과 발급된 확인서를 한 화면에서 안내
export default function DonationComplete() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { me } = useAuth();
  const donationId = Number(id);
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
    api.certificate(donationId)
      .then(setCert)
      .catch(() => setLoadFailed(true));
  }, [donationId]);

  const goHome = () => router.replace(me ? homePath(me.role) : '/');

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.navbar}>
        <View style={s.navButton} />
        <Text style={s.navTitle}>기부 완료</Text>
        <Pressable
          accessibilityLabel="홈으로 이동"
          hitSlop={10}
          onPress={goHome}
          style={({ pressed }) => [s.navButton, pressed && s.pressed]}
        >
          <Ionicons name="close" size={25} color={C.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <View style={s.completeIcon}>
            <Ionicons name="checkmark" size={38} color="#FFFFFF" />
          </View>
          <Text style={s.title}>기부가 완료되었어요</Text>
          <Text style={s.description}>
            {cert
              ? `${cert.beneficiary.name}에 ${cert.itemName} ${cert.quantity}개가 전달됐어요.`
              : loadFailed
                ? '기부는 완료되었지만 내역을 불러오지 못했어요.'
                : '완료된 기부 내역을 불러오고 있어요.'}
          </Text>
        </View>

        <View style={s.certificateNotice}>
          <View style={s.noticeIcon}>
            <Ionicons name="document-text-outline" size={21} color={C.brand} />
          </View>
          <View style={s.noticeCopy}>
            <Text style={s.noticeTitle}>기부 확인서가 발급됐어요</Text>
            <Text style={s.noticeDescription}>필요할 때 PDF로 내려받을 수 있어요.</Text>
          </View>
          <Ionicons name="checkmark-circle" size={20} color={C.brand} />
        </View>

        <Text style={s.sectionTitle}>기부 내역</Text>
        <View style={s.detailCard}>
          {cert ? (
            <>
              <DetailRow label="기부한 곳" value={cert.donor.name} />
              <DetailRow label="전달받은 곳" value={cert.beneficiary.name} />
              <DetailRow label="기부 상품" value={`${cert.itemName} ${cert.quantity}개`} />
              <DetailRow label="환산 무게" value={`${cert.weightKg}kg`} />
              <DetailRow label="완료 시간" value={fmtDateTime(cert.completedAt)} last />
            </>
          ) : loadFailed ? (
            <View style={s.loadError}>
              <Ionicons name="alert-circle-outline" size={20} color={C.red} />
              <Text style={s.loadErrorText}>기부 내역을 불러오지 못했습니다.</Text>
            </View>
          ) : (
            <View style={s.skeletonList}>
              <Skeleton height={14} width="76%" />
              <Skeleton height={14} width="64%" />
              <Skeleton height={14} width="70%" />
              <Skeleton height={14} width="58%" />
            </View>
          )}
        </View>

        {cert ? (
          <Text style={s.serial}>기부 완료 번호  {cert.serialNumber}</Text>
        ) : null}
      </ScrollView>

      <View style={s.actionBar}>
        <Button
          title="기부 확인서 PDF 받기"
          disabled={!cert}
          onPress={() => WebBrowser.openBrowserAsync(api.certificatePdfUrl(donationId))}
        />
        <Pressable
          onPress={goHome}
          style={({ pressed }) => [s.homeButton, pressed && s.pressed]}
        >
          <Text style={s.homeButtonText}>홈으로</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.detailRow, !last && s.detailDivider]}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  navbar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navTitle: { color: C.text, fontSize: 17, fontFamily: 'Pretendard-ExtraBold' },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  hero: { alignItems: 'center', paddingHorizontal: 18, marginBottom: 32 },
  completeIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { color: C.text, fontSize: 24, lineHeight: 33, fontFamily: 'Pretendard-ExtraBold', textAlign: 'center' },
  description: { color: C.sub, fontSize: 14, lineHeight: 21, fontFamily: 'Pretendard-Regular', textAlign: 'center', marginTop: 8 },
  certificateNotice: {
    minHeight: 76,
    borderRadius: R.card,
    backgroundColor: C.brandSoft,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  noticeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  noticeCopy: { flex: 1, gap: 3 },
  noticeTitle: { color: C.text, fontSize: 14, fontFamily: 'Pretendard-Bold' },
  noticeDescription: { color: C.sub, fontSize: 11.5, fontFamily: 'Pretendard-Regular' },
  sectionTitle: { color: C.text, fontSize: 15, fontFamily: 'Pretendard-Bold', marginBottom: 10 },
  detailCard: {
    borderRadius: R.card,
    backgroundColor: C.bg,
    paddingHorizontal: 18,
    paddingVertical: 5,
  },
  detailRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 18 },
  detailDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E3E7E5' },
  detailLabel: { width: 72, color: C.sub, fontSize: 13, fontFamily: 'Pretendard-Regular' },
  detailValue: { flex: 1, color: C.text, fontSize: 13.5, lineHeight: 19, textAlign: 'right', fontFamily: 'Pretendard-SemiBold' },
  skeletonList: { gap: 18, paddingVertical: 20 },
  loadError: { minHeight: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadErrorText: { color: C.red, fontSize: 12.5, fontFamily: 'Pretendard-SemiBold' },
  serial: { color: C.gray, fontSize: 11, fontFamily: 'Pretendard-Regular', textAlign: 'center', marginTop: 14 },
  actionBar: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, backgroundColor: '#FFFFFF' },
  homeButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  homeButtonText: { color: C.sub, fontSize: 14, fontFamily: 'Pretendard-Bold' },
  pressed: { opacity: 0.62 },
});
