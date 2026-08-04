import { Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { notify } from '@/lib/feedback';
import { useSafeBack } from '@/lib/navigation';
import { isVerified } from '@/lib/verify';
import { C } from '@/lib/theme';

// 마이페이지 정보 수정 — 본인 확인(verify-identity) 통과 후에만 진입
export default function EditProfile() {
  const router = useRouter();
  const goBackSafe = useSafeBack();
  const { me, refresh } = useAuth();

  const profile = me?.store ?? me?.facility;
  const [name, setName] = useState(profile?.name ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 본인 확인 안 거치고 직접 진입하면 게이트로
  if (!isVerified()) return <Redirect href="/verify-identity" />;

  const save = async () => {
    if (!name.trim()) {
      setError(me?.role === 'STORE' ? '상호명을 입력해주세요.' : '기관명을 입력해주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.updateProfile({
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      await refresh();
      notify.success('내 정보를 수정했어요');
      goBackSafe();
    } catch (e) {
      setError(e instanceof Error ? e.message : '수정에 실패했어요.');
      notify.error('수정 실패', e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const nameLabel = me?.role === 'STORE' ? '상호명' : '기관명';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
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
          <Text style={s.navTitle}>내 정보 수정</Text>
          <View style={{ width: 26 }} />
        </View>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

          <Field label={nameLabel} value={name} onChangeText={setName} placeholder={nameLabel} />
          <Field label="주소" value={address} onChangeText={setAddress} placeholder="서울 마포구 …" />
          <Field
            label="연락처"
            value={phone}
            onChangeText={setPhone}
            placeholder="02-000-0000"
            keyboardType="phone-pad"
          />

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button title="저장하기" loading={busy} onPress={save} />
          <Button title="취소" variant="danger" onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field(props: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>{props.label}</Text>
      <TextInput placeholderTextColor={C.gray} {...props} style={s.input} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: 24, paddingTop: 12, gap: 16 },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navTitle: { fontSize: 17, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  label: { fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: C.sub },
  input: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
    color: C.text,
  },
  errorBox: { backgroundColor: C.redSoft, borderRadius: 12, padding: 14 },
  errorText: { color: C.red, fontSize: 13, fontFamily: 'Pretendard-SemiBold' },
});
