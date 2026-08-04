import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useSafeBack } from '@/lib/navigation';
import { markVerified } from '@/lib/verify';
import { C } from '@/lib/theme';

// 마이페이지 진입 게이트 — 가입 번호로 인증번호 재확인
export default function VerifyIdentity() {
  const router = useRouter();
  const goBackSafe = useSafeBack();
  const { me, adoptToken } = useAuth();

  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    if (!me?.phone) {
      setError('가입 번호를 찾을 수 없어요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.phoneRequest(me.phone);
      setDemoCode(res.demoCode);
      setCode('');
      setCodeSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '인증번호 발송에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    if (!me?.phone) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.phoneVerify(me.phone, code);
      if (res.accessToken) await adoptToken(res.accessToken);
      markVerified();
      router.replace('/edit-profile');
    } catch {
      setError('인증번호가 올바르지 않아요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.navbar}>
          <Pressable
            onPress={goBackSafe}
            hitSlop={10}
            style={({ pressed }) => pressed && { opacity: 0.6 }}
          >
            <Ionicons name="chevron-back" size={26} color={C.text} />
          </Pressable>
          <Text style={s.navTitle}>본인 확인</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <Text style={s.title}>정보 수정 전에{'\n'}본인 확인이 필요해요</Text>
          <Text style={s.sub}>가입한 번호로 인증번호를 보내드려요.</Text>

          {!codeSent ? (
            <>
              {error ? <Text style={s.errorText}>{error}</Text> : null}
              <Button title="인증번호 받기" loading={busy} onPress={sendCode} />
            </>
          ) : (
            <>
              <TextInput
                style={s.codeInput}
                value={code}
                onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="······"
                placeholderTextColor={C.gray}
                keyboardType="number-pad"
                autoFocus
              />
              {demoCode ? (
                <View style={s.demoHint}>
                  <Text style={s.demoHintText}>
                    데모 빌드 · 인증번호 <Text style={s.demoHintCode}>{demoCode}</Text>
                  </Text>
                </View>
              ) : null}
              {error ? <Text style={s.errorText}>{error}</Text> : null}
              <Button title="확인" loading={busy} disabled={code.length !== 6} onPress={verifyCode} />
              <Pressable onPress={sendCode} hitSlop={8}>
                <Text style={s.resend}>인증번호 다시 받기</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navTitle: { fontSize: 17, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  container: { flexGrow: 1, padding: 24, paddingTop: 16, gap: 20 },
  title: {
    fontSize: 25,
    fontFamily: 'Pretendard-ExtraBold',
    color: C.text,
    lineHeight: 35,
  },
  sub: { fontSize: 14, fontFamily: 'Pretendard-Regular', color: C.sub, marginTop: -8 },
  codeInput: {
    fontSize: 22,
    fontFamily: 'Pretendard-Bold',
    color: C.text,
    borderBottomWidth: 2,
    borderBottomColor: C.line,
    paddingVertical: 12,
    letterSpacing: 12,
    textAlign: 'center',
  },
  demoHint: {
    backgroundColor: C.brandSoft,
    borderRadius: 12,
    padding: 12,
    alignSelf: 'flex-start',
  },
  demoHintText: { fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: C.brandDeep },
  demoHintCode: { fontFamily: 'Pretendard-Black', letterSpacing: 1 },
  resend: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
    color: C.sub,
    textDecorationLine: 'underline',
  },
  errorText: { color: C.red, fontSize: 13, fontFamily: 'Pretendard-SemiBold' },
});
