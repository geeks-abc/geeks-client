import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
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
import Animated, { FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { homePath, useAuth } from '@/lib/auth';
import { C, R } from '@/lib/theme';
import { useSafeBack } from '@/lib/navigation';

type Step = 'phone' | 'code' | 'profile' | 'done';

const formatPhone = (digits: string) => {
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
};

// 온보딩: 전화번호 → 인증번호 → (신규) 닉네임·유형 → 완료
export default function PhoneAuth() {
  const router = useRouter();
  const goBackSafe = useSafeBack();
  const { adoptToken } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState<'STORE' | 'FACILITY' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcome, setWelcome] = useState({ title: '', sub: '' });
  const codeInputRef = useRef<TextInput>(null);

  const fail = (e: unknown) =>
    setError(e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.');

  const requestCode = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.phoneRequest(phone);
      setDemoCode(res.demoCode);
      setCode('');
      setStep('code');
      setTimeout(() => codeInputRef.current?.focus(), 350);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const finish = async (accessToken: string, isNew: boolean, name?: string | null) => {
    const profile = await adoptToken(accessToken);
    setWelcome(
      isNew
        ? { title: `만나서 반가워요,\n${name ?? '이음'}님!`, sub: '이제 이음을 시작할 수 있어요.' }
        : { title: '돌아오신 것을\n환영해요!', sub: `${profile.nickname ?? ''} 계정으로 로그인했어요.` },
    );
    setStep('done');
    setTimeout(() => router.replace(homePath(profile.role)), 1300);
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.phoneVerify(phone, code);
      if (!res.isNew && res.accessToken) {
        await finish(res.accessToken, false);
      } else if (res.signupToken) {
        setSignupToken(res.signupToken);
        setStep('profile');
      }
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const signup = async () => {
    if (!signupToken || !role) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.phoneSignup(signupToken, nickname.trim(), role);
      await finish(res.accessToken, true, nickname.trim());
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const goBack = () => {
    setError(null);
    if (step === 'phone') goBackSafe();
    else if (step === 'code') setStep('phone');
    else if (step === 'profile') setStep('code');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {step !== 'done' ? (
          <Pressable onPress={goBack} hitSlop={12} style={s.back}>
            <Text style={s.backText}>←</Text>
          </Pressable>
        ) : null}

        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          {step === 'phone' ? (
            <Animated.View entering={FadeInRight.duration(350)} style={{ gap: 24 }}>
              <View style={{ gap: 8 }}>
                <Text style={s.title}>안녕하세요!{'\n'}휴대폰 번호로 시작할게요</Text>
                <Text style={s.sub}>계정이 없으면 자동으로 가입돼요.</Text>
              </View>
              <TextInput
                style={s.bigInput}
                value={formatPhone(phone)}
                onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 11))}
                placeholder="010-0000-0000"
                placeholderTextColor={C.gray}
                keyboardType="number-pad"
                autoFocus
              />
              {error ? <Text style={s.errorText}>{error}</Text> : null}
              <Button
                title="인증번호 받기"
                loading={busy}
                disabled={phone.length < 10}
                onPress={requestCode}
              />
            </Animated.View>
          ) : null}

          {step === 'code' ? (
            <Animated.View entering={FadeInRight.duration(350)} style={{ gap: 24 }}>
              <View style={{ gap: 8 }}>
                <Text style={s.title}>인증번호 6자리를{'\n'}입력해주세요</Text>
                <Text style={s.sub}>{formatPhone(phone)}로 보냈어요.</Text>
              </View>
              <TextInput
                ref={codeInputRef}
                style={[s.bigInput, s.codeInput]}
                value={code}
                onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="······"
                placeholderTextColor={C.gray}
                keyboardType="number-pad"
              />
              {demoCode ? (
                <View style={s.demoHint}>
                  <Text style={s.demoHintText}>
                    데모 빌드 · 인증번호 <Text style={s.demoHintCode}>{demoCode}</Text>
                  </Text>
                </View>
              ) : null}
              {error ? <Text style={s.errorText}>{error}</Text> : null}
              <Button title="확인" loading={busy} disabled={code.length !== 6} onPress={verify} />
              <Pressable onPress={requestCode} hitSlop={8}>
                <Text style={s.resend}>인증번호 다시 받기</Text>
              </Pressable>
            </Animated.View>
          ) : null}

          {step === 'profile' ? (
            <Animated.View entering={FadeInRight.duration(350)} style={{ gap: 24 }}>
              <View style={{ gap: 8 }}>
                <Text style={s.title}>거의 다 왔어요!{'\n'}어떻게 불러드릴까요?</Text>
                <Text style={s.sub}>상호나 기관 이름을 입력하면 프로필이 만들어져요.</Text>
              </View>
              <TextInput
                style={s.bigInput}
                value={nickname}
                onChangeText={setNickname}
                placeholder="오늘의 빵집"
                placeholderTextColor={C.gray}
                maxLength={30}
                autoFocus
              />
              <View style={{ gap: 10 }}>
                <Text style={s.roleLabel}>유형을 선택해주세요</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {(
                    [
                      { key: 'STORE', icon: '🥐', title: '음식점', sub: '남은 식품을 기부해요' },
                      { key: 'FACILITY', icon: '🏠', title: '기관', sub: '기부 식품을 수령해요' },
                    ] as const
                  ).map((option) => {
                    const selected = role === option.key;
                    return (
                      <Pressable
                        key={option.key}
                        onPress={() => setRole(option.key)}
                        style={[s.roleCard, selected && s.roleCardSelected]}
                      >
                        <Text style={{ fontSize: 26 }}>{option.icon}</Text>
                        <Text style={[s.roleTitle, selected && { color: '#FFF' }]}>
                          {option.title}
                        </Text>
                        <Text style={[s.roleSub, selected && { color: 'rgba(255,255,255,0.75)' }]}>
                          {option.sub}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              {error ? <Text style={s.errorText}>{error}</Text> : null}
              <Button
                title="시작하기"
                loading={busy}
                disabled={!nickname.trim() || !role}
                onPress={signup}
              />
            </Animated.View>
          ) : null}

          {step === 'done' ? (
            <View style={s.doneWrap}>
              <Animated.View entering={ZoomIn.duration(400)} style={s.doneCheck}>
                <Text style={{ fontSize: 40 }}>✓</Text>
              </Animated.View>
              <Animated.Text entering={FadeInDown.delay(150).duration(400)} style={s.doneTitle}>
                {welcome.title}
              </Animated.Text>
              <Animated.Text entering={FadeInDown.delay(280).duration(400)} style={s.sub}>
                {welcome.sub}
              </Animated.Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  back: { paddingHorizontal: 20, paddingVertical: 8, alignSelf: 'flex-start' },
  backText: { fontSize: 24, color: C.text, fontFamily: 'Pretendard-Bold' },
  container: { flexGrow: 1, padding: 24, paddingTop: 16 },
  title: {
    fontSize: 26,
    fontFamily: 'Pretendard-ExtraBold',
    color: C.text,
    lineHeight: 37,
  },
  sub: { fontSize: 14, fontFamily: 'Pretendard-Regular', color: C.sub, lineHeight: 21 },
  bigInput: {
    fontSize: 24,
    fontFamily: 'Pretendard-Bold',
    color: C.text,
    borderBottomWidth: 2,
    borderBottomColor: C.line,
    paddingVertical: 12,
  },
  codeInput: { letterSpacing: 12, textAlign: 'center' },
  demoHint: {
    backgroundColor: C.brandSoft,
    borderRadius: R.chip,
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
  roleLabel: { fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: C.sub },
  roleCard: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: R.card,
    borderWidth: 1.5,
    borderColor: C.line,
    padding: 18,
    gap: 6,
    alignItems: 'center',
  },
  roleCardSelected: { backgroundColor: C.brand, borderColor: C.brand },
  roleTitle: { fontSize: 16, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  roleSub: {
    fontSize: 11.5,
    fontFamily: 'Pretendard-Regular',
    color: C.sub,
    textAlign: 'center',
  },
  errorText: { color: C.red, fontSize: 13, fontFamily: 'Pretendard-SemiBold' },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  doneCheck: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: {
    fontSize: 26,
    fontFamily: 'Pretendard-ExtraBold',
    color: C.text,
    textAlign: 'center',
    lineHeight: 37,
  },
});
