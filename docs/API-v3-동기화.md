# API v3 동기화

> 상태: **차이 정리** (2026-11-21). 배포 서버가 v3로 바뀌어 데이터 레이어(04–11단계, 백엔드 `c164ec0` 기준)와 응답이 맞지 않는다. 이 문서는 차이와 고칠 순서만 적는다. 결정은 `API-작업-플랜.md` 「결정 기록」에 남긴다.

## 기준

- 배포 Swagger(`https://api.nutriuniv.co.kr/v3/api-docs`, 2026-11-21 받음). 관리자(`/admin/*`) 제외 사용자 경로 48개를 봤다
- Swagger로 알 수 없는 것은 백엔드 저장소(`MYNUTI/nuti`) 소스로 확인했다. 배포 서버와 소스가 같은지는 확인하지 못했다
- 백엔드 `main`은 `1ddb9b4`(2026-11-17, PR #74 「v3 명세 동기화」). v3 작업은 PR #68–#74(2026-11-09–17)

### Swagger로 알 수 없는 것

- 허용값(enum), 필수·null 여부, 에러 코드는 예전처럼 설명 글에만 있거나 없다
- **스키마 이름 충돌**: 아래 9개 응답의 목록 항목이 모두 `Item` 하나(동의 항목 모양)로 그려져 있다. springdoc이 이름이 같은 내부 클래스를 하나로 합친 것이다. 이 9개는 백엔드 소스(`main` `1ddb9b4`)의 DTO로 확인했다

| 응답                             | 항목 모양(백엔드 소스)                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| `GET /me/history`                | `{ product: ProductCard, viewedAt, source, viewCount }`                                |
| `GET /me/saved-products`         | `{ product: ProductCard, savedAt }`                                                    |
| `GET /products/compare`          | `{ product: ProductCard, serving, basis, nutrients: NutrientRow[] }`                   |
| `GET /rankings`                  | `{ rank, product: ProductCard }`                                                       |
| `GET /rankings/overview`         | `groups[].items`가 `GET /rankings`와 같은 `{ rank, product }`                          |
| `GET /search/keywords/popular`   | `keywords: { rank, keyword }[]`                                                        |
| `GET /search/suggestions`        | `{ type: PRODUCT·KEYWORD, productId?, name, brandName?, matchedRanges }` — 지금과 같다 |
| `GET /analysis-requests/popular` | `{ requestId, displayName, requestCount, status, statusLabel }`                        |
| `GET /meta/policies`             | `privacy`·`terms`가 `{ version, url, updatedAt }`(날짜) — 지금과 같다                  |

## 큰 변화

1. **익명 ID를 서버가 발급하지 않는다.** 기기가 첫 실행 때 UUID를 만들어 `X-Anonymous-Id`로 보낸다(bootstrap 설명). 지금은 개인정보 동의(`POST /onboarding/consent`) 응답으로 받는다(`identity.ts`의 「개인정보 동의 전에는 서버가 발급하지 않아 null」). 로그아웃 응답에도 새 익명 ID가 없다 — 새로 만들지는 클라이언트가 정한다(서버 추천: 새로 만든다). 탈퇴 뒤에는 새로 만든다
2. **목표가 두 개다.** `GENERAL`이 없어지고 미설정·식별 없음은 `WEIGHT_LOSS`로 답한다. 화면(`diet`·`muscle`)과 개수가 맞는다. 화면의 목표는 기기에 둔다(v3 기능명세 ONB_004 · ACCT_002). 서버는 로그인하고 「목표 계정 저장」(`GOAL_ACCOUNT`)에 동의한 계정만 목표를 저장한다(로그인 아니면 401, 미동의 403 `GOAL_CONSENT_REQUIRED`. Swagger 설명 「동의는 필요 없습니다」는 소스와 다르다)
3. **동의가 6항목으로 바뀌고 가입이 생겼다.** 필수 `AGE_14`·`TERMS`·`PRIVACY`, 선택 `GOAL_ACCOUNT`·`BODY_PROFILE`·`MARKETING`. 처음 로그인하면 계정을 만들지 않고 `signupRequired` + `signupToken`(30분)을 주고, `POST /auth/signup`으로 동의와 함께 가입한다. 개인정보·건강정보 동의 API와 온보딩 API는 없어졌다
4. **상품 결과가 두 목표를 한 번에 준다.** 바코드·상세 모두 `ProductResultResponse` 하나로, 목표마다 점수·등급·한 줄 해석·좋은 점·아쉬운 점·더 맞는 제품 수(`goals[]`)와 성분별 100g당·1회 제공량 값(`nutrients[]`), 상태 5종, 쿠팡 구매 줄을 준다. 등급 근거 API(`grade-reason`)는 없어졌다
5. **칼로리 구간(`kcalBand`)** 이 생겼다. 몸 정보(5-7)에 동의하고 저장한 계정만 저장한 구간(1,500·2,000·2,500·3,000), 그 밖은 2,000. 결과·검색·랭킹 응답에 함께 온다

## 도메인별 차이

조치: **유지**(그대로), **수정**(경로는 같고 필드가 바뀜), **교체**(다른 API로 바뀜), **삭제**(대응 API 없음), **신규**(지금 없는 API).

### 식별·인증 (`lib/api`, `lib/auth`)

| 지금                                             | v3                                                                                 | 조치                                                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 익명 ID: 개인정보 동의 응답으로 받아 쿠키에 저장 | 기기가 UUID를 만들어 보낸다                                                        | 수정. 쿠키가 없으면 만든다. 동의 전 null 전제를 쓰는 곳(로깅 「동의 전에는 세션 ID만」 등)을 함께 고친다 |
| `POST /auth/oauth` → `LoginDto`                  | 같은 경로. `signupRequired`·`signupToken`·`signupProfile`·`merged`(종류별 수) 추가 | 수정. `signupRequired`면 토큰이 없다                                                                     |
| —                                                | `POST /auth/signup`(`signupToken` + 동의 6항목 + 판 + `goal`)                      | 신규                                                                                                     |
| `POST /auth/logout` → `{ anonymousId }`          | 응답 `data` 없음                                                                   | 수정. 새 익명 ID는 클라이언트가 만든다(결정 필요)                                                        |
| `POST /auth/refresh`                             | 같은 경로, 응답이 `TokenResponse`(토큰 둘은 같음)                                  | 유지                                                                                                     |

### 온보딩·동의 (`lib/onboarding`)

| 지금                                     | v3                                                                                                                                                                               | 조치                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `GET /app/bootstrap`                     | 같은 경로. `consentAgreed`·`healthConsented`·`onboardingCompleted`·`clipboardLinkDetection` 없음 → `goalAccountConsented`·`bodyProfileConsented`·`marketingConsented`·`kcalBand` | 수정(13-4a). 첫 실행 여부는 기기가 기억한다                        |
| `POST /onboarding/consent`               | 없음                                                                                                                                                                             | 삭제(13-4a) → 가입(`/auth/signup`)으로                             |
| `GET`·`POST`·`DELETE /me/health-consent` | 없음                                                                                                                                                                             | 삭제(13-4a) → `GET /me/consents`, `PUT /me/consents/{item}`(13-4b) |
| `GET /onboarding/samples`                | 없음                                                                                                                                                                             | 삭제(13-4a)                                                        |
| `POST /onboarding/complete`              | 없음                                                                                                                                                                             | 삭제(13-4a). 완료 기록은 기기에만(`storage.ts`)                    |
| —                                        | `GET /meta/consent-items`(항목 6개 + 약관·처리방침 판)                                                                                                                           | 신규                                                               |

### 상품 (`lib/product`, `lib/scan`)

| 지금                                                                                                              | v3                                                                                                                                                                 | 조치                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `GET /products/barcode/{barcode}` → `status`·`product`·`grade`·`topReason`·`appliedGoal`, 404 `PRODUCT_NOT_FOUND` | 같은 경로. `outcome`(`RESULT`·`MULTIPLE`·`NO_SCORE`·`NOT_FOUND`)·`barcode`·`result`(결과 화면 전체)·`candidates`. **미등록도 200**(`NOT_FOUND`). 체크섬 400은 같다 | 수정. `lookupBarcode`의 404 처리를 `outcome`으로 바꾸고 `MULTIPLE`을 더한다. 12-1 스캔 연결도 고친다 |
| `GET /products/{productId}` → `ProductDetailDto`                                                                  | 같은 경로, `ProductResultResponse`. `source` query(최근 본 제품 기록용) 추가                                                                                       | 수정                                                                                                 |
| `GET /products/{productId}/grade-reason`                                                                          | 없음. 좋은 점·아쉬운 점은 상세 `goals[].goods`·`bads`                                                                                                              | 삭제                                                                                                 |
| —                                                                                                                 | `GET /products/{id}/alternatives`(더 맞는 제품, 목표·페이지)                                                                                                       | 신규                                                                                                 |
| —                                                                                                                 | `GET /products/{id}/purchase-link`                                                                                                                                 | 신규. 상세 `purchase`에 같은 값이 있어 따로 부를 일은 적다                                           |
| —                                                                                                                 | `POST /products/{id}/reports`(오류 제보, 항목 여러 개)                                                                                                             | 신규                                                                                                 |
| —                                                                                                                 | `GET /products/compare?ids=`(2–4개)                                                                                                                                | 신규                                                                                                 |
| —                                                                                                                 | `GET /grades/guide`                                                                                                                                                | 신규(1차에도 있었지만 데이터 레이어 없음). 5-4 화면은 지금 문구를 코드에 둔다                        |

### 목표 (`lib/goal`)

| 지금                                           | v3                                                                                                  | 조치                                                                                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `Goal` = `GENERAL`·`WEIGHT_LOSS`·`MUSCLE_GAIN` | `WEIGHT_LOSS`·`MUSCLE_GAIN`                                                                         | 수정. 다른 도메인 타입도 함께 바뀐다                                                                                                |
| `GET /me/goal` → `healthConsented`             | `goalAccountConsented`                                                                              | 수정                                                                                                                                |
| `PUT /me/goal`, 감량·근육은 동의 필요(403)     | 계정 저장 전용. 로그인 아니면 401, 「목표 계정 저장」 미동의 403 `GOAL_CONSENT_REQUIRED`(소스 기준) | 수정(13-3). 화면 목표는 기기 쿠키(`useDeviceGoal`), 동의한 로그인 계정만 계정에도 저장(`useChangeGoal`). `useConsentGate` 대상 아님 |

### 저장 (`lib/saved`)

| 지금                                                                        | v3                                                                                                                 | 조치                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `GET /me/saved-products` → 항목 `status`·`grade`·`label`·`savedAt`          | 같은 경로. `goal` query, 응답 `goal`·`kcalBand`, **page·size가 1부터**. 항목은 `{ product: ProductCard, savedAt }` | 수정                                               |
| `POST`·`DELETE /me/saved-products/{id}`, 식별 없으면 403 `CONSENT_REQUIRED` | 같은 경로. 식별 없으면 400 `ANONYMOUS_ID_REQUIRED`, 동의 필요 없음                                                 | 수정. 「403 → 동의 → 이어서 저장」 경로가 없어진다 |

### 검색 (`lib/search`)

| 지금                                                                              | v3                                                                                                                                                                                | 조치            |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `GET /search` → `exactMatches`·`similarProducts` 두 섹션                          | 한 목록 `items` + `pinned`·`category`·`sort`·페이지, 카드는 `ProductCard`(두 목표 점수·태그·`better`·`saved`), 0건이면 `didYouMean`·`sameCategoryTop`, `analysisRequestAvailable` | 수정(거의 새로) |
| `GET /search/suggestions` → `type`·`productId`·`name`·`brandName`·`matchedRanges` | 같은 경로, `size` query 추가. 항목은 같다                                                                                                                                         | 유지            |
| `GET /search/keywords/popular` → `{ rank, keyword }[]`                            | `{ basedAt, keywords: { rank, keyword }[] }`. 목록이 한 단계 안으로 들어갔다                                                                                                      | 수정            |

### 마이·설정 (`lib/me`)

| 지금                                                      | v3                                                                                               | 조치                                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `GET /me/summary`                                         | 같음                                                                                             | 유지                                                                            |
| `GET /users/me`, `DELETE /users/me?reason=`               | 같음. 탈퇴는 사유를 받지 않는다(`UserController.deleteMe`)                                       | 수정(13-3). `reason` query를 뺐다                                               |
| `GET`·`PATCH /me/settings`, `clipboardLinkDetection` 포함 | `clipboardLinkDetection` 없음. `PATCH`는 목표만 받고 로그인 + 「목표 계정 저장」 동의가 필요하다 | 수정(13-3). `PATCH`는 `PUT /me/goal`과 겹쳐 지웠다(목표 변경은 `useChangeGoal`) |
| `GET /meta/policies` → `{ version, url, updatedAt }`      | 같다                                                                                             | 유지                                                                            |
| —                                                         | `PATCH /users/me`(이메일·닉네임)                                                                 | 신규                                                                            |
| —                                                         | `GET`·`PUT`·`DELETE /me/body-profile`(몸 정보, 로그인 + `BODY_PROFILE` 동의)                     | 신규(5-7)                                                                       |
| —                                                         | `GET /me/history`(최근 본 제품, 등급 필터·페이지, page 0부터)                                    | 신규(4-1·4-2)                                                                   |
| —                                                         | `GET /me/contributions`(내 요청·제보 목록과 상태)                                                | 신규(5-3)                                                                       |

### 기여 (`lib/contribution`)

| 지금                                                                   | v3                                                                                                                                                                                                                                | 조치                                                                                                   |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `POST /analysis-requests` → `requestId`·`type`·`requestCount`·`status` | 요청에 `productName`·`brandName`·`originBarcode`·`originKeyword` 추가(제품명 요청). 응답에 `statusLabel`·`alreadyRequested`·`message` 추가. 상태 값이 `ANALYZING`·`REVIEWING`·`DONE`·`FAILED`로 바뀌었다(`AnalysisRequestStatus`) | 수정(13-3)                                                                                             |
| `POST /support/inquiries`                                              | 없음                                                                                                                                                                                                                              | 삭제(13-3). 3-2 「정보가 틀렸어요」는 `POST /products/{id}/reports`(`useReportProduct`, 13-3에서 추가) |
| —                                                                      | `GET /analysis-requests/popular`                                                                                                                                                                                                  | 신규                                                                                                   |

### 로깅 (`lib/logging`)

| 지금                                                        | v3                                     | 조치                                                                                                                 |
| ----------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `view`·`cta`·`search`·`filter`·`scan-event`                 | 같음                                   | 유지                                                                                                                 |
| `POST /logging/impression`, `POST /logging/onboarding-step` | 없음                                   | 삭제(13-3)                                                                                                           |
| —                                                           | `POST /events`(이벤트 묶음, 이름 61개) | 신규(13-3). `logEvent`로 한 개씩 보낸다. 이름 61개는 백엔드 `EventNames.KNOWN`, 속성·시점 정본은 v3 기능명세 LOG_002 |

### 홈·랭킹 (지금 데이터 레이어 없음)

| v3                                                                                                    | 쓰는 화면                                                     |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `GET /home`(최근 본 제품 수, 내 요청 수, 대분류 15개, 판매처별 수)                                    | 2-1 홈. 지금 fixture인 최근 본 제품 요약의 일부를 채운다      |
| `GET /rankings/categories`·`/rankings`·`/rankings/overview`·`/rankings/filters`·`/rankings/brands`    | 2-2·2-5 등급 순위·필터                                        |
| `GET /categories`, `/brands`, `/categories/{id}/brands`, `GET /products`, `/products/nutrient-claims` | 설명이 v3 표시가 없는 예전 것이다. 화면을 만들 때 쓸지 정한다 |

## 12단계에 미치는 영향

`API-작업-플랜.md` 「12단계 상세」의 결정할 것과 API가 없는 값이 상당수 풀린다.

| 항목                        | v3                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 결정 1 목표 값 대응         | 두 개로 맞는다. 1-5 목표는 기기에 저장한다(`useChangeGoal`). 계정에는 로그인 + 「목표 계정 저장」 동의일 때만 |
| 결정 2 점수 구간            | 그대로 남는다. 응답은 `score` + `grade`(A–E) + `label`                                                        |
| 결정 3 영양성분 기준        | 풀림. `nutrients[].per100g`·`perServing`에 값·1일 기준치 %·단계가 온다                                        |
| 결정 4 좋은 점·아쉬운 점    | 풀림. `goals[].goods`·`bads`(+ 없을 때 문구 `badsEmptyText`)                                                  |
| 분류·생산 중단·쿠팡 주소    | `category`, `state`·`stateLabel`, `purchase`                                                                  |
| 다른 목표로 미리 보기       | `goals[]`에 두 목표가 같이 온다                                                                               |
| 더 맞는 제품                | `goals[].better`(수) + `GET /products/{id}/alternatives`(목록)                                                |
| 내 몸에 맞춤                | `kcalBand` + `/me/body-profile`                                                                               |
| 정보가 틀렸어요             | `POST /products/{id}/reports`                                                                                 |
| 3-1 바코드에 제품이 여러 개 | `outcome: MULTIPLE` + `candidates`                                                                            |
| 같은 종류 중 순위           | 여전히 없다(결과 응답에 순위 없음. 랭킹 목록의 `rank`만 있다)                                                 |
| 홈 최근 본 제품 요약        | `GET /home`의 `viewedCount`·`requestCount`. 점수 구간별 개수는 없다                                           |

## 고칠 순서 (제안)

1. 공통: 익명 ID 기기 생성, `Goal` 두 개. 다른 도메인이 다 기대므로 먼저 한다
2. 상품: `ProductResultResponse` 타입·mapper, 바코드 `outcome`, `grade-reason` 삭제. 12-1 스캔 연결을 새 응답에 맞추고 12-2 상세 연결로 이어간다
3. 나머지 도메인은 화면 연결 순서대로(목표 → 저장 → 검색 → 마이 …). 동의·가입은 11단계 인증 흐름과 함께
4. Swagger에 없는 허용값·필수 여부·에러 코드는 그 도메인을 고칠 때 백엔드 소스로 확인한다
