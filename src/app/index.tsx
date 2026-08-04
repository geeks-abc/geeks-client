import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Field } from '@/components/ui';
import { DEMO_ACCOUNTS, homePath, useAuth } from '@/lib/auth';
import { C, R } from '@/lib/theme';

// A-00 로그인 + D-00 데모 계정 전환
export default function Login() {
  const router = useRouter();
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('store@demo.com');
  const [password, setPassword] = useState('password123');
  const [busy, setBusy] = useState<string | null>(null);

  const go = async (task: () => Promise<{ role: 'STORE' | 'FACILITY' | 'ADMIN' }>, key: string) => {
    setBusy(key);
    try {
      const me = await task();
      router.replace(homePath(me.role));
    } catch (e) {
      Alert.alert('로그인 실패', e instanceof Error ? e.message : '다시 시도해주세요.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.yellow }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={s.hero}>
            <Text style={s.logo}>이음</Text>
            <Text style={s.heroTitle}>버려질 음식이{'\n'}필요한 곳에 닿도록</Text>
            <Text style={s.heroSub}>소상공인과 복지시설을 빠르게 연결합니다.</Text>
          </View>

          <View style={s.sheet}>
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
              <Field label="비밀번호" value={password} onChangeText={setPassword} secureTextEntry />
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
                <Pressable
                  key={account.role}
                  onPress={() => go(() => quickLogin(account.role), account.role)}
                  style={({ pressed }) => [
                    s.switchCard,
                    index === 0 && { backgroundColor: C.yellow },
                    index === 1 && { backgroundColor: C.greenSoft },
                    index === 2 && { backgroundColor: C.navy },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={[s.switchLabel, index === 2 && { color: C.yellow }]}>
                    {account.label}
                  </Text>
                  <Text style={[s.switchName, index === 2 && { color: '#FFF' }]}>{account.sub}</Text>
                  <Text style={[s.switchGo, index === 2 && { color: '#C7CEDB' }]}>
                    이 계정으로 전환 →
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hero: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  logo: { fontSize: 20, fontFamily: 'Pretendard-Black', color: C.navy },
  heroTitle: { fontSize: 30, fontFamily: 'Pretendard-Black', color: C.navy, lineHeight: 40, marginTop: 24 },
  heroSub: { fontSize: 14, color: '#6B6300', marginTop: 10, fontFamily: 'Pretendard-SemiBold' },
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
  switcherTitle: {
    fontSize: 11,
    fontFamily: 'Pretendard-ExtraBold',
    letterSpacing: 1.2,
    color: C.sub,
    marginTop: 32,
    marginBottom: 12,
  },
  switchCard: { borderRadius: R.card, padding: 18, gap: 2 },
  switchLabel: { fontSize: 12, fontFamily: 'Pretendard-ExtraBold', color: '#6B6300' },
  switchName: { fontSize: 17, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  switchGo: { fontSize: 12, fontFamily: 'Pretendard-SemiBold', color: '#6B7684', marginTop: 6 },
});
