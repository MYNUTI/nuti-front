import type { AxiosResponse } from "axios";
import type { ApiSuccess } from "@/lib/api/types";

/**
 * 성공 응답 본문(`{ isSuccess: true, data }`)에서 `data`만 꺼낸다. 서버는 실패를 항상 4xx·5xx로
 * 보내 axios가 reject하므로, 여기까지 온 응답은 성공 모양이다.
 */
export function unwrap<T>(response: AxiosResponse<ApiSuccess<T>>): T {
  // ApiSuccess<T>는 조건부 타입이라 제네릭 T 안에서는 어느 쪽인지 정해지지 않아 `data`가 `T | undefined`로 잡힌다.
  // 본문 없는 성공은 T에 undefined를 넣어 선언하므로 키가 빠져 있어도 T와 맞는다
  return response.data.data as T;
}
