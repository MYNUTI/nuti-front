# 마이뉴티 디자인 시스템

## 파일

- `src/styles/tokens.css` — 디자인 토큰 (색·간격·라운딩·타이포·컴포넌트 규격). **색상값·간격을 코드에 직접 쓰지 말고 여기 변수만 사용**
- `src/app/globals.css` 상단에서 import 중

## 시안

- 화면 시안 40장 (온보딩·스캔·결과·탐색·기여·비교·재방문·설정): 캔버스 링크는 팀 노션/디스코드에 공유됨
- 화면 정의서: `영양대학_IA_화면정의서_최종_20260819.docx` (1~4차 개발 순서·이벤트 명세·남은 결정 포함)

## 반드시 지킬 규칙 5가지

1. **등급 표현은 색 단독 금지** — 색(fill) + 문자(A~E) + 램프 위치, 3중 인코딩. 색약 대응이자 신뢰 요건
2. **등급 필 위 문자는 항상 흰색**, 등급 문자를 배경 없이 단독으로 크게 쓸 때는 `--grade-*-text` 값 사용 (크림 배경 대비 확보)
3. **CTA 색(`--cta` 베리)은 등급색과 절대 섞지 않는다** — 화면당 주요 행동 1개에만
4. **터치 타깃 최소 44px** (`--touch-min`) — 시각적 크기가 작아도 히트 영역은 확보
5. **뎁스는 보더로** (`--hairline`) — 카드에 그림자 사용하지 않음. 순백 배경·순검정 텍스트 금지

## 웹폰트 (해야 할 일)

시안은 로컬 Pretendard 기준. 실서비스는 웹폰트 정식 탑재 필요:

```
pnpm add pretendard
# 또는 CDN: https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard-dynamic-subset.css
```

## Tailwind v4 연동 (제안 — 팀 결정)

`globals.css`의 `@theme inline` 블록에 토큰을 매핑하면 유틸리티 클래스로 쓸 수 있습니다:

```css
@theme inline {
  --color-bg: var(--bg);
  --color-ink: var(--ink);
  --color-cta: var(--cta);
  --color-grade-a: var(--grade-a-fill);
  /* … */
}
```

## 미확정 (IA 6-2 참조)

- 온보딩 구성(스캔 우선 vs 픽커 우선) — 바코드 매핑률 실측 후 결정
- 알림 수단 — 카카오 채널 우선, PWA 웹푸시 병행 여부는 설치 전환율 보고
- 등급 2층 산정(카테고리 보정)의 구체 수식 — 미정. 1층 절대 평가만으로 개발 진행
