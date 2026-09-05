# PINGPONG · 탁구 경기 기록 관리

프론트엔드 개발명세서 8번 섹션의 1~8단계로 구현한 Next.js 14 App Router 프로젝트입니다.

## 실행

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

http://localhost:3000 에서 확인합니다. 실제 API 서버의 origin을 `.env.local`의 `NEXT_PUBLIC_API_BASE_URL`에 설정하세요. 백엔드가 꺼져 있으면 각 영역에 연결 오류와 다시 시도 버튼이 표시됩니다.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

브라우저 테스트 실행 전 `pnpm exec playwright install chromium`이 필요할 수 있습니다. E2E는 API를 테스트 안에서 가로채므로 실제 백엔드가 필요하지 않습니다. 앱에는 가짜 로그인/샘플 데이터를 내장하지 않았습니다.

## 단계별 구현 결과

1. **스캐폴딩**: 명세의 app/(public), app/(admin), components/common·match·ranking, hooks, lib, store, styles 구조. React 18, TypeScript, Tailwind, React Query, Zustand, RHF/Zod.
2. **홈**: 오늘 경기, 상위 랭킹, 최근 결과, 관리자 경기 등록과 권한 안내. 각 요청의 로딩/빈 목록/오류/재시도.
3. **경기 등록 → 점수 입력**: 경기 단계 형식 자동 반영, 팀별 비동기 선수 검색, 중복·인원·메모 검증, 날짜/장소/라운드. 세트 종료/듀스/선승 규칙, 서버 저장 결과 표시, 명시적 경기 확정, 기존 세트 편집.
4. **경기 상세**: 경기 정보, 선수 링크, 세트 점수표, 승패, 관리자 편집/삭제.
5. **선수 관리·상세**: 300ms 검색, 클럽/성별/정렬, 반응형 표와 페이지 이동, ADMIN 등록/수정, 프로필/통계/최근 경기.
6. **통계·랭킹**: 기간/클럽/성별/연령 필터, Recharts 바 차트, 선수별 승률 추이 모달.
7. **커뮤니티**: 공지/게시판 목록·검색·상세, ADMIN 글 등록/수정/삭제, 로그인 회원 댓글 및 1단계 답글.
8. **인증**: 로그인/가입/본인 프로필 수정과 참가 기록, 메모리 Access Token, httpOnly Refresh Cookie 재발급, middleware + role 기반 AuthGuard. 서버 오류의 필드별 표시.

추가: 대회 목록/개요/참가선수/조편성/대진표 조회. 모바일 표는 카드, 점수 입력은 숫자 키패드, 모달은 포커스 제한·Esc 닫기·포커스 복원.

## API 계약과 제한

**백엔드 API 명세서가 제공되지 않아 실제 서버 연동은 검증하지 못했습니다.** 응답 형식, 인증 쿠키 조건, 추가 가정 엔드포인트, 범위 제외 기능은 [API 연동 가정](docs/API_연동_가정.md)을 확인하세요. ADMIN 계정은 실제 백엔드에서 발급해야 합니다. JWT/권한/소유권 검증은 백엔드에서도 필수입니다.

요청 버전에 맞춰 Next.js 14.2.35를 고정했습니다. [공식 2026년 5월 보안 공지](https://vercel.com/changelog/next-js-may-2026-security-release)는 14.x 전체에 대해 15.5.18 또는 16.2.6 이상으로 업그레이드를 안내합니다. **현재 14 버전 그대로 운영 배포하지 말고 지원되는 패치 버전으로 이전하세요.**

## 검증 결과

- `pnpm build`: 성공 (타입 검사 및 ESLint 포함)
- `pnpm test`: 38개 성공 — 듀스/선승/세트 순서, 참가 인원·중복, 회원가입, 리디렉션, 토큰 재발급 경쟁, 목록 페이지 누락 방지
- `pnpm test:e2e`: Chromium 8개 성공 — 데스크톱/390px 모바일, 경기 등록→점수 저장→확정, middleware 로그인 이동, USER의 ADMIN 접근 차단, 선수 검색·랭킹 차트, 답글, 로그인, API 오류 상태
- E2E는 테스트 API 응답을 사용했습니다. 실제 백엔드 통합 검증은 별도로 필요합니다.
