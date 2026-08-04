import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, Me, Role, setToken } from './api';

// 시딩 스크립트(geeks-server npm run seed)의 데모 계정
export const DEMO_ACCOUNTS: { role: Role; label: string; sub: string; email: string }[] = [
  { role: 'STORE', label: '가게 A', sub: '어니언 베이커리 홍대점', email: 'store@demo.com' },
  { role: 'FACILITY', label: '복지시설 B', sub: '마포 푸드뱅크', email: 'facility@demo.com' },
  { role: 'ADMIN', label: '관리자', sub: '이음 운영팀', email: 'admin@demo.com' },
];
const DEMO_PASSWORD = 'password123';

interface AuthState {
  me: Me | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Me>;
  quickLogin: (role: Role) => Promise<Me>;
  adoptToken: (accessToken: string) => Promise<Me>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>(null as unknown as AuthState);
export const useAuth = () => useContext(AuthContext);

export function homePath(role: Role): '/store' | '/facility' | '/dashboard' {
  if (role === 'STORE') return '/store';
  if (role === 'FACILITY') return '/facility';
  return '/dashboard';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('token');
        if (saved) {
          setToken(saved);
          setMe(await api.me());
        }
      } catch {
        setToken(null);
        await AsyncStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 발급받은 토큰 채택 (전화번호 인증·가입 완료 후)
  const adoptToken = async (accessToken: string) => {
    setToken(accessToken);
    await AsyncStorage.setItem('token', accessToken);
    const profile = await api.me();
    setMe(profile);
    return profile;
  };

  const login = async (email: string, password: string) => {
    const { accessToken } = await api.login(email, password);
    return adoptToken(accessToken);
  };

  const quickLogin = (role: Role) => {
    const account = DEMO_ACCOUNTS.find((a) => a.role === role)!;
    return login(account.email, DEMO_PASSWORD);
  };

  const logout = async () => {
    setToken(null);
    setMe(null);
    await AsyncStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider
      value={{ me, loading, login, quickLogin, adoptToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 홈 헤더의 "계정 전환" 공통 액션 — 로그아웃 후 랜딩으로
export function useSwitchAccount() {
  const router = useRouter();
  const { logout } = useAuth();
  return async () => {
    await logout();
    router.replace('/');
  };
}
