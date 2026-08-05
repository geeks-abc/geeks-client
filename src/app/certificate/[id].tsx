import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Skeleton } from '@/components/skeleton';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { openCertificatePdf } from '@/lib/certificate';
import { notify } from '@/lib/feedback';
import { fmtDateTime } from '@/lib/hooks';
import { useSafeBack } from '@/lib/navigation';
import { C, R } from '@/lib/theme';

type Certificate = Awaited<ReturnType<typeof api.certificate>>;

// 기부 확인서 — 완료된 전달 내역과 PDF 확인서 제공
export default function CertificateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goBackSafe = useSafeBack();
  const donationId = Number(id);
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      await openCertificatePdf(donationId);
    } catch (e) {
      notify.error('확인서 열기 실패', e instanceof Error ? e.message : undefined);
    } finally {
      setPdfBusy(false);
    }
  };

  useEffect(() => {
    setLoadFailed(false);
    api.certificate(donationId)
      .then(setCert)
      .catch(() => setLoadFailed(true));
  }, [donationId]);

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.navbar}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          hitSlop={10}
          onPress={goBackSafe}
          style={({ pressed }) => [s.navButton, pressed && s.pressed]}
        >
          <Ionicons name="chevron-back" size={26} color={C.text} />
        </Pressable>
        <Text style={s.navTitle}>기부 확인서</Text>
        <View style={s.navButton} />
      </View>

      <View style={s.content}>
        <View style={s.hero}>
          <View style={s.completeIcon}>
            <Ionicons name="checkmark" size={26} color="#FFFFFF" />
          </View>
          <View style={s.heroCopy}>
            <Text style={s.title}>기부가 완료됐어요!</Text>
            <Text style={s.description}>전달이 완료된 기부 내역을 확인해보세요.</Text>
          </View>
        </View>

        <View style={s.statusCard}>
          <View style={s.statusIcon}>
            <Ionicons name="document-text-outline" size={21} color={C.brand} />
          </View>
          <View style={s.statusCopy}>
            <Text style={s.statusTitle}>식품 기부 확인서</Text>
            <Text style={s.statusDescription}>
              {cert ? `NO. ${cert.serialNumber}` : '확인서 정보를 불러오고 있어요.'}
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={21} color={C.brand} />
        </View>

        <Text style={s.sectionTitle}>기부 내역</Text>
        <View style={s.detailCard}>
          {cert ? (
            <>
              <DetailRow label="기부한 곳" value={cert.donor.name} />
              <DetailRow label="전달받은 곳" value={cert.beneficiary.name} />
              <DetailRow label="기부 상품" value={cert.itemName} />
              <DetailRow label="수량" value={`총 ${cert.quantity}개`} />
              <DetailRow label="환산 무게" value={`${cert.weightKg}kg`} />
              <DetailRow label="완료 시간" value={fmtDateTime(cert.completedAt)} last />
            </>
          ) : loadFailed ? (
            <View style={s.loadError}>
              <Ionicons name="alert-circle-outline" size={20} color={C.red} />
              <Text style={s.loadErrorText}>기부 확인서를 불러오지 못했습니다.</Text>
            </View>
          ) : (
            <View style={s.skeletonList}>
              <Skeleton height={14} width="72%" />
              <Skeleton height={14} width="64%" />
              <Skeleton height={14} width="78%" />
              <Skeleton height={14} width="56%" />
            </View>
          )}
        </View>

      </View>

      <View style={s.actionBar}>
        <Button
          title="기부 확인서 PDF 받기"
          disabled={!cert}
          loading={pdfBusy}
          onPress={downloadPdf}
        />
      </View>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.detailRow, !last && s.detailDivider]}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={s.detailValue}>{value}</Text>
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
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  hero: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  completeIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, gap: 3 },
  title: { color: C.text, fontSize: 21, lineHeight: 29, fontFamily: 'Pretendard-ExtraBold' },
  description: { color: C.sub, fontSize: 12.5, fontFamily: 'Pretendard-Regular' },
  statusCard: { minHeight: 64, borderRadius: R.card, backgroundColor: C.brandSoft, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 18 },
  statusIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  statusCopy: { flex: 1, gap: 3 },
  statusTitle: { color: C.text, fontSize: 14, fontFamily: 'Pretendard-Bold' },
  statusDescription: { color: C.sub, fontSize: 11.5, fontFamily: 'Pretendard-Regular' },
  sectionTitle: { color: C.text, fontSize: 15, fontFamily: 'Pretendard-Bold', marginBottom: 8 },
  detailCard: { borderRadius: R.card, backgroundColor: C.bg, paddingHorizontal: 16, paddingVertical: 3 },
  detailRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 14 },
  detailDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E3E7E5' },
  detailLabel: { width: 72, color: C.sub, fontSize: 13, fontFamily: 'Pretendard-Regular' },
  detailValue: { flex: 1, color: C.text, fontSize: 13.5, lineHeight: 19, textAlign: 'right', fontFamily: 'Pretendard-SemiBold' },
  skeletonList: { gap: 18, paddingVertical: 20 },
  loadError: { minHeight: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadErrorText: { color: C.red, fontSize: 12.5, fontFamily: 'Pretendard-SemiBold' },
  actionBar: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, backgroundColor: '#FFFFFF' },
  pressed: { opacity: 0.62 },
});
