import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button, Field } from '@/components/ui';
import { DEMO_ACCOUNTS, homePath, useAuth } from '@/lib/auth';
import { C, R } from '@/lib/theme';

// A-00 로그인 + D-00 데모 계정 전환
export default function Login() {
  const router = useRouter();
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('store@demo.com');
  const [password, setPassword] = useState('password123');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const go = async (
    task: () => Promise<{ role: 'STORE' | 'FACILITY' | 'ADMIN' }>,
    key: string,
  ) => {
    setBusy(key);
    setError(null);
    try {
      const me = await task();
      router.replace(homePath(me.role));
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인에 실패했어요. 다시 시도해주세요.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.brand }}>
      {/* 장식용 원 (디자인 시안의 유기적 셰이프) */}
      <View style={s.circleLarge} />
      <View style={s.circleSmall} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={s.hero}>
              <Animated.View entering={FadeInDown.duration(500)}>
                <View style={s.logoPill}>
                  <Text style={s.logoText}>이음</Text>
                </View>
              </Animated.View>
              <Animated.Text
                entering={FadeInDown.delay(120).duration(600)}
                style={s.heroTitle}
              >
                버려질 음식이{'\n'}필요한 곳에 닿도록
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(240).duration(600)}
                style={s.heroSub}
              >
                소상공인과 복지시설을 빠르게 연결합니다.
              </Animated.Text>
            </View>

            <Animated.View entering={FadeInUp.delay(200).duration(600)} style={s.sheet}>
              <Text style={s.sheetTitle}>로그인</Text>
              <Text style={s.sheetSub}>데모 계정으로 바로 시작할 수 있어요.</Text>

              <View style={{ gap: 14, marginTop: 20 }}>
                <Field
                  label="이메일"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Field
                  label="비밀번호"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                {error ? (
                  <Animated.View entering={FadeInDown.duration(250)} style={s.errorBox}>
                    <Text style={s.errorText}>{error}</Text>
                  </Animated.View>
                ) : null}
                <Button
                  title="로그인"
                  variant="dark"
                  loading={busy === 'login'}
                  onPress={() => go(() => login(email.trim(), password), 'login')}
                />
              </View>

              <Text style={s.switcherTitle}>QUICK ACCOUNT SWITCHER</Text>
              <View style={{ gap: 10 }}>
                {DEMO_ACCOUNTS.map((account, index) => (
                  <Animated.View
                    key={account.role}
                    entering={FadeInUp.delay(350 + index * 100).duration(500)}
                  >
                    <Pressable
                      onPress={() => go(() => quickLogin(account.role), account.role)}
                      style={({ pressed }) => [
                        s.switchCard,
                        index === 0 && { backgroundColor: C.brandSoft },
                        index === 1 && { backgroundColor: C.blueSoft },
                        index === 2 && { backgroundColor: C.navy },
                        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
                      ]}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          style={[
                            s.switchLabel,
                            index === 1 && { color: C.blue },
                            index === 2 && { color: C.brandOnDark },
                          ]}
                        >
                          {account.label}
                        </Text>
                        <Text style={[s.switchName, index === 2 && { color: '#FFF' }]}>
                          {account.sub}
                        </Text>
                      </View>
                      <Text style={[s.switchGo, index === 2 && { color: '#8D97AC' }]}>
                        전환 →
                      </Text>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  circleLarge: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  circleSmall: {
    position: 'absolute',
    top: 130,
    right: 40,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  hero: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 36 },
  logoPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  logoText: { fontSize: 15, fontFamily: 'Pretendard-Black', color: C.brand },
  heroTitle: {
    fontSize: 30,
    fontFamily: 'Pretendard-Black',
    color: '#FFF',
    lineHeight: 41,
    marginTop: 26,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 10,
    fontFamily: 'Pretendard-SemiBold',
  },
  sheet: {
    flex: 1,
    backgroundColor: C.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 48,
  },
  sheetTitle: { fontSize: 22, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  sheetSub: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: C.sub, marginTop: 6 },
  errorBox: { backgroundColor: C.redSoft, borderRadius: R.chip, padding: 14 },
  errorText: { color: C.red, fontSize: 13, fontFamily: 'Pretendard-SemiBold' },
  switcherTitle: {
    fontSize: 11,
    fontFamily: 'Pretendard-ExtraBold',
    letterSpacing: 1.2,
    color: C.sub,
    marginTop: 32,
    marginBottom: 12,
  },
  switchCard: {
    borderRadius: R.card,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: { fontSize: 12, fontFamily: 'Pretendard-ExtraBold', color: C.brandDeep },
  switchName: { fontSize: 17, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  switchGo: { fontSize: 13, fontFamily: 'Pretendard-Bold', color: C.sub },
});
