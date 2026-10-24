# API 연동 작업 플랜

> 상태: **00단계 완료** (2026-10-24). 이 문서는 범위·순서·결정만 기록한다. 항목별 진행 체크는 개인 체크리스트(리포 밖)에서 한다.

## 목적

디자인이 확정되기 전에 화면과 무관하게 쓸 수 있는 데이터 레이어를 먼저 만든다.

- 만드는 것: API 클라이언트, 타입, API 함수, 쿼리 키, 훅, 목 데이터, 인증 흐름
- 건드리지 않는 것: 페이지·컴포넌트의 스타일과 레이아웃. 데이터를 받아오는 부분만 바꾼다
- 명세가 애매하거나 빠진 부분은 추측해서 채우지 않고 백엔드 질문으로 남긴다

## 기준 문서

공개 리포라 내부 문서 링크는 싣지 않는다. 주소는 팀 공지를 참고한다.

- 노션 「API 명세서」(팀 워크스페이스) — 엔드포인트별 정책·예외 처리 규칙
- 배포 API 서버의 Swagger(`/swagger-ui/index.html`, JSON은 `/v3/api-docs`) — 실제 요청·응답 필드
- 백엔드 소스 — Swagger에 없는 에러 응답 형태와 헤더 처리 확인용

## 범위

1차 사용자 API 37개.

| 도메인      | 엔드포인트                                                                                                                   | 개수 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- | ---- |
| 온보딩·동의 | `/app/bootstrap`, `/onboarding/consent`, `/me/health-consent`(조회·동의·철회), `/onboarding/samples`, `/onboarding/complete` | 7    |
| 인증        | `POST /auth/oauth`, `/auth/refresh`, `/auth/logout`                                                                          | 3    |
| 상품        | `/products/barcode/{barcode}`, `/products/{productId}`, `/products/{productId}/grade-reason`                                 | 3    |
| 안내        | `/grades/guide`, `/meta/policies`                                                                                            | 2    |
| 목표        | `GET·PUT /me/goal`                                                                                                           | 2    |
| 검색        | `/search/suggestions`, `/search`, `/search/keywords/popular`                                                                 | 3    |
| 저장        | `/me/saved-products` 목록·저장·해제                                                                                          | 3    |
| 마이·설정   | `/me/summary`, `/users/me`(조회·탈퇴), `/me/settings`(조회·변경)                                                             | 5    |
| 기여·문의   | `/analysis-requests`, `/support/inquiries`                                                                                   | 2    |
| 로깅        | 기존 5종 + `/logging/scan-event`, `/logging/onboarding-step`                                                                 | 7    |

`/support/inquiries`와 `DELETE /users/me`는 화면 진입점이 정해지지 않아 API 함수만 만든다.

제외:

- 관리자 API 9개 — 관리자 페이지에서 쓴다
- 2차 API 7개 — 랭킹, 링크 인식·구매 링크, 오류 제보
- 보류·폐지 — `/search/keywords/recent`, 알림(3차), `/auth/register`
- OAuth 콜백 `GET /auth/oauth/{provider}` — 백엔드가 처리하고 프론트는 리다이렉트된 `?code&provider`만 받는다

## Swagger 확인 결과 (2026-10-24)

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
- 배포 서버는 운영 데이터다. 상품 조회만 해도 조회수가 오르고, 없는 바코드는 분석 대기 목록에 등록된다. 개발 중 실험 호출을 하지 않는다

## 작업 흐름

보통은 기능 하나씩 스펙 합의 → 목으로 병렬 개발 → 실제 API로 교체를 반복한다. 이 프로젝트는 디자인이 확정될 때까지 화면 연결만 뒤로 미룬다.

1. **스펙 합의** — 화면에 필요한 데이터를 정리하고 백엔드와 엔드포인트·응답 형태를 맞춘다
2. **기반 레이어** — HTTP 클라이언트, 인증 헤더, 토큰 갱신, 공통 에러 처리, QueryClient 설정. 한 번만 만든다
3. **기능 단위 반복** — 타입 → API 함수 → 쿼리 키·훅 → 화면 연결 → 로딩·에러·빈 상태. 백엔드가 구현 중이면 목으로 개발한다
4. **실제 API 연동** — 목을 끄고 연결한다. 명세와 다른 점은 백엔드에 알리고 명세를 고친 뒤 「스펙 합의」로 돌아간다. 차이는 mapper에서 흡수한다
5. **예외 케이스 점검** — 토큰 만료, 네트워크 끊김, 빈 결과, 권한 에러를 실제 서버에서 확인한다

레이어 단위로 진행하되, 06단계에서 상품 도메인 하나를 `lookup.ts`와 상세 페이지 연결까지 끝까지 만들어 패턴을 먼저 검증한다.

## 단계

각 단계가 끝나면 `pnpm typecheck`, `pnpm lint`(테스트를 추가한 단계는 `pnpm test`까지)를 통과시키고 확인받은 뒤 다음 단계로 넘어간다.

| 단계 | 이름                  | 할 일                                                                                                                                               | 확인받을 것              |
| ---- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 00   | 명세 확보             | 노션 명세 받기, 범위 확정                                                                                                                           | 범위 (완료)              |
| 01   | 사전 정리             | 현재 스택 요약, 화면 → 엔드포인트 매핑표, 백엔드 질문 리스트                                                                                        | —                        |
| 02   | 백엔드 답변 받기      | 아래 「백엔드 질문」 답변                                                                                                                           | —                        |
| 03   | 구조·라이브러리 결정  | 아래 「03단계 결정 항목」                                                                                                                           | 결정 항목 전부           |
| 04   | API 클라이언트        | 기존 `src/lib/api.ts` 확장, 인증·익명 ID·세션 헤더, `data` 언래핑, `ApiError`(`data.code`) 통일, 401 토큰 갱신, 갱신 실패 시 로그아웃, 목 서버 설정 | —                        |
| 05   | 타입 정의             | 공통 타입, 도메인 DTO, DTO → 화면 모델 mapper, `INSUFFICIENT` 표현 방식                                                                             | `INSUFFICIENT` 표현 방식 |
| 06   | 핵심 도메인: 상품     | 아래 「06단계 상세」                                                                                                                                | 상품 도메인 패턴         |
| 07   | QueryClient·공통 상태 | 기존 `src/app/providers.tsx`의 기본 옵션, 로딩·에러·빈 데이터 처리 방식, 에러 알림 공통 함수, 동의 필요(403) 처리                                   | 로딩·에러 처리 방식      |
| 08   | 나머지 도메인         | 온보딩·동의, 목표, 저장, 검색, 마이·설정, 기여·문의, 로깅                                                                                           | —                        |
| 09   | 캐시 무효화 규칙      | 목표 변경, 저장·해제, 건강정보 동의 철회, 로그인·로그아웃 후 다시 불러올 조회                                                                       | —                        |
| 10   | 목 데이터             | 아직 없는 API 핸들러, 에러 시나리오(404, 403 `CONSENT_REQUIRED`, 401 토큰 만료)                                                                     | —                        |
| 11   | 인증 흐름             | OAuth 콜백 화면, 토큰 저장·읽기, 로그아웃 시 익명 ID 교체, 로그인 상태 판단, 보호 라우트                                                            | —                        |

### 03단계 결정 항목

- **목 서버(MSW) 추가 여부** — 개발 서버가 없으면 운영 서버를 대신할 목이 필요하다
- **타입 작성 방식** — Swagger에서 자동 생성할지, 명세를 보고 직접 쓸지. 자동 생성은 enum·필수 정보가 없어 모든 필드가 선택값으로 나온다
- **토큰 저장 위치** — 토큰이 응답 본문으로 와서 프론트가 보관한다. 아래 항목과 함께 정한다
- **상세 페이지 조회 위치** — `/product/[id]`는 서버 컴포넌트(`generateMetadata`, `notFound()`)이고 명세도 SSR 대상이다. 서버에서 조회하면 localStorage의 익명 ID·토큰을 못 보내 일반 기준 등급이 나온다. 서버 조회 + 서버용 base URL로 갈지, 클라이언트 훅으로 내릴지 정한다
- **CORS 대응** — 백엔드에 허용을 요청할지, Next.js rewrites로 중계할지
- **만들 파일 목록과 순서**

### 06단계 상세

- API 함수: `GET /products/barcode/{barcode}`, `GET /products/{productId}`, `GET /products/{productId}/grade-reason`
- `productKeys` 쿼리 키 팩토리. 스캔 시트의 기존 `["product", gtin]` 키도 여기로 옮긴다
- 조회 훅: `useProductByBarcode`, `useProductDetail`, `useGradeReason`
- `lookup.ts`를 실제 API에 연결한다. 404 `PRODUCT_NOT_FOUND`는 에러가 아니라 not-found 결과로, 400 `BARCODE_CHECKSUM_INVALID`는 따로 구분한다
- 상세 페이지의 데이터 소스도 같은 단계에서 API로 바꾼다. 스캔 결과 id와 상세 조회 id가 같은 소스에서 나와야 스캔 → 상세가 `notFound()`로 떨어지지 않는다. 홈 「최근 본 제품」은 맞는 1차 API가 없어 목으로 둔다
- path 값은 `encodeURIComponent`로 넣고, 이상한 id로 상세에 들어오면 `notFound()`
- 등급 없음 응답(200 + `INSUFFICIENT`, grade·topReason 없음) 처리
- 상품 목 핸들러(명세 출력 형태 그대로)
- 테스트: mapper, lookup. 기존 테스트로 고정한 성질(프로토타입 키 방어, not-found 계약)이 유지되는지 확인

## 백엔드 질문

- `/products/barcode/{barcode}`가 받는 형식 — GTIN-13/14 중 무엇인지, 앞에 0을 붙인 14자리도 체크섬 검증을 통과하는지. 프론트는 현재 14자리로 정규화해 보냄
- 응답 필드의 필수·null 여부 — Swagger에 표시가 거의 없음
- 상품 상세 응답의 예전 필드(`id`, `name`, `pns`, `coupang`, `nutrients`, `favorited` 등)를 계속 유지하는지
- 개발·스테이징 서버가 있는지 — 배포 서버는 운영 데이터라 개발 중 호출하기 어려움
- CORS 허용 계획 — 지금은 프리플라이트에 허용 헤더가 없음. 커스텀 헤더 `X-Anonymous-Id`, `X-Session-Id`, `X-Cohort`도 허용해야 함
- 검색 응답 페이지네이션 형태 — 저장 목록은 `totalCount/hasNext`, 검색은 `Section` 구조
- `DELETE /users/me` 탈퇴 사유를 query와 body 중 어디로 보내는지 — 노션은 body, Swagger는 query
- OAuth 콜백이 리다이렉트하는 `frontendUrl` 경로
- 동의 없이 온보딩을 끝낸 사용자의 완료 상태 동기화 방식 — 명세에 「팀 확인 필요」로 남아 있음
- 노션 「수정」 링크 페이지 내용 — 내보내기에 포함되지 않음

## 결정 기록

| 날짜       | 결정                                                                                  |
| ---------- | ------------------------------------------------------------------------------------- |
| 2026-10-24 | 범위를 1차 사용자 API 37개로 확정. 관리자·2차·보류 API는 제외                         |
| 2026-10-24 | `/support/inquiries`, `DELETE /users/me`는 API 함수만 만든다                          |
| 2026-10-24 | 노션 명세 사본과 개인 작업 문서는 로컬에만 두고, `docs/`에서는 이 문서만 git에 올린다 |
| 2026-10-24 | 공개 리포라 노션·체크리스트 등 내부 문서 링크는 싣지 않는다                           |
| 2026-10-24 | `docs/design/`은 디자인 브랜치가 추적하므로 git에서 제외하지 않는다                   |
