import { Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { Role } from '@/lib/api';
import { DEMO_ACCOUNTS, homePath, useAuth } from '@/lib/auth';
import { C, R } from '@/lib/theme';

const FEATURES = [
  { icon: '⏱️', title: '30초 등록', sub: '마감 전 남은 식품을 사진 한 장으로' },
  { icon: '📍', title: '반경 자동 매칭', sub: '3km 안의 복지시설과 바로 연결' },
  { icon: '📄', title: '기부확인서 발급', sub: 'QR 인수 확인 후 PDF까지 원스톱' },
];

// 랜딩 — 첫 진입 화면 (로그인 상태면 홈으로)
export default function Landing() {
  const router = useRouter();
  const { me, loading, quickLogin } = useAuth();
  const [debugOpen, setDebugOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!loading && me) return <Redirect href={homePath(me.role)} />;

  const enterDemo = async (role: Role) => {
    setBusy(role);
    setError(null);
    try {
      const profile = await quickLogin(role);
      setDebugOpen(false);
      router.replace(homePath(profile.role));
    } catch (e) {
      setError(e instanceof Error ? e.message : '전환에 실패했어요.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView contentContainerStyle={s.container} bounces={false}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={s.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(600)} style={{ gap: 10 }}>
          <Text style={s.headline}>
            버려질 음식이{'\n'}필요한 곳에 <Text style={{ color: C.brand }}>닿도록</Text>
          </Text>
          <Text style={s.subline}>
            소상공인의 남은 식품과 복지시설을{'\n'}가장 빠르게 잇는 방법, 이음
          </Text>
        </Animated.View>

        <View style={{ gap: 12, marginTop: 36 }}>
          {FEATURES.map((feature, index) => (
            <Animated.View
              key={feature.title}
              entering={FadeInUp.delay(250 + index * 100).duration(500)}
              style={s.featureRow}
            >
              <View style={s.featureIcon}>
                <Text style={{ fontSize: 20 }}>{feature.icon}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.featureTitle}>{feature.title}</Text>
                <Text style={s.featureSub}>{feature.sub}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={FadeInUp.delay(550).duration(500)} style={{ gap: 6 }}>
          <Button title="시작하기" onPress={() => router.push('/phone-auth')} />
          <Pressable onPress={() => setDebugOpen(true)} hitSlop={12} style={s.devButton}>
            <Text style={s.devButtonText}>개발자 모드</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

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
                  onPress={() => enterDemo(account.role)}
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
            {error ? <Text style={s.errorText}>{error}</Text> : null}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 28 },
  logo: { width: 150, height: 75, marginLeft: -12 },
  headline: {
    fontSize: 30,
    fontFamily: 'Pretendard-Black',
    color: C.text,
    lineHeight: 42,
    marginTop: 8,
  },
  subline: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: C.sub,
    lineHeight: 21,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.bg,
    borderRadius: R.card,
    padding: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { fontSize: 15, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  featureSub: { fontSize: 12.5, fontFamily: 'Pretendard-Regular', color: C.sub },
  devButton: { alignSelf: 'center', paddingVertical: 12 },
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
  errorText: {
    color: C.red,
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
    marginTop: 12,
  },
});
