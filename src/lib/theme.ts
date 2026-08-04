// 이음 디자인 토큰 — 토스풍 미니멀 + 브랜드 그린
export const C = {
  bg: '#F4F6F5',
  card: '#FFFFFF',
  brand: '#10B26C', // 메인 그린
  brandSoft: '#E3F6ED', // 연한 그린 배경
  brandDeep: '#0B7A49', // soft 배경 위 텍스트
  brandOnDark: '#5CE0A1', // 어두운 배경 위 그린 포인트
  navy: '#131A2E',
  text: '#191F28',
  sub: '#8B95A1',
  line: '#F2F4F6',
  blue: '#3182F6',
  blueSoft: '#EAF2FE',
  green: '#1FA85C',
  greenSoft: '#E5F6EC',
  red: '#F04452',
  redSoft: '#FDEBEC',
  gray: '#B0B8C1',
  graySoft: '#F2F4F6',
};

export const R = { card: 20, chip: 12, button: 14 };

export const STATUS_META: Record<
  string,
  { label: string; fg: string; bg: string }
> = {
  OPEN: { label: 'OPEN', fg: C.brandDeep, bg: C.brandSoft },
  MATCHED: { label: 'MATCHED', fg: C.blue, bg: C.blueSoft },
  COMPLETED: { label: '완료', fg: '#FFFFFF', bg: C.navy },
  EXPIRED: { label: '마감', fg: C.sub, bg: C.graySoft },
  CANCELLED: { label: '취소됨', fg: C.red, bg: C.redSoft },
};
