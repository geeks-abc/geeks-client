import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
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
import Animated, { FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { VerificationCodeInput } from '@/components/verification-code-input';
import { api } from '@/lib/api';
import { API_BASE } from '@/lib/config';
import { homePath, useAuth } from '@/lib/auth';
import { useSafeBack } from '@/lib/navigation';
import { C } from '@/lib/theme';

type Step = 'phone' | 'code' | 'role' | 'info' | 'done';
const STEP_ORDER: Step[] = ['phone', 'code', 'role', 'info'];

const FACILITY_TYPES = ['푸드뱅크', '지역아동센터', '무료급식소'];

const formatPhone = (digits: string) => {
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
};

// 온보딩: 번호 → 인증 → 유형 → 역할별 정보 → 완료
export default function PhoneAuth() {
  const router = useRouter();
  const goBackSafe = useSafeBack();
  const { adoptToken } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [role, setRole] = useState<'STORE' | 'FACILITY' | null>(null);

  // info step
  const [nickname, setNickname] = useState('');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [facilityType, setFacilityType] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcome, setWelcome] = useState({ title: '', sub: '' });

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

  const verify = async (submittedCode = code) => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.phoneVerify(phone, submittedCode);
      if (!res.isNew && res.accessToken) {
        await finish(res.accessToken, false);
      } else if (res.signupToken) {
        setSignupToken(res.signupToken);
        setStep('role');
      }
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('사진 접근 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.5 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const signup = async () => {
    if (!signupToken || !role) return;
    if (!nickname.trim()) {
      setError(role === 'STORE' ? '상호명을 입력해주세요.' : '기관명을 입력해주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let photoUrl: string | undefined;
      if (role === 'STORE' && photoUri) {
        const uploaded = await api.upload(photoUri);
        photoUrl = `${API_BASE}${uploaded.url}`;
      }
      const res = await api.phoneSignup({
        signupToken,
        nickname: nickname.trim(),
        role,
        address: address || undefined,
        contactPhone: contactPhone.trim() || undefined,
        photoUrl,
        facilityType: role === 'FACILITY' ? (facilityType ?? undefined) : undefined,
      });
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
    else if (step === 'role') setStep('code');
    else if (step === 'info') setStep('role');
  };

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {step !== 'done' ? (
          <View style={s.topBar}>
            <Pressable onPress={goBack} hitSlop={12} style={({ pressed }) => pressed && { opacity: 0.6 }}>
              <Ionicons name="chevron-back" size={26} color={C.text} />
            </Pressable>
            <View style={s.progress}>
              {STEP_ORDER.map((name, index) => (
                <View
                  key={name}
                  style={[s.progressDot, index <= stepIndex && s.progressDotActive]}
                />
              ))}
            </View>
            <View style={{ width: 26 }} />
          </View>
        ) : null}

        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          {step === 'phone' ? (
            <Animated.View entering={FadeInRight.duration(320)} style={{ gap: 22 }}>
              <View style={{ gap: 8 }}>
                <Text style={s.title}>안녕하세요!{'\n'}휴대폰 번호로 시작할게요</Text>
                <Text style={s.sub}>계정이 없으면 자동으로 가입 절차가 진행돼요.</Text>
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
              <Button title="인증번호 받기" loading={busy} disabled={phone.length < 10} onPress={requestCode} />
            </Animated.View>
          ) : null}

          {step === 'code' ? (
            <Animated.View entering={FadeInRight.duration(320)} style={{ gap: 22 }}>
              <View style={{ gap: 8 }}>
                <Text style={s.title}>인증번호 6자리를{'\n'}입력해주세요</Text>
                <Text style={s.sub}>{formatPhone(phone)}로 보냈어요.</Text>
              </View>
              <VerificationCodeInput
                value={code}
                onChange={(value) => {
                  setCode(value);
                  setError(null);
                }}
                onComplete={verify}
                error={Boolean(error)}
                disabled={busy}
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
              {busy ? <Text style={s.verifyingText}>인증번호를 확인하고 있어요.</Text> : null}
              <Pressable onPress={requestCode} hitSlop={8}>
                <Text style={s.resend}>인증번호 다시 받기</Text>
              </Pressable>
            </Animated.View>
          ) : null}

          {step === 'role' ? (
            <Animated.View entering={FadeInRight.duration(320)} style={{ gap: 22 }}>
              <View style={{ gap: 8 }}>
                <Text style={s.title}>어떻게{'\n'}이음을 사용하시나요?</Text>
                <Text style={s.sub}>역할에 따라 홈 화면과 기능이 달라져요.</Text>
              </View>
              <View style={{ gap: 12 }}>
                {(
                  [
                    {
                      key: 'STORE',
                      icon: 'storefront' as const,
                      title: '음식점이에요',
                      sub: '남은 식품을 등록하고 이웃 시설과 나눠요',
                    },
                    {
                      key: 'FACILITY',
                      icon: 'home' as const,
                      title: '복지시설이에요',
                      sub: '주변의 나눔을 신청하고 수령해요',
                    },
                  ] as const
                ).map((option) => {
                  const selected = role === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() => setRole(option.key)}
                      style={[s.roleCard, selected && s.roleCardSelected]}
                    >
                      <View style={[s.roleIcon, selected && s.roleIconSelected]}>
                        <Ionicons
                          name={option.icon}
                          size={24}
                          color={selected ? '#FFFFFF' : C.brand}
                        />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={s.roleTitle}>{option.title}</Text>
                        <Text style={s.roleSub}>{option.sub}</Text>
                      </View>
                      <Ionicons
                        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={selected ? C.brand : C.line}
                      />
                    </Pressable>
                  );
                })}
              </View>
              {error ? <Text style={s.errorText}>{error}</Text> : null}
              <Button title="다음" disabled={!role} onPress={() => setStep('info')} />
            </Animated.View>
          ) : null}

          {step === 'info' ? (
            <Animated.View entering={FadeInRight.duration(320)} style={{ gap: 18 }}>
              <View style={{ gap: 8 }}>
                <Text style={s.title}>
                  {role === 'STORE' ? '가게 정보를\n알려주세요' : '기관 정보를\n알려주세요'}
                </Text>
                <Text style={s.sub}>
                  {role === 'STORE'
                    ? '이웃 시설이 보게 될 가게 프로필이에요.'
                    : '나눔을 신청할 때 사용되는 프로필이에요.'}
                </Text>
              </View>

              {role === 'STORE' ? (
                <Pressable onPress={pickPhoto} style={s.photoBox}>
                  {photoUri ? (
                    <>
                      <Image source={{ uri: photoUri }} style={s.photo} transition={150} />
                      <View style={s.photoEdit}>
                        <Text style={s.photoEditText}>사진 변경</Text>
                      </View>
                    </>
                  ) : (
                    <View style={{ alignItems: 'center', gap: 6 }}>
                      <Ionicons name="camera-outline" size={26} color={C.gray} />
                      <Text style={s.photoText}>가게 사진 추가 (선택)</Text>
                    </View>
                  )}
                </Pressable>
              ) : null}

              <Field
                label={role === 'STORE' ? '상호명' : '기관명'}
                value={nickname}
                onChangeText={setNickname}
                placeholder={role === 'STORE' ? '오늘의 빵집' : '행복 지역아동센터'}
              />

              {role === 'FACILITY' ? (
                <View style={{ gap: 8 }}>
                  <Text style={s.label}>기관 유형</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {FACILITY_TYPES.map((type) => {
                      const selected = facilityType === type;
                      return (
                        <Pressable
                          key={type}
                          onPress={() => setFacilityType(type)}
                          style={[s.typeChip, selected && s.typeChipSelected]}
                        >
                          <Text style={[s.typeChipText, selected && s.typeChipTextSelected]}>
                            {type}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              <Field
                label="주소"
                value={address}
                onChangeText={setAddress}
                placeholder="예: 서울 마포구 양화로 45 1층"
              />

              <Field
                label="연락처 (선택)"
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="02-000-0000"
                keyboardType="phone-pad"
              />

              {error ? <Text style={s.errorText}>{error}</Text> : null}
              <Button
                title="이음 시작하기"
                loading={busy}
                disabled={!nickname.trim()}
                onPress={signup}
              />
            </Animated.View>
          ) : null}

          {step === 'done' ? (
            <View style={s.doneWrap}>
              <Animated.View entering={ZoomIn.duration(400)} style={s.doneCheck}>
                <View style={s.doneCheckInner}>
                  <Ionicons name="checkmark" size={36} color="#FFFFFF" />
                </View>
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

function Field(
  props: React.ComponentProps<typeof TextInput> & { label?: string },
) {
  return (
    <View style={{ gap: 8 }}>
      {props.label ? <Text style={s.label}>{props.label}</Text> : null}
      <TextInput placeholderTextColor={C.gray} {...props} style={s.input} />
    </View>
  );
}

const s = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  progress: { flexDirection: 'row', gap: 6 },
  progressDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.graySoft,
  },
  progressDotActive: { backgroundColor: C.brand },
  container: { flexGrow: 1, padding: 24, paddingTop: 14 },
  title: {
    fontSize: 25,
    fontFamily: 'Pretendard-ExtraBold',
    color: C.text,
    lineHeight: 35,
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
  verifyingText: { color: C.brandDeep, fontSize: 12.5, fontFamily: 'Pretendard-SemiBold', textAlign: 'center' },
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
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.line,
    padding: 18,
  },
  roleCardSelected: { borderColor: C.brand, backgroundColor: C.brandSoft },
  roleIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconSelected: { backgroundColor: C.brand },
  roleTitle: { fontSize: 16, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  roleSub: { fontSize: 12.5, fontFamily: 'Pretendard-Regular', color: C.sub },
  label: { fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: C.sub },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15.5,
    fontFamily: 'Pretendard-Regular',
    color: C.text,
  },
  photoBox: {
    height: 150,
    borderRadius: 16,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  photoEdit: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  photoEditText: { color: '#FFF', fontSize: 12, fontFamily: 'Pretendard-Bold' },
  photoText: { fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: C.gray },
  typeChip: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
  },
  typeChipSelected: { backgroundColor: C.brand, borderColor: C.brand },
  typeChipText: { fontSize: 13, fontFamily: 'Pretendard-Bold', color: C.text },
  typeChipTextSelected: { color: '#FFFFFF' },
  errorText: { color: C.red, fontSize: 13, fontFamily: 'Pretendard-SemiBold' },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  doneCheck: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: C.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCheckInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.brand,
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
