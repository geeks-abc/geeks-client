import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Image,
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
import {
  buildSlots,
  nextSlotAfter,
  slotLabel,
  TimeSlotModal,
} from '@/components/time-picker';
import { Button, Headline } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { API_BASE } from '@/lib/config';
import { C, R } from '@/lib/theme';

// S-02 품목 등록 — "30초면 등록 끝!"
export default function NewListing() {
  const router = useRouter();
  const { me } = useAuth();

  // 화면 진입 시각 기준으로 슬롯 고정 (현재 시각 다음 5분 경계부터, 6시간 범위)
  const firstSlot = useMemo(() => nextSlotAfter(new Date()), []);
  const startSlots = useMemo(() => buildSlots(firstSlot, 72), [firstSlot]);

  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pickupStart, setPickupStart] = useState<Date>(firstSlot);
  const [pickupEnd, setPickupEnd] = useState<Date>(
    () => new Date(firstSlot.getTime() + 60 * 60000), // 기본: 시작 + 1시간
  );
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState<'start' | 'end' | null>(null);

  // 종료 슬롯은 항상 시작 이후 5분부터 (6시간 범위)
  const endSlots = useMemo(
    () => buildSlots(new Date(pickupStart.getTime() + 5 * 60000), 72),
    [pickupStart],
  );

  const selectStart = (slot: Date) => {
    setPickupStart(slot);
    // 종료가 시작보다 빠르거나 같아지면 시작 + 1시간으로 보정
    if (pickupEnd.getTime() <= slot.getTime()) {
      setPickupEnd(new Date(slot.getTime() + 60 * 60000));
    }
  };

  const pickPhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('사진 접근 권한이 필요해요. 설정에서 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.5,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const submit = async () => {
    setError(null);
    if (!me?.storeId) {
      setError('가게 계정으로 로그인해주세요.');
      return;
    }
    if (!itemName.trim()) {
      setError('품목명을 입력해주세요.');
      return;
    }
    const qty = Number(quantity);
    if (!quantity.trim() || !Number.isInteger(qty) || qty < 1) {
      setError('수량은 1 이상의 숫자로 입력해주세요.');
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
        quantity: qty,
        photoUrl,
        pickupStart: pickupStart.toISOString(),
        pickupEnd: pickupEnd.toISOString(),
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : '등록에 실패했어요. 다시 시도해주세요.');
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
        <ScrollView
          contentContainerStyle={{ padding: 24, gap: 18 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.eyebrow}>30초면 충분해요</Text>
          <Headline>{'오늘 남은 식품,\n버리지 말고 나눠요'}</Headline>

          <Pressable onPress={pickPhoto} style={s.photoBox}>
            {photoUri ? (
              <>
                <Image source={{ uri: photoUri }} style={s.photo} />
                <View style={s.photoEdit}>
                  <Text style={s.photoEditText}>사진 변경</Text>
                </View>
              </>
            ) : (
              <Text style={s.photoText}>+ 음식 사진 추가 (선택)</Text>
            )}
          </Pressable>
          {photoUri ? (
            <Pressable onPress={() => setPhotoUri(null)}>
              <Text style={s.photoRemove}>사진 제거</Text>
            </Pressable>
          ) : null}

          <View style={{ gap: 8 }}>
            <Text style={s.label}>품목명</Text>
            <Pressable style={s.inputWrap}>
              <TextInputBox
                value={itemName}
                onChangeText={setItemName}
                placeholder="소보로빵 외 3종"
              />
            </Pressable>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={s.label}>수량</Text>
            <TextInputBox
              value={quantity}
              onChangeText={(t: string) => setQuantity(t.replace(/[^0-9]/g, ''))}
              placeholder="18"
              keyboardType="number-pad"
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={s.label}>픽업 시작</Text>
              <Pressable style={s.timeButton} onPress={() => setPicker('start')}>
                <Text style={s.timeText}>{slotLabel(pickupStart)}</Text>
                <Text style={s.timeCaret}>▾</Text>
              </Pressable>
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={s.label}>픽업 종료</Text>
              <Pressable style={s.timeButton} onPress={() => setPicker('end')}>
                <Text style={s.timeText}>{slotLabel(pickupEnd)}</Text>
                <Text style={s.timeCaret}>▾</Text>
              </Pressable>
            </View>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button title="이웃에게 나눔 알리기" loading={busy} onPress={submit} />
          <Button title="다음에 할게요" variant="ghost" onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>

      <TimeSlotModal
        visible={picker === 'start'}
        title="픽업 시작 시간"
        slots={startSlots}
        selected={pickupStart}
        onSelect={selectStart}
        onClose={() => setPicker(null)}
      />
      <TimeSlotModal
        visible={picker === 'end'}
        title="픽업 종료 시간"
        slots={endSlots}
        selected={pickupEnd}
        onSelect={setPickupEnd}
        onClose={() => setPicker(null)}
      />
    </SafeAreaView>
  );
}

// 내부 전용 얇은 인풋 래퍼
function TextInputBox(props: TextInputProps) {
  return <TextInput placeholderTextColor={C.gray} {...props} style={s.input} />;
}

const s = StyleSheet.create({
  eyebrow: { fontSize: 13, fontFamily: 'Pretendard-ExtraBold', color: C.brandDeep },
  photoBox: {
    height: 180,
    borderRadius: R.card,
    backgroundColor: '#A98963',
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
  photoText: { color: '#FFF', fontFamily: 'Pretendard-Bold', fontSize: 13 },
  photoRemove: { color: C.sub, fontSize: 12, fontFamily: 'Pretendard-Regular', textAlign: 'right', marginTop: -10 },
  label: { fontSize: 13, color: C.sub, fontFamily: 'Pretendard-SemiBold' },
  inputWrap: {},
  input: {
    backgroundColor: C.card,
    borderRadius: R.chip,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16, fontFamily: 'Pretendard-Regular',
    color: C.text,
  },
  timeButton: {
    backgroundColor: C.card,
    borderRadius: R.chip,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: C.text },
  timeCaret: { color: C.sub, fontSize: 12, fontFamily: 'Pretendard-Regular' },
  errorBox: {
    backgroundColor: C.redSoft,
    borderRadius: R.chip,
    padding: 14,
  },
  errorText: { color: C.red, fontSize: 13, fontFamily: 'Pretendard-SemiBold' },
});
