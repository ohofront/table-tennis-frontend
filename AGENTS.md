# AGENTS.md

## API 연동 규칙

백엔드 API를 호출하는 코드를 작성하거나 수정할 때는 항상 아래를 따른다:

1. 작업 전에 https://table-tennis-api-production.up.railway.app/v3/api-docs 를
   fetch해서 최신 OpenAPI 스펙을 확인한다.
2. 요청 body/쿼리 파라미터는 스펙에 정의된 필드명, 타입, 필수 여부를 그대로 따른다.
3. 응답 파싱은 스펙의 response schema를 기준으로 한다
   (예: ApiResponse<T> 래퍼 구조 - {success, data, meta} 또는 {success, error}).
4. 정렬(sort), 필터 파라미터는 스펙에 명시된 기본값/형식(snake_case, "필드,방향" 등)을
   그대로 사용하고, 스펙에 없는 필드는 임의로 만들어 보내지 않는다.
5. 스펙만으로 확실하지 않은 부분(예: sort 허용값 전체 목록)은
   실제로 Swagger UI(https://table-tennis-api-production.up.railway.app/swagger-ui/index.html)에서
   Try it out으로 값을 바꿔가며 테스트해서 확인한다.
6. 회원가입/로그인 등 인증 관련 API는 백엔드가 최소 정보만 받는 구조일 수 있으므로,
   폼에 입력받는 필드와 실제 API가 받는 필드가 다를 경우:
   - 회원가입은 필수 필드만 우선 전송
   - 나머지 정보(연락처, 생년월일, 소속클럽, 성별 등)는 가입 후
     PUT /api/v1/users/{userId} 로 별도 저장하는 2단계 흐름을 우선 고려한다.
