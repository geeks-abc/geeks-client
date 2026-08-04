import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { usePolling } from '@/lib/hooks';
import { useSafeBack } from '@/lib/navigation';
import { C, R } from '@/lib/theme';

// S-05B 직접 코드 입력 — QR 토큰의 숫자 6자리를 확인한 뒤 최종 확인으로 이동
export default function CodeEntry() {
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const router = useRouter();
  const goBackSafe = useSafeBack();
  const numericMatchId = Number(matchId);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { data: match } = usePolling(
    () =>
      Number.isFinite(numericMatchId) && numericMatchId > 0
        ? api.match(numericMatchId)
        : Promise.reject(new Error('매칭 정보를 찾을 수 없어요.')),
    5000,
    [numericMatchId],
  );

  const verificationCode = useMemo(
    () => (match?.qrToken.replace(/\D/g, '').padEnd(6, '0').slice(0, 6) ?? ''),
    [match?.qrToken],
  );

  const verifyCode = () => {
    if (code.length !== 6) {
      setError('6자리 코드를 모두 입력해주세요.');
      return;
    }
    if (!match || code !== verificationCode) {
      setError('코드가 일치하지 않아요. 다시 확인해주세요.');
      return;
    }
    router.push({
      pathname: '/delivery-confirm',
      params: { matchId: String(match.id), qrToken: match.qrToken },
    });
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.navbar}>
        <Pressable
          accessibilityLabel="QR 스캔으로 돌아가기"
          hitSlop={10}
          onPress={goBackSafe}
          style={({ pressed }) => [s.navButton, pressed && s.pressed]}
        >
          <Ionicons name="chevron-back" size={26} color={C.text} />
        </Pressable>
        <Text style={s.navTitle}>코드 직접 입력</Text>
        <View style={s.navButton} />
      </View>

      <View style={s.screen}>
        <View style={s.content}>
          <View style={s.codeIcon}>
            <Ionicons name="keypad-outline" size={27} color={C.brand} />
          </View>
          <Text style={s.title}>6자리 코드를 입력해주세요</Text>
          <Text style={s.description}>시설 QR 화면 아래에 표시된 숫자 코드예요.</Text>

          <View style={[s.codeBox, error && s.codeBoxError]}>
            <TextInput
              autoFocus
              value={code}
              onChangeText={(value) => {
                setCode(value.replace(/\D/g, '').slice(0, 6));
                setError(null);
              }}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor={C.gray}
              style={s.codeInput}
              textAlign="center"
            />
            <Text style={s.codeCount}>{code.length}/6</Text>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={C.red} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        <View style={s.actions}>
          <Button title="코드 확인" onPress={verifyCode} disabled={!match || code.length !== 6} />
          <Pressable onPress={goBackSafe} style={({ pressed }) => [s.scanButton, pressed && s.pressed]}>
            <Ionicons name="scan-outline" size={18} color={C.text} />
            <Text style={s.scanButtonText}>QR 스캔으로 돌아가기</Text>
          </Pressable>
        </View>
      </View>
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
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 52, alignItems: 'center' },
  codeIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { color: C.text, fontSize: 22, lineHeight: 30, fontFamily: 'Pretendard-ExtraBold', textAlign: 'center' },
  description: { color: C.sub, fontSize: 13, fontFamily: 'Pretendard-Regular', textAlign: 'center', marginTop: 7 },
  codeBox: { width: '100%', maxWidth: 460, minHeight: 132, marginTop: 40, borderRadius: R.card, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: C.line },
  codeBoxError: { borderColor: C.red },
  codeInput: { width: '100%', color: C.text, fontSize: 38, fontFamily: 'Pretendard-ExtraBold', letterSpacing: 7, paddingHorizontal: 16, paddingVertical: 4 },
  codeCount: { color: C.sub, fontSize: 11, fontFamily: 'Pretendard-Regular' },
  errorBox: { width: '100%', maxWidth: 460, marginTop: 12, borderRadius: 12, backgroundColor: C.redSoft, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  errorText: { color: C.red, fontSize: 12, fontFamily: 'Pretendard-SemiBold' },
  actions: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  scanButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  scanButtonText: { color: C.text, fontSize: 13.5, fontFamily: 'Pretendard-Bold' },
  pressed: { opacity: 0.65 },
});
