import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { C } from '@/lib/theme';
import { useSafeBack } from '@/lib/navigation';

// S-05 가게 QR 스캔 — 시설이 제시한 토큰을 최종 확인 화면으로 전달
export default function Scan() {
  const router = useRouter();
  const goBackSafe = useSafeBack();
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const handled = useRef(false);

  const onScanned = (data: string) => {
    if (handled.current) return;

    try {
      const payload = JSON.parse(data) as { matchId: number; qrToken: string };
      if (!payload.matchId || !payload.qrToken || (matchId && payload.matchId !== Number(matchId))) {
        throw new Error('현재 픽업 건의 QR이 아니에요.');
      }
      handled.current = true;
      setBusy(true);
      router.push({
        pathname: '/delivery-confirm',
        params: { matchId: String(payload.matchId), qrToken: payload.qrToken },
      });
    } catch (e) {
      Alert.alert('스캔 실패', e instanceof Error ? e.message : '올바른 이음 QR이 아니에요.');
    } finally {
      setBusy(false);
    }
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={s.permissionScreen}>
        <Text style={s.logo}>이음</Text>
        <View style={s.permissionContent}>
          <View style={s.permissionIcon}><Text style={s.permissionIconText}>QR</Text></View>
          <Text style={s.permissionTitle}>카메라 권한이 필요해요</Text>
          <Text style={s.permissionSub}>시설이 보여주는 QR을 스캔해 전달을 확인합니다.</Text>
        </View>
        <Button title="카메라 권한 허용" onPress={requestPermission} style={s.yellowButton} />
        <Button title="뒤로" variant="ghost" onPress={goBackSafe} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.screen}>
        <View style={s.header}>
          <View>
            <Text style={s.logo}>이음</Text>
            <Text style={s.screenLabel}>FACILITY QR SCAN</Text>
          </View>
          <Text style={s.step}>S-05</Text>
        </View>

        <View style={s.intro}>
          <Text style={s.title}>시설이 보여주는 QR을{`\n`}화면 안에 맞춰주세요.</Text>
          <Text style={s.sub}>인수 확인 후 전달 완료로 처리됩니다.</Text>
        </View>

        <View style={s.scannerBox}>
          <CameraView
            style={s.camera}
            enableTorch={torchEnabled}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={busy ? undefined : ({ data }) => onScanned(data)}
          />
          <View pointerEvents="none" style={s.scanGuide}>
            <View style={[s.corner, s.topLeft]} />
            <View style={[s.corner, s.topRight]} />
            <View style={[s.corner, s.bottomLeft]} />
            <View style={[s.corner, s.bottomRight]} />
          </View>
        </View>

        <View style={s.actions}>
          <View style={s.inlineActions}>
            <Pressable onPress={() => setTorchEnabled((enabled) => !enabled)} style={s.secondaryButton}>
              <Text style={s.secondaryButtonText}>{torchEnabled ? '손전등 끄기' : '손전등 켜기'}</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push({ pathname: '/code-entry', params: matchId ? { matchId } : {} })}
              style={s.secondaryButton}
            >
              <Text style={s.secondaryButtonText}>코드 직접 입력</Text>
            </Pressable>
          </View>
          <Pressable onPress={goBackSafe} style={s.cancelButton}>
            <Text style={s.cancelButtonText}>스캔 취소</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E9E9E6' },
  screen: { flex: 1, backgroundColor: C.navy, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  logo: { color: '#FFFFFF', fontSize: 25, fontFamily: 'Pretendard-Black' },
  screenLabel: { color: '#AEB7C5', fontSize: 10, fontFamily: 'Pretendard-ExtraBold', letterSpacing: 0.7 },
  step: { color: '#FFD21D', fontSize: 11, fontFamily: 'Pretendard-ExtraBold' },
  intro: { gap: 7 },
  title: { color: '#FFFFFF', fontSize: 25, fontFamily: 'Pretendard-Black', lineHeight: 33, letterSpacing: -0.8 },
  sub: { color: '#AEB7C5', fontSize: 12, fontFamily: 'Pretendard-Regular' },
  scannerBox: { flex: 1, minHeight: 300, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#748195' },
  camera: { flex: 1 },
  scanGuide: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  corner: { position: 'absolute', width: 66, height: 66, borderColor: '#FFD21D' },
  topLeft: { top: 22, left: 22, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 5 },
  topRight: { top: 22, right: 22, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 5 },
  bottomLeft: { bottom: 22, left: 22, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 5 },
  bottomRight: { bottom: 22, right: 22, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 5 },
  actions: { gap: 12 },
  inlineActions: { flexDirection: 'row', gap: 10 },
  secondaryButton: { flex: 1, borderRadius: 14, minHeight: 48, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: C.navy, fontSize: 13, fontFamily: 'Pretendard-ExtraBold' },
  cancelButton: { minHeight: 48, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: C.navy, fontSize: 13, fontFamily: 'Pretendard-ExtraBold' },
  permissionScreen: { flex: 1, backgroundColor: C.navy, padding: 28, justifyContent: 'space-between' },
  permissionContent: { alignItems: 'center', gap: 12 },
  permissionIcon: { width: 84, height: 84, borderRadius: 24, backgroundColor: '#FFD21D', alignItems: 'center', justifyContent: 'center' },
  permissionIconText: { color: C.navy, fontSize: 21, fontFamily: 'Pretendard-Black' },
  permissionTitle: { color: '#FFFFFF', fontSize: 23, fontFamily: 'Pretendard-Black' },
  permissionSub: { color: '#AEB7C5', fontSize: 13, fontFamily: 'Pretendard-Regular', textAlign: 'center' },
  yellowButton: { backgroundColor: '#FFD21D' },
});
