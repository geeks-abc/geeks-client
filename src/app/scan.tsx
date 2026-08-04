import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { C } from '@/lib/theme';

// QR 스캔 — 가게 화면의 QR({matchId, qrToken})을 읽어 인수 완료 처리
export default function Scan() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const handled = useRef(false);

  const onScanned = async (data: string) => {
    if (handled.current) return;
    handled.current = true;
    setBusy(true);
    try {
      const payload = JSON.parse(data) as { matchId: number; qrToken: string };
      const result = await api.completeMatch(payload.matchId, payload.qrToken);
      Alert.alert('인수 완료!', `${result.itemName} ${result.quantity}개`, [
        { text: '확인서 보기', onPress: () => router.replace(`/certificate/${result.donation.id}`) },
      ]);
    } catch (e) {
      Alert.alert('스캔 실패', e instanceof Error ? e.message : '올바른 이음 QR이 아니에요.', [
        { text: '다시 시도', onPress: () => (handled.current = false) },
        { text: '닫기', onPress: () => router.back() },
      ]);
    } finally {
      setBusy(false);
    }
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={s.title}>카메라 권한이 필요해요</Text>
        <Text style={s.sub}>가게 화면의 QR을 스캔해서 인수를 확인합니다.</Text>
        <Button title="권한 허용" variant="dark" onPress={requestPermission} style={{ alignSelf: 'stretch' }} />
        <Button title="뒤로" variant="ghost" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={busy ? undefined : ({ data }) => onScanned(data)}
      />
      <SafeAreaView style={s.overlay} edges={['bottom']}>
        <Text style={s.overlayText}>
          {matchId ? `매칭 #${matchId} · ` : ''}가게 화면의 QR을 비춰주세요
        </Text>
        <Button title="닫기" onPress={() => router.back()} />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', padding: 32, gap: 14 },
  title: { fontSize: 20, fontWeight: '800', color: C.text, textAlign: 'center' },
  sub: { fontSize: 13, color: C.sub, textAlign: 'center', marginBottom: 10 },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, gap: 12 },
  overlayText: { color: '#FFF', textAlign: 'center', fontWeight: '700' },
});
