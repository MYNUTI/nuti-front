/**
 * 앱 진입 초기화(bootstrap) API의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 배포 Swagger(2026-11-21)와 백엔드 `main` `1ddb9b4`의 `BootstrapResponse`.
 * v3에서 개인정보·건강정보 동의, 샘플, 온보딩 완료 API는 없어졌다. 첫 실행 여부와 온보딩 완료는 기기가
 * 기억한다(`storage.ts`, v3 기능명세 ONB_001). 동의는 가입·동의 관리(`/auth/signup`, `/me/consents`)로 옮겨 갔다
 */
import type { Goal } from "@/lib/goal/types";

// ── DTO ──────────────────────────────────────────────────────────────────────

/**
 * `GET /app/bootstrap`. 동의 값은 로그인한 계정의 선택 동의 상태다(기기 ID만 있으면 false).
 * `kcalBand`·`currentPolicyVersion`은 `@JsonInclude(NON_NULL)`이라 없으면 키가 빠진다
 */
export type BootstrapDto = {
  isLoggedIn: boolean;
  /** 「목표 계정 저장」 */
  goalAccountConsented: boolean;
  /** 「몸 정보 수집·이용」 */
  bodyProfileConsented: boolean;
  /** 「광고성 정보 수신」 */
  marketingConsented: boolean;
  /** 몸 정보에 동의하고 저장한 계정의 칼로리 구간. 없으면 서버는 2000으로 계산한다 */
  kcalBand?: number;
  /** 계정에 저장한 목표(미설정·기기 ID 없음은 WEIGHT_LOSS). 화면의 내 목표는 기기 목표다 */
  goal: Goal;
  /** 현재 약관·처리방침 판. 재동의를 유도할 때 동의 기록 판과 비교한다. 정책이 아직 없으면 없다 */
  currentPolicyVersion?: string;
};

// ── 화면 모델 ────────────────────────────────────────────────────────────────

export type Bootstrap = Omit<
  BootstrapDto,
  "kcalBand" | "currentPolicyVersion"
> & {
  kcalBand: number | null;
  currentPolicyVersion: string | null;
};
