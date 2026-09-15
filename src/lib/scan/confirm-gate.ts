/**
 * 라이브 스트림의 디코딩 결과를 "확정"으로 거른다.
 *
 * - **연속 확정**: 1D 바코드는 부분만 읽히거나 잘못 읽히는 프레임이 섞이므로 같은 값이
 *   `threshold`번 연속으로 와야 확정한다.
 * - **재발화 억제**: 디코딩 루프는 확정 뒤에도 계속 돈다. 같은 상품을 계속 비추는 동안
 *   매 프레임 다시 방출하지 않도록 확정한 값을 기억한다.
 * - **다시 비추면 풀림**: 확정한 값이 `releaseMs` 이상 안 보이다 다시 나타나면 뗐다가
 *   다시 비춘 것으로 보고 새로 확정한다. 다른 입력원(사진·직접 입력)으로 결과를 바꾼 뒤
 *   앞 상품으로 돌아가는 흐름이 이 경우다.
 *
 * 사라짐을 이벤트로 알 방법이 없어 다음 도착 시점의 간격으로 판단한다. react-zxing은
 * 바코드가 없는 프레임에 아무 콜백도 부르지 않는다 — `onDecodeError`는 `detect()`가
 * 예외를 던질 때만 온다.
 */
export type ConfirmGate = {
  /** 확정되면 그 값을, 아니면 null을 돌려준다. */
  push: (raw: string, now: number) => string | null;
};

export function createConfirmGate({
  threshold,
  releaseMs,
}: {
  threshold: number;
  releaseMs: number;
}): ConfirmGate {
  let last: string | null = null;
  let streak = 0;
  let confirmed: string | null = null;
  let confirmedSeenAt = 0;

  return {
    push(raw, now) {
      if (raw === confirmed) {
        const gap = now - confirmedSeenAt;
        confirmedSeenAt = now;
        if (gap < releaseMs) return null;
        confirmed = null;
      }

      if (raw === last) {
        streak += 1;
      } else {
        last = raw;
        streak = 1;
      }
      if (streak < threshold) return null;

      confirmed = raw;
      confirmedSeenAt = now;
      last = null;
      streak = 0;
      return raw;
    },
  };
}
