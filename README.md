# 이음 클라이언트 (geeks-client)

버려질 음식과 복지시설을 잇는 **이음**의 React Native(Expo) 앱.

## 실행

서버 먼저 (geeks-server):

```bash
docker compose up -d && npm run seed && npm run start:dev
```

클라이언트:

```bash
npm install
npx expo start
```

iOS 시뮬레이터 `i` / Android 에뮬레이터 `a` / 실기기는 Expo Go로 QR 스캔.

> **실기기 데모**: [src/lib/config.ts](src/lib/config.ts)의 `API_BASE`를 같은 와이파이의 맥 IP(`http://192.168.x.x:3000`) 또는 VPS 주소로 변경.

## 데모 계정 (비밀번호 공통 `password123`)

| 역할 | 이메일 | 프로필 |
|---|---|---|
| 가게 | store@demo.com | 어니언 베이커리 홍대점 |
| 복지시설 | facility@demo.com | 마포 푸드뱅크 |
| 관리자 | admin@demo.com | 임팩트 대시보드 |

로그인 화면의 **QUICK ACCOUNT SWITCHER**로 1초 만에 역할 전환.

## 화면 ↔ 코드

| 화면 | 파일 |
|---|---|
| A-00 로그인 + D-00 계정 전환 | `src/app/index.tsx` |
| S-01 가게 홈 (오늘 통계·품목 목록) | `src/app/store/index.tsx` |
| S-02 품목 등록 (사진 업로드) | `src/app/new-listing.tsx` |
| S-03 매칭 상세·QR 표시 (가게) | `src/app/match/[id].tsx` |
| S-04 시설 피드 (3초 폴링·빈 상태) | `src/app/facility/index.tsx` |
| S-05 픽업 상세·QR 스캔 (시설) | `src/app/pickup/[id].tsx`, `src/app/scan.tsx` |
| S-06 기부확인서 (+PDF) | `src/app/certificate/[id].tsx` |
| S-07 임팩트 대시보드 | `src/app/dashboard.tsx` |
| 기부/수령 내역 | `src/app/store/history.tsx`, `src/app/facility/history.tsx` |
| 알림 (벨 뱃지·전체 읽음) | `src/app/notifications.tsx` |

## 데모 시나리오 (두 기기)

1. **[가게]** 홈 → 기부 품목 등록 (30초)
2. **[시설]** 피드에 3초 내 자동 표시 → 픽업 신청
3. **[가게]** 매칭 확정 화면에 QR 표시
4. **[시설]** 픽업 탭 → QR 스캔 (또는 "인수 완료 처리(데모용)" 버튼)
5. 확인서 발급 → PDF 다운로드 → **[관리자]** 임팩트 대시보드

## 구조

- `src/lib/api.ts` — 서버 API 클라이언트 (전 엔드포인트 타입 포함, 서버와 교차검증됨)
- `src/lib/auth.tsx` — JWT 로그인·데모 계정 전환·역할별 라우팅
- `src/lib/hooks.ts` — 3초 폴링(`usePolling`)·시간 포맷 유틸
- `src/components/ui.tsx` — 토스풍 공용 컴포넌트 (Card/Button/Badge/EmptyState)
