# nuti-front

마이뉴티 웹(PWA) 프론트엔드.

## 기술 스택

- Next.js 16 (App Router, React Compiler) / React 19 / TypeScript
- Tailwind CSS v4 (디자인 토큰은 `src/app/globals.css`)
- TanStack Query + axios
- 바코드 스캔: react-zxing, zxing-wasm, barcode-detector
- 테스트: Vitest
- ESLint + Prettier

Next.js 16은 이전 버전과 API·규칙이 다르다(예: 미들웨어 대신 `src/proxy.ts`). 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 해당 문서를 확인한다.

## 시작하기

Node `>=22.23.4`, pnpm 11이 필요하다.

```bash
pnpm install
```

`.env.example`을 복사해 `.env.local`을 만들고 값을 채운다.

```bash
cp .env.example .env.local
```

```bash
pnpm dev
```

http://localhost:3000

### 환경변수

| 이름                          | 값          | 설명                                                                                           |
| ----------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`         | `/api`      | 브라우저 요청 접두사. `next.config.ts` rewrites가 백엔드로 중계한다                            |
| `API_URL`                     | 백엔드 주소 | 서버 전용(주소는 팀 공지). 비우면 dev는 뜨지만 API 요청이 404가 된다. `next build`는 필수      |
| `NEXT_PUBLIC_LOGGING_ENABLED` | 비움        | 로깅 전송. 비우면 프로덕션 빌드만 보낸다. 개발 중에는 비워 두고 로깅 전송을 확인할 때만 `true` |

개발 서버가 따로 없어 개발 중에도 배포 API 서버(운영 데이터)를 부른다. 상품 조회만 해도 조회수가 오르고 없는 바코드는 분석 대기 목록에 등록되니 실험 삼아 반복 호출하지 않는다.

## 스크립트

| 명령              | 설명                                    |
| ----------------- | --------------------------------------- |
| `pnpm dev`        | 개발 서버                               |
| `pnpm build`      | 프로덕션 빌드                           |
| `pnpm start`      | 프로덕션 서버                           |
| `pnpm typecheck`  | 타입 검사                               |
| `pnpm lint`       | ESLint 검사                             |
| `pnpm test`       | 테스트 1회 실행 (`test:watch`는 감시)   |
| `pnpm format`     | Prettier 포맷 (`format:check`는 검사만) |
| `pnpm pwa:assets` | PWA 아이콘·iOS 스플래시 이미지 생성     |

작업을 마치면 `pnpm typecheck`, `pnpm lint`, `pnpm test`를 통과시킨다.

## 디렉토리 구조

```
src/
  app/          # 라우트. 화면 전용 컴포넌트와 임시 데이터(_fixtures.ts)는 라우트 폴더 옆에 둔다
  components/
    common/     # 공통 부품(피그마 v3 디자인 시스템)
    scan/       # 바코드 스캔 화면 부품
    icons.tsx   # 선 아이콘
    ui/         # shadcn(임시 화면용)
  hooks/        # 여러 도메인에 걸친 훅(동의 필요 처리 등)
  lib/
    api/        # HTTP 클라이언트, 인증·식별 쿠키, 토큰 갱신, 에러, QueryClient
    <도메인>/   # product, onboarding, goal, search, saved, me, auth, contribution, logging
                # 기본 types → mapper → api → keys → queries
    scan/       # 스캔 상태 기계, GTIN 정규화, 바코드 조회
    *.ts        # grade, mock-catalog(목), pwa(SPLASH_COLOR), utils(cn)
  proxy.ts      # 상품 상세 이동 전 토큰 갱신
  test/         # 테스트 헬퍼
scripts/        # PWA 이미지 생성 스크립트
docs/           # 작업 플랜·인수인계 문서
```

## 문서

- [인수인계 (2026-11-09 ~ 11-16)](docs/인수인계-2026-11-09.md) — 현재 진행 상황과 남은 작업 요약
- [API 작업 플랜](docs/API-작업-플랜.md) — API 연동 범위·엔드포인트 매핑·결정 기록
- [UI 작업 플랜](docs/UI-작업-플랜.md) — 피그마 v3 화면 범위·라우트·결정 기록
