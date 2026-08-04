import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Row } from '@/components/ui';
import { api } from '@/lib/api';
import { fmtDateTime } from '@/lib/hooks';
import { C, R } from '@/lib/theme';

type Certificate = Awaited<ReturnType<typeof api.certificate>>;

// S-06 기부확인서
export default function CertificateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const donationId = Number(id);
  const [cert, setCert] = useState<Certificate | null>(null);

  useEffect(() => {
    api.certificate(donationId).then(setCert).catch(() => {});
  }, [donationId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.brand }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <Text style={s.logo}>이음 · CERTIFICATE</Text>
        <Text style={s.title}>기부가 완료됐어요!</Text>
        <Text style={s.sub}>기부확인서를 바로 확인할 수 있습니다.</Text>

        <View style={s.paper}>
          <Text style={s.paperTitle}>식품 기부 확인서</Text>
          <Text style={s.serial}>NO. {cert?.serialNumber ?? '…'}</Text>
          <View style={s.divider} />
          <Row label="기부자" value={cert?.donor.name ?? '-'} />
          <Row label="수혜 시설" value={cert?.beneficiary.name ?? '-'} />
          <Row label="품목" value={cert?.itemName ?? '-'} />
          <Row label="수량" value={cert ? `총 ${cert.quantity}개 (${cert.weightKg}kg)` : '-'} />
          <Row label="인수 일시" value={cert ? fmtDateTime(cert.completedAt) : '-'} />
          <View style={s.stamp}>
            <Text style={s.stampText}>확인</Text>
          </View>
        </View>

        <Button
          title="PDF 다운로드"
          variant="dark"
          onPress={() => WebBrowser.openBrowserAsync(api.certificatePdfUrl(donationId))}
        />
        <Button title="닫기" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  logo: { fontSize: 13, fontFamily: 'Pretendard-Black', color: C.navy, letterSpacing: 1 },
  title: { fontSize: 28, fontFamily: 'Pretendard-Black', color: C.navy },
  sub: { fontSize: 14, color: C.brandDeep, fontFamily: 'Pretendard-SemiBold', marginTop: -10 },
  paper: { backgroundColor: '#FFF', borderRadius: R.card, padding: 24, gap: 2 },
  paperTitle: { fontSize: 20, fontFamily: 'Pretendard-Black', color: C.text, textAlign: 'center' },
  serial: { fontSize: 11, fontFamily: 'Pretendard-Regular', color: C.sub, textAlign: 'center', marginTop: 6 },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 14 },
  stamp: {
    alignSelf: 'flex-end',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  stampText: { color: C.red, fontFamily: 'Pretendard-ExtraBold' },
});
