import type { AxiosInstance } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import { toBootstrap } from "@/lib/onboarding/mapper";
import type { BootstrapDto } from "@/lib/onboarding/types";

/** 식별은 선택이다. 서버는 익명 ID를 발급하지 않는다(기기가 만든다) */
export function fetchBootstrap(http: AxiosInstance, signal?: AbortSignal) {
  return http
    .get<ApiSuccess<BootstrapDto>>("/app/bootstrap", { signal })
    .then(unwrap)
    .then(toBootstrap);
}
