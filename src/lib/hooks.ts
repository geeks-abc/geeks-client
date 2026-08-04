import { useCallback, useEffect, useRef, useState } from 'react';

// 3초 폴링 기본 — 명세서 "신규 등록 → 피드 반영 3초 이내"
// deps가 바뀌면(예: 로그인 완료로 storeId 확보) 즉시 다시 요청
export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs = 3000,
  deps: unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    try {
      setData(await fetcherRef.current());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오기 실패');
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, intervalMs);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, intervalMs, ...deps]);

  return { data, error, refresh };
}

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export const remainingLabel = (pickupEnd: string) => {
  const min = Math.max(0, Math.ceil((new Date(pickupEnd).getTime() - Date.now()) / 60000));
  if (min <= 0) return '마감';
  if (min < 60) return `${min}분 남음`;
  return `${Math.floor(min / 60)}시간 ${min % 60}분 남음`;
};

export const isToday = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};
