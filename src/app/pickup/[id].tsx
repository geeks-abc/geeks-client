import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { BackButton } from '@/components/back-button';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { fmtTime, remainingLabel, usePolling } from '@/lib/hooks';
import { C, R } from '@/lib/theme';

// S-05 매칭 상세 (시설) — 가게 정보와 픽업 안내를 우선 보여주는 거래형 화면
export default function PickupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const matchId = Number(id);
  const [qrOpen, setQrOpen] = useState(false);
  const { data: match } = usePolling(() => api.match(matchId), 5000);
  const store = match?.listing?.store;
  const directCode = match?.qrToken.replace(/\D/g, '').padEnd(6, '0').slice(0, 6) ?? '';

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.screen}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.hero}>
            {match?.listing?.photoUrl ? (
              <Image source={{ uri: match.listing.photoUrl }} style={s.heroImage} />
            ) : (
              <View style={s.heroFallback}>
                <Ionicons name="fast-food-outline" size={72} color="#FFFFFF" />
                <Text style={s.heroFallbackLabel}>PICKUP FOOD</Text>
              </View>
            )}
            <View style={s.backButton}>
              <BackButton />
            </View>
          </View>

          <Pressable
            disabled={!store}
            onPress={() => store && router.push(`/store-detail/${store.id}`)}
            style={({ pressed }) => [s.storeRow, pressed && { opacity: 0.7 }]}
          >
            <View style={s.storeAvatar}>
              <Text style={s.storeAvatarText}>{store?.name?.slice(0, 1) ?? '가'}</Text>
            </View>
            <View style={s.storeInfo}>
              <Text style={s.storeName}>{store?.name ?? '나눔 가게'}</Text>
              <Text numberOfLines={1} style={s.storeAddress}>{store?.address ?? '가게 위치 확인'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.gray} />
          </Pressable>

          <View style={s.divider} />

          <View style={s.titleSection}>
            <View style={s.titleTopRow}>
              <Text style={s.category}>식품 나눔</Text>
              <View style={s.statusChip}>
                <Text style={s.statusText}>픽업 예정</Text>
              </View>
            </View>
            <Text style={s.title}>{match?.listing?.itemName ?? '기부 식품'}</Text>
            <Text style={s.meta}>
              총 {match?.listing?.quantity ?? '-'}개
              {match?.listing ? ` · ${remainingLabel(match.listing.pickupEnd)}` : ''}
            </Text>
          </View>

          <View style={s.pickupCard}>
            <View style={s.pickupIcon}>
              <Ionicons name="time-outline" size={24} color="#E86618" />
            </View>
            <View style={s.pickupText}>
              <Text style={s.pickupTitle}>픽업 안내</Text>
              <Text style={s.pickupTime}>
                {match?.listing ? `${fmtTime(match.listing.pickupStart)} - ${fmtTime(match.listing.pickupEnd)}` : '-'}
              </Text>
              <Text style={s.pickupSub}>픽업 시간 안에 가게를 방문해주세요.</Text>
            </View>
          </View>

          <View style={s.descriptionSection}>
            <Text style={s.descriptionTitle}>가게 정보</Text>
            <Text style={s.description}>
              {store?.name ?? '가게'}에서 픽업할 식품이에요. 방문 전 필요한 사항은 가게에 연락해 확인해주세요.
            </Text>
          </View>

          <View style={s.infoList}>
            <InfoRow icon="location-outline" label="픽업 장소" value={store?.address ?? '-'} />
            <InfoRow icon="call-outline" label="연락처" value={store?.phone ?? '-'} />
          </View>
        </ScrollView>

        <View style={s.actionBar}>
          <Button title="시설 QR 보여주기" onPress={() => setQrOpen(true)} style={s.qrButton} />
          <Pressable
            accessibilityLabel="가게에 전화하기"
            disabled={!store?.phone}
            onPress={() => store?.phone && Linking.openURL(`tel:${store.phone}`)}
            style={({ pressed }) => [s.callButton, !store?.phone && s.disabledButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="call" size={23} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <Modal visible={qrOpen} animationType="slide" onRequestClose={() => setQrOpen(false)}>
        <SafeAreaView style={s.qrScreen} edges={['top', 'bottom']}>
          <Text style={s.qrLogo}>이음</Text>
          <Text style={s.qrTitle}>가게 담당자에게{`\n`}이 QR을 보여주세요.</Text>
          <Text style={s.qrSub}>가게에서 스캔하면 전달 최종 확인으로 이어집니다.</Text>
          {match ? (
            <View style={s.qrCard}>
              <QRCode value={JSON.stringify({ matchId: match.id, qrToken: match.qrToken })} size={220} color={C.navy} />
              <Text style={s.qrItemName}>{match.listing?.itemName ?? '기부 식품'}</Text>
              <Text style={s.qrHint}>QR 스캔이 어려우면 아래 코드를 알려주세요.</Text>
              <Text style={s.directCode}>{directCode}</Text>
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          <Button title="닫기" variant="ghost" onPress={() => setQrOpen(false)} />
        </SafeAreaView>
      </Modal>
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
  content: { paddingBottom: 36 },
  hero: { height: 300, backgroundColor: '#F5A167', overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  heroFallback: { flex: 1, backgroundColor: '#F39A55', alignItems: 'center', justifyContent: 'center', gap: 10 },
  heroFallbackLabel: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Pretendard-ExtraBold', letterSpacing: 1.4 },
  backButton: { position: 'absolute', top: 16, left: 20 },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 20 },
  storeAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0DB' },
  storeAvatarText: { color: '#E86618', fontSize: 18, fontFamily: 'Pretendard-ExtraBold' },
  storeInfo: { flex: 1, gap: 3 },
  storeName: { color: C.text, fontSize: 16, fontFamily: 'Pretendard-ExtraBold' },
  storeAddress: { color: C.sub, fontSize: 13, fontFamily: 'Pretendard-Regular' },
  divider: { height: 1, backgroundColor: C.line, marginHorizontal: 20 },
  titleSection: { paddingHorizontal: 20, paddingTop: 24, gap: 7 },
  titleTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  category: { color: C.sub, fontSize: 14, fontFamily: 'Pretendard-SemiBold' },
  statusChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#FFF0DB' },
  statusText: { color: '#E86618', fontSize: 12, fontFamily: 'Pretendard-ExtraBold' },
  title: { color: C.text, fontSize: 26, fontFamily: 'Pretendard-Black', letterSpacing: -0.8 },
  meta: { color: C.sub, fontSize: 13, fontFamily: 'Pretendard-Regular' },
  pickupCard: { margin: 20, marginBottom: 8, borderRadius: 18, backgroundColor: '#FFF5EC', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  pickupIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFE4CB', alignItems: 'center', justifyContent: 'center' },
  pickupText: { flex: 1, gap: 3 },
  pickupTitle: { color: '#A9470D', fontSize: 14, fontFamily: 'Pretendard-ExtraBold' },
  pickupTime: { color: C.text, fontSize: 18, fontFamily: 'Pretendard-ExtraBold' },
  pickupSub: { color: '#8E725F', fontSize: 12.5, fontFamily: 'Pretendard-Regular' },
  descriptionSection: { paddingHorizontal: 20, paddingTop: 22, gap: 10 },
  descriptionTitle: { color: C.text, fontSize: 16, fontFamily: 'Pretendard-ExtraBold' },
  description: { color: '#525B64', fontSize: 15, fontFamily: 'Pretendard-Regular', lineHeight: 23 },
  infoList: { marginTop: 24, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, paddingHorizontal: 20 },
  infoRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { color: C.sub, fontSize: 14, fontFamily: 'Pretendard-Regular' },
  infoValue: { flex: 1, color: C.text, fontSize: 14, fontFamily: 'Pretendard-SemiBold', textAlign: 'right' },
  qrScreen: { flex: 1, backgroundColor: C.navy, padding: 24 },
  qrLogo: { color: '#FFD21D', fontSize: 25, fontFamily: 'Pretendard-Black' },
  qrTitle: { color: '#FFFFFF', fontSize: 27, lineHeight: 36, fontFamily: 'Pretendard-Black', marginTop: 42 },
  qrSub: { color: '#AEB7C5', fontSize: 13, fontFamily: 'Pretendard-Regular', marginTop: 10 },
  qrCard: { backgroundColor: '#FFFFFF', borderRadius: 24, alignItems: 'center', padding: 24, marginTop: 38 },
  qrItemName: { color: C.navy, fontSize: 17, fontFamily: 'Pretendard-ExtraBold', marginTop: 20 },
  qrHint: { color: C.sub, fontSize: 12, fontFamily: 'Pretendard-Regular', marginTop: 18 },
  directCode: { color: C.navy, fontSize: 30, fontFamily: 'Pretendard-Black', letterSpacing: 5, marginTop: 6 },
  actionBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: C.line },
  qrButton: { flex: 1, backgroundColor: '#FF6F0F' },
  callButton: { width: 54, height: 54, borderRadius: R.button, backgroundColor: '#FF6F0F', alignItems: 'center', justifyContent: 'center' },
  disabledButton: { backgroundColor: C.gray },
});
