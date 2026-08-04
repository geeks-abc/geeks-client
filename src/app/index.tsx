import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
import { Role } from '@/lib/api';
import { C, R } from '@/lib/theme';

// A-00 로그인 (데모 계정 전환은 하단 '개발자 모드'로 분리)
export default function Login() {
  const router = useRouter();
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);

  const go = async (task: () => Promise<{ role: Role }>, key: string) => {
    setBusy(key);
    setError(null);
    try {
      const me = await task();
      setDebugOpen(false);
      router.replace(homePath(me.role));
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인에 실패했어요. 다시 시도해주세요.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.container}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <Animated.View entering={FadeInDown.duration(500)} style={s.brandArea}>
            <View style={s.logoMark}>
              <Text style={s.logoMarkText}>이음</Text>
            </View>
            <Text style={s.headline}>
              버려질 음식이{'\n'}필요한 곳에 <Text style={{ color: C.brand }}>닿도록</Text>
            </Text>
            <Text style={s.subline}>소상공인과 복지시설을 잇는 가장 빠른 방법</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(150).duration(500)} style={s.form}>
            <Field
              label="이메일"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            {error ? (
              <Animated.View entering={FadeInDown.duration(250)} style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            <Button
              title="로그인"
              loading={busy === 'login'}
              disabled={!email.trim() || !password}
              onPress={() => go(() => login(email.trim(), password), 'login')}
            />
          </Animated.View>

          <View style={{ flex: 1 }} />

          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            <Pressable onPress={() => setDebugOpen(true)} hitSlop={12} style={s.devButton}>
              <Text style={s.devButtonText}>개발자 모드</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 디버그: 데모 계정 빠른 전환 */}
      <Modal
        visible={debugOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDebugOpen(false)}
      >
        <Pressable style={s.backdrop} onPress={() => setDebugOpen(false)}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>개발자 모드</Text>
            <Text style={s.sheetSub}>시딩된 데모 계정으로 바로 전환합니다.</Text>
            <View style={{ gap: 10, marginTop: 16 }}>
              {DEMO_ACCOUNTS.map((account) => (
                <Pressable
                  key={account.role}
                  onPress={() => go(() => quickLogin(account.role), account.role)}
                  style={({ pressed }) => [s.demoRow, pressed && { opacity: 0.7 }]}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.demoLabel}>{account.label}</Text>
                    <Text style={s.demoName}>{account.sub}</Text>
                  </View>
                  <Text style={s.demoGo}>{busy === account.role ? '전환 중…' : '전환 →'}</Text>
                </Pressable>
              ))}
            </View>
            {error ? <Text style={[s.errorText, { marginTop: 12 }]}>{error}</Text> : null}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 40 },
  brandArea: { gap: 14 },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMarkText: { color: '#FFF', fontSize: 15, fontFamily: 'Pretendard-Black' },
  headline: {
    fontSize: 30,
    fontFamily: 'Pretendard-Black',
    color: C.text,
    lineHeight: 42,
    marginTop: 14,
  },
  subline: { fontSize: 14, fontFamily: 'Pretendard-Regular', color: C.sub },
  form: { gap: 14, marginTop: 36 },
  errorBox: { backgroundColor: C.redSoft, borderRadius: R.chip, padding: 14 },
  errorText: { color: C.red, fontSize: 13, fontFamily: 'Pretendard-SemiBold' },
  devButton: { alignSelf: 'center', paddingVertical: 14 },
  devButtonText: { fontSize: 12, fontFamily: 'Pretendard-SemiBold', color: C.gray },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 44,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.gray,
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  sheetSub: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: C.sub, marginTop: 4 },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: R.card,
    borderWidth: 1,
    borderColor: C.line,
    padding: 16,
  },
  demoLabel: { fontSize: 11, fontFamily: 'Pretendard-ExtraBold', color: C.brandDeep },
  demoName: { fontSize: 15, fontFamily: 'Pretendard-Bold', color: C.text },
  demoGo: { fontSize: 13, fontFamily: 'Pretendard-Bold', color: C.brand },
});
