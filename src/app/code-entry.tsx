import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { usePolling } from '@/lib/hooks';
import { C } from '@/lib/theme';
import { useSafeBack } from '@/lib/navigation';

// S-05B 직접 코드 입력 — QR 토큰의 숫자 6자리를 확인한 뒤 최종 확인으로 이동
export default function CodeEntry() {
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const router = useRouter();
  const goBackSafe = useSafeBack();
  const numericMatchId = Number(matchId);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { data: match } = usePolling(
    () => (Number.isFinite(numericMatchId) && numericMatchId > 0 ? api.match(numericMatchId) : Promise.reject(new Error('매칭 정보를 찾을 수 없어요.'))),
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
      <View style={s.screen}>
        <View style={s.header}>
          <View>
            <Text style={s.logo}>이음</Text>
            <Text style={s.screenLabel}>CODE ENTRY</Text>
          </View>
          <Text style={s.step}>S-05B</Text>
        </View>

        <View style={s.content}>
          <Text style={s.eyebrow}>직접 입력 코드</Text>
          <Text style={s.title}>시설이 알려주는{`\n`}6자리 코드를 입력하세요.</Text>
          <Text style={s.sub}>QR 스캔이 어려울 때 사용할 수 있습니다.</Text>

          <View style={s.codeBox}>
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
              placeholderTextColor="#677489"
              style={s.codeInput}
              textAlign="center"
            />
            <Text style={s.codeHint}>6자리 숫자</Text>
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}
        </View>

        <View style={s.actions}>
          <Button title="코드 확인" onPress={verifyCode} disabled={!match} style={s.yellowButton} />
          <Pressable onPress={goBackSafe} style={s.cancelButton}>
            <Text style={s.cancelText}>QR 스캔으로 돌아가기</Text>
          </Pressable>
          <Text style={s.help}>코드는 한 번만 사용할 수 있으며,{`\n`}확인 완료 후 자동으로 전달됩니다.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E9E9E6' },
  screen: { flex: 1, backgroundColor: C.navy, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  logo: { color: '#FFFFFF', fontSize: 25, fontFamily: 'Pretendard-Black' },
  screenLabel: { color: '#AEB7C5', fontSize: 10, fontFamily: 'Pretendard-ExtraBold', letterSpacing: 0.7 },
  step: { color: '#FFD21D', fontSize: 11, fontFamily: 'Pretendard-ExtraBold' },
  content: { flex: 1, paddingTop: 42 },
  eyebrow: { color: '#FFD21D', fontSize: 11, fontFamily: 'Pretendard-ExtraBold', marginBottom: 22 },
  title: { color: '#FFFFFF', fontSize: 25, fontFamily: 'Pretendard-Black', lineHeight: 33, letterSpacing: -0.8 },
  sub: { color: '#AEB7C5', fontSize: 12, fontFamily: 'Pretendard-Regular', marginTop: 10 },
  codeBox: { marginTop: 46, minHeight: 147, borderWidth: 1, borderColor: '#41516B', borderRadius: 20, justifyContent: 'center', gap: 5 },
  codeInput: { color: '#FFFFFF', fontSize: 39, fontFamily: 'Pretendard-Black', letterSpacing: 5, paddingHorizontal: 10 },
  codeHint: { color: '#AEB7C5', fontSize: 11, fontFamily: 'Pretendard-Regular', textAlign: 'center' },
  error: { color: '#FF8B80', fontSize: 12, fontFamily: 'Pretendard-SemiBold', textAlign: 'center', marginTop: 14 },
  actions: { gap: 12 },
  yellowButton: { backgroundColor: '#FFD21D' },
  cancelButton: { minHeight: 48, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: C.navy, fontSize: 13, fontFamily: 'Pretendard-ExtraBold' },
  help: { color: '#98A4B5', fontSize: 10.5, fontFamily: 'Pretendard-Regular', lineHeight: 16, marginTop: 15 },
});
