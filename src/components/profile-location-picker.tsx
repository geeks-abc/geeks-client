import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notify } from '@/lib/feedback';
import {
  AddressSearchResult,
  getCurrentProfileLocation,
  ProfileLocation,
  searchKoreanAddresses,
} from '@/lib/profile-location';
import { C } from '@/lib/theme';

export function ProfileLocationPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: ProfileLocation | null;
  onChange: (location: ProfileLocation) => void;
  disabled?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [findingCurrent, setFindingCurrent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openSearch = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setModalOpen(true);
  };

  const search = async () => {
    if (query.trim().length < 2) {
      setError('검색할 주소를 두 글자 이상 입력해주세요.');
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const found = await searchKoreanAddresses(query);
      setResults(found);
      if (found.length === 0) {
        setError('검색 결과가 없어요. 도로명이나 건물명을 확인해주세요.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '주소 검색에 실패했어요.');
    } finally {
      setSearching(false);
    }
  };

  const useCurrentLocation = async () => {
    setFindingCurrent(true);
    setError(null);
    try {
      const location = await getCurrentProfileLocation();
      onChange(location);
      notify.success('현재 위치를 확인했어요');
    } catch (e) {
      const message = e instanceof Error ? e.message : '현재 위치를 확인하지 못했어요.';
      setError(message);
      notify.error('위치 확인 실패', message);
    } finally {
      setFindingCurrent(false);
    }
  };

  const selectAddress = (result: AddressSearchResult) => {
    onChange(result);
    setModalOpen(false);
    setResults([]);
    setError(null);
  };

  return (
    <View style={s.section}>
      <Text style={s.label}>위치</Text>
      <Pressable
        onPress={useCurrentLocation}
        disabled={findingCurrent || disabled}
        style={({ pressed }) => [s.currentButton, pressed && s.pressed]}
      >
        {findingCurrent ? (
          <ActivityIndicator size="small" color={C.brand} />
        ) : (
          <Ionicons name="navigate" size={18} color={C.brand} />
        )}
        <Text style={s.currentButtonText}>
          {findingCurrent ? '현재 위치 확인 중…' : '현재 내 위치로 설정'}
        </Text>
      </Pressable>

      <Text style={s.orText}>또는</Text>

      <Pressable
        onPress={openSearch}
        disabled={disabled}
        style={({ pressed }) => [s.addressPicker, pressed && s.pressed]}
      >
        <Ionicons name="search" size={19} color={C.text} />
        <View style={s.addressPickerContent}>
          <Text style={s.addressPickerLabel}>주소 검색</Text>
          <Text numberOfLines={2} style={s.addressPickerValue}>
            {value?.address ?? '도로명, 건물명 또는 지번으로 찾아보세요'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color={C.gray} />
      </Pressable>

      {value ? (
        <View style={s.selectedLocation}>
          <Ionicons name="checkmark-circle" size={17} color={C.brand} />
          <Text numberOfLines={2} style={s.selectedLocationText}>
            {value.source === 'current' ? '현재 위치' : '선택한 주소'} · {value.address}
          </Text>
        </View>
      ) : (
        <Text style={s.hint}>현재 위치 또는 검색 결과에서 주소를 선택해주세요.</Text>
      )}

      {!modalOpen && error ? <Text style={s.error}>{error}</Text> : null}

      <Modal
        visible={modalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalOpen(false)}
      >
        <SafeAreaView style={s.modal} edges={['top', 'bottom']}>
          <View style={s.modalHeader}>
            <Pressable
              onPress={() => setModalOpen(false)}
              hitSlop={10}
              style={({ pressed }) => pressed && s.pressed}
            >
              <Ionicons name="close" size={26} color={C.text} />
            </Pressable>
            <Text style={s.modalTitle}>주소 검색</Text>
            <View style={{ width: 26 }} />
          </View>

          <View style={s.modalBody}>
            <Text style={s.guide}>도로명, 건물명 또는 지번을 입력해주세요.</Text>
            <View style={s.searchRow}>
              <TextInput
                autoFocus
                value={query}
                onChangeText={(text) => {
                  setQuery(text);
                  setResults([]);
                  setError(null);
                }}
                onSubmitEditing={search}
                placeholder="예: 서울 마포구 월드컵로"
                placeholderTextColor={C.gray}
                returnKeyType="search"
                style={s.input}
              />
              <Pressable
                onPress={search}
                disabled={searching}
                style={({ pressed }) => [s.searchButton, pressed && s.pressed]}
              >
                {searching ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={s.searchButtonText}>검색</Text>
                )}
              </Pressable>
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.results}>
              {results.map((result, index) => (
                <Pressable
                  key={result.id}
                  onPress={() => selectAddress(result)}
                  style={({ pressed }) => [
                    s.resultRow,
                    index < results.length - 1 && s.resultDivider,
                    pressed && s.pressed,
                  ]}
                >
                  <Ionicons name="location-outline" size={20} color={C.brand} />
                  <Text style={s.resultText}>{result.address}</Text>
                </Pressable>
              ))}
              {results.length > 0 ? (
                <Text style={s.attribution}>주소 데이터 © OpenStreetMap contributors</Text>
              ) : null}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  section: { gap: 10 },
  label: { fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: C.sub },
  currentButton: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.brand,
    backgroundColor: C.brandSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  currentButtonText: { color: C.brandDeep, fontSize: 14, fontFamily: 'Pretendard-Bold' },
  orText: { color: C.sub, fontSize: 11.5, textAlign: 'center', fontFamily: 'Pretendard-Regular' },
  addressPicker: {
    minHeight: 68,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  addressPickerContent: { flex: 1, gap: 3 },
  addressPickerLabel: { color: C.text, fontSize: 14, fontFamily: 'Pretendard-Bold' },
  addressPickerValue: { color: C.sub, fontSize: 12, lineHeight: 17, fontFamily: 'Pretendard-Regular' },
  selectedLocation: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: C.brandSoft, borderRadius: 10, padding: 10 },
  selectedLocationText: { flex: 1, color: C.brandDeep, fontSize: 11.5, lineHeight: 17, fontFamily: 'Pretendard-SemiBold' },
  hint: { color: C.sub, fontSize: 11.5, lineHeight: 17, fontFamily: 'Pretendard-Regular' },
  modal: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    height: 54,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    backgroundColor: C.card,
  },
  modalTitle: { color: C.text, fontSize: 17, fontFamily: 'Pretendard-ExtraBold' },
  modalBody: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20 },
  guide: { color: C.sub, fontSize: 13, marginBottom: 10, fontFamily: 'Pretendard-Regular' },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Pretendard-Regular',
    color: C.text,
  },
  searchButton: { width: 64, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.navy },
  searchButtonText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Pretendard-Bold' },
  error: { color: C.red, fontSize: 12.5, marginTop: 2, fontFamily: 'Pretendard-SemiBold' },
  results: { marginTop: 14, backgroundColor: C.card, borderRadius: 12, overflow: 'hidden' },
  resultRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16 },
  resultDivider: { borderBottomWidth: 1, borderBottomColor: C.line },
  resultText: { flex: 1, color: C.text, fontSize: 13, lineHeight: 19, fontFamily: 'Pretendard-Regular' },
  attribution: { color: C.gray, fontSize: 9.5, paddingHorizontal: 14, paddingBottom: 10, fontFamily: 'Pretendard-Regular' },
  pressed: { opacity: 0.7 },
});
