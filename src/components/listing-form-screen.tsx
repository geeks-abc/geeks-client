import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { DateTimePickerModal, dateTimeLabel } from '@/components/date-time-picker';
import { nextSlotAfter } from '@/components/time-picker';
import { api, Listing } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { API_BASE } from '@/lib/config';
import { notify } from '@/lib/feedback';
import { useSafeBack } from '@/lib/navigation';
import { C, R } from '@/lib/theme';

const DRAFT_KEY = 'ieum:new-listing-draft:v2';

type Mode = 'create' | 'edit';
type SaveState = 'idle' | 'saving' | 'saved';

interface ListingDraft {
  itemName: string;
  quantity: string;
  pickupStart: string;
  pickupEnd: string;
  photoUri: string | null;
  savedAt: string;
}

export function ListingFormScreen({ mode, listingId }: { mode: Mode; listingId?: number }) {
  const goBackSafe = useSafeBack();
  const { me } = useAuth();
  const firstSlot = useMemo(() => nextSlotAfter(new Date()), []);
  const defaultEnd = useMemo(() => new Date(firstSlot.getTime() + 60 * 60000), [firstSlot]);

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(mode === 'edit' && Boolean(listingId));
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pickupStart, setPickupStart] = useState(firstSlot);
  const [pickupEnd, setPickupEnd] = useState(defaultEnd);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [picker, setPicker] = useState<'start' | 'end' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    mode === 'edit' && !listingId ? '수정할 품목을 찾을 수 없습니다.' : null,
  );
  const [draftReady, setDraftReady] = useState(mode === 'edit');
  const [draftRecovered, setDraftRecovered] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const hasDraftContent =
    Boolean(itemName.trim()) ||
    Boolean(quantity) ||
    Boolean(photoUri) ||
    pickupStart.getTime() !== firstSlot.getTime() ||
    pickupEnd.getTime() !== defaultEnd.getTime();

  const persistDraft = useCallback(async () => {
    if (mode !== 'create' || !draftReady) return;
    if (!hasDraftContent) {
      await AsyncStorage.removeItem(DRAFT_KEY);
      setSaveState('idle');
      return;
    }

    setSaveState('saving');
    const draft: ListingDraft = {
      itemName,
      quantity,
      pickupStart: pickupStart.toISOString(),
      pickupEnd: pickupEnd.toISOString(),
      photoUri,
      savedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setSaveState('saved');
  }, [draftReady, hasDraftContent, itemName, mode, photoUri, pickupEnd, pickupStart, quantity]);

  useEffect(() => {
    if (mode === 'create') {
      AsyncStorage.getItem(DRAFT_KEY)
        .then((raw) => {
          if (!raw) return;
          const draft = JSON.parse(raw) as ListingDraft;
          setItemName(draft.itemName ?? '');
          setQuantity(draft.quantity ?? '');
          if (draft.pickupStart) setPickupStart(new Date(draft.pickupStart));
          if (draft.pickupEnd) setPickupEnd(new Date(draft.pickupEnd));
          setPhotoUri(draft.photoUri ?? null);
          setDraftRecovered(true);
          setSaveState('saved');
        })
        .catch(() => undefined)
        .finally(() => setDraftReady(true));
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
      .catch((caughtError) =>
        setError(caughtError instanceof Error ? caughtError.message : '품목을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false));
  }, [listingId, mode]);

  useEffect(() => {
    if (mode !== 'create' || !draftReady) return;
    setSaveState(hasDraftContent ? 'saving' : 'idle');
    const timer = setTimeout(() => {
      persistDraft().catch(() => setSaveState('idle'));
    }, 650);
    return () => clearTimeout(timer);
  }, [draftReady, hasDraftContent, mode, persistDraft]);

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

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const clearDraft = async () => {
    await AsyncStorage.removeItem(DRAFT_KEY);
    setItemName('');
    setQuantity('');
    setPickupStart(firstSlot);
    setPickupEnd(defaultEnd);
    setPhotoUri(null);
    setDraftRecovered(false);
    setSaveState('idle');
    notify.success('새 작성 화면으로 초기화했어요');
  };

  const closeForm = async () => {
    if (mode === 'create') await persistDraft().catch(() => undefined);
    goBackSafe();
  };

  const submit = async () => {
    setError(null);

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

      notify.success(
        mode === 'edit' ? '수정을 저장했어요' : '나눔이 등록됐어요',
        mode === 'edit' ? undefined : '주변 시설에 알림을 보냈어요.',
      );
      goBackSafe();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '저장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.loading}><ActivityIndicator color={C.brand} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <Pressable
            accessibilityLabel="등록 화면 닫기"
            onPress={closeForm}
            hitSlop={10}
            style={({ pressed }) => [s.headerButton, pressed && s.pressed]}
          >
            <Ionicons name="close" size={25} color={C.text} />
          </Pressable>
          <Text style={s.headerTitle}>{mode === 'edit' ? '기부 상품 수정' : '기부 상품 등록'}</Text>
          <View style={s.saveStatusWrap}>
            {mode === 'create' ? (
              <Text style={s.saveStatusText}>
                {saveState === 'saving' ? '저장 중' : saveState === 'saved' ? '저장됨' : ''}
              </Text>
            ) : null}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.pageIntro}>
            <Text style={s.pageTitle}>
              {mode === 'edit' ? '상품 정보를 수정해주세요' : '나눌할 상품을 알려주세요'}
            </Text>
            <Text style={s.pageDescription}>등록한 정보는 주변 복지시설에 보여요.</Text>
          </View>

          {mode === 'create' && draftRecovered ? (
            <View style={s.draftNotice}>
              <Text style={s.draftText}>작성 중이던 내용을 불러왔어요.</Text>
              <Pressable onPress={clearDraft} hitSlop={8}>
                <Text style={s.resetText}>삭제</Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={s.sectionTitle}>상품 사진</Text>
          <Pressable onPress={pickPhoto} style={({ pressed }) => [s.photoCard, pressed && s.pressed]}>
            <View style={s.photoThumb}>
              {photoUri ? (
                <Image transition={150} source={{ uri: photoUri }} style={s.photo} contentFit="cover" />
              ) : (
                <Ionicons name="camera-outline" size={26} color={C.brand} />
              )}
            </View>
            <View style={s.photoCopy}>
              <Text style={s.photoTitle}>{photoUri ? '사진 변경' : '사진 추가'}</Text>
              <Text style={s.photoSub}>식품을 확인할 수 있는 사진을 올려주세요.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.gray} />
          </Pressable>

          <Text style={s.sectionTitle}>상품 정보</Text>
          <View style={s.card}>
            <Field label="품목명" helper="여러 종류라면 대표 상품과 종류 수를 함께 적어주세요.">
              <TextInput
                value={itemName}
                onChangeText={setItemName}
                placeholder="예: 소보로빵 외 3종"
                placeholderTextColor={C.gray}
                style={s.input}
                returnKeyType="next"
              />
            </Field>
            <View style={s.formDivider} />
            <Field label="수량">
              <View style={s.quantityInputWrap}>
                <TextInput
                  value={quantity}
                  onChangeText={(value) => setQuantity(value.replace(/[^0-9]/g, ''))}
                  placeholder="18"
                  placeholderTextColor={C.gray}
                  keyboardType="number-pad"
                  style={s.quantityInput}
                />
                <Text style={s.quantityUnit}>개</Text>
              </View>
            </Field>
          </View>

          <Text style={s.sectionTitle}>픽업 시간</Text>
          <View style={s.card}>
            <DateField
              label="시작"
              value={dateTimeLabel(pickupStart)}
              onPress={() => setPicker('start')}
            />
            <View style={s.rowDivider} />
            <DateField
              label="종료"
              value={dateTimeLabel(pickupEnd)}
              onPress={() => setPicker('end')}
            />
          </View>
          <View style={s.locationHint}>
            <Ionicons name="location-outline" size={16} color={C.sub} />
            <Text style={s.locationHintText}>가게 반경 3km 이내 복지시설에 공개됩니다.</Text>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={C.red} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={s.actionBar}>
          <Pressable
            disabled={busy}
            onPress={submit}
            style={({ pressed }) => [s.submit, (pressed || busy) && s.submitPressed]}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={s.submitText}>{mode === 'edit' ? '변경 내용 저장' : '기부 상품 등록'}</Text>
            )}
          </Pressable>
        </View>

        <DateTimePickerModal
          visible={picker === 'start'}
          title="픽업 시작 시간"
          selected={pickupStart}
          onSelect={chooseStart}
          onClose={() => setPicker(null)}
        />
        <DateTimePickerModal
          visible={picker === 'end'}
          title="픽업 종료 시간"
          selected={pickupEnd}
          minDate={new Date(pickupStart.getTime() + 5 * 60000)}
          onSelect={setPickupEnd}
          onClose={() => setPicker(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      {children}
      {helper ? <Text style={s.fieldHelper}>{helper}</Text> : null}
    </View>
  );
}

function DateField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.dateField, pressed && s.rowPressed]}>
      <Text style={s.dateLabel}>{label}</Text>
      <Text style={s.dateValue}>{value}</Text>
      <Ionicons name="chevron-forward" size={17} color={C.gray} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  screen: { flex: 1, backgroundColor: C.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: C.text, fontSize: 17, fontFamily: 'Pretendard-ExtraBold' },
  saveStatusWrap: { width: 44, alignItems: 'flex-end' },
  saveStatusText: { color: C.sub, fontSize: 11, fontFamily: 'Pretendard-SemiBold' },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  pageIntro: { gap: 5, marginBottom: 28 },
  pageTitle: { color: C.text, fontSize: 23, lineHeight: 32, fontFamily: 'Pretendard-ExtraBold' },
  pageDescription: { color: C.sub, fontSize: 13, fontFamily: 'Pretendard-Regular' },
  draftNotice: {
    minHeight: 44,
    marginBottom: 24,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: C.brandSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  draftText: { flex: 1, color: C.brandDeep, fontSize: 12, fontFamily: 'Pretendard-SemiBold' },
  resetText: { color: C.brandDeep, fontSize: 12, fontFamily: 'Pretendard-ExtraBold' },
  sectionTitle: {
    color: C.text,
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    marginBottom: 10,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: R.card,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 26,
  },
  photoCard: {
    minHeight: 112,
    backgroundColor: C.card,
    borderRadius: R.card,
    padding: 14,
    marginBottom: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  photoThumb: {
    width: 82,
    height: 82,
    borderRadius: 14,
    backgroundColor: C.brandSoft,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%' },
  photoCopy: { flex: 1, gap: 5 },
  photoTitle: { color: C.text, fontSize: 15, fontFamily: 'Pretendard-Bold' },
  photoSub: { color: C.sub, fontSize: 11.5, lineHeight: 17, fontFamily: 'Pretendard-Regular' },
  field: { gap: 8 },
  label: { color: C.sub, fontSize: 13, fontFamily: 'Pretendard-SemiBold' },
  fieldHelper: { color: C.sub, fontSize: 11, lineHeight: 16, fontFamily: 'Pretendard-Regular' },
  input: {
    height: 52,
    borderRadius: R.chip,
    backgroundColor: C.bg,
    paddingHorizontal: 14,
    color: C.text,
    fontSize: 15,
    fontFamily: 'Pretendard-Regular',
  },
  quantityInputWrap: {
    height: 52,
    borderRadius: R.chip,
    backgroundColor: C.bg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  quantityInput: { flex: 1, color: C.text, fontSize: 15, fontFamily: 'Pretendard-Regular', paddingVertical: 0 },
  quantityUnit: { color: C.sub, fontSize: 14, fontFamily: 'Pretendard-SemiBold' },
  formDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.line, marginVertical: 18 },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.line },
  dateField: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowPressed: { opacity: 0.55 },
  dateLabel: { width: 42, color: C.sub, fontSize: 13.5, fontFamily: 'Pretendard-Regular' },
  dateValue: { flex: 1, color: C.text, fontSize: 14, textAlign: 'right', fontFamily: 'Pretendard-SemiBold' },
  locationHint: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -14, marginBottom: 26 },
  locationHintText: { color: C.sub, fontSize: 11.5, fontFamily: 'Pretendard-Regular' },
  errorBox: { borderRadius: 12, backgroundColor: C.redSoft, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { flex: 1, color: C.red, fontSize: 12, lineHeight: 17, fontFamily: 'Pretendard-SemiBold' },
  actionBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
    backgroundColor: C.card,
  },
  submit: { height: 54, borderRadius: R.button, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  submitPressed: { opacity: 0.76 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Pretendard-Bold' },
  pressed: { opacity: 0.7 },
});
