import type { UseMutationResult } from "@tanstack/react-query";
import { useState } from "react";
import { isConsentRequired, type ConsentCode } from "@/lib/api/errors";

/**
 * 동의가 없어 403으로 거절된 변경을 동의 뒤에 이어서 보낸다. 거절되면 필요한 동의를 `required`로
 * 알리고 보낸 인자를 들고 있다가, 동의가 끝나면 `resume()`이 같은 인자로 다시 보낸다.
 *
 * - 감쌀 변경은 `useMutation({ meta: { consentGate: true } })`로 만든다. 표시가 없으면 동의 필요도 공통 알림으로 간다
 * - 인자는 이 훅을 쓴 컴포넌트가 들고 있다. 동의 화면은 언마운트 없이(시트·모달) 띄워야 이어진다.
 *   페이지로 보내면 인자가 사라지고, 언마운트 뒤에는 mutate 단위 `onError`도 불리지 않는다
 * - 동의 필요도 `mutation.error`에는 남는다. 화면은 `required`가 있으면 오류 표시를 하지 않는다
 * - 다른 실패는 공통 알림으로 간다
 */
export function useConsentGate<TData, TError, TVariables, TContext>(
  mutation: UseMutationResult<TData, TError, TVariables, TContext>,
) {
  const [pending, setPending] = useState<{
    code: ConsentCode;
    variables: TVariables;
  } | null>(null);

  const mutate = (variables: TVariables) => {
    setPending(null);
    mutation.mutate(variables, {
      onError: (error) => {
        if (isConsentRequired(error))
          setPending({ code: error.code, variables });
      },
    });
  };

  return {
    mutate,
    /** 필요한 동의. 없으면 null */
    required: pending?.code ?? null,
    /** 동의를 마친 뒤 부른다. 다시 거절되면 `required`가 다시 채워진다 */
    resume: () => {
      if (pending) mutate(pending.variables);
    },
    /** 동의하지 않고 닫았을 때 부른다 */
    dismiss: () => setPending(null),
  };
}
