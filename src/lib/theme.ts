// 이음 디자인 토큰 — 토스풍 미니멀 + 브랜드 그린
export const C = {
  bg: '#F4F6F5',
  card: '#FFFFFF',
  brand: '#3C7A52', // 메인 그린 (로고 딥그린 계열)
  brandSoft: '#E9F1EB', // 연한 그린 배경
  brandDeep: '#2C5E3F', // soft 배경 위 텍스트
  brandOnDark: '#8FCBA5', // 어두운 배경 위 그린 포인트
  accent: '#F0A24C', // 로고 오렌지 포인트
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

// 소비자 언어 상태 라벨 (뱃지용)
export const STATUS_META: Record<
  string,
  { label: string; fg: string; bg: string }
> = {
  OPEN: { label: '신청 가능', fg: C.brandDeep, bg: C.brandSoft },
  MATCHED: { label: '픽업 예정', fg: C.blue, bg: C.blueSoft },
  COMPLETED: { label: '전달 완료', fg: '#FFFFFF', bg: C.navy },
  EXPIRED: { label: '마감됨', fg: C.sub, bg: C.graySoft },
  CANCELLED: { label: '취소됨', fg: C.red, bg: C.redSoft },
};
