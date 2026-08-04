import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { buildSlots, nextSlotAfter, slotLabel, TimeSlotModal } from '@/components/time-picker';
import { api, Listing } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { API_BASE } from '@/lib/config';
import { useSafeBack } from '@/lib/navigation';

const DRAFT_KEY = 'ieum:new-listing-draft:v1';

const P = {
  outer: '#E7E7E3',
  surface: '#F9F9F5',
  white: '#FFFFFF',
  yellow: '#FFCF14',
  orange: '#FF9740',
  navy: '#051224',
  sub: '#6B7078',
  line: '#DDE1DF',
  red: '#B42318',
  redSoft: '#FEECEB',
};

type Mode = 'create' | 'edit';

export function ListingFormScreen({ mode, listingId }: { mode: Mode; listingId?: number }) {
  const goBackSafe = useSafeBack();
  const { me } = useAuth();
  const firstSlot = useMemo(() => nextSlotAfter(new Date()), []);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(mode === 'edit' && Boolean(listingId));
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pickupStart, setPickupStart] = useState(firstSlot);
  const [pickupEnd, setPickupEnd] = useState(() => new Date(firstSlot.getTime() + 60 * 60000));
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [picker, setPicker] = useState<'start' | 'end' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    mode === 'edit' && !listingId
      ? '\uC218\uC815\uD560 \uD488\uBAA9\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.'
      : null,
  );
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'create') {
      AsyncStorage.getItem(DRAFT_KEY)
        .then((raw) => {
          if (!raw) return;
          const draft = JSON.parse(raw) as {
            itemName?: string;
            quantity?: string;
            pickupStart?: string;
            pickupEnd?: string;
            photoUri?: string | null;
          };
          if (draft.itemName) setItemName(draft.itemName);
          if (draft.quantity) setQuantity(draft.quantity);
          if (draft.pickupStart) setPickupStart(new Date(draft.pickupStart));
          if (draft.pickupEnd) setPickupEnd(new Date(draft.pickupEnd));
          if (draft.photoUri) setPhotoUri(draft.photoUri);
        })
        .catch(() => undefined);
      return;
    }

    if (!listingId) return;

    api.listing(listingId)
      .then((data) => {
        setListing(data);
        setItemName(data.itemName);
        setQuantity(String(data.quantity));
        setPickupStart(new Date(data.pickupStart));
        setPickupEnd(new Date(data.pickupEnd));
        setPhotoUri(data.photoUrl ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : '품목을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [listingId, mode]);

  const startSlots = useMemo(() => buildSlots(firstSlot, 72), [firstSlot]);
  const endSlots = useMemo(
    () => buildSlots(new Date(pickupStart.getTime() + 5 * 60000), 72),
    [pickupStart],
  );

  const chooseStart = (slot: Date) => {
    setPickupStart(slot);
    if (pickupEnd.getTime() <= slot.getTime()) {
      setPickupEnd(new Date(slot.getTime() + 60 * 60000));
    }
  };

  const pickPhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('사진 접근 권한이 필요합니다. 설정에서 사진 권한을 허용해 주세요.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const saveDraft = async () => {
    await AsyncStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        itemName,
        quantity,
        pickupStart: pickupStart.toISOString(),
        pickupEnd: pickupEnd.toISOString(),
        photoUri,
      }),
    );
    setNotice('임시 저장했습니다.');
    setTimeout(() => setNotice(null), 1800);
  };

  const submit = async () => {
    setError(null);
    setNotice(null);

    if (!me?.storeId) {
      setError('가게 계정으로 로그인해 주세요.');
      return;
    }
    if (!itemName.trim()) {
      setError('품목명을 입력해 주세요.');
      return;
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      setError('수량은 1 이상의 숫자로 입력해 주세요.');
      return;
    }
    if (pickupEnd.getTime() <= pickupStart.getTime()) {
      setError('픽업 종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    setBusy(true);
    try {
      let photoUrl = photoUri ?? undefined;
      if (photoUri && !/^https?:\/\//.test(photoUri)) {
        const uploaded = await api.upload(photoUri);
        photoUrl = `${API_BASE}${uploaded.url}`;
      }

      const body = {
        itemName: itemName.trim(),
        quantity: parsedQuantity,
        photoUrl,
        pickupStart: pickupStart.toISOString(),
        pickupEnd: pickupEnd.toISOString(),
      };

      if (mode === 'edit') {
        if (!listingId || !listing) throw new Error('수정할 품목을 찾을 수 없습니다.');
        await api.updateListing(listingId, body);
      } else {
        await api.createListing({ storeId: me.storeId, ...body });
        await AsyncStorage.removeItem(DRAFT_KEY);
      }

      goBackSafe();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.loading}>
          <ActivityIndicator color={P.navy} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.screen}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={s.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={s.header}>
              <View>
                <Text style={s.logo}>이음</Text>
                <Text style={s.englishLabel}>{mode === 'edit' ? 'EDIT LISTING' : 'NEW LISTING'}</Text>
              </View>
              <Pressable
                onPress={mode === 'edit' ? goBackSafe : saveDraft}
                style={({ pressed }) => pressed && s.pressed}
              >
                <Text style={s.headerAction}>{mode === 'edit' ? '닫기' : '임시저장'}</Text>
              </Pressable>
            </View>

            <Text style={s.title}>{mode === 'edit' ? '등록 내용 수정' : '기부할 식품을 등록하세요.'}</Text>

            <Pressable onPress={pickPhoto} style={({ pressed }) => [s.photoBox, pressed && s.pressed]}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={s.photo} />
              ) : null}
              <View style={s.photoOverlay}>
                <Text style={s.photoText}>{photoUri ? '사진 변경' : '+ 음식 사진 추가'}</Text>
              </View>
            </Pressable>

            <Field label="품목명">
              <TextInput
                value={itemName}
                onChangeText={setItemName}
                placeholder="소보로빵 외 3종"
                placeholderTextColor="#A4AAA8"
                style={s.input}
                returnKeyType="next"
              />
            </Field>

            <Field label="수량">
              <TextInput
                value={quantity}
                onChangeText={(value) => setQuantity(value.replace(/[^0-9]/g, ''))}
                placeholder="18"
                placeholderTextColor="#A4AAA8"
                keyboardType="number-pad"
                style={s.input}
              />
            </Field>

            <View style={s.timeRow}>
              <View style={s.timeColumn}>
                <Text style={s.label}>픽업 시작</Text>
                <Pressable onPress={() => setPicker('start')} style={({ pressed }) => [s.input, s.timeInput, pressed && s.pressed]}>
                  <Text style={s.inputText}>{slotLabel(pickupStart)}</Text>
                </Pressable>
              </View>
              <View style={s.timeColumn}>
                <Text style={s.label}>픽업 종료</Text>
                <Pressable onPress={() => setPicker('end')} style={({ pressed }) => [s.input, s.timeInput, pressed && s.pressed]}>
                  <Text style={s.inputText}>{slotLabel(pickupEnd)}</Text>
                </Pressable>
              </View>
            </View>

            {mode === 'create' ? (
              <Text style={s.helper}>등록 후 주변 3km 이내 시설에 공개됩니다.</Text>
            ) : null}

            {notice ? <Text style={s.notice}>{notice}</Text> : null}
            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              disabled={busy}
              onPress={submit}
              style={({ pressed }) => [s.submit, (pressed || busy) && s.submitPressed]}
            >
              {busy ? (
                <ActivityIndicator color={P.white} />
              ) : (
                <Text style={s.submitText}>{mode === 'edit' ? '변경 내용 저장' : '모집 시작'}</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>

        <TimeSlotModal
          visible={picker === 'start'}
          title="픽업 시작 시간"
          slots={startSlots}
          selected={pickupStart}
          onSelect={chooseStart}
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
      </View>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: P.outer },
  screen: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 28,
    backgroundColor: P.surface,
    overflow: 'hidden',
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  logo: { color: P.navy, fontSize: 23, lineHeight: 32, fontFamily: 'Pretendard-Black' },
  englishLabel: { color: P.sub, fontSize: 10, lineHeight: 14, fontFamily: 'Pretendard-Bold' },
  headerAction: { color: P.navy, fontSize: 13, lineHeight: 18, fontFamily: 'Pretendard-Bold', paddingTop: 4 },
  title: {
    color: P.navy,
    fontSize: 27,
    lineHeight: 38,
    letterSpacing: -0.8,
    fontFamily: 'Pretendard-Black',
    marginTop: 49,
  },
  photoBox: {
    height: 152,
    borderRadius: 24,
    backgroundColor: P.orange,
    overflow: 'hidden',
    marginTop: 20,
    justifyContent: 'flex-end',
  },
  photo: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  photoOverlay: { minHeight: 54, justifyContent: 'center', paddingHorizontal: 16 },
  photoText: { color: P.white, fontSize: 13, fontFamily: 'Pretendard-Bold' },
  field: { gap: 8, marginTop: 28 },
  label: { color: P.navy, fontSize: 11, lineHeight: 15, fontFamily: 'Pretendard-Bold' },
  input: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.white,
    paddingHorizontal: 15,
    color: P.navy,
    fontSize: 15,
    fontFamily: 'Pretendard-Regular',
  },
  timeRow: { flexDirection: 'row', gap: 20, marginTop: 28 },
  timeColumn: { flex: 1, gap: 8 },
  timeInput: { justifyContent: 'center' },
  inputText: { color: P.navy, fontSize: 15, fontFamily: 'Pretendard-Regular' },
  helper: { color: P.sub, fontSize: 11, lineHeight: 15, fontFamily: 'Pretendard-Regular', marginTop: 28 },
  notice: { color: '#16794A', fontSize: 12, fontFamily: 'Pretendard-SemiBold', marginTop: 18 },
  errorBox: { borderRadius: 14, backgroundColor: P.redSoft, padding: 12, marginTop: 18 },
  errorText: { color: P.red, fontSize: 12, lineHeight: 17, fontFamily: 'Pretendard-SemiBold' },
  submit: {
    height: 54,
    borderRadius: 18,
    backgroundColor: P.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 42,
  },
  submitPressed: { opacity: 0.75 },
  submitText: { color: P.white, fontSize: 15, lineHeight: 21, fontFamily: 'Pretendard-Bold' },
  pressed: { opacity: 0.72 },
});
