import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 3000;

function hostFromUri(uri?: string | null) {
  if (!uri) return null;
  try {
    return new URL(`http://${uri}`).hostname;
  } catch {
    return uri.split(':')[0] || null;
  }
}

function developmentApiBase() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:${API_PORT}`;
  }

  const expoHost = hostFromUri(
    Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost,
  );
  if (expoHost) return `http://${expoHost}:${API_PORT}`;

  return Platform.OS === 'android'
    ? `http://10.0.2.2:${API_PORT}`
    : `http://localhost:${API_PORT}`;
}

// EXPO_PUBLIC_API_BASE_URL을 설정하면 자동 감지보다 우선합니다.
// 실기기 Expo Go에서는 개발 서버의 IP를 자동으로 사용합니다.
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? developmentApiBase();
