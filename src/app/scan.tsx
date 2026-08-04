import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { notify } from '@/lib/feedback';
import { useSafeBack } from '@/lib/navigation';
import { C, R } from '@/lib/theme';

// S-05 가게 QR 스캔 — 시설이 제시한 토큰을 최종 확인 화면으로 전달
export default function Scan() {
  const router = useRouter();
  const goBackSafe = useSafeBack();
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const handled = useRef(false);
  const lastErrorAt = useRef(0);

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
    } catch (caughtError) {
      const now = Date.now();
      if (now - lastErrorAt.current > 2500) {
        lastErrorAt.current = now;
        notify.error(
          '스캔 실패',
          caughtError instanceof Error ? caughtError.message : '올바른 이음 QR이 아니에요.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const openCodeEntry = () => {
    router.push({ pathname: '/code-entry', params: matchId ? { matchId } : {} });
  };

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
        <Text style={s.navTitle}>QR 스캔</Text>
        <View style={s.navButton} />
      </View>

      {!permission?.granted ? (
        <View style={s.permissionScreen}>
          <View style={s.permissionContent}>
            <View style={s.permissionIcon}>
              <Ionicons name="camera-outline" size={34} color={C.brand} />
            </View>
            <Text style={s.permissionTitle}>카메라 권한이 필요해요</Text>
            <Text style={s.permissionDescription}>
              시설이 보여주는 QR을 스캔하려면{`\n`}카메라 사용을 허용해주세요.
            </Text>
          </View>
          <View style={s.permissionAction}>
            <Button title="카메라 권한 허용" onPress={requestPermission} />
          </View>
        </View>
      ) : (
        <View style={s.screen}>
          <View style={s.intro}>
            <Text style={s.title}>시설 QR을 스캔해주세요</Text>
            <Text style={s.description}>QR 전체가 사각형 안에 들어오도록 맞춰주세요.</Text>
          </View>

          <View style={s.scannerFrame}>
            <CameraView
              style={s.camera}
              enableTorch={torchEnabled}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={busy ? undefined : ({ data }) => onScanned(data)}
            />
            <View pointerEvents="none" style={s.scanOverlay}>
              <View style={[s.corner, s.topLeft]} />
              <View style={[s.corner, s.topRight]} />
              <View style={[s.corner, s.bottomLeft]} />
              <View style={[s.corner, s.bottomRight]} />
              <View style={s.scanLine} />
            </View>
          </View>

          <Text style={s.scanHint}>QR을 인식하면 자동으로 다음 화면으로 이동합니다.</Text>

          <View style={s.actions}>
            <View style={s.tools}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setTorchEnabled((enabled) => !enabled)}
                style={({ pressed }) => [s.toolButton, torchEnabled && s.toolButtonActive, pressed && s.pressed]}
              >
                <Ionicons
                  name={torchEnabled ? 'flash' : 'flash-outline'}
                  size={20}
                  color={torchEnabled ? C.brand : C.text}
                />
                <Text style={s.toolText}>{torchEnabled ? '손전등 끄기' : '손전등 켜기'}</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={openCodeEntry}
                style={({ pressed }) => [s.toolButton, pressed && s.pressed]}
              >
                <Ionicons name="keypad-outline" size={20} color={C.text} />
                <Text style={s.toolText}>코드 직접 입력</Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={goBackSafe}
              style={({ pressed }) => [s.closeButton, pressed && s.pressed]}
            >
              <Text style={s.closeButtonText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
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
  screen: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 14 },
  intro: { gap: 6, marginBottom: 14 },
  title: { color: C.text, fontSize: 22, lineHeight: 30, fontFamily: 'Pretendard-ExtraBold' },
  description: { color: C.sub, fontSize: 13, fontFamily: 'Pretendard-Regular' },
  scannerFrame: {
    width: '100%',
    maxWidth: 520,
    aspectRatio: 1,
    alignSelf: 'center',
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: C.navy,
  },
  camera: { flex: 1 },
  scanOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.12)' },
  corner: { position: 'absolute', width: 56, height: 56, borderColor: C.brand },
  topLeft: { top: 24, left: 24, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 8 },
  topRight: { top: 24, right: 24, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 8 },
  bottomLeft: { bottom: 24, left: 24, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 8 },
  bottomRight: { bottom: 24, right: 24, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 8 },
  scanLine: { position: 'absolute', left: 54, right: 54, top: '50%', height: 2, borderRadius: 1, backgroundColor: C.brand },
  scanHint: { color: C.sub, fontSize: 11.5, fontFamily: 'Pretendard-Regular', textAlign: 'center', marginTop: 12 },
  actions: { marginTop: 'auto', paddingTop: 14, paddingBottom: 8, gap: 10 },
  tools: { flexDirection: 'row', gap: 10 },
  toolButton: { flex: 1, height: 52, borderRadius: R.button, backgroundColor: C.graySoft, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  toolButtonActive: { backgroundColor: C.brandSoft },
  toolText: { color: C.text, fontSize: 13, fontFamily: 'Pretendard-Bold' },
  closeButton: { height: 52, borderRadius: R.button, backgroundColor: C.graySoft, alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { color: C.text, fontSize: 14, fontFamily: 'Pretendard-Bold' },
  permissionScreen: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20, justifyContent: 'space-between' },
  permissionContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  permissionIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  permissionTitle: { color: C.text, fontSize: 21, fontFamily: 'Pretendard-ExtraBold' },
  permissionDescription: { color: C.sub, fontSize: 13, lineHeight: 20, fontFamily: 'Pretendard-Regular', textAlign: 'center', marginTop: 8 },
  permissionAction: { paddingBottom: 12 },
  pressed: { opacity: 0.65 },
});
