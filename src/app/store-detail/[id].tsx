import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/back-button';
import { api } from '@/lib/api';
import { usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';

// 가게 상세 — 픽업 전 위치와 연락처를 확인하는 가게 프로필
export default function StoreDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const storeId = Number(id);
  const { data: store } = usePolling(() => api.store(storeId), 5000, [storeId]);

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.screen}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.hero}>
            <View style={s.backButton}><BackButton /></View>
            <View style={s.heroIcon}>
              <Ionicons name="storefront-outline" size={44} color="#FFFFFF" />
            </View>
            <Text style={s.heroLabel}>FOOD SHARE STORE</Text>
          </View>

          <View style={s.profileSection}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{store?.name?.slice(0, 1) ?? '가'}</Text>
            </View>
            <Text style={s.name}>{store?.name ?? '가게 정보를 불러오는 중'}</Text>
            <Text style={s.category}>식품 나눔 가게</Text>
          </View>

          <View style={s.divider} />

          <View style={s.introSection}>
            <Text style={s.sectionTitle}>가게 소개</Text>
            <Text style={s.intro}>
              남은 식품을 필요한 이웃에게 나누는 가게예요. 픽업 시간에 맞춰 방문해주세요.
            </Text>
          </View>

          <View style={s.infoList}>
            <InfoRow icon="location-outline" label="주소" value={store?.address ?? '-'} />
            <InfoRow icon="call-outline" label="연락처" value={store?.phone ?? '-'} />
          </View>

          <View style={s.noticeBox}>
            <Ionicons name="information-circle-outline" size={20} color="#A9470D" />
            <Text style={s.noticeText}>픽업 전 문의가 필요하면 가게에 전화해주세요.</Text>
          </View>
        </ScrollView>

        <View style={s.actionBar}>
          <Pressable
            accessibilityLabel="가게에 전화하기"
            disabled={!store?.phone}
            onPress={() => store?.phone && Linking.openURL(`tel:${store.phone}`)}
            style={({ pressed }) => [s.callButton, !store?.phone && s.disabledButton, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="call" size={21} color="#FFFFFF" />
            <Text style={s.callButtonText}>가게에 전화하기</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: 'location-outline' | 'call-outline'; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Ionicons name={icon} size={20} color={C.sub} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text numberOfLines={1} style={s.infoValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingBottom: 38 },
  hero: { height: 244, backgroundColor: '#F39A55', alignItems: 'center', justifyContent: 'center', gap: 10 },
  backButton: { position: 'absolute', top: 16, left: 20 },
  heroIcon: { width: 82, height: 82, borderRadius: 41, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroLabel: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Pretendard-ExtraBold', letterSpacing: 1.2 },
  profileSection: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24, gap: 5 },
  avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFF0DB', alignItems: 'center', justifyContent: 'center', marginTop: -58, borderWidth: 4, borderColor: '#FFFFFF' },
  avatarText: { color: '#E86618', fontSize: 25, fontFamily: 'Pretendard-ExtraBold' },
  name: { color: C.text, fontSize: 22, fontFamily: 'Pretendard-Black', marginTop: 7 },
  category: { color: C.sub, fontSize: 13, fontFamily: 'Pretendard-Regular' },
  divider: { height: 1, backgroundColor: C.line, marginHorizontal: 20 },
  introSection: { paddingHorizontal: 20, paddingTop: 26, gap: 10 },
  sectionTitle: { color: C.text, fontSize: 16, fontFamily: 'Pretendard-ExtraBold' },
  intro: { color: '#525B64', fontSize: 15, lineHeight: 23, fontFamily: 'Pretendard-Regular' },
  infoList: { marginTop: 24, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, paddingHorizontal: 20 },
  infoRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { color: C.sub, fontSize: 14, fontFamily: 'Pretendard-Regular' },
  infoValue: { flex: 1, color: C.text, fontSize: 14, fontFamily: 'Pretendard-SemiBold', textAlign: 'right' },
  noticeBox: { margin: 20, marginBottom: 0, borderRadius: 16, backgroundColor: '#FFF5EC', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 9 },
  noticeText: { flex: 1, color: '#8E725F', fontSize: 12.5, fontFamily: 'Pretendard-Regular' },
  actionBar: { padding: 20, borderTopWidth: 1, borderColor: C.line, backgroundColor: '#FFFFFF' },
  callButton: { minHeight: 54, borderRadius: R.button, backgroundColor: '#FF6F0F', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  callButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Pretendard-ExtraBold' },
  disabledButton: { backgroundColor: C.gray },
});
