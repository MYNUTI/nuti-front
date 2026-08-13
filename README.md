# nuti-front

## 기술 스택

- Next.js 16 (App Router) / React 19 / TypeScript
- Tailwind CSS v4
- TanStack Query + axios
- ESLint + Prettier

## 시작하기

```bash
pnpm install
```

`.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.

```bash
cp .env.example .env.local
```

```bash
pnpm dev
```

http://localhost:3000

## 스크립트

| 명령          | 설명          |
| ------------- | ------------- |
| `pnpm dev`    | 개발 서버     |
| `pnpm build`  | 프로덕션 빌드 |
| `pnpm lint`   | ESLint 검사   |
| `pnpm format` | Prettier 포맷 |

## 디렉토리 구조

```
src/
  app/ # 라우트, 레이아웃
  components/ # 공용 컴포넌트
  hooks/ # 커스텀 훅 (useQuery 래퍼 등)
  lib/ # axios 인스턴스, 유틸
  types/ # 공용 타입
```
