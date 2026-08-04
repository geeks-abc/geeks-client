import { useRouter } from 'expo-router';
import { homePath, useAuth } from './auth';

// 돌아갈 스택이 없으면(새로고침·replace 진입) 역할 홈으로 — 웹 GO_BACK 에러 방지
export function useSafeBack() {
  const router = useRouter();
  const { me } = useAuth();
  return () => {
    if (router.canGoBack()) router.back();
    else router.replace(me ? homePath(me.role) : '/');
  };
}
