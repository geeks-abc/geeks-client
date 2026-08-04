// 이음 디자인 토큰 — 브랜드 오렌지
export const C = {
  bg: '#F4F6F5',
  card: '#FFFFFF',
  brand: '#FF6F0F', // 메인 오렌지 (시설 QR 버튼 기준)
  brandSoft: '#FFEFE2', // 연한 오렌지 배경
  brandDeep: '#C2560A', // soft 배경 위 텍스트
  brandOnDark: '#FFB067', // 어두운 배경 위 오렌지 포인트
  accent: '#F0A24C', // 로고 오렌지 포인트
  navy: '#131A2E',
  text: '#191F28',
  sub: '#8B95A1',
  line: '#F2F4F6',
  blue: '#3182F6',
  blueSoft: '#EAF2FE',
  green: '#E86618',
  greenSoft: '#FFEFE2',
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
