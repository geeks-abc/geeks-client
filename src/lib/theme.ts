// 이음 디자인 토큰 — 토스풍 미니멀 + 브랜드 옐로/네이비
export const C = {
  bg: '#F6F6F2',
  card: '#FFFFFF',
  yellow: '#FFD400',
  yellowSoft: '#FFF6C9',
  navy: '#131A2E',
  text: '#191F28',
  sub: '#8B95A1',
  line: '#F2F4F6',
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
  OPEN: { label: 'OPEN', fg: '#8A6D00', bg: C.yellowSoft },
  MATCHED: { label: 'MATCHED', fg: C.green, bg: C.greenSoft },
  COMPLETED: { label: '완료', fg: '#FFFFFF', bg: C.navy },
  EXPIRED: { label: '마감', fg: C.sub, bg: C.graySoft },
  CANCELLED: { label: '취소됨', fg: C.red, bg: C.redSoft },
};
