import { Platform } from 'react-native';

// 서버 주소 — 실기기 데모 시 같은 와이파이의 맥 IP 또는 VPS 주소로 교체
// 예: export const API_BASE = 'http://192.168.0.10:3000';
export const API_BASE =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
