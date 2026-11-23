/**
 * 서버 공통 응답(`CommonResponse`). 성공·실패 모두 이 모양이고, 보안 필터의 401·403도 같다.
 *
 * 서버는 `data`가 null이면 키를 빼고 보낸다. 본문 없는 성공은 `{ isSuccess: true }`만 오므로
 * `T`에 `undefined`가 들어가면 `data`를 선택 속성으로 둔다.
 */
export type ApiSuccess<T> = undefined extends T
  ? { isSuccess: true; data?: T }
  : { isSuccess: true; data: T };

export type ApiFailure = { isSuccess: false; data: ApiErrorBody };

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** 서버 `ErrorResponse`. `code`는 서버 `ErrorCode` 이름이다. */
export type ApiErrorBody = {
  /** 서버 `LocalDateTime` — 타임존 없는 ISO 문자열 */
  timestamp: string;
  path: string;
  code: string;
  /** 메시지 없이 던진 예외(`new CustomException(ErrorCode.X)`, 메시지 없는 500 예외)는 null. `ErrorCode` 기본 문구로 대체해야 한다 */
  message: string | null;
  /** 요청 검증 실패(`VALIDATION_FAILED`)일 때만 채워지고, 나머지는 null */
  details: ApiErrorDetail[] | null;
};

export type ApiErrorDetail = {
  field: string;
  /** 거절된 값을 문자열로 바꾼 것. 값이 없으면 빈 문자열 */
  value: string;
  reason: string;
};
