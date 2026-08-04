import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, Headline } from '@/components/ui';
import { api } from '@/lib/api';
import { API_BASE } from '@/lib/config';
import { useAuth } from '@/lib/auth';
import { C, R } from '@/lib/theme';

// S-02 품목 등록 — "30초면 등록 끝!"
export default function NewListing() {
  const router = useRouter();
  const { me } = useAuth();
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [startTime, setStartTime] = useState('19:30');
  const [endTime, setEndTime] = useState('20:30');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const toIso = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    // 픽업 시간이 이미 지난 경우 내일로 (데모 편의)
    if (d.getTime() < Date.now() - 60 * 1000) d.setDate(d.getDate() + 1);
    return d.toISOString();
  };

  const submit = async () => {
    if (!me?.storeId) return;
    if (!itemName.trim() || !quantity.trim()) {
      Alert.alert('입력 확인', '품목명과 수량을 입력해주세요.');
      return;
    }
    setBusy(true);
    try {
      let photoUrl: string | undefined;
      if (photoUri) {
        const uploaded = await api.upload(photoUri);
        photoUrl = `${API_BASE}${uploaded.url}`;
      }
      await api.createListing({
        storeId: me.storeId,
        itemName: itemName.trim(),
        quantity: Number(quantity),
        photoUrl,
        pickupStart: toIso(startTime),
        pickupEnd: toIso(endTime),
      });
      router.back();
    } catch (e) {
      Alert.alert('등록 실패', e instanceof Error ? e.message : '다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }} keyboardShouldPersistTaps="handled">
          <Text style={s.eyebrow}>30초면 등록 끝!</Text>
          <Headline>{'오늘 남은 식품을\n빠르게 등록하세요.'}</Headline>

          <Pressable onPress={pickPhoto} style={s.photoBox}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%', borderRadius: R.card }} />
            ) : (
              <Text style={s.photoText}>+ 음식 사진 추가 (선택)</Text>
            )}
          </Pressable>

          <Field label="품목명" placeholder="소보로빵 외 3종" value={itemName} onChangeText={setItemName} />
          <Field
            label="수량"
            placeholder="18"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="픽업 시작" value={startTime} onChangeText={setStartTime} placeholder="19:30" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="픽업 종료" value={endTime} onChangeText={setEndTime} placeholder="20:30" />
            </View>
          </View>

          <Button title="OPEN 상태로 등록" variant="dark" loading={busy} onPress={submit} />
          <Button title="닫기" variant="ghost" onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  eyebrow: { fontSize: 13, fontWeight: '800', color: '#B4950A' },
  photoBox: {
    height: 180,
    borderRadius: R.card,
    backgroundColor: '#A98963',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
});
