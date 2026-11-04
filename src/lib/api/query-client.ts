import { MutationCache, QueryClient } from "@tanstack/react-query";
import {
  isConsentRequired,
  isRetryable,
  toErrorMessage,
} from "@/lib/api/errors";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /** `useConsentGate`로 감싼 변경. 동의 필요(403)는 게이트가 동의 화면으로 이어 가 공통 알림에서 뺀다 */
      consentGate?: boolean;
    };
  }
}

export type MutationErrorListener = (message: string, error: unknown) => void;

let mutationErrorListener: MutationErrorListener | null = null;

/**
 * 변경 실패를 한곳에서 받는다. 알림 UI(토스트)가 정해지면 화면 쪽에서 등록한다. 브라우저의
 * QueryClient는 하나(`getQueryClient`)라 리스너도 하나만 둔다. 해제 함수를 돌려준다.
 */
export function setMutationErrorListener(listener: MutationErrorListener) {
  mutationErrorListener = listener;
  return () => {
    if (mutationErrorListener === listener) mutationErrorListener = null;
  };
}

export function createQueryClient() {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _onMutateResult, mutation) => {
        // 게이트 표시가 없는 변경은 동의 필요도 알린다. 게이트를 빠뜨렸을 때 실패가 묻히지 않고 보이게 한다
        if (mutation.meta?.consentGate && isConsentRequired(error)) return;
        mutationErrorListener?.(toErrorMessage(error), error);
      },
    }),
    defaultOptions: {
      queries: {
        // 4xx는 다시 보내도 같고, 배포 서버는 조회에도 조회수 같은 부수 효과가 있어 한 번만 다시 보낸다
        retry: (failureCount, error) => failureCount < 1 && isRetryable(error),
        // 포커스마다 다시 조회하면 상세 외 조회도 부수 효과가 반복된다. 최신화가 필요한 조회는 쿼리별로 켠다
        refetchOnWindowFocus: false,
        // 재연결 때도 같은 이유로 끈다. 오프라인 중 실패한 조회는 화면의 다시 시도로 다시 부른다
        refetchOnReconnect: false,
      },
      // 변경은 서버에서 반영됐는데 응답만 못 받았을 수 있어 자동으로 다시 보내지 않는다
      mutations: { retry: false },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** 서버 렌더는 요청끼리 캐시가 섞이지 않게 매번 새로 만들고, 브라우저는 하나를 계속 쓴다(Next 16 `tanstack-query.md`) */
export function getQueryClient() {
  if (typeof window === "undefined") return createQueryClient();
  return (browserQueryClient ??= createQueryClient());
}
