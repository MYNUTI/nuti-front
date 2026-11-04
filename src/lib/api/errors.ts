import { AxiosError, isAxiosError } from "axios";
import type { ApiErrorDetail, ApiFailure } from "@/lib/api/types";

// 서버 `ErrorCode`의 이름과 기본 문구. 서버는 메시지 없이 던진 예외에 message를 null로 보내므로
// 이 문구로 대신한다. 서버에 코드가 추가·변경되면 함께 바꾼다.
// 기준: 백엔드 `common/exception/ErrorCode.java`, 커밋 c164ec0
const SERVER_ERROR_MESSAGES = {
  BAD_REQUEST: "잘못된 요청입니다.",
  VALIDATION_FAILED: "입력값 유효성 검사에 실패했습니다.",
  INVALID_QUERY_PARAM: "유효하지 않은 쿼리 파라미터입니다.",
  BARCODE_CHECKSUM_INVALID: "바코드 체크섬이 일치하지 않습니다.",
  UNAUTHORIZED: "인증이 필요합니다.",
  TOKEN_EXPIRED: "토큰이 만료되었습니다.",
  INVALID_TOKEN: "유효하지 않은 토큰입니다.",
  // 서버 기본 문구는 「아이디 또는 비밀번호가 일치하지 않습니다.」인데 소셜 로그인뿐이라 바꿔 쓴다
  LOGIN_FAILED: "로그인에 실패했어요. 다시 시도해 주세요.",
  FORBIDDEN: "접근 권한이 없습니다.",
  CONSENT_REQUIRED: "개인정보 수집·이용 동의가 필요합니다.",
  HEALTH_CONSENT_REQUIRED: "건강정보 수집·이용 동의가 필요합니다.",
  RESOURCE_NOT_FOUND: "요청한 리소스를 찾을 수 없습니다.",
  USER_NOT_FOUND: "해당 사용자를 찾을 수 없습니다.",
  PRODUCT_NOT_FOUND: "제품을 찾을 수 없습니다.",
  RANKING_NOT_OPEN: "아직 랭킹이 열리지 않은 분류입니다.",
  DUPLICATE_RESOURCE: "데이터가 이미 존재합니다.",
  STATE_CONFLICT: "리소스 상태가 충돌합니다.",
  POLICY_VERSION_CONFLICT:
    "처리방침 버전이 일치하지 않습니다. 다시 동의해 주세요.",
  GRADE_NOT_AVAILABLE: "영양정보가 부족해 등급을 제공할 수 없습니다.",
  ALREADY_ANALYZED: "이미 분석이 완료된 제품입니다.",
  SAVE_LIMIT_EXCEEDED: "저장 가능한 제품 수(200개)를 초과했습니다.",
  METHOD_NOT_ALLOWED: "허용되지 않는 HTTP 메서드입니다.",
  UNSUPPORTED_MEDIA_TYPE: "지원하지 않는 미디어 타입입니다.",
  UNPROCESSABLE_ENTITY: "요청은 올바르나 처리할 수 없습니다.",
  TOO_MANY_REQUESTS: "요청 횟수가 허용치를 초과했습니다.",
  DAILY_LIMIT_EXCEEDED: "일일 요청 한도를 초과했습니다.",
  INTERNAL_SERVER_ERROR: "서버 내부 오류가 발생했습니다.",
} as const;

// 서버 응답이 없거나 해석할 수 없을 때 클라이언트가 붙이는 코드
const CLIENT_ERROR_MESSAGES = {
  NETWORK_ERROR: "네트워크에 연결할 수 없습니다.",
  TIMEOUT: "응답이 늦어 요청을 중단했습니다.",
  CANCELED: "요청이 취소되었습니다.",
  UNKNOWN: "알 수 없는 오류가 발생했습니다.",
} as const;

export type ServerErrorCode = keyof typeof SERVER_ERROR_MESSAGES;
export type ApiErrorCode = ServerErrorCode | keyof typeof CLIENT_ERROR_MESSAGES;

// 4xx지만 서버가 내부 예외 문구를 message에 그대로 싣는 코드. 405·415는 Spring 예외 메시지,
// LOGIN_FAILED는 OAuth 토큰 교환 실패 원인(`e.getMessage()`)이 붙는다.
// 기준: 백엔드 커밋 c164ec0의 OAuth 클라이언트와 `GlobalExceptionHandler`
const RAW_MESSAGE_CODES: ReadonlySet<ApiErrorCode> = new Set([
  "LOGIN_FAILED",
  "METHOD_NOT_ALLOWED",
  "UNSUPPORTED_MEDIA_TYPE",
]);

/** API 요청 실패. 브라우저·서버 인스턴스 모두 실패를 이 모양으로 reject한다 */
export class ApiError extends Error {
  /** 응답이 없으면(네트워크·타임아웃·취소) null */
  readonly status: number | null;
  readonly code: ApiErrorCode;
  /** 요청 검증 실패(`VALIDATION_FAILED`)일 때만 채워진다 */
  readonly details: ApiErrorDetail[] | null;

  constructor(
    init: {
      status: number | null;
      code: ApiErrorCode;
      message: string;
      details?: ApiErrorDetail[] | null;
    },
    options?: ErrorOptions,
  ) {
    super(init.message, options);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.details = init.details ?? null;
  }
}

/**
 * axios 오류를 `ApiError`로 바꾼다. axios 오류가 아닌 것(설정·코드 오류)은 원인을 가리지 않도록
 * 그대로 돌려준다. 원래 axios 오류는 `cause`로 남긴다.
 */
export function toApiError(error: unknown): unknown {
  if (!isAxiosError(error)) return error;
  const options = { cause: error };

  if (error.code === AxiosError.ERR_CANCELED) {
    return clientError("CANCELED", options);
  }
  if (!error.response) {
    // 인스턴스에 `transitional.clarifyTimeoutError`를 켜 두어 타임아웃은 ETIMEDOUT으로 온다.
    // 기본값인 ECONNABORTED는 브라우저에서 요청이 끊긴 경우에도 쓰여 구분할 수 없다
    const code =
      error.code === AxiosError.ETIMEDOUT ? "TIMEOUT" : "NETWORK_ERROR";
    return clientError(code, options);
  }

  const { status, data } = error.response;
  if (!isFailureBody(data)) {
    // 중계(rewrites) 실패 등으로 서버 공통 모양이 아닌 응답
    return new ApiError(
      { status, code: "UNKNOWN", message: CLIENT_ERROR_MESSAGES.UNKNOWN },
      options,
    );
  }

  const body = data.data;
  const code = isServerErrorCode(body.code) ? body.code : "UNKNOWN";
  const fallback =
    code === "UNKNOWN"
      ? CLIENT_ERROR_MESSAGES.UNKNOWN
      : SERVER_ERROR_MESSAGES[code];
  // 5xx와 RAW_MESSAGE_CODES의 message는 서버 내부 예외 문구일 수 있어 화면에 내보내지 않는다.
  // 목록에 없는 코드도 4xx면 서버 문구를 쓴다. 백엔드의 4xx 문구는 대부분 화면용으로 쓴 것이라
  // 버리는 손해가 더 크다고 봤다. 대신 표에 코드를 추가할 때 내부 문구를 싣는지 확인해
  // RAW_MESSAGE_CODES에 넣는다
  const message =
    status < 500 && !RAW_MESSAGE_CODES.has(code) && body.message !== null
      ? body.message
      : fallback;
  return new ApiError(
    { status, code, message, details: body.details },
    options,
  );
}

function clientError(
  code: keyof typeof CLIENT_ERROR_MESSAGES,
  options: ErrorOptions,
) {
  return new ApiError(
    { status: null, code, message: CLIENT_ERROR_MESSAGES[code] },
    options,
  );
}

function isServerErrorCode(code: string): code is ServerErrorCode {
  return Object.hasOwn(SERVER_ERROR_MESSAGES, code);
}

function isFailureBody(value: unknown): value is ApiFailure {
  if (typeof value !== "object" || value === null) return false;
  if (!("isSuccess" in value) || value.isSuccess !== false) return false;
  if (
    !("data" in value) ||
    typeof value.data !== "object" ||
    value.data === null
  )
    return false;
  return "code" in value.data && typeof value.data.code === "string";
}

/** 화면에 띄울 문구. `ApiError`의 message는 이미 화면용으로 골라 두었다(`toApiError`) */
export function toErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : CLIENT_ERROR_MESSAGES.UNKNOWN;
}

/** 다시 보내면 성공할 수 있는 실패인지. 응답이 없었거나(취소 제외) 서버 오류(5xx)일 때만이다 */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.status === null) return error.code !== "CANCELED";
  return error.status >= 500;
}

export type ConsentCode = "CONSENT_REQUIRED" | "HEALTH_CONSENT_REQUIRED";

/** 동의가 없어 거절된 요청인지. 개인정보 동의 전 개인 귀속 변경, 건강정보 동의 없이 감량·근육증가 목표 */
export function isConsentRequired(
  error: unknown,
): error is ApiError & { code: ConsentCode } {
  return (
    error instanceof ApiError &&
    (error.code === "CONSENT_REQUIRED" ||
      error.code === "HEALTH_CONSENT_REQUIRED")
  );
}
