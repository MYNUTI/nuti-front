import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from "axios";

export type Reply = { status: number; data?: unknown };

/**
 * 테스트용 axios `adapter`. 요청마다 `handler`의 응답을 돌려주고, 실제 adapter처럼 2xx가 아니면
 * `AxiosError`로 reject한다. 받은 요청은 `requests`에 쌓인다.
 */
export function mockAdapter(
  handler: (config: InternalAxiosRequestConfig) => Reply | Promise<Reply>,
) {
  const requests: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    requests.push(config);
    const { status, data } = await handler(config);
    const response = {
      status,
      statusText: String(status),
      data,
      headers: new AxiosHeaders(),
      config,
    };
    if (status >= 200 && status < 300) return response;
    throw new AxiosError(
      `Request failed with status code ${status}`,
      status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      null,
      response,
    );
  };
  return { adapter, requests };
}

export function success(data?: unknown): Reply {
  return { status: 200, data: { isSuccess: true, data } };
}

export function failure(
  status: number,
  code: string,
  message: string | null = null,
): Reply {
  return {
    status,
    data: {
      isSuccess: false,
      data: {
        timestamp: "2026-11-02T00:00:00",
        path: "/",
        code,
        message,
        details: null,
      },
    },
  };
}

/** `exp`(초)만 담은 서명 없는 JWT. `refresh.ts`는 서명을 검사하지 않는다 */
export function jwt(expSeconds: number): string {
  const payload = Buffer.from(JSON.stringify({ exp: expSeconds })).toString(
    "base64url",
  );
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`;
}

export function jwtExpiringIn(ms: number): string {
  return jwt(Math.floor((Date.now() + ms) / 1000));
}
