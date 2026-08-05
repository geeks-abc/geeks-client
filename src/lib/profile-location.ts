import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type LocationSource = 'current' | 'search';

export interface ProfileLocation {
  address: string;
  lat: number;
  lng: number;
  source: LocationSource;
}

export interface AddressSearchResult extends ProfileLocation {
  id: string;
}

const NOMINATIM_URL =
  process.env.EXPO_PUBLIC_GEOCODING_URL ?? 'https://nominatim.openstreetmap.org';

const storageKey = (profileId: number) => `profile-location:${profileId}`;

export async function loadProfileLocation(profileId: number) {
  const raw = await AsyncStorage.getItem(storageKey(profileId));
  if (!raw) return null;

  try {
    const saved = JSON.parse(raw) as ProfileLocation;
    if (
      typeof saved.address !== 'string' ||
      !Number.isFinite(saved.lat) ||
      !Number.isFinite(saved.lng)
    ) {
      return null;
    }
    return saved;
  } catch {
    return null;
  }
}

export async function saveProfileLocation(profileId: number, location: ProfileLocation) {
  await AsyncStorage.setItem(storageKey(profileId), JSON.stringify(location));
}

export async function searchKoreanAddresses(query: string): Promise<AddressSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const params = new URLSearchParams({
    q: trimmed,
    format: 'jsonv2',
    addressdetails: '1',
    countrycodes: 'kr',
    limit: '5',
    'accept-language': 'ko',
  });
  const response = await fetch(`${NOMINATIM_URL}/search?${params.toString()}`);
  if (!response.ok) throw new Error('주소 검색 서비스에 연결할 수 없어요.');

  const results = (await response.json()) as {
    place_id: number | string;
    display_name: string;
    lat: string;
    lon: string;
  }[];

  return results
    .map((item) => ({
      id: String(item.place_id),
      address: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
      source: 'search' as const,
    }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
}

async function reverseGeocodeFromWeb(lat: number, lng: number) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'jsonv2',
    zoom: '18',
    'accept-language': 'ko',
  });
  const response = await fetch(`${NOMINATIM_URL}/reverse?${params.toString()}`);
  if (!response.ok) return null;
  const result = (await response.json()) as { display_name?: string };
  return result.display_name?.trim() || null;
}

function formatNativeAddress(address: Location.LocationGeocodedAddress) {
  const parts = [
    address.region,
    address.city,
    address.district,
    address.street,
    address.name,
  ].filter((part, index, all): part is string => Boolean(part) && all.indexOf(part) === index);
  return parts.join(' ');
}

export async function getCurrentProfileLocation(): Promise<ProfileLocation> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) throw new Error('기기의 위치 서비스를 켜주세요.');

  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== Location.PermissionStatus.GRANTED) {
    throw new Error('현재 위치를 사용하려면 위치 권한이 필요해요.');
  }

  const current = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const { latitude: lat, longitude: lng } = current.coords;

  let address: string | null = null;
  if (Platform.OS !== 'web') {
    const candidates = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    address = candidates[0] ? formatNativeAddress(candidates[0]) : null;
  }
  address ||= await reverseGeocodeFromWeb(lat, lng);

  if (!address) throw new Error('현재 위치의 주소를 확인할 수 없어요. 주소 검색을 이용해주세요.');
  return { address, lat, lng, source: 'current' };
}
