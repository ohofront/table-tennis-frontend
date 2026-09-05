# API 연동 계약과 확인 필요 사항

현재 저장소에는 `01_백엔드_API_개발명세서.md`가 없습니다. 프론트엔드 명세서의 엔드포인트를 구현했으나 **아래 요청/응답 계약은 임시 가정이며 실제 백엔드 통합 검증을 완료하지 않았습니다.** 화면에 성공 데이터나 임의 계정을 주입하지 않습니다. 테스트에서만 독립된 fixture 응답을 사용합니다.

## 기본 계약

- `NEXT_PUBLIC_API_BASE_URL` + `/api/v1` + 경로. 기본 주소 `http://localhost:8080`.
- JSON 직접 응답 또는 `{ data: T }`. 목록은 `T[]` 또는 `{content: T[]}`. 목록 API가 페이지를 나눠 반환하면 totalPages를 따라 전체를 가져와 화면에서 10개씩 표시합니다. 대규모 데이터에는 서버 페이지네이션 UI로 변경 권장.
- 오류: `{message, fieldErrors: {[fieldName]: message}}` 또는 `{error:{message,fieldErrors}}`. API 오류 코드별 매핑은 백엔드 2.5절 확인 후 추가해야 합니다.
- ID는 문자열, 필드명은 camelCase. 날짜는 ISO 문자열, 승률은 0~100 단위.
- 세부 응답 타입: `lib/types.ts`. 백엔드 필드가 다르면 이 타입과 API 어댑터를 조정해야 합니다.

## 인증 및 권한

- `POST /auth/login`: `{email,password}` → `{accessToken,user:{...Player,role:'ADMIN'|'USER'}}`.
- `POST /auth/refresh`: 요청 본문 없음, httpOnly 쿠키 → 동일 Session 응답.
- `POST /auth/logout`: 서버가 refresh 쿠키를 만료시키고 세션을 폐기, 성공 응답 또는 204.
- refresh/logout 경로와 응답은 프론트엔드 문서에 정의되지 않아 가정했습니다.
- Access Token은 Zustand 메모리만 사용. localStorage/sessionStorage에 저장하지 않음. 재접속 시 refresh로 복구. 401 재발급은 동시 요청을 합치고 원래 요청을 한 번만 재시도.
- Refresh 쿠키는 백엔드가 httpOnly, SameSite=Lax, 운영환경 Secure, **Path=/** 및 프론트엔드에서도 수신 가능한 도메인으로 발급해야 합니다. 프론트/백엔드는 동일 사이트 리버스 프록시 구성을 권장합니다. localhost에서는 포트가 달라도 쿠키를 공유합니다.
- `AUTH_REFRESH_COOKIE_NAME` 기본 `refreshToken`. middleware는 쿠키가 없는 보호 경로 방문을 로그인으로 보냅니다. 쿠키 존재만으로 신원/ADMIN을 승인하지 않습니다. AuthGuard가 재발급된 서버 세션의 role을 확인합니다.
- 백엔드는 모든 쓰기 요청의 JWT/role/소유권을 검증해야 합니다. 프론트 가드는 보안 경계가 아닙니다. 서로 다른 origin을 사용하는 경우 명시적인 CORS origin과 credentials 허용이 필요합니다.

## 경기

- `/competitions/{id}` → `{competitionId,name,matchFormat,bestOf}`. 대회 목록을 선택한 후 대회 상세 응답의 competitions에서 경기 단계를 선택하고 형식을 자동 반영합니다. 대회 상세의 competitions 배열은 백엔드와 확인해야 하는 가정입니다.
- `POST /matches`: `{competitionId,matchFormat,participants:[{userId,side:'A'|'B'}],scheduledAt,venue,matchRound,courtNumber?,notes}` → `Match`(최소 matchId 필수).
- 단식 각 1명, 복식 각 2명, 단체전 각 3명 이상 동일 인원. 중복 선수 금지.
- `Match`: sideA/sideB에 Player 배열, bestOf에 홀수 최대 세트 수, sideAWins/sideBWins, winnerSide, status 포함.
- `POST /matches/{id}/sets`: `{sets:[{setNumber,sideAScore,sideBScore}],durationSeconds?}` → 서버가 계산한 Match.
- `PUT /matches/{id}/sets/{setId}`: 단일 세트 객체. 기존 세트 수정은 순차 실행하며 중간 실패 시 오류를 표시하고 다음 저장에서 다시 시도할 수 있습니다. 다중 수정의 원자성은 서버 지원이 필요합니다.
- 경기 시간은 최초 세트 등록 시 입력. 기존 시간 수정 API가 없어 기존 세트 편집에서 시간은 읽기 전용입니다.
- `POST /matches/{id}/finalize`: `{}` → Match. 저장 응답이 COMPLETED면 상세로 이동, 미확정이면 서버 결과와 별도 확정 버튼 제공.
- 5전제에서 2:1은 승리 아님. 11:9, 12:10, 13:11 등 세트 종료 점수만 허용. 12:9처럼 종료 시점을 지나친 점수는 오류. 서버가 최종 검증.

## 선수 / 랭킹

- 프로필 통계 응답에 `history:[{date,winRate}]`, `totalMatches,wins,losses,winRate,averageScore` 가정.
- `/rankings`의 period: MONTH / QUARTER / YEAR / ALL, ageGroup: 10/20/.../70 가정. 클럽/성별/기간 쿼리는 명세에 있고 연령 쿼리 이름은 추가 가정.
- 신규 선수는 문서에 허용된 `POST /auth/signup` 사용. 비밀번호 재입력은 API로 보내지 않음. role은 가입 요청에 포함하지 않음.
- `/users/{id}/tournaments`는 마이페이지의 최근 참가 대회 목록을 위한 추가 가정. 경기 이력은 명시된 `/players/{id}/matches` 사용.

## 커뮤니티

- Post 응답 `{id,title,content,authorName,createdAt,views}`. 실제 noticeNum/boardId 필드 사용 시 어댑터 필요.
- 등록 POST `/notices`, `/boards`, 수정 PUT `/{kind}/{id}`, 삭제 DELETE `/{kind}/{id}`. 관리 기능은 명시되었지만 쓰기 payload는 없어 `{title,content}`로 가정.
- Comment: `{commentId,content,authorName,createdAt,parentCommentId?,comment_depth}`. 댓글 POST는 `{content,parentCommentId?,comment_depth:0|1}`.
- 본문은 일반 텍스트로 렌더링. 사용자 HTML 실행 없음.

## 작업 범위

8번 섹션의 1~8단계가 요청 범위입니다. 대회 조회(3.8)는 메뉴 연결을 위해 추가했습니다. 대회 등록/수정, 참가선수 등록, 조편성 관리 쓰기 기능은 8번 단계에 포함되지 않아 구현하지 않았습니다. 선택 기능인 경기 랠리/서브 통계도 제외했습니다.
