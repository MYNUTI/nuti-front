# API 연동 작업 플랜

> 상태: **13단계 v3 동기화 완료** (2026-11-24). 배포 서버가 v3로 바뀌어 04–11단계 데이터 레이어를 v3에 맞췄다(아래 「13단계 상세」). 다음은 12단계 화면 연결이고, 12-2(상세)는 UI 브랜치의 상세 작업이 `main`에 머지되면 시작한다. 11단계 OAuth 콜백 화면은 아래 「남은 질문」의 답을 받은 뒤 한다. 이 문서는 범위·순서·결정만 기록한다. 항목별 진행 체크는 개인 체크리스트(리포 밖)에서 한다.

## 목적

디자인이 확정되기 전에 화면과 무관하게 쓸 수 있는 데이터 레이어를 먼저 만든다.

- 만드는 것: API 클라이언트, 타입, API 함수, 쿼리 키, 훅, 인증 흐름
- 건드리지 않는 것: 페이지·컴포넌트의 스타일과 레이아웃. 데이터를 받아오는 부분만 바꾼다
- 명세가 애매하거나 빠진 부분은 추측해서 채우지 않는다. 근거가 있는 가정만 「진행 가정」에 적고, 확인할 것은 「남은 질문」으로 남긴다

## 기준 문서

공개 리포라 내부 문서 링크는 싣지 않는다. 주소는 팀 공지를 참고한다.

- 노션 「API 명세서」(팀 워크스페이스) — 엔드포인트별 정책·예외 처리 규칙
- 배포 API 서버의 Swagger(`/swagger-ui/index.html`, JSON은 `/v3/api-docs`) — 실제 요청·응답 필드
- 백엔드 소스 — Swagger에 없는 에러 응답 형태와 헤더 처리 확인용

## 현재 스택 (2026-10-25 확인)

- Next.js 16.3(App Router, React Compiler), React 19.2 — 페이지는 기본이 서버 컴포넌트다
- HTTP: axios 1.19 — `src/lib/api.ts`에 baseURL만 넣은 인스턴스가 있고 사용처는 없다
- 서버 상태: TanStack Query 5 — `src/app/providers.tsx`의 QueryClient는 기본 옵션이 없다. 실제 조회는 스캔 결과(`scan-stage.tsx`, 키 `["product", gtin]`) 한 곳뿐이다
- 클라이언트 상태: 전역 상태 라이브러리와 localStorage 사용처가 없다
- 환경변수: `NEXT_PUBLIC_API_URL` 하나. `next.config.ts`에 `rewrites`는 없다
- 테스트: vitest 5. `lib/scan`의 순수 함수 위주다
- 이어서 쓰는 것: `lib/scan/lookup.ts`의 포트와 `LookupOutcome` 계약(미등록은 결과로 돌려주고 네트워크 실패만 reject)

## 범위

v3(13단계) 기준 사용자 API 32개를 데이터 레이어로 만들었다 — 앱 진입 1, 동의 3, 상품 3, 목표 2, 검색 3, 저장 3, 마이·설정 5, 인증 4, 기여 2, 로깅 6. 엔드포인트별 목록은 아래 「기능 → 엔드포인트 매핑」에 있다. 처음(04–11단계)에는 v3 이전 1차 사용자 API 37개를 기준으로 했다.

`DELETE /users/me`는 화면 진입점이 정해지지 않아 API 함수만 만든다(훅 없음).

쓰는 화면을 만들 때 넣는 v3 API(아직 데이터 레이어 없음):

- 홈 `GET /home`, 최근 본 제품 `GET /me/history`, 내 기여 `GET /me/contributions`, 많이 요청된 제품 `GET /analysis-requests/popular`
- 몸 정보 `GET`·`PUT`·`DELETE /me/body-profile`(5-7), 내 정보 수정 `PATCH /users/me`
- 제품 비교 `GET /products/compare`(3-5), 등급 기준 안내 `GET /grades/guide`(5-4, 지금은 문구를 코드에 둔다), 구매 링크 `GET /products/{id}/purchase-link`(결과의 `purchase`와 같다)
- 랭킹 `GET /rankings/categories`·`/rankings/leaders`·`/rankings`·`/rankings/overview`·`/rankings/filters`·`/rankings/brands`(2-2·2-5) — 12-5에서 만든다. `leaders`는 백엔드 `1ddb9b4` 뒤에 생겼다(배포 Swagger·백엔드 `origin/main` `RankingController`, 2026-11-28 확인)

제외:

- 관리자 API — 관리자 페이지에서 쓴다
- 설명이 v3 이전인 `GET /categories`·`/brands`·`/categories/{id}/brands`·`/products`·`/products/nutrient-claims` — 화면을 만들 때 쓸지 정한다
- OAuth 콜백 `GET /auth/oauth/{provider}` — 백엔드가 처리하고 프론트는 리다이렉트된 `?code&provider`만 받는다

## 기능 → 엔드포인트 매핑

v3(13단계) 기준이다. v3 이전과 다른 점과 고친 단계는 [`API-v3-동기화.md`](API-v3-동기화.md)에 있다. 화면 대신 기능 단위로 묶는다. 실제 화면에 붙일 때는 화면 → 기능 연결만 따로 하면 된다.

- 식별: 익명 ID는 기기가 늘 만들어 보낸다(13-1). 「로그인」은 토큰이 있어야 한다(없으면 401). 둘 다 있으면 서버가 계정을 우선한다
- 「성공 후 다시 불러올 조회」는 변경 요청이 성공한 뒤 무효화하거나 캐시를 직접 고치는 대상이다
- 화면의 내 목표는 기기 쿠키(`useDeviceGoal`)다. 목표에 따라 달라지는 목록은 요청마다 `goal`을 실어 보내고 키에 넣는다(13-3)

### 앱 진입·동의

| 기능                | 엔드포인트                | 종류 | 식별   | 훅                 | 메모                                                                                                               | 성공 후 다시 불러올 조회                                                                              |
| ------------------- | ------------------------- | ---- | ------ | ------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 앱 진입 초기화      | `GET /app/bootstrap`      | 조회 | 선택   | `useBootstrap`     | 선택 동의 상태·칼로리 구간·계정 목표·현재 정책 판. 첫 실행·온보딩 완료는 기기 기록(`storage.ts`)이라 서버가 모른다 |                                                                                                       |
| 가입 동의 항목      | `GET /meta/consent-items` | 조회 | 없음   | `useConsentItems`  | 항목 6개와 지금 약관·처리방침 판                                                                                   |                                                                                                       |
| 내 동의             | `GET /me/consents`        | 조회 | 로그인 | `useMyConsents`    |                                                                                                                    |                                                                                                       |
| 선택 동의 켜기·철회 | `PUT /me/consents/{item}` | 변경 | 로그인 | `useChangeConsent` | 선택 항목만. 목표 저장을 켜면 기기 목표를 함께 보낸다. 철회하면 그 동의로 저장한 데이터를 서버가 지운다            | 내 동의(응답으로 교체), bootstrap. 목표 저장이면 계정 목표를 보여 주는 조회, 몸 정보면 상품·검색·저장 |

### 상품·등급

| 기능             | 엔드포인트                               | 종류 | 식별 | 훅                                            | 메모                                                                                                                                           |
| ---------------- | ---------------------------------------- | ---- | ---- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 바코드 스캔 조회 | `GET /products/barcode/{barcode}`        | 조회 | 선택 | `useProductByBarcode`                         | `outcome`: RESULT·NO_SCORE·MULTIPLE·NOT_FOUND(미등록도 200). 체크섬 400은 결과로 돌려준다. 미등록·점수 없음은 서버가 분석 요청을 자동 등록한다 |
| 제품 결과        | `GET /products/{productId}`              | 조회 | 선택 | `getProductDetail`(서버) · `useProductDetail` | 두 목표 결과를 함께 준다. 조회수 +1, 최근 본 제품에 기록. 없거나 비활성이면 404                                                                |
| 더 맞는 제품     | `GET /products/{productId}/alternatives` | 조회 | 선택 | `useAlternatives`                             | `goal` 필수로 보낸다. page 0부터                                                                                                               |

### 목표

| 기능           | 엔드포인트     | 종류 | 식별          | 훅              | 메모                                                                                                                        | 성공 후 다시 불러올 조회                             |
| -------------- | -------------- | ---- | ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 계정 목표 조회 | `GET /me/goal` | 조회 | 선택          | `useMyGoal`     | 계정에 저장한 목표와 「목표 계정 저장」 동의 여부. 화면의 내 목표로 쓰지 않는다                                             |                                                      |
| 목표 바꾸기    | `PUT /me/goal` | 변경 | 로그인 + 동의 | `useChangeGoal` | 기기 목표를 먼저 바꾸고, 동의한 로그인 계정만 계정에도 저장한다(실패는 알리지 않음). 아니면 401·403 `GOAL_CONSENT_REQUIRED` | 계정 목표를 보여 주는 조회(목표·마이·설정·bootstrap) |

### 검색

| 기능          | 엔드포인트                     | 종류 | 식별 | 훅                     | 메모                                                                            |
| ------------- | ------------------------------ | ---- | ---- | ---------------------- | ------------------------------------------------------------------------------- |
| 검색          | `GET /search`                  | 조회 | 선택 | `useSearch`            | 한 목록(+ `pinned`·`category`), `goal` 필수, `sort` 선택. 0건도 200. page 0부터 |
| 검색 자동완성 | `GET /search/suggestions`      | 조회 | 없음 | `useSearchSuggestions` | 2~30자일 때만 보낸다                                                            |
| 인기 검색어   | `GET /search/keywords/popular` | 조회 | 없음 | `usePopularKeywords`   | `{ basedAt, keywords }`                                                         |

### 저장

| 기능      | 엔드포인트                              | 종류 | 식별 | 훅                      | 메모                                                 | 성공 후 다시 불러올 조회                                              |
| --------- | --------------------------------------- | ---- | ---- | ----------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| 저장 목록 | `GET /me/saved-products`                | 조회 | 필수 | `useSavedProducts`      | 목록 카드, `goal` 필수. page 1부터                   |                                                                       |
| 제품 저장 | `POST /me/saved-products/{productId}`   | 변경 | 필수 | `useSaveProduct`        | 동의 필요 없음. 200개 초과 409 `SAVE_LIMIT_EXCEEDED` | 저장 목록, 마이. 상세·검색은 다시 부르지 않고 캐시의 `saved`만 바꾼다 |
| 저장 해제 | `DELETE /me/saved-products/{productId}` | 변경 | 필수 | `useRemoveSavedProduct` | 없는 것을 지워도 200                                 | 저장과 같다                                                           |

### 마이·설정

| 기능          | 엔드포인트           | 종류 | 식별   | 훅                                | 메모                                                                             |
| ------------- | -------------------- | ---- | ------ | --------------------------------- | -------------------------------------------------------------------------------- |
| 마이 화면     | `GET /me/summary`    | 조회 | 선택   | `useMeSummary`                    | 비로그인이면 `profile`이 null. `goal`은 계정 목표                                |
| 내 정보       | `GET /users/me`      | 조회 | 로그인 | `useUser`                         |                                                                                  |
| 회원 탈퇴     | `DELETE /users/me`   | 변경 | 로그인 | `authMutations.withdraw`(훅 없음) | 사유를 받지 않는다. 뒤처리는 로그아웃과 같고 기기 목표·온보딩 완료 기록도 지운다 |
| 설정 조회     | `GET /me/settings`   | 조회 | 선택   | `useMeSettings`                   | `PATCH /me/settings`는 목표만 받아 `PUT /me/goal`과 겹쳐 쓰지 않는다(13-3)       |
| 약관·처리방침 | `GET /meta/policies` | 조회 | 없음   | `usePolicies`                     |                                                                                  |

### 인증

| 기능                    | 엔드포인트           | 종류 | 식별            | 훅                    | 메모                                                                                                      | 성공 후 다시 불러올 조회                    |
| ----------------------- | -------------------- | ---- | --------------- | --------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 소셜 로그인 + 기록 병합 | `POST /auth/oauth`   | 변경 | 익명 ID(병합용) | `useLogin`            | 처음 로그인이면 토큰 없이 `SIGNUP_REQUIRED`(가입 토큰)를 돌려준다. 가입한 계정은 종류별 병합 수(`merged`) | 사용자 데이터 조회 전부(가입한 계정일 때만) |
| 가입                    | `POST /auth/signup`  | 변경 | 익명 ID(병합용) | `useSignup`           | 가입 토큰 + 동의 6항목 + 판. 「목표 계정 저장」에 동의했을 때만 기기 목표를 보낸다                        | 사용자 데이터 조회 전부                     |
| 토큰 재발급             | `POST /auth/refresh` | 변경 | refresh 토큰    | (인터셉터·`proxy.ts`) | 만료 전에 갱신한다. 거절되면 이 기기만 로그아웃                                                           | 없음                                        |
| 로그아웃                | `POST /auth/logout`  | 변경 | 로그인          | `useLogout`           | 새 익명 ID는 클라이언트가 만든다                                                                          | 사용자 데이터 조회 전부(캐시 비움)          |

### 기여

| 기능      | 엔드포인트                           | 종류 | 식별 | 훅                   | 메모                                                                                                   | 성공 후 다시 불러올 조회 |
| --------- | ------------------------------------ | ---- | ---- | -------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------ |
| 분석 요청 | `POST /analysis-requests`            | 변경 | 선택 | `useRequestAnalysis` | 바코드·검색어·보강·제품명 요청. 분석 완료 409 `ALREADY_ANALYZED`, 검색어·제품명 합쳐 하루 5건 초과 429 | 마이                     |
| 오류 제보 | `POST /products/{productId}/reports` | 변경 | 선택 | `useReportProduct`   | 항목 여러 개, 기타는 내용 필수. 하루 10건 초과 429                                                     | 없음                     |

### 로깅

응답을 기다리지 않고, 실패해도 무시한다. 다시 불러올 조회는 없다. 개발 중에는 끈다(`NEXT_PUBLIC_LOGGING_ENABLED`).

| 기능                          | 엔드포인트                               | 함수                                                                |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| 상품 조회·구매 버튼·검색·필터 | `POST /logging/{view,cta,search,filter}` | `logProductView`·`logProductCta`(keepalive)·`logSearch`·`logFilter` |
| 스캔 실패                     | `POST /logging/scan-event`               | `logScanEvent`                                                      |
| 앱 이벤트(이름 61개)          | `POST /events`                           | `logEvent`(keepalive)                                               |

## Swagger 확인 결과 (2026-10-24)

> v3 이전 Swagger를 확인한 기록이다. v3 Swagger 확인 결과(스키마 이름 충돌 등)는 [`API-v3-동기화.md`](API-v3-동기화.md)에 있다.

범위의 37개는 모두 Swagger에 있다.

확인된 것:

- 성공 응답은 `{isSuccess, data}`로 감싼다
- 에러 응답은 Swagger에 없다. 백엔드 소스 기준으로 `{isSuccess: false, data: {timestamp, path, code, message, details}}`이고 에러 코드는 `data.code`에 온다
- 경로는 서버 루트에 바로 붙는다(`/api` 접두사 없음)
- `nutrition` 키는 영문이다 — `calories`, `protein`, `sugar`, `saturatedFat`, `transFat`, `cholesterol`, `sodium`, `dietaryFiber`
- 대부분 API에 보이는 `actor` query 파라미터는 문서 생성 오류다. 서버가 `Authorization`·`X-Anonymous-Id`·`X-Session-Id`·`X-Cohort` 헤더로 만들므로 보내지 않는다

주의할 것:

- enum이 하나도 없고, 필수 필드를 표시한 스키마가 189개 중 1개뿐이다. 허용값과 null 여부는 Swagger만으로 알 수 없다
- 상품 상세 응답에 새 필드(`product`, `grade`, `nutrition`, `saved`)와 예전 필드(`id`, `name`, `pns`, `coupang`, `nutrients`, `favorited` 등)가 섞여 있다
- `DELETE /users/me`의 탈퇴 사유가 노션 명세(body)와 달리 query다
- `localhost:3000` 출처의 CORS 프리플라이트에 `Access-Control-Allow-*` 헤더가 없었고, 백엔드 소스에도 CORS 설정이 없다
- 배포 서버는 운영 데이터다. 상품 조회만 해도 조회수가 오르고, 없는 바코드는 분석 대기 목록에 등록된다. 개발 중 호출은 팀이 허용해 이 부수 효과를 감수한다(「진행 가정」)
- 만료된 액세스 토큰은 401이 아니라 비로그인 요청으로 처리된다(백엔드 소스 `JwtAuthenticationFilter`, `SecurityConfig`). 1차 범위의 거의 모든 경로가 로그인 없이 열려 있어서, 만료 토큰으로 조회하면 200과 함께 익명 ID 기준 값(일반 기준 등급, `saved` false)이 온다. 로그인이 필요한 경로는 `/users/**` 정도다. `TOKEN_EXPIRED`는 `/auth/refresh`에서 refresh 토큰이 만료됐을 때만 나온다

## 작업 흐름

보통은 기능 하나씩 스펙 합의 → 목으로 병렬 개발 → 실제 API로 교체를 반복한다. 이 프로젝트는 목 없이 배포 서버로 바로 개발하고, 디자인이 확정될 때까지 화면 연결만 뒤로 미룬다.

1. **스펙 합의** — 화면에 필요한 데이터를 정리하고 백엔드와 엔드포인트·응답 형태를 맞춘다
2. **기반 레이어** — HTTP 클라이언트, 인증 헤더, 토큰 갱신, 공통 에러 처리, QueryClient 설정. 한 번만 만든다
3. **기능 단위 반복** — 타입 → API 함수 → 쿼리 키·훅 → 화면 연결 → 로딩·에러·빈 상태. 배포 서버로 확인한다
4. **명세 차이 반영** — 명세와 다른 점은 백엔드에 알리고 명세를 고친 뒤 「스펙 합의」로 돌아간다. 차이는 mapper에서 흡수한다
5. **예외 케이스 점검** — 토큰 만료, 네트워크 끊김, 빈 결과, 권한 에러를 실제 서버에서 확인한다

레이어 단위로 진행하되, 06단계에서 상품 도메인 하나를 `lookup.ts`와 상세 페이지 연결까지 끝까지 만들어 패턴을 먼저 검증한다.

## 단계

각 단계가 끝나면 `pnpm typecheck`, `pnpm lint`(테스트를 추가한 단계는 `pnpm test`까지)를 통과시키고 확인받은 뒤 다음 단계로 넘어간다.

| 단계 | 이름                  | 할 일                                                                                                                                                                                                                                                                                                                                                                                                                         | 확인받을 것              |
| ---- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 00   | 명세 확보             | 노션 명세 받기, 범위 확정                                                                                                                                                                                                                                                                                                                                                                                                     | 범위 (완료)              |
| 01   | 사전 정리             | 현재 스택 요약, 기능 → 엔드포인트 매핑표, 진행 가정·남은 질문                                                                                                                                                                                                                                                                                                                                                                 | —                        |
| 02   | 백엔드 확인(병행)     | 답을 기다리지 않고 「진행 가정」으로 03단계 이후와 함께 진행한다. 「남은 질문」 답이 오면 가정을 바꾼다. 질문마다 답이 필요한 단계가 있으면 그 단계 전까지 받는다                                                                                                                                                                                                                                                             | —                        |
| 03   | 구조·라이브러리 결정  | 아래 「03단계 결정 항목」                                                                                                                                                                                                                                                                                                                                                                                                     | 결정 항목 전부           |
| 04   | API 클라이언트        | 기존 `src/lib/api.ts`를 `client.ts`로 옮겨 확장, 쿠키 저장 모듈(토큰·익명 ID·세션 ID 읽기·쓰기), 브라우저·서버 base URL 분리(서버 전용 `API_URL`), `next.config.ts` rewrites(`/api/:path*` → 백엔드 `/:path*`), 인증·익명 ID·세션 헤더, `data` 언래핑, `ApiError`(`data.code`) 통일, 만료 전 토큰 갱신(JWT `exp` 확인, 동시 요청은 한 번만), 갱신 실패 시 로그아웃, 상세 경로 `proxy.ts`, 쿠키 속성(`Secure`·`SameSite`·만료) | —                        |
| 05   | 타입 정의             | 공통 타입은 04단계에서 만든다. 상품 DTO·mapper와 `INSUFFICIENT` 표현 방식. 나머지 도메인 DTO는 08단계에서 도메인마다 만든다                                                                                                                                                                                                                                                                                                   | `INSUFFICIENT` 표현 방식 |
| 06   | 핵심 도메인: 상품     | 아래 「06단계 상세」                                                                                                                                                                                                                                                                                                                                                                                                          | 상품 도메인 패턴         |
| 07   | QueryClient·공통 상태 | 기존 `src/app/providers.tsx`의 기본 옵션, 로딩·에러·빈 데이터 처리 방식, 에러 알림 공통 함수, 동의 필요(403) 처리                                                                                                                                                                                                                                                                                                             | 로딩·에러 처리 방식      |
| 08   | 나머지 도메인         | `onboarding` → `goal` → `saved` → `search` → `me` → `contribution` → `logging`. 도메인마다 `types` → `mapper` → `api` → `keys` → `queries` 순서                                                                                                                                                                                                                                                                               | —                        |
| 09   | 캐시 무효화 규칙      | 목표·설정 변경, 저장·해제, 건강정보 동의·철회, 분석 요청, 로그인·로그아웃·탈퇴 후 다시 불러올 조회. 초안은 「기능 → 엔드포인트 매핑」 참고                                                                                                                                                                                                                                                                                    | —                        |
| 10   | ~~목 데이터~~         | 취소(2026-11-02). 개발 중에도 배포 서버를 쓴다                                                                                                                                                                                                                                                                                                                                                                                | —                        |
| 11   | 인증 흐름             | OAuth 콜백 화면, 쿠키 저장 모듈로 토큰 저장·읽기, 로그아웃 시 익명 ID 교체, 로그인 상태 판단, 보호 라우트                                                                                                                                                                                                                                                                                                                     | —                        |
| 12   | 화면 연결             | 아래 「12단계 상세」. UI 브랜치에서 완료된 화면의 `_fixtures.ts` import를 쿼리 훅 + mapper로 바꾼다. 06단계에서 미룬 스캔·상세 연결도 여기서 한다                                                                                                                                                                                                                                                                             | 하위 단계마다            |
| 13   | v3 동기화             | 아래 「13단계 상세」. 배포 서버 v3 응답에 맞춰 04–11단계 데이터 레이어를 고친다. **12단계 나머지보다 먼저 한다**                                                                                                                                                                                                                                                                                                              | 하위 단계마다            |

### 03단계 결정 항목

- ~~목 서버 도구~~ — 정해짐: 만들지 않는다(2026-11-02). 개발 중에도 배포 서버를 쓴다. 테스트는 테스트마다 axios `adapter`를 바꿔 끼워 응답을 만든다
- ~~타입 작성 방식~~ — 정해짐: 명세·Swagger·백엔드 소스를 보고 쓰는 필드만 직접 작성한다. 허용값은 유니온, null 여부는 소스 주석 기준이고 예전 필드는 넣지 않는다. 자동 생성은 Swagger에 enum·필수 정보가 없고 30개 API에 `actor`가 필수로 잘못 표시돼 쓰지 않는다. 개발 서버가 생기거나 Swagger에 enum·필수 표시가 들어오면 생성 결과를 변경 감지용으로 붙이는 것을 다시 검토한다
- ~~토큰 저장 위치~~ — 정해짐: 토큰과 익명 ID를 스크립트로 읽을 수 있는 일반 쿠키에 둔다. 브라우저 요청은 인터셉터가 쿠키 값을 읽어 헤더에 붙이고, 서버 요청은 `cookies()`로 읽어 붙인다. 읽고 쓰는 코드는 한 파일에 모아, 보안 검토에서 httpOnly가 필요해지면 저장 부분만 바꾼다. 노션 명세는 익명 ID를 localStorage에 둔다고 적었지만 프론트 내부 구현이라 서버에는 영향이 없다. 액세스 토큰은 만료되기 전에 미리 갱신한다(JWT `exp` 확인). 만료 토큰은 401 없이 비로그인으로 처리되기 때문이다. 브라우저는 인터셉터가, 상세 경로는 렌더 전에 실행되는 `proxy.ts`가 갱신한다. 서버 컴포넌트는 렌더 중에 쿠키를 저장할 수 없다(Next 16 `cookies.md`). `proxy.ts`는 브라우저 갱신과 겹치지 않게 페이지 이동 요청에서만 갱신한다. `proxy.ts`는 새 토큰을 응답의 `Set-Cookie`와 `NextResponse.next({ request: { headers } })`의 요청 `cookie` 헤더 양쪽에 넣는다. 응답에만 넣으면 같은 요청에서 렌더되는 서버 컴포넌트의 `cookies()`가 만료된 토큰을 읽어 일반 기준 등급이 나오고, `HydrationBoundary`·`staleTime` 때문에 그 값이 화면에 남는다(Next 16 `proxy.md`). 바꾼 요청 쿠키를 `cookies()`가 읽는 것은 04단계에서 next 16.4.3 소스로 확인했다(요청 헤더 덮어쓰기와 응답 쿠키의 `x-middleware-set-cookie` 병합 둘 다)
- ~~상세 페이지 조회 위치와 base URL~~ — 정해짐: 상세는 서버 컴포넌트에서 쿠키의 익명 ID·토큰을 붙여 개인 기준으로 한 번 조회한다. 백엔드가 조회마다 조회수를 올리고 서버의 axios 요청은 Next가 중복 제거하지 않으므로, 조회 함수를 React `cache()`로 감싸 `generateMetadata`와 페이지가 한 번만 부르게 한다. base URL은 브라우저가 `NEXT_PUBLIC_API_URL`(값은 `/api`, rewrites), 서버가 서버 전용 환경변수(예: `API_URL`)의 백엔드 주소를 쓴다. `NEXT_PUBLIC_API_URL`에는 백엔드 주소를 넣지 않는다. 브라우저가 백엔드를 직접 부르면 CORS에 막히고 주소가 번들에 들어간다. 쿠키를 읽으므로 상세 페이지는 요청마다 렌더링된다. 서버 조회 결과는 `HydrationBoundary`로 클라이언트 캐시에 넣고 `useProductDetail`과 같은 쿼리 키를 쓴다. 마운트 직후 다시 조회하지 않게 `staleTime`을 준다. 저장·해제는 `setQueryData`로 `saved`만 바꾸고(재조회 없음), 목표 변경은 무효화해서 다시 조회한다(조회수 1 증가는 감수)
- ~~CORS 대응~~ — 정해짐: 실제 서버 연동은 Next.js rewrites로 중계한다. 프론트 페이지 경로와 겹치지 않게 `/api` 접두사를 쓴다(「진행 가정」)
- ~~만들 파일 목록과 순서~~ — 정해짐: 아래 「파일 구조」

### 파일 구조

공통 기반은 `src/lib/api/`, 도메인은 `src/lib/<도메인>/`에 둔다. 테스트는 `lib/scan/`처럼 같은 폴더에 둔다. 페이지·컴포넌트는 데이터를 받아오는 줄만 바꾼다.

공통 기반 `src/lib/api/`:

| 파일                 | 역할                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client.ts`          | 브라우저용 axios 인스턴스와 인터셉터. 기존 `src/lib/api.ts`를 옮겨 확장한다. baseURL은 `NEXT_PUBLIC_API_URL`(값은 `/api`)을 읽는다                    |
| `server.ts`          | 서버 컴포넌트용 인스턴스. `server-only`, `API_URL`, `cookies()`로 헤더 첨부                                                                           |
| `identity.ts`        | 쿠키 저장 모듈. 쿠키 이름 상수와 브라우저 쪽 토큰·익명 ID·세션 ID 읽기·쓰기                                                                           |
| `identity.server.ts` | 서버 쪽 쿠키 읽기. `identity.ts`와 같은 쿠키 이름을 쓴다                                                                                              |
| `errors.ts`          | `ApiError`, 에러 코드 유니온, 에러 응답 정규화                                                                                                        |
| `refresh.ts`         | 만료 전 토큰 갱신. JWT `exp`를 보고 요청 전에 `/auth/refresh`를 부르며, 동시 요청은 갱신 한 번을 공유한다. 브라우저 인터셉터와 `proxy.ts`가 같이 쓴다 |
| `types.ts`           | 공통 타입: `{isSuccess, data}` 래퍼, 에러 응답, 페이지네이션                                                                                          |
| `response.ts`        | 성공 응답에서 `data`를 꺼내는 `unwrap`. 브라우저·서버 인스턴스가 같이 쓴다                                                                            |
| `query-client.ts`    | QueryClient 기본 옵션(재시도·재조회)과 변경 실패 리스너. `getQueryClient`는 서버 렌더마다 새로, 브라우저는 하나를 쓴다                                |

도메인 `src/lib/<도메인>/` — `product`, `onboarding`, `goal`, `search`, `saved`, `me`, `auth`, `contribution`, `logging`:

| 파일         | 역할                                                        |
| ------------ | ----------------------------------------------------------- |
| `types.ts`   | 서버 필드 그대로의 DTO와 화면 모델                          |
| `mapper.ts`  | DTO → 화면 모델                                             |
| `api.ts`     | 엔드포인트당 함수 하나                                      |
| `keys.ts`    | 쿼리 키 팩토리                                              |
| `queries.ts` | `queryOptions`, 조회·변경 훅, 변경 성공 후 다시 불러올 조회 |

그 밖에 바뀌는 파일:

- `next.config.ts` — rewrites. 목적지는 `API_URL`을 읽는다. rewrites가 빌드할 때 평가되는지는 04단계에서 문서로 확인한다
- `.env.example` — `API_URL` 추가, `NEXT_PUBLIC_API_URL` 값을 `/api`로. rewrites의 `/api/:path*`와 값이 같아야 한다
- `src/proxy.ts` — 상세 경로에서 렌더 전 토큰 갱신. 새 쿠키를 응답 `Set-Cookie`와 요청 `cookie` 헤더(`NextResponse.next({ request: { headers } })`) 양쪽에 넣는다
- `src/app/providers.tsx` — `getQueryClient()`로 받은 QueryClient를 제공한다. 기본 옵션·변경 실패 리스너는 `src/lib/api/query-client.ts`
- `src/test/` — 테스트 헬퍼. 테스트용 axios `adapter`, `document.cookie`·`location`·Web Locks 흉내
- `src/hooks/` — 여러 도메인에 걸친 훅만 둔다(예: 403 동의 필요 처리). 도메인 훅은 도메인 폴더에 둔다

단계별 순서:

| 단계 | 파일                                                                                                                                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 04   | `api/types.ts`, `errors.ts` → `identity.ts`, `identity.server.ts` → `client.ts`(기존 `api.ts` 이동) → `refresh.ts` → `server.ts` → `src/proxy.ts` → `next.config.ts`, `.env.example` → 테스트                      |
| 05   | `product/types.ts`, `product/mapper.ts` + 테스트                                                                                                                                                                   |
| 06   | `product/api.ts`, `keys.ts`, `queries.ts` → `lib/scan/lookup.ts` 연결 → `scan-stage.tsx` 쿼리 키 이관 → 상세 페이지 서버 조회(`cache()`, `HydrationBoundary`) → 목 카탈로그 이름 변경(테스트 import 포함) → 테스트 |
| 07   | `providers.tsx` → 에러 알림 공통 함수 → `src/hooks/` 동의 필요 처리 훅                                                                                                                                             |
| 08   | `onboarding` → `goal` → `saved` → `search` → `me` → `contribution` → `logging` 폴더                                                                                                                                |
| 09   | 각 도메인 `queries.ts`의 다시 불러올 조회 확정                                                                                                                                                                     |
| 10   | 없음(취소)                                                                                                                                                                                                         |
| 11   | `auth/` → OAuth 콜백 화면(경로는 `frontendUrl` 답변 후)                                                                                                                                                            |

주의할 것:

- 기존 목 카탈로그 `src/lib/product.ts`와 새 `src/lib/product/` 폴더는 import 경로(`@/lib/product`)가 겹친다. 06단계에서 목 카탈로그를 다른 이름(예: `src/lib/mock-catalog.ts`)으로 옮긴다. `src/lib/product.test.ts`, `src/lib/scan/lookup.test.ts`의 import도 함께 고친다(12-1에서 삭제)
- `server-only`는 Next가 타입을 선언해 두어(`next/types/global.d.ts`) 설치하지 않아도 typecheck는 통과한다. vitest는 Next 컴파일러를 거치지 않아 서버 모듈을 import하면 패키지를 못 찾는다(04단계에서 확인). 정해짐: `vitest.config.mts`에서 빈 모듈로 별칭한다. 패키지를 설치해도 `react-server` 조건이 아니면 import 즉시 throw해 해결되지 않는다

### 06단계 상세

- API 함수: `GET /products/barcode/{barcode}`, `GET /products/{productId}`, `GET /products/{productId}/grade-reason`
- `productKeys` 쿼리 키 팩토리. 스캔 시트의 기존 `["product", gtin]` 키도 여기로 옮긴다
- 조회 훅: `useProductByBarcode`, `useProductDetail`, `useGradeReason`
- `lookup.ts`를 실제 API에 연결한다. 404 `PRODUCT_NOT_FOUND`는 에러가 아니라 not-found 결과로, 400 `BARCODE_CHECKSUM_INVALID`는 따로 구분한다
- 상세 페이지의 데이터 소스도 같은 단계에서 API로 바꾼다. 스캔 결과 id와 상세 조회 id가 같은 소스에서 나와야 스캔 → 상세가 `notFound()`로 떨어지지 않는다. 홈 「최근 본 제품」은 맞는 1차 API가 없어 fixture(`app/home/_fixtures.ts`)로 둔다. 서버에서 쿠키의 식별을 붙여 조회하고, 조회 함수는 React `cache()`로 감싼다. 서버 조회 결과는 `HydrationBoundary`로 클라이언트 캐시에 넣어 `useProductDetail`과 같은 키로 이어 쓴다
- path 값은 `encodeURIComponent`로 넣고, 이상한 id로 상세에 들어오면 `notFound()`
- 등급 없음 응답(200 + `INSUFFICIENT`, grade·topReason 없음) 처리
- 테스트: mapper, lookup. 기존 테스트로 고정한 성질(프로토타입 키 방어, not-found 계약)이 유지되는지 확인
- 화면 연결은 미뤘다(2026-11-03). 디자인 확정·UI 브랜치 머지 뒤에 아래를 한다
  - `scan-stage.tsx`를 `useProductByBarcode`로 옮기고 등급 없음·미등록·체크섬 오류 분기를 넣는다. 앞자리가 0이 아닌 14자리 직접 입력(400 `BAD_REQUEST`)을 입력 단계에서 막을지 정한다. 목 `lookupProduct`와 `ScanResult`를 지운다
  - 상세 페이지를 `getProductDetail`·`notFound()`·`HydrationBoundary`로 바꾼다. 서버 prefetch용 QueryClient는 `retry`를 끈다. 기본 옵션의 `retry` 함수가 TanStack의 서버 기본값(0)을 덮어 조회수가 두 번 오를 수 있다
  - 실제 서버로 `cache()` 중복 제거, 스캔 → 상세, proxy 갱신 뒤 개인 기준 렌더를 확인한다
  - → 12단계 12-1·12-2로 옮겼다

### 12단계 상세

UI 브랜치(`feat/ui`)가 `main`에 머지한 화면만 연결한다(2026-11-28 #15 머지 기준). 연결 지점은 각 화면이 import하는 `_fixtures.ts`다. 무엇을 부를지는 위 「기능 → 엔드포인트 매핑」을 따르고, fixture는 꽂을 자리를 찾는 데만 쓴다. 맞는 API가 없는 값은 fixture로 남기고 아래 「API가 없는 값」에 적는다. 하위 단계마다 검증 명령을 통과시키고 확인받은 뒤 넘어간다.

화면 쪽 처리(버튼 `isPending` 잠금, 가입 토큰 전달 등)는 아래 「화면 연결 때 챙길 것」을 따른다.

먼저 할 화면(2026-11-28): 온보딩 · 검색 · 스캔 · 정렬 · 필터 · 랭킹 · 상세. 정렬은 검색 결과와 랭킹에, 필터는 랭킹(2-5)에 있다. 이 화면들이 쓰는 5-2 목표 바꾸기와 3-6 제품 요청하기(`/contribute/request`)도 함께 한다. 홈 · 마이 · 나머지 기여 · 비교 · 최근 본 제품은 그 뒤에 한다.

#### 연결 대상

| 화면                             | 경로·파일                                                                                                  | 지금 쓰는 목                                                                            | 쓸 훅·함수                                                                                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0-4 · 1-5 온보딩                 | `app/intro/*`(`goal/goal-form.tsx`)                                                                        | 없음. 목표를 URL(`?goal=`)로만 넘긴다                                                   | `useChangeGoal`(기기에 저장), `rememberOnboardingCompleted`, 이벤트 `logEvent`                                                                                          |
| 3-1 스캔 · 3-6 점수 없는 제품    | `components/scan/scan-stage.tsx`, `scan-no-score-sheet.tsx`                                                | `components/scan/_fixtures.ts`(이름을 아는 바코드 · 요청한 바코드)                      | `useProductByBarcode`(머지에서 새 흐름에 연결), 정보가 틀렸어요는 `useReportProduct`. 「제품 요청하기」는 `/contribute/request`로 가는 링크라 요청은 그 화면에서 보낸다 |
| 3-2 제품 결과 · 3-4 더 맞는 제품 | `app/product/[id]/(result)/page.tsx` 외, `better/page.tsx`, `better/pick/*`                                | `app/product/[id]/_fixtures.ts`(`ProductResult`·`BetterItem`)                           | `getProductDetail`(서버) + `useProductDetail`, `useSaveProduct`·`useRemoveSavedProduct`, `useReportProduct`, `useAlternatives`                                          |
| 2-3 · 2-4 검색(정렬)             | `app/search/search-screen.tsx`, `search-results.tsx`, `result-params.ts`                                   | `app/search/_fixtures.ts`(인기 검색어 · 자동완성 · 결과 · 정렬)                         | `usePopularKeywords`, `useSearchSuggestions`, `useSearch`(정렬 `sort`), 목표는 `useDeviceGoal`, `logSearch`. 0건 「제품 요청하기」는 `/contribute/request` 링크         |
| 2-2 · 2-5 랭킹(정렬·필터)        | `app/ranking/*`(`ranking-home`·`ranking-major`·`ranking-list`·`ranking-filter-sheet`·`ranking-brand-more`) | `app/ranking/_fixtures.ts`(분류 · 첫 화면 · 대분류 전체 · 칩 순위 · 필터 시트 · 브랜드) | `review/v3-rankings`의 `src/lib/ranking` 훅(12-5에서 옮긴다), 목표는 `useDeviceGoal`, `logFilter`                                                                       |
| 5-2 목표 바꾸기                  | `app/my/goal/goal-picker.tsx`, `goal-link.tsx`                                                             | 없음. 바꾼 목표를 주소 `?goal=`로 넘긴다                                                | `useChangeGoal`, `useDeviceGoal`(`GoalLink`가 보이는 목표)                                                                                                              |
| 3-6 제품 요청하기                | `app/contribute/request/request-form.tsx`                                                                  | 없음. 보내기를 서버로 보내지 않는다                                                     | `useRequestAnalysis`(`?gtin=`은 `originBarcode`, `?name=`은 `originKeyword`)                                                                                            |

`history`·`home`·`compare`·`login`·`settings`와 `my`·`contribute`의 나머지 화면은 이번 묶음에서 빼고 뒤에 연결한다. `/`는 UI 플랜 라우트 표대로 늘 `/intro`로 보내 바꾸지 않는다.

#### 하위 단계

순서는 스캔·상세를 먼저 한다. 12-1이 12-2와 함께 머지돼야 해서다. 검색·랭킹은 목표를 기기에서 읽어서 12-3(목표 저장) 뒤에 하고, 랭킹은 데이터 레이어부터 옮긴다.

| 단계  | 할 일                                                                                                                                                                                                                                                                                                                                                                                        | 조건                                                                                                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 12-1  | 스캔: `scan-stage.tsx`를 `useProductByBarcode`로. 등급 없음·미등록·체크섬 오류 분기                                                                                                                                                                                                                                                                                                          | 완료(커밋 「스캔 화면을 바코드 조회 API에 연결」, 13-2·13-3에서 v3·기기 목표로 고침). #15 머지에서 새 흐름(찾으면 3-2로 바로 이동 · 3-6 시트)에 다시 맞췄다. 머지는 12-2와 함께 한다 |
| 12-1b | 스캔 마무리: 3-6 시트를 응답으로. `NO_SCORE`는 응답 제품의 이름·회사, `NOT_FOUND`는 이름 없는 기본 시트. 스캔의 「정보가 틀렸어요」를 `useReportProduct`로. `components/scan/_fixtures.ts`를 지운다                                                                                                                                                                                          | 바로 시작할 수 있다                                                                                                                                                                  |
| 12-2  | 상세: `ProductResult`(lib, v3) → 화면 `ProductResult`(`_fixtures.ts`) mapper. 이름이 같아 import 별칭을 쓴다. 서버 렌더에서 기기 목표 쿠키를 읽는 함수를 더한다. 저장 버튼·정보가 틀렸어요·더 맞는 제품(3-4 · 고르기) 연결                                                                                                                                                                   | 바로 시작할 수 있다(#15로 `main`에 들어왔다)                                                                                                                                         |
| 12-3  | 온보딩 · 목표: 1-5 「이 목표로 시작」에서 `useChangeGoal` + `rememberOnboardingCompleted`, 이벤트 `goal_set`·`onboarding_complete`. 5-2 목표 바꾸기를 `useChangeGoal`로 저장하고, `GoalLink`가 기기 목표(`useDeviceGoal`)를 보이게 한다. 목표를 주소 `?goal=`로 넘기던 것은 지운다(결정 기록 2026-11-28)                                                                                     | 바로 시작할 수 있다. 12-4·12-6보다 먼저 한다                                                                                                                                         |
| 12-4  | 검색: 인기 검색어 · 자동완성 · 결과(한 목록 + `pinned`·`category`, 무한 조회)를 연결. 목표는 `useDeviceGoal`(고른 적이 없으면 `WEIGHT_LOSS`). 화면 정렬 값(`score`·`calories`·`protein`·`sugar`)을 API `SCORE`·`CALORIES_LOW`·`PROTEIN_HIGH`·`SUGAR_LOW`로 바꾼다. `logSearch`                                                                                                               | 12-3 뒤                                                                                                                                                                              |
| 12-5  | 랭킹 데이터 레이어: `origin/review/v3-rankings`의 `src/lib/ranking/*`(+ 테스트)를 가져와 배포 Swagger·백엔드 `origin/main`과 대조해 고친다(UI 플랜 결정 기록 2026-11-24). 그 브랜치에 없는 `GET /rankings/leaders`(2-2 첫 화면)를 더한다. 목표·정렬·필터(`brands`·`nutrients`·`sellers`)를 키에 넣는다. 백엔드가 v3 동기화 기준(`1ddb9b4`)보다 앞서 있어 랭킹 밖의 바뀐 응답도 함께 확인한다 | 바로 시작할 수 있다(`src/lib`만 건드린다)                                                                                                                                            |
| 12-6  | 랭킹 화면: 2-2 첫 화면 · 대분류 전체 · 칩 순위(정렬)와 2-5 필터 시트(고른 조건의 개수 미리 보기) · 브랜드 더 보기를 12-5 훅으로. 목표는 `useDeviceGoal`. `logFilter`. 아래 「API가 없는 값」의 랭킹 항목은 fixture로 남기거나 숨긴다                                                                                                                                                         | 12-3 · 12-5 뒤                                                                                                                                                                       |
| 12-7  | 제품 요청하기: `/contribute/request` 보내기(`request-form.tsx`)를 `useRequestAnalysis`로 연결한다. 스캔 3-6(`?gtin=` → `originBarcode`)과 검색 0건(`?name=` → `originKeyword`)에서 들어온다. 보낸 뒤 이 기기 요청 기록(`requested-gtins.ts`)을 남긴다                                                                                                                                        | 바로 시작할 수 있다                                                                                                                                                                  |
| 나중  | 홈(`GET /home` 데이터 레이어 + 내 목표·로그인 여부·첫 방문), 공통 알림 등록(`setMutationErrorListener`, `onSessionExpired`를 `Toast`에)                                                                                                                                                                                                                                                      | 위 묶음 뒤                                                                                                                                                                           |

UI 브랜치가 같은 파일을 고치고 있으면 그 단계는 뒤로 미룬다. 화면 파일에서는 데이터를 받는 부분만 바꾸고 마크업·스타일은 건드리지 않는다.

#### 결정할 것

1. ~~**목표 값 대응**~~ — v3로 풀림(13-3): 목표가 두 개(`WEIGHT_LOSS`·`MUSCLE_GAIN`)로 화면과 맞고, 내 목표는 기기에 둔다. 고른 적이 없으면 다이어트로 보이고 「내 목표 고르기」를 둔다
2. **점수 구간** — 화면은 `score`(0–100) + `band`(1–5), API는 `score` + `grade`(A–E)다. `band`를 `grade`에서 바꿀지 `score` 구간으로 나눌지 정한다
3. ~~**영양성분 기준**~~ — v3로 풀림(13-2): `nutrients[].per100g`·`perServing`에 값·1일 기준치 %·단계가 온다
4. ~~**좋은 점·아쉬운 점**~~ — v3로 풀림(13-2): `goals[].goods`·`bads`(없을 때 `badsEmptyText`)

#### API가 없는 값

연결 때 fixture로 남기거나 숨긴다. 어느 쪽으로 할지는 하위 단계에서 화면마다 정한다.

- 홈: 최근 본 제품 요약(`RecentSummary`), 인기 제품(`FIXTURE_POPULAR`, 많이 찾는 제품은 검색어 칩 API뿐), 비교함 안내(`CompareLeft`)
- 스캔 3-6: `NOT_FOUND`에는 이름·회사가 없다(이름을 아는 바코드 시트는 `NO_SCORE`일 때만). 「다른 사람이 먼저 요청함」 상태도 응답에 없다. 이 기기에서 요청한 것은 기기 기록(`requested-gtins.ts`)으로 본다
- 랭킹: 종류를 고르지 않은 2-2 첫 화면의 필터 시트 개수·브랜드(`/rankings/filters`·`/rankings/brands`는 `category`가 필수, UI 남은 질문 38), 대분류 전체 합계 개수(`/rankings/overview`에 `coverage`가 없다, UI 남은 질문 31)
- 상세: 순위. v3로 분류·더 맞는 제품·다른 목표·생산 중단·쿠팡 주소·내 몸에 맞춤·제보는 응답이나 API가 생겼다(`API-v3-동기화.md` 「12단계에 미치는 영향」)

### 13단계 상세

배포 서버가 v3(백엔드 PR #68–#74, 2026-11-09–17)로 바뀌어 04–11단계 데이터 레이어(백엔드 `c164ec0` 기준)와 응답이 맞지 않는다(2026-11-21 확인). 차이 표는 [`docs/API-v3-동기화.md`](API-v3-동기화.md)에 있다. 기준은 배포 Swagger이고, Swagger에 없는 것(스키마 이름 충돌로 가려진 응답 9개, 허용값·필수 여부·에러 코드)은 백엔드 소스로 확인한다.

| 단계  | 할 일                                                                                                                                                                                                                                                                           | 조건       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 13-1  | 공통: 익명 ID를 기기가 만든다(서버 발급 전제 제거), `Goal`을 두 개로. 로그아웃·탈퇴 뒤 익명 ID 처리                                                                                                                                                                             | 바로 시작  |
| 13-2  | 상품: `ProductResultResponse` 타입·mapper, 바코드 `outcome`(`MULTIPLE`·`NO_SCORE`·`NOT_FOUND` 200), `grade-reason` 삭제. 12-1 스캔 연결을 새 응답에 맞춘다                                                                                                                      | 13-1 뒤    |
| 13-3  | 나머지 도메인: 화면 연결 순서대로(목표 → 저장 → 검색 → 마이 → 기여 → 로깅). 온보딩·동의·가입은 13-4                                                                                                                                                                             | 도메인마다 |
| 13-4a | 온보딩 정리: v3에서 없어진 개인정보·건강정보 동의·샘플·온보딩 완료 API 삭제, bootstrap 필드 v3로, 첫 실행·온보딩 완료는 기기 기록                                                                                                                                               | 13-3 뒤    |
| 13-4b | 동의: `GET /meta/consent-items`, `GET /me/consents`, `PUT /me/consents/{item}`. `errors.ts`의 동의 오류를 v3 코드(`GOAL_CONSENT_REQUIRED`·`BODY_CONSENT_REQUIRED` 등)로 맞추고, 옛 코드만 알아보는 동의 게이트(`useConsentGate`·`meta.consentGate`)를 v3에 맞출지 지울지 정한다 | 13-4a 뒤   |
| 13-4c | 가입: 로그인 응답의 `signupRequired`·`signupToken`·`merged` 처리, `POST /auth/signup`. OAuth 콜백 화면은 11단계(막힌 질문 답 필요)                                                                                                                                              | 13-4b 뒤   |
| 13-4d | 일괄 수정: v3 이전 기록으로 남겨 둔 「범위」·「기능 → 엔드포인트 매핑」·「화면 연결 때 챙길 것」·「진행 가정」·「남은 질문」                                                                                                                                                    | 13-4c 뒤   |

13-2가 끝나면 12-2(상세 연결)로 넘어간다. 12단계 「결정할 것」 1·3·4와 「API가 없는 값」 상당수는 v3 응답으로 풀린다(동기화 문서 「12단계에 미치는 영향」). 12단계 표는 13단계에서 도메인을 고칠 때 함께 고친다.

13-4d(2026-11-24)에서 v3 이전 기록으로 남겨 둔 곳을 한꺼번에 고쳤다. 「범위」, 「기능 → 엔드포인트 매핑」, 「화면 연결 때 챙길 것」, 「진행 가정」, 「남은 질문」이다. 「Swagger 확인 결과」·「결정 기록」·06단계 상세는 그때의 기록이라 두었다.

### 화면 연결 때 챙길 것

08단계 도메인을 만들며 나온, 화면에서 처리할 일이다.

- 첫 실행·온보딩 완료 분기는 기기 기록(`isOnboardingCompletedLocally`)이라 브라우저에서 한다. 서버 렌더에서는 늘 false다(hydration 불일치)
- 동의 게이트(`useConsentGate`)는 13-4b에서 지웠다. v3에서 동의가 없어 403이 나는 곳(목표 계정 저장 `GOAL_CONSENT_REQUIRED`, 몸 정보 `BODY_CONSENT_REQUIRED`)은 화면이 동의를 먼저 확인하고 부르기 때문이다(ACCT_002 · ACCT_010). 목표 계정 저장은 동의한 계정만 보내고(`useChangeGoal`), 몸 정보는 동의하지 않은 사람에게 입력 칸 대신 동의 안내를 먼저 보인다
- 선택 동의 변경(`useChangeConsent`)은 `isPending` 동안 막는다. 응답이 항목 전체라 순서가 뒤바뀌면 늦게 온 이전 상태가 캐시에 남는다
- 가입 토큰(`SIGNUP_REQUIRED`의 `signupToken`, 30분)은 URL·스토리지·로그에 두지 않고 메모리(상태·컨텍스트)로 5-6 가입 동의에 넘긴다. 11단계 콜백 화면에서 5-6으로 갈 때 query string에 싣지 않는다. 새로고침 등으로 잃었거나 가입이 401 `SIGNUP_TOKEN_INVALID`로 거절되면 로그인부터 다시 한다
- 저장·해제 버튼은 `isPending` 동안 막는다. 저장과 해제의 응답 순서가 뒤바뀌면 상세 캐시의 `saved`가 서버와 어긋난다
- 목표 선택은 `isPending` 동안 막는다. 동의한 로그인 계정이면 바꿀 때마다 계정 저장(`PUT /me/goal`)이 나가, 연달아 바꾸면 요청 순서가 뒤바뀌어 늦게 온 이전 값이 계정에 남을 수 있다
- 검색 자동완성은 입력마다 키가 바뀌어 요청이 나간다. 디바운스와 `placeholderData: keepPreviousData`는 화면이 붙인다(`searchQueries.suggestions`를 펼쳐 쓴다)
- 검색어는 30자를 넘으면 서버가 400으로 답한다. 입력 단계에서 30자로 막는다
- 분석 요청·오류 제보 버튼은 `isPending` 동안 막는다. 바코드·검색어·보강 요청은 같은 기기의 거듭 요청에 `requestCount`를 올리지 않지만(`alreadyRequested`·`message`로 알림), 제품명 요청은 보낼 때마다 새 요청이 되어 마이 수가 오른다. 검색어·제품명 요청(합쳐 하루 5건)·오류 제보(하루 10건) 한도도 쓴다
- 구매·외부 이동 버튼의 `logProductCta`는 fetch keepalive로 보내 페이지를 떠나도 전송된다. 다만 요청 인터셉터(토큰 확인)가 끝나기 전에 페이지가 닫히면 유실될 수 있다
- 분석 직접 접수는 검색 0건(검색어)과 3-6 제품 요청하기(제품명, 어디서 왔는지 바코드·검색어)에 둔다. 바코드 미등록·점수 없음 상품은 조회할 때 서버가 이미 자동 등록해 직접 접수가 필요 없다
- 오류 제보에서 「기타」(`OTHER`)를 고르면 내용이 필수다(빈 내용은 400). 고른 항목 중 이미 확인 중인 것은 `duplicateTypes`로 오고 새로 만들지 않는다
- 로그인 상태는 `useIsLoggedIn`(refresh 토큰 쿠키)으로 바로 판단한다. 서버 기준이 필요하면 `bootstrap.isLoggedIn`을 쓴다
- 갱신 거절로 자동 로그아웃되면 `onSessionExpired`가 알린다. 사용자 캐시는 `connectSession`(`providers.tsx`)이 비우고, 알림 UI는 화면이 등록한다. proxy의 `Set-Cookie`보다 401이 먼저 오면 곧 복구될 로그인에도 만료가 알려질 수 있어, 알림은 그 뒤 로그인 상태를 다시 보고 띄운다
- 로그아웃이 401로 거절되면 이 기기만 정리하지만 공통 알림(「인증이 필요합니다.」)도 나간다. 숨기려면 화면이 `meta`로 끈다

## 진행 가정

백엔드 답을 기다리지 않고 아래 가정으로 진행한다. 답이 오면 해당 가정만 바꾼다. 가정은 mapper나 상수 한 곳에만 둬서 바꿀 곳이 하나가 되게 한다.

| 주제                 | 가정                                                                                                                                                                                                                          | 근거                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 개발 서버            | 없다. 개발 중에도 배포 서버(운영 데이터)를 부른다. 조회수(인기·추천 정렬에도 쓰인다)·분석 대기 목록 같은 부수 효과는 감수한다. 변경 API·로그인도 운영 데이터에 남는다. 로깅은 개발 중 끈다(`NEXT_PUBLIC_LOGGING_ENABLED`)     | 팀 허용 (2026-11-02 반영)                           |
| 토큰 수명            | 액세스 10분, refresh 7일로 보고 갱신 시점과 토큰 쿠키 만료(`TOKEN_MAX_AGE_SECONDS`)를 정한다                                                                                                                                  | 백엔드 로컬 설정. 운영 값은 확인하지 못함           |
| CORS                 | `localhost` 출처는 막힌 것을 확인했다. 실제 서버 연동은 Next.js rewrites(`/api/:path*` → 백엔드 `/:path*`)로 중계한다. 백엔드는 `/api` 접두사가 없어 그대로 중계하면 `/onboarding/consent` 같은 프론트 페이지와 경로가 겹친다 | 팀 결정 (2026-10-25), 프리플라이트 확인             |
| 문자열 필드 값       | 아래 표의 값을 유니온 타입으로 쓴다                                                                                                                                                                                           | 백엔드 소스(`main` `1ddb9b4`, v3)                   |
| 동의 항목 코드       | 필수 `AGE_14`·`TERMS`·`PRIVACY`, 선택 `GOAL_ACCOUNT`·`BODY_PROFILE`·`MARKETING`(`ConsentItemCode`). 가입 동의 항목 API가 주는 값을 쓴다                                                                                       | 백엔드 소스 `ConsentItemCode`, v3 기능명세 ACCT_004 |
| null 여부            | 명세·소스로 확인되지 않은 응답 필드는 null이 올 수 있다고 보고 타입을 만든다                                                                                                                                                  | Swagger에 필수 표시가 거의 없음                     |
| 상품 결과 모양       | 바코드·상세가 같은 `ProductResultResponse`를 쓴다. 두 목표 결과는 함께 오거나(점수 있음) 빈 배열이다. 한 목표만 오면 다른 목표 점수를 지어내지 않고 점수 없음으로 본다                                                        | 백엔드 소스 `ProductResultResponse`                 |
| 검색 페이지네이션    | v3(13-3): 한 목록이 `page`(0부터)·`size`로 넘어오고 다음 페이지는 `hasNext`로 정한다. 이름이 같은 제품(`pinned`)은 첫 페이지에만 따로 온다. 08단계의 두 섹션 방식은 v3에서 없어졌다                                           | 백엔드 소스 `ProductSearchService`                  |
| 탈퇴 사유            | 보내지 않는다(v3는 받지 않는다)                                                                                                                                                                                               | 백엔드 소스 `UserController.deleteMe`               |
| 온보딩 완료          | 첫 실행 여부와 온보딩 완료는 기기(localStorage)가 기억한다. 서버 API는 없다. 계정 삭제 때 지운다                                                                                                                              | v3 기능명세 ONB_001 · ONB_004 · ACCT_008            |
| 노션 「수정」 페이지 | 받은 명세와 같은 내용이다                                                                                                                                                                                                     | 팀 확인 (2026-10-25)                                |

문자열 필드 값 — 백엔드 소스(`main` `1ddb9b4`, v3) 기준:

| 필드                             | 값                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `goal`                           | `WEIGHT_LOSS`, `MUSCLE_GAIN` (v3에서 `GENERAL` 없어짐)                                  |
| 상품 `state`                     | `NO_SCORE`, `ANALYZED`, `PRODUCTION_STOPPED`, `STOCK_REMAINING`, `DISCONTINUED`         |
| 바코드 조회 `outcome`            | `RESULT`, `NO_SCORE`, `MULTIPLE`, `NOT_FOUND`                                           |
| `grade`                          | `A`, `B`, `C`, `D`, `E`                                                                 |
| 검색 `sort`                      | `SCORE`, `POPULAR`, `CALORIES_LOW`, `PROTEIN_HIGH`, `SUGAR_LOW`                         |
| 로그인 `provider`                | `GOOGLE`, `KAKAO`, `NAVER`, `APPLE` (OAuth 콜백은 `APPLE` 제외 3개)                     |
| 분석 요청 `type`·`status`        | `NEW_PRODUCT`, `NUTRITION_FILL` · `ANALYZING`, `REVIEWING`, `DONE`, `FAILED`            |
| 오류 제보 `reportTypes`·`status` | `WRONG_PRODUCT`, `NAME_OR_IMAGE`, `NUTRITION`, `OTHER` · `RECEIVED`, `DONE`, `REJECTED` |
| 스캔 이벤트 `result`             | `SCAN_FAIL`, `NOT_IN_DATA`, `CHECKSUM_FAIL`, `PERMISSION_DENIED`                        |
| 검색 자동완성 `type`             | `KEYWORD`, `PRODUCT`                                                                    |

## 남은 질문

대부분 진행을 막지 않는다. 답이 필요한 단계가 있는 질문은 그 단계를 함께 적는다. 답이 오면 「진행 가정」을 고친다.

- 로그인할 때 계정 목표를 기기 목표에 반영하는지 — v3 기능명세(ONB_009)는 계정 저장의 목적을 「다른 기기에서도 같은 목표로 점수를 본다」로 적었지만 로그인 시나리오에는 없다. 지금은 동의하고 계정에 저장한 목표가 있으면 기기 값을 맞춘다(`applyAccountGoal`). 기획 확인
- 계정 목표 저장이 실패했을 때 다시 보내는 시점 — ACCT_002는 「다음 연결 때 계정 목표를 다시 저장한다」. 지금은 실패를 알리지 않고 기기 값만 바꾼 채 둔다(TODO). 언제 다시 보낼지 정한다
- `PUT /me/goal`의 Swagger 설명 — 「기기 ID 또는 Bearer, 동의는 필요 없습니다」인데 백엔드 소스(`GoalService.requireGoalConsent`)와 v3 기능명세는 로그인 + 「목표 계정 저장」 동의를 요구한다. 백엔드에 설명 수정 요청
- iOS Safari가 스크립트로 쓴 쿠키 수명을 7일로 줄이는 문제(ITP) — 익명 ID·기기 목표 쿠키가 오래 안 들어온 아이폰에서 사라질 수 있다. 서버 `Set-Cookie`로 다시 쓰면 피할 수 있어 proxy 등에서 다시 써 줄지 검토한다
- 오류 제보의 영양성분표 사진 — 3-2 「정보가 틀렸어요」 시트(UI)는 사진 한 장을 고르게 하지만 v3 제보 API(`POST /products/{id}/reports`)는 사진을 받지 않는다(UI 플랜 「남은 질문」 11). 백엔드에 사진 업로드를 둘지 확인한다. 답이 오기 전에는 사진 없이 보낸다
- 목록 API에 실어 보내는 목표 — 검색·저장·더 맞는 제품은 기기 목표를 `goal` query로 보낸다(13-3). v3 기능명세는 「건강 목표는 민감정보라 동의 없이 서버로 보내지 않는다」(ONB_004)고 하면서, 서버 계산에 목표를 어떻게 받을지를 결정 대기(「서버 계산에 쓰는 목표」, 개발·변호사)로 두었다. 백엔드는 요청마다 `goal`을 받고 저장하지 않는 방식으로 구현했다. 이 방식이 동의 없이 보내도 되는 범위인지 확인한다
- 몸 정보를 바꾼 뒤 목록 캐시 — 서버는 카드 점수를 계정의 칼로리 구간(`kcalBand`)으로 계산하는데 검색·저장·더 맞는 제품 키에는 구간이 없다. 몸 정보 동의를 켜거나 철회하면 상품·검색·저장을 다시 부르게 했다(13-4b). 5-7 내 몸에 맞추기에서 몸 정보 저장·지우기(`/me/body-profile`) 뒤에도 같게 할지 그때 정한다
- 목록 카드 태그(`ProductCard.tags`)의 좋고 나쁨 — 카드 디자인은 걸리는 성분 태그를 분홍으로 보이는데, 응답은 짧은 말 문자열만 준다(백엔드는 좋은 점 1 + 아쉬운 점 1을 먼저 넣고 한쪽이 없으면 다른 쪽으로 채워, 좋은 점만 2개·아쉬운 점만 2개·0~1개도 온다). 순서로도 문자열로도 구분할 수 없어 백엔드가 톤을 함께 줄지 확인한다. 3-4·검색·즐겨찾기 카드 연결 전까지 답 필요
- OAuth 콜백이 리다이렉트하는 `frontendUrl` 경로 — 11단계 콜백 화면 전에 팀에서 확인 예정
- 소셜 로그인 시작 URL — 백엔드에 인가 URL을 주는 API가 없어 프론트가 소셜별 인가 URL을 만든다. 소셜별 `client_id`와 `redirect_uri`(백엔드 `/auth/oauth/{provider}`)가 필요하다. 11단계 콜백 화면 전까지 답 필요
- OAuth `state` — 백엔드 콜백 3종(구글·카카오·네이버) 모두 `code`·`provider`만 넘겨 프론트가 `state`를 검증할 수 없다(로그인 CSRF). 네이버는 인가 요청에 `state`가 필수다. 백엔드가 `state`를 넘겨줄지 정해야 한다. 콜백 화면은 토큰 교환 직후 URL에서 `code`를 지운다(히스토리·Referer)
- 백엔드 소스(`main` `1ddb9b4`)에서 확인한 값이 배포 서버와 같은지 — Swagger에 없는 것(스키마 이름 충돌로 가려진 응답, 허용값, 에러 코드)을 소스로 채웠다
- 응답 필드의 필수·null 여부 — 확인되면 타입을 좁힌다

## 결정 기록

| 날짜       | 결정                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-24 | 범위를 1차 사용자 API 37개로 확정. 관리자·2차·보류 API는 제외                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-10-24 | `/support/inquiries`, `DELETE /users/me`는 API 함수만 만든다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-10-24 | 노션 명세 사본과 개인 작업 문서는 로컬에만 두고, `docs/`에서는 이 문서만 git에 올린다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-10-24 | 공개 리포라 노션·체크리스트 등 내부 문서 링크는 싣지 않는다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-10-24 | `docs/design/`은 디자인 브랜치가 추적하므로 git에서 제외하지 않는다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-10-25 | 현재 화면 구조·목 데이터·IA 화면정의서는 설계 기준으로 쓰지 않는다. 매핑표는 명세의 기능 단위로 만들고, `lib/scan`의 계약은 유지한다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-10-25 | 개발 서버가 없어 목으로 개발한다. 운영 서버는 개발 중 호출하지 않는다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-10-25 | 실제 서버 연동은 Next.js rewrites로 중계하고, 프론트 페이지와 겹치지 않게 `/api` 접두사를 쓴다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-10-25 | 백엔드 답을 기다리지 않고 「진행 가정」으로 진행한다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-10-26 | 목은 새 의존성 없이 자체 axios 어댑터로 만든다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-10-26 | 타입은 명세·Swagger·백엔드 소스를 보고 직접 작성한다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-10-26 | 토큰·익명 ID는 일반 쿠키에 두고, 상세는 서버에서 개인 기준으로 한 번 조회한다(React `cache()`로 중복 방지)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-10-26 | 파일 구조와 단계별 순서를 확정했다. 공통 타입은 04단계, 05단계는 상품 DTO만, 나머지 도메인 DTO는 08단계에서 만든다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-10-26 | 액세스 토큰은 만료 전에 미리 갱신한다(브라우저 인터셉터 + 상세 경로 `proxy.ts`). 상세 서버 조회 결과는 `HydrationBoundary`로 클라이언트 캐시에 넣는다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-10-28 | 브라우저 baseURL은 고정값 대신 `NEXT_PUBLIC_API_URL`을 읽고, 값은 rewrites 접두사 `/api`로 둔다. 백엔드 주소는 서버 전용 `API_URL`에만 둔다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-10-31 | 세션 ID(`X-Session-Id`)는 쿠키에 두고 요청마다 만료를 30분 뒤로 미룬다. 백엔드의 30분 무활동 규칙과 맞추고, 탭끼리 공유하며, 서버 컴포넌트도 읽을 수 있다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-11-01 | 액세스 토큰은 만료 60초 전에 갱신한다. 서버가 갱신마다 refresh 토큰을 교체하므로 브라우저는 Web Locks로 탭 사이 갱신을 하나씩 돌린다. 갱신이 네트워크 오류·5xx로 실패하면 원래 요청을 보내지 않고 그 오류로 실패시킨다. 401(`TOKEN_EXPIRED`·`INVALID_TOKEN`)이면 토큰과 익명 ID를 지우고 비로그인으로 보낸다. 익명 ID는 로그인 때 계정에 병합돼 서버가 소유자로 인정하지 않기 때문이다. 서버는 refresh 토큰을 사용자당 하나만 두어, 다른 기기에서 로그인하면 이 기기의 refresh 토큰이 지워진다. 로그아웃을 화면에 알리는 방법은 11단계에서 정한다                                                                                                                                                                                                                                                                                                              |
| 2026-11-02 | 개발 중에도 배포 서버를 부른다(팀 허용). 목 어댑터와 목 데이터 단계(10단계)는 만들지 않고, 테스트는 테스트마다 axios `adapter`를 바꿔 끼운다. 2026-10-25 「목으로 개발」, 2026-10-26 「자체 axios 어댑터」 결정을 대체한다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-11-02 | 서버 컴포넌트 요청은 쿠키의 토큰·익명 ID·세션 ID를 읽어 붙이기만 한다. 렌더 중에는 쿠키를 쓸 수 없어 세션 ID가 없으면(첫 방문·30분 무활동 뒤) 빼고 보낸다. 백엔드에서 세션 ID는 브라우저가 보내는 로깅·문의·제보에 주로 쓰여 영향이 작다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-11-02 | `proxy.ts`는 `/product/:id` 페이지 이동에서만 갱신하고 프리페치는 matcher에서 뺀다. 갱신에 실패해도 쿠키를 지우지 않는다. 브라우저의 Web Locks 밖이라 다른 탭이 방금 교체한 것과 구분할 수 없어서다. 정리는 브라우저 인터셉터가 맡고 그 렌더만 비로그인 기준이 된다. 브라우저 갱신이 거절되면 쿠키를 다시 읽어 refresh 토큰이 바뀌었으면(proxy가 교체) 그 토큰을 쓴다. 거절이 proxy의 `Set-Cookie`보다 먼저 오면 토큰은 다시 써지지만 익명 ID는 지워지는 한계는 감수한다                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-11-03 | 식별 쿠키 속성은 `SameSite=Lax`, HTTPS에서만 `Secure`, 만료는 토큰 7일(refresh 수명 가정)·익명 ID 400일(Chrome 상한)·세션 ID 30분으로 한다. Strict는 외부 링크로 들어온 첫 렌더가 비로그인 기준이 되어 쓰지 않는다. 백엔드는 헤더로 인증해 Lax의 CSRF 부담은 없다. 세션 쿠키로 두면 PWA를 다시 열 때 로그인이 풀린다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-03 | 상품 화면 모델은 등급 유무를 `status` 판별 유니온으로 나눈다. 등급·감점 이유는 `ANALYZED`로 좁혀야 꺼낼 수 있어 등급 없음 처리를 빠뜨릴 수 없다. `ANALYZED`인데 `grade`가 빠져 오면 등급을 지어낼 수 없어 `INSUFFICIENT`로 보인다. 응답에서 빠진 키는 mapper가 `null`로 채우고, `productId`는 상세 경로·스캔 결과에 맞춰 문자열로 바꾼다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-11-03 | 06단계는 데이터 레이어(상품 `api`·`keys`·`queries`·서버 조회 `getProductDetail`·`lookupBarcode`, 목 카탈로그를 `mock-catalog.ts`로 이름 변경)까지만 한다. 스캔 시트·상세 페이지는 화면 필드와 분기를 바꿔야 해 UI 브랜치와 겹치므로 연결을 미루고, 그때까지 목을 쓴다. 상세 쿼리는 서버 조회 결과를 이어 쓰고 조회수가 다시 오르지 않게 `staleTime: Infinity`로 둔다. 체크섬 오류는 다시 보내도 같아 실패가 아닌 결과로 돌려준다. 상품 ID는 Long을 넘는 값에 서버가 500으로 답해 18자리까지만 보낸다                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-03 | QueryClient 기본 옵션: 조회는 응답 없음(취소 제외)·5xx만 1회 재시도하고, 변경은 재시도하지 않는다. 배포 서버라 조회에도 부수 효과가 있어 포커스·재연결 재조회는 끈다. 서버 렌더는 요청마다 새로 만들고 브라우저는 하나를 쓴다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-11-03 | 로딩·에러·빈 데이터는 훅 상태(`isPending`·`isError`·`data`)로 컴포넌트가 분기하고, 0건은 에러가 아닌 정상 결과다. 에러 알림은 문구 함수(`toErrorMessage`)와 변경 실패 리스너(`setMutationErrorListener`)까지 만들고 토스트 UI는 화면에서 붙인다. 동의 필요(403)는 `useConsentGate`가 필요한 동의와 `resume()`을 주고, 감싼 변경은 `meta.consentGate`로 표시해 공통 알림에서 뺀다. 인자를 컴포넌트가 들고 있어 동의 화면은 시트·모달로 띄운다                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-11-03 | 저장·해제 뒤 검색 결과는 다시 부르지 않고 캐시의 저장 표시만 바꾼다(매핑표 초안의 「검색 다시 부르기」를 대신한다). 무한 목록이라 다시 부르면 불러 둔 페이지를 모두 다시 받고, 저장 여부는 정렬에 영향이 없다. 목표 변경·건강정보 철회 뒤에는 등급이 바뀌어 검색 결과도 무효화한다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-11-04 | contribution 도메인은 조회 API가 없어 `keys.ts`를 두지 않는다. 분석 요청 입력은 유형마다 식별값이 하나라 유형별 유니온으로 묶는다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-11-04 | 개발 중에는 로깅을 보내지 않는다. 서버가 개발 트래픽을 구분하지 못해(`X-Cohort`는 warm·cold만) 검색 로그가 사용자에게 보이는 인기 검색어와 운영 통계에 섞인다. `NEXT_PUBLIC_LOGGING_ENABLED`로 켜고 끄고, 비우면 프로덕션 빌드만 보낸다. 로그는 TanStack 변경 훅을 쓰지 않고 응답을 기다리지 않으며 실패를 버린다(공통 에러 알림에 가지 않게)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-11-04 | 09단계 무효화 규칙을 매핑표대로 확정한다. 목표가 바뀌는 변경(목표 변경·설정의 목표 변경·건강정보 철회)은 `invalidateGoalDependents` 하나로 목표·마이·설정·bootstrap과 등급이 목표 기준인 상품·검색·저장 목록을 다시 부른다. 저장 목록이 빠져 있던 것을 이때 넣었다. 등급이 보이는 조회를 새로 만들면 이 함수에 넣는다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-11-04 | 상품 조회의 자동 등록으로 마이의 기여 수가 바뀌어도 마이를 무효화하지 않는다. 마이는 `staleTime` 0이라 들어갈 때 다시 부른다. 바코드 조회는 조회마다 서버가 분석 요청 수를 올려 상세처럼 `staleTime: Infinity`로 둔다. 분석 직접 접수는 검색 0건 검색어에만 둔다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-11-04 | 11단계 인증 데이터 레이어: 로그인하면 토큰을 저장하고, 계정에 병합된 익명 ID는 지운 뒤 사용자 조회를 무효화한다. 로그아웃은 응답의 새 익명 ID로, 탈퇴는 익명 ID까지 지우고 사용자 캐시를 비운다(`resetUserQueries`). 토큰은 갱신 락 안에서 지워 다른 탭의 갱신 응답이 다시 써 넣지 않게 한다. 네트워크·5xx 실패는 쿠키를 두고, 401은 서버 세션이 이미 없어 이 기기만 정리한다. 갱신 거절도 같은 캐시를 비운다. 로그인 상태는 refresh 토큰 쿠키로 판단한다                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-11-04 | 로그인·로그아웃(탈퇴·세션 만료 포함)은 `BroadcastChannel`로 다른 탭에 알려, 받은 탭도 사용자 캐시를 다시 부르거나 비우고 로그인 상태를 다시 읽는다. 쿠키는 탭끼리 공유하지만 캐시는 탭마다 따로라 공용 기기에서 이전 계정의 개인 정보가 남기 때문이다. `LOGIN_FAILED`는 서버 기본 문구(비밀번호 문구)가 소셜 로그인과 맞지 않아 클라이언트 문구로 바꿔 쓴다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-11-19 | 화면 연결을 12단계로 둔다. UI 브랜치가 `main`에 머지한 화면만 `_fixtures.ts` 자리를 쿼리 훅 + mapper로 바꾸고, 06단계에서 미룬 스캔·상세 연결도 여기서 한다(2026-11-03 결정을 이어받음). 맞는 1차 API가 없는 값은 fixture로 남긴다. 스캔(12-1)과 상세(12-2)는 같이 머지한다. 스캔만 먼저 머지하면 실제 상품 id가 fixture 상세에 없어 「자세히 보기」가 404가 된다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-11-19 | 12-1 스캔: 앞자리가 0이 아닌 14자리(묶음 포장 GTIN-14)는 입력 단계에서 막지 않고 서버 400 `BAD_REQUEST`를 조회 실패(「다시 시도」)로 보인다. 결과 시트의 점수 구간은 목 때와 같이 등급 A–E를 1–5로 옮기고, 목표 문구는 GENERAL이면 뺀다(「결정할 것」 1·2가 정해지면 바꾼다). 등급 없음·체크섬 오류는 3-6 화면이 생길 때까지 기존 안내 시트로 보인다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-21 | 배포 서버가 v3로 바뀌어 13단계 「v3 동기화」를 두고 12단계 나머지보다 먼저 한다. 기준은 배포 Swagger, Swagger로 알 수 없는 것만 백엔드 소스(`main` `1ddb9b4`)로 확인한다. 노션 명세는 기준으로 쓰지 않는다. 12-1 스캔 연결은 v3 전 응답으로 만들어 13-2에서 다시 고친다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-11-21 | 13-1 공통: 익명 ID는 기기가 만든다(브라우저 요청 인터셉터, 상세 페이지 이동은 `proxy.ts`). 첫 방문 상세의 서버 조회에도 익명 ID가 실려 최근 본 제품에 기록되게 하려고 proxy에서도 만든다. 로그인 때는 바꾸지 않고(서버가 병합에 실패하면 다음 로그인 때 같은 ID로 다시 옮긴다) 로그아웃·탈퇴·세션 만료 때 새로 만든다(공용 기기에서 이전 기록을 이어받지 않게, 서버 추천·탈퇴는 필수). `Goal`에서 `GENERAL`을 뺀다                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-11-21 | 13-2 상품: 바코드·상세가 같은 결과 모양(`ProductResult`)을 쓰고, 목표별 결과는 `goals: Record<Goal, GoalResult> \| null`(점수 없으면 null, 한 목표만 오면 지어내지 않고 null)로 둔다. 등급 근거 API는 지운다. 결과에 `appliedGoal`이 없어 스캔 시트는 내 목표를 `GET /me/goal`(`useMyGoal`)에서 받는다. 바코드에 제품이 여러 개(`MULTIPLE`)면 3-1 「여러 개」 디자인이 정해질 때까지 임시 안내 시트로 보이고 후보는 데이터 레이어에만 둔다. 스캔이 `useMyGoal`을 쓰게 되어 `GoalDto`의 동의 필드(`healthConsented` → `goalAccountConsented`)만 먼저 맞춘다. 목표 저장의 403 제거 등 나머지 목표 도메인은 13-3에서 한다                                                                                                                                                                                                                                         |
| 2026-11-23 | 3-4 더 맞는 제품 데이터 레이어(`GET /products/{id}/alternatives`)를 UI 머지 전에 만든다(`src/lib`만 건드려 충돌 없음). 검색·랭킹·최근 본 제품·즐겨찾기·더 맞는 제품이 같은 목록 카드를 써서 `ProductCardData`(UI 부품 `ProductCard`와 이름이 겹치지 않게)로 만들어 둔다. 목표는 늘 보낸다(빼면 서버가 내 목표가 아니라 WEIGHT_LOSS로 답한다). 무한 조회, page 0부터                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-11-23 | 13-3 목표: 내 목표는 기기 쿠키(`nuti_goal`)에 둔다(v3 기능명세 ONB_004 · ACCT_002 · ONB_009, 백엔드 `GoalService`). 고른 적이 없으면 없음(화면은 다이어트 기준 + 「내 목표 고르기」), 쿠키를 못 쓰면 이번 사용 동안만 기억한다. 목표를 바꾸면 기기에 바로 저장하고, 로그인하고 「목표 계정 저장」에 동의한 계정이면 `PUT /me/goal`로 계정에도 저장한다(실패는 알리지 않음). 로그아웃·동의 철회는 기기 목표를 남기고 계정 삭제는 지운다. 로그인 뒤 계정 목표가 있으면 기기 값을 맞춘다(확인 대기). 결과가 두 목표 점수를 함께 줘 계정 목표가 바뀌어도 상품은 다시 부르지 않는다. 계정 목표를 보여 주는 조회와, 아직 계정 목표로 계산되는 검색·저장만 다시 부른다(13-3 저장·검색에서 기기 목표를 늘 실어 보내게 바꾸면 뺀다). 2026-11-21 13-2의 「스캔 시트는 내 목표를 `useMyGoal`에서 받는다」는 기기 목표로 바꾼다(비로그인은 서버 목표가 늘 WEIGHT_LOSS라서) |
| 2026-11-23 | 13-3 저장: 저장 목록 항목이 목록 카드(`ProductCardData`)가 된다. 카드의 태그·더 맞는 제품 표시가 목표 기준이라 `goal`을 늘 보내고(빼면 서버가 WEIGHT_LOSS로 답한다) 키에 목표를 넣는다. page는 1부터(다른 목록과 다르다), 기본 20개. 동의는 필요 없어 게이트로 감싸지 않는다. 목표 무효화에서 저장 목록을 뺀다(목표가 바뀌면 키가 바뀐다)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-11-23 | 13-3 검색: 결과가 두 섹션(`exactMatches`·`similarProducts`)에서 한 목록(`items`, 카드는 `ProductCardData`)으로 바뀐다. 이름이 같은 제품(`pinned`)은 첫 페이지 맨 위 한 칸으로 따로 오고, 중분류 이름과 같으면 순위 링크(`category`)가 온다. 다음 페이지는 서버 `hasNext`로 정한다. `goal`은 늘 보내고(빼면 서버가 내 목표가 아니라 WEIGHT_LOSS로 계산한다) 정렬(`sort`, 기본 점수순)과 함께 키에 넣는다. 인기 검색어는 `{ basedAt, keywords }`로 바뀐다. 목표 무효화에서 검색을 빼 목표 무효화는 계정 목표를 보여 주는 조회만 남는다                                                                                                                                                                                                                                                                                                                           |
| 2026-11-23 | 13-3 마이·설정: v3 `PATCH /me/settings`는 목표 하나만 받고 조건(로그인 + 「목표 계정 저장」 동의)도 `PUT /me/goal`과 같아, 목표 변경을 `useChangeGoal` 하나로 모으려고 설정 변경 함수·훅(`patchMeSettings`·`useUpdateMeSettings`)을 지운다. 설정의 `clipboardLinkDetection`(v3에서 없어짐)과 탈퇴 사유(`reason`, v3는 받지 않음)를 뺀다. 마이·설정 응답의 `goal`은 계정 목표라 화면의 내 목표로 쓰지 않는다(기기 목표). 새 API(`PATCH /users/me`, `/me/body-profile`, `/me/history`, `/me/contributions`)는 쓰는 화면을 만들 때 넣는다                                                                                                                                                                                                                                                                                                                         |
| 2026-11-23 | 13-3 기여: 분석 요청 상태 값을 v3(`ANALYZING`·`REVIEWING`·`DONE`·`FAILED`)로 바꾸고 응답에 `statusLabel`·`alreadyRequested`·`message`를 더한다. 3-6 제품명 요청(`productName`·`brandName`·`originBarcode`·`originKeyword`)을 입력에 더한다. 문의(`/support/inquiries`)는 v3에서 없어져 지우고, 3-2 「정보가 틀렸어요」용 오류 제보(`POST /products/{id}/reports`, `useReportProduct`)를 더한다. 제보는 마이 요약에 보이지 않아 다시 부를 조회가 없다                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-24 | 13-3 로깅: v3에서 없어진 노출(`/logging/impression`)·온보딩 단계(`/logging/onboarding-step`) 로그를 지운다. 기존 5종 중 남은 4종(view·cta·search·filter)과 스캔 실패(scan-event)는 그대로 둔다. v3 앱 이벤트 `POST /events`를 `logEvent(name, { screen, props })`로 더한다 — 이름은 백엔드 허용 목록 61개를 유니온 타입으로 두고, 기기 시각(ISO-8601)을 붙이고, 화면을 떠나는 순간에도 가도록 CTA처럼 fetch keepalive로 한 개씩 보낸다. 이벤트별 속성·기록 시점은 화면을 연결할 때 기능명세 LOG_002를 따른다                                                                                                                                                                                                                                                                                                                                                   |
| 2026-11-24 | 13-4a 온보딩 정리: v3에서 없어진 개인정보 동의·건강정보 동의(조회·동의·철회)·샘플·온보딩 완료 API와 훅을 지우고 `src/lib/onboarding`에는 bootstrap과 기기 온보딩 완료 기록만 남긴다. bootstrap 필드를 v3(`goalAccountConsented`·`bodyProfileConsented`·`marketingConsented`·`kcalBand`)로 바꾼다. 첫 실행 여부와 온보딩 완료는 기기가 기억해(ONB_001) bootstrap에 합치지 않고, 계정 삭제 때 기기 목표와 함께 지운다(ACCT_008). 폴더 이름은 그대로 둔다                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-24 | 13-4b 동의: 가입 동의 항목(`GET /meta/consent-items`), 내 동의(`GET /me/consents`), 선택 동의 켜기·철회(`PUT /me/consents/{item}`)를 `src/lib/consent`에 더한다. 목표 저장을 켜면 기기 목표를 함께 보내 계정에 저장하고(ONB_009), 목표 저장 변경 뒤에는 계정 목표에 딸린 조회를, 몸 정보 변경 뒤에는 칼로리 구간이 바뀌어(철회하면 2,000) bootstrap과 점수를 담은 조회(상품·검색·저장)를, 광고성 정보 수신은 bootstrap만 다시 부른다. 철회한 민감정보로 계산한 점수가 남지 않게 하려는 것이고, 열려 있는 상세는 조회수가 1 오른다(감수). 몸 정보 동의의 `bodyProfile`은 5-7을 연결할 때 넣는다. 옛 코드(`CONSENT_REQUIRED`·`HEALTH_CONSENT_REQUIRED`)만 알아보던 동의 게이트는 v3 흐름에 「403 → 동의 → 이어 보내기」가 없어 지우고(사용자 결정), 오류 문구 표를 v3 `ErrorCode`로 맞춘다                                                                       |
| 2026-11-24 | 13-4c 가입: 로그인 응답을 `TokenDto`(가입한 계정 / 처음 로그인)로 나눈다. 처음 로그인이면 토큰이 없어 저장하지 않고 다른 탭 방송·사용자 조회 무효화도 하지 않은 채 `SIGNUP_REQUIRED`(가입 토큰·회사 계정 정보)를 돌려준다. `POST /auth/signup`(`useSignup`)은 동의·약관 판에 「목표 계정 저장」에 동의했으면 5-6c에서 기기에 저장한 목표를 붙여 보내고(동의하지 않았으면 민감정보라 보내지 않는다, ONB_004), 토큰을 저장한 뒤 로그인과 같게 마무리한다(방송·무효화·계정 목표 맞추기). 판 충돌(409)이면 가입 동의 항목을 다시 부른다. 가입 응답은 늘 토큰을 줘 타입으로만 표현하고 따로 검사하지 않는다. 종류별 병합 수(`merged`)는 5-6b 연결 완료 화면이 쓴다                                                                                                                                                                                                  |
| 2026-11-24 | 13-4d 일괄 수정: 「범위」·「기능 → 엔드포인트 매핑」·「진행 가정」·「남은 질문」·「화면 연결 때 챙길 것」을 v3 기준으로 고친다. 매핑표는 기능별로 다시 쓰고 훅 이름을 더한다. v3 이전 기록(「Swagger 확인 결과」·결정 기록·06단계 상세)은 그대로 둔다. 13단계를 마친다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-28 | 12단계 재편: #15 머지 뒤 온보딩 · 검색 · 스캔 · 정렬 · 필터 · 랭킹 · 상세를 먼저 연결한다(사용자 결정). 스캔·검색의 「제품 요청하기」는 `/contribute/request`로 가는 링크라서 그 화면의 보내기(12-7)도 함께 한다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-11-28 | 검색 · 랭킹 · 홈의 목표는 기기 목표(`useDeviceGoal`)로 읽고, #15가 쓰던 주소 `?goal=` 전달은 지운다(사용자 결정). 주소와 기기 값이 섞이면 5-2에서 바꾼 목표가 다른 화면에 반영되지 않아서다. 그래서 5-2 목표 바꾸기(`useChangeGoal`)를 12-3에 함께 넣는다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
