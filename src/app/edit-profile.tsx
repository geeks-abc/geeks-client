import { Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import {
  AddressSearchResult,
  getCurrentProfileLocation,
  ProfileLocation,
  saveProfileLocation,
  searchKoreanAddresses,
} from '@/lib/profile-location';
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
  const [selectedLocation, setSelectedLocation] = useState<ProfileLocation | null>(
    profile && Number.isFinite(profile.lat) && Number.isFinite(profile.lng)
      ? { address: profile.address, lat: profile.lat, lng: profile.lng, source: 'search' }
      : null,
  );
  const [addressResults, setAddressResults] = useState<AddressSearchResult[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [findingCurrent, setFindingCurrent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 본인 확인 안 거치고 직접 진입하면 게이트로
  if (!isVerified()) return <Redirect href="/verify-identity" />;

  const save = async () => {
    if (!name.trim()) {
      setError(me?.role === 'STORE' ? '상호명을 입력해주세요.' : '기관명을 입력해주세요.');
      return;
    }
    if (!address.trim() || !selectedLocation || selectedLocation.address !== address.trim()) {
      setError('현재 위치 또는 주소 검색 결과에서 위치를 선택해주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.updateProfile({
        name: name.trim(),
        address: selectedLocation.address,
        phone: phone.trim() || undefined,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
      });
      if (profile?.id) await saveProfileLocation(profile.id, selectedLocation);
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

  const searchAddress = async () => {
    if (address.trim().length < 2) {
      setError('검색할 주소를 두 글자 이상 입력해주세요.');
      return;
    }
    setSearchingAddress(true);
    setError(null);
    try {
      const results = await searchKoreanAddresses(address);
      setAddressResults(results);
      if (results.length === 0) setError('검색 결과가 없어요. 도로명이나 건물명을 확인해주세요.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '주소 검색에 실패했어요.');
    } finally {
      setSearchingAddress(false);
    }
  };

  const useCurrentLocation = async () => {
    setFindingCurrent(true);
    setError(null);
    try {
      const location = await getCurrentProfileLocation();
      setAddress(location.address);
      setSelectedLocation(location);
      setAddressResults([]);
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
    setAddress(result.address);
    setSelectedLocation(result);
    setAddressResults([]);
    setError(null);
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
          <View style={s.addressSection}>
            <Text style={s.label}>위치</Text>
            <Pressable
              onPress={useCurrentLocation}
              disabled={findingCurrent || busy}
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

            <View style={s.orRow}>
              <View style={s.orLine} />
              <Text style={s.orText}>또는 주소 검색</Text>
              <View style={s.orLine} />
            </View>

            <View style={s.searchRow}>
              <TextInput
                value={address}
                onChangeText={(value) => {
                  setAddress(value);
                  setSelectedLocation(null);
                  setAddressResults([]);
                }}
                onSubmitEditing={searchAddress}
                placeholder="도로명, 건물명 또는 지번"
                placeholderTextColor={C.gray}
                returnKeyType="search"
                style={[s.input, s.searchInput]}
              />
              <Pressable
                onPress={searchAddress}
                disabled={searchingAddress || busy}
                style={({ pressed }) => [s.searchButton, pressed && s.pressed]}
              >
                {searchingAddress ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="search" size={19} color="#FFFFFF" />
                )}
              </Pressable>
            </View>

            {addressResults.length > 0 ? (
              <View style={s.resultList}>
                {addressResults.map((result, index) => (
                  <Pressable
                    key={result.id}
                    onPress={() => selectAddress(result)}
                    style={({ pressed }) => [
                      s.resultRow,
                      index < addressResults.length - 1 && s.resultDivider,
                      pressed && s.pressed,
                    ]}
                  >
                    <Ionicons name="location-outline" size={18} color={C.brand} />
                    <Text style={s.resultText}>{result.address}</Text>
                  </Pressable>
                ))}
                <Text style={s.attribution}>주소 데이터 © OpenStreetMap contributors</Text>
              </View>
            ) : null}

            {selectedLocation ? (
              <View style={s.selectedLocation}>
                <Ionicons name="checkmark-circle" size={17} color={C.brand} />
                <Text numberOfLines={2} style={s.selectedLocationText}>
                  {selectedLocation.source === 'current' ? '현재 위치' : '선택한 주소'} · {selectedLocation.address}
                </Text>
              </View>
            ) : (
              <Text style={s.addressHint}>검색 결과를 선택해야 지도 위치가 정확히 설정돼요.</Text>
            )}
          </View>
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
  addressSection: { gap: 10 },
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
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  orLine: { flex: 1, height: 1, backgroundColor: C.line },
  orText: { color: C.sub, fontSize: 11.5, fontFamily: 'Pretendard-Regular' },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1 },
  searchButton: {
    width: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.navy,
  },
  resultList: { backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  resultRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14 },
  resultDivider: { borderBottomWidth: 1, borderBottomColor: C.line },
  resultText: { flex: 1, color: C.text, fontSize: 13, lineHeight: 19, fontFamily: 'Pretendard-Regular' },
  attribution: { color: C.gray, fontSize: 9.5, paddingHorizontal: 14, paddingBottom: 10, fontFamily: 'Pretendard-Regular' },
  selectedLocation: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: C.brandSoft, borderRadius: 10, padding: 10 },
  selectedLocationText: { flex: 1, color: C.brandDeep, fontSize: 11.5, lineHeight: 17, fontFamily: 'Pretendard-SemiBold' },
  addressHint: { color: C.sub, fontSize: 11.5, lineHeight: 17, fontFamily: 'Pretendard-Regular' },
  pressed: { opacity: 0.7 },
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
