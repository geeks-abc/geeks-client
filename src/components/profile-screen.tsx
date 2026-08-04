import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeader } from '@/components/header';
import { Row } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { C, R } from '@/lib/theme';

// 내 정보 탭 (가게/시설 공용)
export function ProfileScreen() {
  const { me, logout } = useAuth();
  const router = useRouter();

  const profile = me?.store ?? me?.facility;
  const roleLabel = me?.role === 'STORE' ? '음식점' : me?.role === 'FACILITY' ? '복지시설' : '관리자';

  const formatPhone = (digits?: string | null) =>
    digits && /^\d{10,11}$/.test(digits)
      ? digits.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3')
      : (digits ?? '-');

  const signOut = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <HomeHeader />

        <View style={s.profileHead}>
          <View style={s.avatar}>
            <Ionicons
              name={me?.role === 'STORE' ? 'storefront' : 'home'}
              size={26}
              color={C.brand}
            />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={s.name}>{profile?.name ?? me?.nickname ?? '이음 회원'}</Text>
            <View style={s.roleChip}>
              <Text style={s.roleChipText}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>프로필 정보</Text>
        <View style={s.card}>
          <Row label="이름" value={profile?.name ?? '-'} />
          <Row label="주소" value={profile?.address ?? '-'} />
          <Row label="연락처" value={profile?.phone ?? '-'} />
          {me?.phone ? <Row label="가입 번호" value={formatPhone(me.phone)} /> : null}
        </View>

        <Text style={s.sectionTitle}>계정</Text>
        <View style={s.card}>
          <Pressable
            onPress={() => router.push('/verify-identity')}
            style={({ pressed }) => [s.actionRow, pressed && { backgroundColor: C.bg }]}
          >
            <Ionicons name="create-outline" size={20} color={C.text} />
            <Text style={s.editText}>내 정보 수정</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={16} color={C.gray} />
          </Pressable>
          <View style={s.rowDivider} />
          <Pressable
            onPress={signOut}
            style={({ pressed }) => [s.actionRow, pressed && { backgroundColor: C.bg }]}
          >
            <Ionicons name="log-out-outline" size={20} color={C.red} />
            <Text style={s.logoutText}>로그아웃</Text>
          </Pressable>
        </View>

        <Text style={s.footnote}>이음 데모 빌드</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  profileHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 20, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: C.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleChipText: { fontSize: 11.5, fontFamily: 'Pretendard-Bold', color: C.brandDeep },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    color: C.text,
    marginBottom: 10,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: R.card,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  logoutText: { fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: C.red },
  editText: { fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: C.text },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.line },
  footnote: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: C.gray,
    textAlign: 'center',
  },
});
